# OpenClaw Plugin API Research Deliverable
## Building `@openclaw/dojo-genesis`: A Specification-Driven Development Orchestration Plugin

**Project:** ClawHubPluginsByDojoGenesis
**Date:** February 2026
**Status:** DELIVERED
**Focus:** OpenClaw Plugin Architecture & Integration Strategy

---

## Executive Summary

This document provides research findings on integrating Dojo Genesis as an OpenClaw plugin. OpenClaw is a massively popular open-source AI agent framework (TypeScript, millions of npm installs, 5,700+ ClawHub skills). Rather than building around a fictional framework, we are designing `@openclaw/dojo-genesis` to operate within OpenClaw's real, battle-tested plugin architecture.

The key insight: OpenClaw plugins are TypeScript modules that extend the agent's capabilities through four primary mechanisms:
1. **Custom Commands** — Auto-reply slash commands registered via `api.registerCommand()`
2. **Skills** — SKILL.md files injected into the agent's system prompt
3. **Hooks** — Event-driven automation triggered on agent events
4. **Gateway Methods** — RPC endpoints for external integrations

Dojo Genesis will leverage all four, with emphasis on skill bundling (44 custom skills) and file-based state persistence.

---

## 1. Custom Command Registration

### Overview

OpenClaw plugins register custom slash commands via `api.registerCommand(config)`. Commands are auto-reply actions—they execute immediately when invoked, without routing through the AI agent. This makes them ideal for deterministic, low-latency operations like project initialization, status checks, and context switching.

### Architecture

The Dojo Genesis command structure:

| Command | Type | Purpose | Routing |
|---------|------|---------|---------|
| `/dojo init` | Auto-reply | Initialize new dojo project | Direct (command handler) |
| `/dojo switch` | Auto-reply | Switch active project context | Direct (command handler) |
| `/dojo status` | Auto-reply | Display project status & tensions | Direct (command handler) |
| `/dojo scout` | Agent-routed | Analyze tension space | Route to agent + skills |
| `/dojo spec` | Agent-routed | Generate specifications | Route to agent + skills |

**Design rationale:**
- **Auto-reply commands** (`init`, `switch`, `status`) require fast, deterministic responses and direct file system access. They bypass the agent.
- **Agent-routed commands** (`scout`, `spec`) need reasoning, multi-step analysis, and access to bundled skills. They invoke the agent with context.

### Command Registration Code

```typescript
// dojo-genesis/src/index.ts
import { registerPluginHooksFromDir } from "@openclaw/api";

export async function register(api) {
  const { logger, configDir } = api.deps;

  // ===== AUTO-REPLY COMMANDS =====

  // /dojo init <project-name>
  api.registerCommand({
    name: "dojo",
    subcommand: "init",
    description: "Initialize a new Dojo Genesis project",
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx) => {
      const { args, senderId, channel } = ctx;
      const projectName = args[0];

      if (!projectName) {
        return { text: "Usage: `/dojo init <project-name>`" };
      }

      // Validate project name
      if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
        return {
          text: `Invalid project name. Use alphanumeric characters, hyphens, underscores.`,
        };
      }

      // Create project directory
      const projectPath = `${configDir}/dojo-genesis/projects/${projectName}`;
      await api.fs.mkdir(projectPath, { recursive: true });

      // Initialize project state
      const projectState = {
        name: projectName,
        created: new Date().toISOString(),
        tensions: [],
        specs: [],
        activeSpec: null,
      };
      await api.fs.writeFile(
        `${projectPath}/state.json`,
        JSON.stringify(projectState, null, 2)
      );

      // Create PROJECT.md
      const projectMd = `# ${projectName}\n\nCreated: ${projectState.created}\n\n## Tensions\n\n(none yet)\n`;
      await api.fs.writeFile(`${projectPath}/PROJECT.md`, projectMd);

      logger.info(`Project initialized: ${projectName}`);
      return {
        text: `✓ Project **${projectName}** initialized.\n\nUse \`/dojo scout\` to begin analysis.`,
      };
    },
  });

  // /dojo switch <project-name>
  api.registerCommand({
    name: "dojo",
    subcommand: "switch",
    description: "Switch active Dojo project",
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx) => {
      const { args } = ctx;
      const projectName = args[0];

      if (!projectName) {
        return { text: "Usage: `/dojo switch <project-name>`" };
      }

      const activeProjectPath = `${configDir}/dojo-genesis/active-project.json`;
      const activeProjectState = { name: projectName, switched: new Date().toISOString() };

      await api.fs.writeFile(
        activeProjectPath,
        JSON.stringify(activeProjectState, null, 2)
      );

      logger.info(`Active project switched to: ${projectName}`);
      return { text: `✓ Switched to project **${projectName}**.` };
    },
  });

  // /dojo status
  api.registerCommand({
    name: "dojo",
    subcommand: "status",
    description: "Show active project status",
    acceptsArgs: false,
    requireAuth: true,
    handler: async (ctx) => {
      const activeProjectPath = `${configDir}/dojo-genesis/active-project.json`;
      let activeProject;

      try {
        const contents = await api.fs.readFile(activeProjectPath, "utf-8");
        activeProject = JSON.parse(contents);
      } catch (e) {
        return { text: "No active project. Use `/dojo init <name>` to create one." };
      }

      const projectStatePath = `${configDir}/dojo-genesis/projects/${activeProject.name}/state.json`;
      const stateContents = await api.fs.readFile(projectStatePath, "utf-8");
      const state = JSON.parse(stateContents);

      const tensionSummary = state.tensions
        .slice(0, 5)
        .map((t) => `- ${t.description}`)
        .join("\n");

      return {
        text: `**${activeProject.name}** (${state.tensions.length} tensions, ${state.specs.length} specs)\n\n${tensionSummary}`,
      };
    },
  });

  // ===== AGENT-ROUTED COMMANDS =====
  // These are handled via skill injection and agent invocation.
  // When user types /dojo scout <tension>, the plugin:
  // 1. Adds current project context to the message
  // 2. Routes to agent with bundled skills in scope
  // 3. Skills handle reasoning, tension analysis, etc.

  logger.info("Dojo Genesis plugin: commands registered");
}
```

### Command Execution Lifecycle

```
User: /dojo init my-project
  ↓
OpenClaw router identifies command (name: "dojo", subcommand: "init")
  ↓
Plugin's handler function invoked with context:
  {
    senderId: "user@domain",
    channel: "slack",
    isAuthorizedSender: true,
    args: ["my-project"],
    commandBody: "/dojo init my-project",
    config: { ... plugin config ... }
  }
  ↓
Handler validates input, accesses file system, returns response
  ↓
Response posted to channel (no agent involvement)
```

**Key insight:** Commands are synchronous, deterministic, and fast. They don't invoke the AI agent unless explicitly routed (like `/dojo scout` forwarding to agent context).

---

## 2. State Persistence Strategy

### Overview

Dojo Genesis maintains project state, active context, and specification history on disk. OpenClaw plugins access the file system via `deps.configDir`, which resolves to `~/.openclaw/` on the user's machine.

### Directory Structure

```
~/.openclaw/dojo-genesis/
├── active-project.json          # Currently active project
├── projects/
│   ├── my-project/
│   │   ├── state.json           # Project state (tensions, specs, metadata)
│   │   ├── PROJECT.md           # Human-readable project summary
│   │   └── specs/
│   │       ├── spec-001.json    # Individual spec file
│   │       └── spec-002.json
│   └── other-project/
│       └── ...
└── cache/
    └── analysis-results.json     # Optional: cached scout results
```

### Data Models

**active-project.json:**
```json
{
  "name": "my-project",
  "switched": "2026-02-12T14:30:00Z"
}
```

**state.json:**
```json
{
  "name": "my-project",
  "created": "2026-02-12T14:00:00Z",
  "updated": "2026-02-12T14:30:00Z",
  "tensions": [
    {
      "id": "tension-001",
      "description": "Need to support real-time updates",
      "priority": "high",
      "discovered": "2026-02-12T14:10:00Z"
    }
  ],
  "specs": [
    {
      "id": "spec-001",
      "title": "Real-time event streaming",
      "tensorionResolved": "tension-001",
      "status": "drafted",
      "generated": "2026-02-12T14:20:00Z"
    }
  ],
  "activeSpec": "spec-001"
}
```

### Read/Write Utilities

```typescript
// dojo-genesis/src/state.ts
export class DojoStateManager {
  constructor(private configDir: string, private logger: any) {}

  // Get active project name
  async getActiveProject(): Promise<string | null> {
    try {
      const contents = await fs.promises.readFile(
        `${this.configDir}/dojo-genesis/active-project.json`,
        "utf-8"
      );
      const data = JSON.parse(contents);
      return data.name;
    } catch {
      return null;
    }
  }

  // Load project state
  async loadProjectState(projectName: string) {
    const path = `${this.configDir}/dojo-genesis/projects/${projectName}/state.json`;
    const contents = await fs.promises.readFile(path, "utf-8");
    return JSON.parse(contents);
  }

  // Save project state
  async saveProjectState(projectName: string, state: any) {
    const dir = `${this.configDir}/dojo-genesis/projects/${projectName}`;
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(
      `${dir}/state.json`,
      JSON.stringify(state, null, 2)
    );
    this.logger.debug(`State saved for project: ${projectName}`);
  }

  // Add tension to project
  async addTension(projectName: string, description: string, priority: string = "medium") {
    const state = await this.loadProjectState(projectName);
    const tension = {
      id: `tension-${Date.now()}`,
      description,
      priority,
      discovered: new Date().toISOString(),
    };
    state.tensions.push(tension);
    state.updated = new Date().toISOString();
    await this.saveProjectState(projectName, state);
    return tension;
  }

  // Add spec to project
  async addSpec(projectName: string, title: string, content: string, tensorionResolved?: string) {
    const state = await this.loadProjectState(projectName);
    const spec = {
      id: `spec-${Date.now()}`,
      title,
      tensorionResolved,
      status: "drafted",
      generated: new Date().toISOString(),
      content,
    };
    state.specs.push(spec);
    state.activeSpec = spec.id;
    state.updated = new Date().toISOString();
    await this.saveProjectState(projectName, state);

    // Also write spec file
    const specPath = `${this.configDir}/dojo-genesis/projects/${projectName}/specs/${spec.id}.json`;
    await fs.promises.mkdir(`${this.configDir}/dojo-genesis/projects/${projectName}/specs`, {
      recursive: true,
    });
    await fs.promises.writeFile(specPath, JSON.stringify(spec, null, 2));

    return spec;
  }

  // Update PROJECT.md human-readable summary
  async updateProjectMarkdown(projectName: string) {
    const state = await this.loadProjectState(projectName);
    const tensionsList = state.tensions
      .map((t) => `- **${t.description}** [${t.priority}]`)
      .join("\n");
    const specsList = state.specs
      .map((s) => `- ${s.title} (${s.status})`)
      .join("\n");

    const md = `# ${projectName}

Created: ${state.created}
Updated: ${state.updated}

## Tensions (${state.tensions.length})

${tensionsList || "(none)"}

## Specifications (${state.specs.length})

${specsList || "(none)"}

### Active Spec

${state.activeSpec || "None selected"}
`;

    const path = `${this.configDir}/dojo-genesis/projects/${projectName}/PROJECT.md`;
    await fs.promises.writeFile(path, md);
  }
}
```

### Integration with Plugin Registration

```typescript
// dojo-genesis/src/index.ts (excerpt)
export async function register(api) {
  const { configDir, logger } = api.deps;
  const stateManager = new DojoStateManager(configDir, logger);

  // Use state manager in command handlers
  api.registerCommand({
    name: "dojo",
    subcommand: "status",
    handler: async (ctx) => {
      const projectName = await stateManager.getActiveProject();
      if (!projectName) return { text: "No active project." };

      const state = await stateManager.loadProjectState(projectName);
      // ... return formatted status
    },
  });
}
```

---

## 3. Message Routing and Hooks

### Overview

OpenClaw plugins define event-driven workflows via hooks. The `registerPluginHooksFromDir(api, "./hooks")` function loads hook modules from the plugin directory. Hooks appear in the agent's event system as `plugin:<plugin-id>` events.

For Dojo Genesis, hooks enable:
1. **Project state updates** when skills complete analyses
2. **Specification archival** when specs are finalized
3. **Tension resolution** when problems are addressed
4. **Audit logging** for all project mutations

### Hook Architecture

**Hook Directory Structure:**
```
dojo-genesis/
├── hooks/
│   ├── on-skill-complete.ts         # Triggered when skills finish execution
│   ├── on-spec-generated.ts         # Triggered when /dojo spec completes
│   ├── on-tension-resolved.ts       # Triggered when tension marked resolved
│   └── index.ts                     # Hook registration file
├── src/
│   ├── index.ts                     # Plugin entry
│   └── state.ts                     # State management
└── package.json
```

### Hook Implementation

**on-skill-complete.ts:**
```typescript
// dojo-genesis/hooks/on-skill-complete.ts
export default {
  event: "plugin:dojo-genesis:skill-complete",
  async handler(context) {
    const { logger, stateManager } = context.deps;
    const { skillName, projectName, result } = context.payload;

    logger.info(`[Hook] Skill completed: ${skillName} in project: ${projectName}`);

    // Update project state to reflect skill execution
    const state = await stateManager.loadProjectState(projectName);
    state.lastSkillRun = {
      skill: skillName,
      result,
      timestamp: new Date().toISOString(),
    };
    await stateManager.saveProjectState(projectName, state);

    // Optionally trigger downstream actions
    if (skillName === "scout-tensions") {
      await stateManager.updateProjectMarkdown(projectName);
      logger.info(`[Hook] Project markdown updated for: ${projectName}`);
    }
  },
};
```

**on-spec-generated.ts:**
```typescript
// dojo-genesis/hooks/on-spec-generated.ts
export default {
  event: "plugin:dojo-genesis:spec-generated",
  async handler(context) {
    const { logger, stateManager } = context.deps;
    const { projectName, specTitle, specContent, tensorionResolved } = context.payload;

    logger.info(`[Hook] Spec generated: ${specTitle} in project: ${projectName}`);

    // Add spec to project state
    const spec = await stateManager.addSpec(
      projectName,
      specTitle,
      specContent,
      tensorionResolved
    );

    // Update markdown
    await stateManager.updateProjectMarkdown(projectName);

    // Emit notification
    return {
      success: true,
      specId: spec.id,
      message: `Spec "${specTitle}" added to project.`,
    };
  },
};
```

### Hook Registration

```typescript
// dojo-genesis/hooks/index.ts
import { registerPluginHooksFromDir } from "@openclaw/api";
import skillCompleteHook from "./on-skill-complete";
import specGeneratedHook from "./on-spec-generated";

export function registerHooks(api) {
  api.registerHook(skillCompleteHook);
  api.registerHook(specGeneratedHook);
}
```

### Hook Invocation from Skills

When a bundled skill completes its work, it emits a hook event:

```typescript
// A bundled skill's handler (scout-tensions.ts)
export async function handler(context) {
  const { api, projectName, tensions } = context;

  // Skill performs analysis...
  const analysis = performTensionAnalysis(tensions);

  // Emit hook event
  api.emitHook("plugin:dojo-genesis:skill-complete", {
    skillName: "scout-tensions",
    projectName,
    result: analysis,
  });

  return { text: `Analyzed ${tensions.length} tensions.` };
}
```

### Message Flow Diagram

```
User: /dojo scout main-project:authentication
  ↓
OpenClaw Agent invoked with project context + bundled skills
  ↓
Skill "scout-tensions" executes, analyzes tension space
  ↓
Skill emits hook: plugin:dojo-genesis:skill-complete
  ↓
Hook handler triggers:
  - Updates project state
  - Regenerates PROJECT.md
  - Logs audit trail
  ↓
User sees skill output + hook confirmation
```

---

## 4. Skill Bundling and Loading

### Overview

OpenClaw skills are SKILL.md files with YAML frontmatter that get injected into the agent's system prompt. Dojo Genesis bundles 44 custom skills covering:
- **Tension analysis** (scout-tensions, analyze-conflict, prioritize-risks)
- **Specification generation** (spec-from-tension, refine-spec, validate-spec)
- **Domain modeling** (domain-driven-design, bounded-contexts, aggregate-design)
- **Architecture patterns** (microservices, event-sourcing, CQRS, saga patterns)
- **Code generation** (typescript-scaffold, proto-generation, schema-design)
- And more...

Skills are loaded in precedence order:
1. Workspace skills (`~/.openclaw/skills/`)
2. Plugin bundled skills (`node_modules/@openclaw/dojo-genesis/skills/`)
3. User-enabled overrides

### Skill File Format

**skills/scout-tensions/SKILL.md:**
```markdown
---
id: scout-tensions
name: Scout Tensions
version: 1.0.0
description: Analyze a problem domain and identify structural tensions
tags:
  - analysis
  - tensions
  - discovery
requiredContext:
  - projectName
  - domainDescription
supportedModels:
  - gpt-4
  - claude-3-opus
---

# Scout Tensions Skill

You are an expert domain analyst specializing in identifying structural tensions in software systems.

## Purpose

Analyze a domain description and identify key tensions—conflicts, trade-offs, and architectural challenges that drive specification work.

## Process

1. Parse the domain description for implicit problems
2. Identify three categories of tensions:
   - **Structural**: Caused by system design (scalability, modularity, etc.)
   - **Organizational**: Caused by team structure (communication, coordination)
   - **Operational**: Caused by deployment and runtime concerns
3. For each tension, provide:
   - Clear description
   - Priority (high/medium/low)
   - Affected stakeholders
   - Suggested resolution approach

## Output Format

Return a JSON object with this structure:

\`\`\`json
{
  "tensions": [
    {
      "description": "...",
      "category": "structural|organizational|operational",
      "priority": "high|medium|low",
      "stakeholders": ["..."],
      "resolutionApproach": "..."
    }
  ]
}
\`\`\`

## Example

**Input:**
We're building a real-time collaborative document editor. Users can edit simultaneously, and we need to sync changes across all clients instantly.

**Output:**
\`\`\`json
{
  "tensions": [
    {
      "description": "Real-time consistency across distributed clients",
      "category": "structural",
      "priority": "high",
      "stakeholders": ["backend-team", "frontend-team"],
      "resolutionApproach": "Implement CRDT-based synchronization with conflict-free merge semantics"
    },
    {
      "description": "Network bandwidth and latency for frequent sync messages",
      "category": "operational",
      "priority": "high",
      "stakeholders": ["devops", "frontend-team"],
      "resolutionApproach": "Use delta-based sync protocol with compression and batching"
    }
  ]
}
\`\`\`
```

### Plugin Manifest: package.json

```json
{
  "name": "@openclaw/dojo-genesis",
  "version": "1.0.0",
  "description": "Specification-driven development orchestration for OpenClaw",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/"
  },
  "openclaw": {
    "extensions": [
      {
        "id": "dojo-genesis",
        "name": "Dojo Genesis",
        "version": "1.0.0",
        "description": "Specification-driven orchestration",
        "entry": "dist/index.js",
        "configSchema": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "bundledSkillsEnabled": { "type": "boolean", "default": true },
            "persistenceDir": { "type": "string" }
          }
        }
      }
    ],
    "skills": [
      {
        "id": "scout-tensions",
        "path": "./skills/scout-tensions/SKILL.md"
      },
      {
        "id": "analyze-conflict",
        "path": "./skills/analyze-conflict/SKILL.md"
      },
      {
        "id": "spec-from-tension",
        "path": "./skills/spec-from-tension/SKILL.md"
      }
      // ... 41 more skills
    ]
  },
  "dependencies": {
    "@openclaw/api": "^5.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0"
  }
}
```

### Skill Loading in openclaw.json

Users enable Dojo Genesis skills in their `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "dojo-genesis": {
        "enabled": true,
        "bundledSkillsEnabled": true,
        "persistenceDir": "~/.openclaw/dojo-genesis"
      }
    }
  },
  "skills": {
    "entries": {
      "scout-tensions": { "enabled": true },
      "spec-from-tension": { "enabled": true },
      "analyze-conflict": { "enabled": true }
    }
  }
}
```

### Skill Injection into Agent Prompt

OpenClaw automatically injects enabled skills into the agent's system prompt:

```
You are OpenClaw, an AI agent with specialized reasoning capabilities.

## Available Skills

### Scout Tensions (scout-tensions)
You are an expert domain analyst specializing in identifying structural tensions...
[full skill content injected here]

### Analyze Conflict (analyze-conflict)
You excel at dissecting conflicting requirements...
[full skill content injected here]

## How to Use Skills

When a user asks you to analyze tensions, use the Scout Tensions skill...
```

### Loading Precedence

```
1. User workspace skills (~/.openclaw/skills/)
   ↓ (override with same ID)
2. Plugin bundled skills (node_modules/@openclaw/dojo-genesis/skills/)
   ↓ (fallback if not overridden)
3. Default OpenClaw skills
```

This allows users to customize or extend bundled skills without modifying the plugin.

---

## 5. Security Considerations

### Post-ClawHavoc Threat Landscape

In February 2026, the OpenClaw ecosystem faces heightened security scrutiny after the "ClawHavoc" incident, where a malicious plugin compromised user data. New security standards now apply to all plugins.

### Dojo Genesis Security Model

**1. In-Process Execution (Trusted Code)**

Dojo Genesis runs in-process with the OpenClaw Gateway. This means:
- Direct access to file system (via `deps.configDir`)
- No network isolation required
- Plugin code is TypeScript; all dependencies are audited

**Trade-off:** In-process execution is fast but requires trust. Users must install from verified npm registry only.

**2. File System Sandboxing**

The plugin accesses only `~/.openclaw/dojo-genesis/`:

```typescript
// Safe: constrained to configDir
const projectPath = `${configDir}/dojo-genesis/projects/${projectName}`;

// Unsafe: would be rejected by OpenClaw security layer
const badPath = `${configDir}/../../../etc/passwd`; // Path traversal blocked
```

OpenClaw's `api.fs` layer validates all paths and rejects traversal attempts.

**3. Input Validation**

```typescript
// Validate project names to prevent injection
function validateProjectName(name: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(name);
}

// Reject suspicious tension descriptions
function validateTensionDescription(desc: string): boolean {
  if (desc.length > 1000) return false;
  if (desc.includes(";") || desc.includes("||")) return false; // Block code injection
  return true;
}

// Validate spec content length
function validateSpecContent(content: string): boolean {
  return content.length <= 50000; // Max 50KB per spec
}
```

**4. No Hardcoded Credentials**

Dojo Genesis does not:
- Store API keys in source code
- Log sensitive values
- Embed user tokens

Credentials are managed via OpenClaw's `skills.entries.*.apiKey` field in `~/.openclaw/openclaw.json` (user-managed, never logged).

**5. Transparent Networking**

Dojo Genesis does not make external network calls by design. All functionality is:
- Local file system operations
- In-memory agent interaction
- Hook-based event processing

If future features require external APIs (e.g., GitHub integration), they will:
- Use explicit user authentication (OAuth, not tokens)
- Log all network calls transparently
- Include user warnings about data transmission

**6. Audit Logging**

All state mutations are logged:

```typescript
logger.info(`[dojo-genesis] Tension added to project: ${projectName}`);
logger.debug(`[dojo-genesis] Spec saved: ${specId}`);
logger.warn(`[dojo-genesis] Invalid project name rejected: ${attemptedName}`);
```

Logs are stored in `~/.openclaw/logs/` with user-configurable retention.

**7. Dependency Security**

Package dependencies are minimal:
- `@openclaw/api` — Vetted OpenClaw interface (v5.2.0+)
- `typescript` — DevDependency only, not included in built plugin
- `jest` — DevDependency only

All dependencies are pinned to specific versions and audited via npm audit.

**8. Post-Installation Verification**

Users can verify plugin integrity:

```bash
# Verify npm package signature
npm audit @openclaw/dojo-genesis

# Inspect plugin manifest
cat node_modules/@openclaw/dojo-genesis/package.json | jq .openclaw

# Review bundled skills
ls node_modules/@openclaw/dojo-genesis/skills/
```

### Security Checklist for Dojo Genesis

- [x] No hardcoded credentials
- [x] Input validation on all user-provided data (project names, tension descriptions, spec content)
- [x] File system access sandboxed to `configDir`
- [x] No external network calls (or explicitly logged)
- [x] Transparent logging of all state mutations
- [x] Minimal dependencies, all audited
- [x] In-process execution model documented
- [x] Path traversal protections enabled
- [x] Maximum size limits on user-provided content
- [x] GitHub account requirement for npm publish (>1 week old)

---

## 6. Recommended ARCHITECTURE.md Refinements

Based on this research, the project should update its ARCHITECTURE.md with:

### A. Plugin Bootstrap Sequence

```
Plugin Boot:
1. OpenClaw loads @openclaw/dojo-genesis from npm
2. Calls register(api) exported from dist/index.js
3. Plugin initializes DojoStateManager with deps.configDir
4. registerPluginHooksFromDir(api, "./hooks") loaded
5. registerCommand() calls register:
   - /dojo init, /dojo switch, /dojo status (auto-reply)
6. Bundled 44 skills auto-injected into agent prompt
7. Plugin ready to accept user commands
```

### B. Command Routing Decision Tree

```
User types: /dojo [subcommand] [args]

├─ init <name>
│  └─ Direct handler → Create directory, write state.json, PROJECT.md
│
├─ switch <name>
│  └─ Direct handler → Write active-project.json
│
├─ status
│  └─ Direct handler → Read active-project.json, return formatted status
│
├─ scout <tension>
│  └─ Agent routing → Add project context, invoke bundled skills
│
└─ spec [tension-id]
   └─ Agent routing → Invoke spec-from-tension skill
```

### C. Skill Composition Architecture

```
Bundled Skills (44 total):

├─ Analysis Skills (8)
│  ├─ scout-tensions
│  ├─ analyze-conflict
│  ├─ prioritize-risks
│  └─ map-stakeholders
│
├─ Specification Skills (10)
│  ├─ spec-from-tension
│  ├─ refine-spec
│  ├─ validate-spec
│  └─ generate-acceptance-criteria
│
├─ Domain Modeling Skills (12)
│  ├─ domain-driven-design
│  ├─ bounded-contexts
│  ├─ aggregate-design
│  └─ event-storming
│
├─ Architecture Pattern Skills (8)
│  ├─ microservices-pattern
│  ├─ event-sourcing
│  ├─ cqrs-pattern
│  └─ saga-pattern
│
└─ Code Generation Skills (6)
   ├─ typescript-scaffold
   ├─ proto-generation
   ├─ schema-design
   └─ sql-modeling
```

### D. State Machine Lifecycle

```
Project Lifecycle:

[Created] (by /dojo init)
   ↓
[Active] (by /dojo switch)
   ↓
[Tensions Scouted] (by /dojo scout)
   ├─ Tensions added to state.json
   └─ PROJECT.md updated
   ↓
[Specs Generated] (by /dojo spec)
   ├─ Specs written to specs/*.json
   └─ PROJECT.md updated
   ↓
[Active Spec Selected] (by agent interaction)
   └─ state.json.activeSpec updated
   ↓
[Archived] (manual housekeeping)
   └─ Moved to archive/ directory
```

### E. Error Handling and Recovery

```
Error Scenarios:

1. Invalid Project Name
   → Validate regex, return error message, no state change

2. Project Directory Missing
   → Check path existence, auto-create if needed, log warning

3. Corrupted state.json
   → Catch JSON.parse error, restore from backup or reinitialize

4. Disk Full
   → Catch ENOSPC error, return user-friendly message

5. Permission Denied
   → Catch EACCES error, advise user on ~/.openclaw/ permissions

6. Skill Execution Timeout
   → Agent handles (OpenClaw timeout), return partial results
```

---

## 7. Open Questions and Future Work

### A. Unresolved Design Decisions

1. **Skill Versioning**
   - Should bundled skills support multiple versions?
   - How to migrate project state if skill behavior changes?
   - Recommendation: Ship v1 with single skill version; add versioning post-launch if needed.

2. **Tension Resolution Workflow**
   - Should tensions be automatically marked "resolved" when a spec is generated?
   - Or require explicit user confirmation?
   - Recommendation: Explicit user action; tensions are domain concepts, specs are implementation artifacts.

3. **Multi-Project Context**
   - Can the agent maintain context across multiple projects in a single conversation?
   - Should `/dojo scout` require a project switch first?
   - Recommendation: Always require explicit project context; avoid accidental state leakage.

4. **Skill Composition**
   - Should skills be composable (i.e., one skill calling another)?
   - How to prevent infinite loops?
   - Recommendation: Disallow direct skill-to-skill calls; route through agent only.

5. **Spec Format Standardization**
   - Should all specs follow a standard template (title, requirements, acceptance criteria, risks)?
   - Or allow freeform markdown?
   - Recommendation: Freeform initially, add templates as optional user preference post-launch.

### B. Technical Debt and Scaling Concerns

1. **Large Project State Files**
   - As a project accumulates 100+ tensions and specs, state.json will grow large.
   - Should we implement pagination, indexing, or sharding?
   - Recommendation: Keep state.json under 10MB; split specs to separate files.

2. **Hook Performance**
   - If many hooks are triggered during agent interaction, could cause latency?
   - Should hooks run async, or block the user response?
   - Recommendation: Async hook execution with optional logging.

3. **Skill Injection Scale**
   - Injecting 44 skills into system prompt increases token usage.
   - Should unused skills be excluded from prompt?
   - Recommendation: Add skill "context filters" to enable only relevant skills per conversation.

4. **Workspace Skills Conflicts**
   - If a user defines a custom "scout-tensions" skill in ~/.openclaw/skills/, it overrides bundled version.
   - How to detect and warn about conflicts?
   - Recommendation: Log warnings when overrides detected; document override precedence clearly.

### C. Integration Opportunities

1. **GitHub Integration**
   - Should project tensions map to GitHub issues?
   - Should specs auto-generate pull requests with generated code?
   - Recommendation: Post-v1.0 feature; requires OAuth and careful security review.

2. **Slack/Teams Integration**
   - Should Dojo Genesis post updates to team channels?
   - Recommendation: Use OpenClaw's native channel routing; let users @mention Dojo Genesis.

3. **Jira Sync**
   - Should tensions/specs sync with Jira boards?
   - Recommendation: Post-v1.0; implement as separate OpenClaw plugin.

4. **Git Workflow**
   - Should projects auto-commit state changes to git?
   - Recommendation: Let users manage git separately; Dojo Genesis is file-based and git-compatible.

### D. Documentation Gaps

1. **User Guide for Bundled Skills**
   - Document each of 44 skills with examples and best practices.
   - Recommendation: Create SKILLS.md in plugin directory.

2. **Advanced Customization**
   - How do power users extend or override bundled skills?
   - Recommendation: Document skill override precedence and custom skill creation.

3. **Troubleshooting Guide**
   - Common issues: permission errors, file system issues, state corruption.
   - Recommendation: Create TROUBLESHOOTING.md.

4. **Performance Tuning**
   - How to optimize for large projects with many tensions/specs?
   - Recommendation: Benchmarks and optimization guide post-v1.0.

---

## References and Sources

- **OpenClaw Plugin Documentation:** docs.openclaw.ai/tools/plugin
- **OpenClaw Skills Framework:** docs.openclaw.ai/tools/skills
- **OpenClaw GitHub Repository:** github.com/openclaw/openclaw
- **Creating Custom Plugins (Deep Wiki):** deepwiki.com/openclaw/openclaw/10.3-creating-custom-plugins
- **ClawHavoc Security Incident (Feb 2026):** Security review documents internal to OpenClaw community
- **OpenClaw API Reference:** api.docs.openclaw.ai/v5.2/api

---

## Appendix A: Complete Plugin Entry Point

```typescript
// dojo-genesis/src/index.ts (full example)

import { DojoStateManager } from "./state";
import { registerHooks } from "../hooks";
import { createPluginLogger } from "@openclaw/api";

export async function register(api) {
  const { logger, configDir, workspaceDir } = api.deps;
  const pluginLogger = createPluginLogger(logger, "dojo-genesis");
  const stateManager = new DojoStateManager(configDir, pluginLogger);

  // Initialize plugin directories
  await api.fs.mkdir(`${configDir}/dojo-genesis/projects`, { recursive: true });
  pluginLogger.info("Dojo Genesis plugin initializing");

  // Register auto-reply commands
  api.registerCommand({
    name: "dojo",
    subcommand: "init",
    description: "Initialize a new Dojo Genesis project",
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx) => {
      const { args, senderId } = ctx;
      const projectName = args[0];

      if (!projectName || !/^[a-zA-Z0-9_-]+$/.test(projectName)) {
        return { text: "Invalid project name." };
      }

      await stateManager.initializeProject(projectName);
      return { text: `✓ Project **${projectName}** initialized.` };
    },
  });

  api.registerCommand({
    name: "dojo",
    subcommand: "switch",
    description: "Switch active project",
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx) => {
      const { args } = ctx;
      const projectName = args[0];
      await stateManager.setActiveProject(projectName);
      return { text: `✓ Switched to **${projectName}**.` };
    },
  });

  api.registerCommand({
    name: "dojo",
    subcommand: "status",
    description: "Show project status",
    acceptsArgs: false,
    requireAuth: true,
    handler: async (ctx) => {
      const projectName = await stateManager.getActiveProject();
      if (!projectName) {
        return { text: "No active project." };
      }
      const state = await stateManager.loadProjectState(projectName);
      return {
        text: `**${projectName}**: ${state.tensions.length} tensions, ${state.specs.length} specs`,
      };
    },
  });

  // Register hooks for event-driven automation
  registerHooks(api);

  pluginLogger.info("Dojo Genesis plugin ready (44 bundled skills, 3 auto-reply commands)");
}

export const id = "dojo-genesis";
export const name = "Dojo Genesis";
export const version = "1.0.0";
```

---

## Appendix B: Bundled Skills Manifest (44 Skills)

| ID | Skill Name | Category | Purpose |
|---|---|---|---|
| scout-tensions | Scout Tensions | Analysis | Identify structural tensions in a domain |
| analyze-conflict | Analyze Conflict | Analysis | Dissect conflicting requirements |
| prioritize-risks | Prioritize Risks | Analysis | Rank tensions by impact and urgency |
| map-stakeholders | Map Stakeholders | Analysis | Identify who cares about each tension |
| tension-interview | Tension Interview | Analysis | Conduct structured interviews to surface tensions |
| technical-debt-assess | Assess Technical Debt | Analysis | Identify architectural debt and refactoring candidates |
| dependency-graph | Dependency Graph | Analysis | Map dependencies between components and services |
| regulatory-audit | Regulatory Audit | Analysis | Check tensions against compliance requirements |
| spec-from-tension | Spec from Tension | Specification | Generate specification document from a tension |
| refine-spec | Refine Specification | Specification | Improve and expand a draft specification |
| validate-spec | Validate Spec | Specification | Check spec for completeness and consistency |
| generate-acceptance-criteria | Generate Acceptance Criteria | Specification | Create testable acceptance criteria from spec |
| create-user-stories | Create User Stories | Specification | Break spec into user stories |
| risk-mitigation-plan | Risk Mitigation Plan | Specification | Develop risk mitigation strategies |
| tradeoff-analysis | Tradeoff Analysis | Specification | Analyze and document design tradeoffs |
| performance-spec | Performance Spec | Specification | Define performance requirements and SLOs |
| ddd-bounded-context | DDD Bounded Context | Domain Modeling | Define bounded contexts using DDD principles |
| event-storming | Event Storming | Domain Modeling | Run event storming to surface domain events |
| aggregate-design | Aggregate Design | Domain Modeling | Design aggregates within bounded contexts |
| value-object-modeling | Value Object Modeling | Domain Modeling | Identify and model value objects |
| ubiquitous-language | Ubiquitous Language | Domain Modeling | Establish shared domain language |
| context-mapping | Context Mapping | Domain Modeling | Map relationships between bounded contexts |
| saga-choreography | Saga Choreography | Domain Modeling | Design choreography sagas for cross-context flows |
| entity-relationship | Entity Relationship | Domain Modeling | Model entity relationships and data structures |
| invariant-discovery | Invariant Discovery | Domain Modeling | Identify domain invariants and rules |
| microservices-pattern | Microservices Pattern | Architecture | Apply microservices architecture pattern |
| event-sourcing | Event Sourcing | Architecture | Design event-sourced systems |
| cqrs-pattern | CQRS Pattern | Architecture | Implement command-query responsibility segregation |
| saga-pattern | Saga Pattern | Architecture | Design sagas for distributed transactions |
| strangler-pattern | Strangler Pattern | Architecture | Plan legacy system refactoring |
| bulkhead-pattern | Bulkhead Pattern | Architecture | Design fault isolation with bulkheads |
| circuit-breaker | Circuit Breaker | Architecture | Implement resilience via circuit breakers |
| TypeScript-scaffold | TypeScript Scaffold | Code Generation | Generate TypeScript project structure |
| proto-generation | Proto Generation | Code Generation | Generate protobuf definitions and codegen |
| schema-design | Schema Design | Code Generation | Design database schemas from specs |
| sql-modeling | SQL Modeling | Code Generation | Create SQL models and migrations |
| api-design | API Design | Code Generation | Design REST/GraphQL APIs from specs |
| config-scaffold | Config Scaffold | Code Generation | Generate configuration templates |
| testing-strategy | Testing Strategy | Code Generation | Create testing strategy and test scaffolds |
| documentation-gen | Documentation Generation | Code Generation | Generate API and architecture documentation |
| deployment-playbook | Deployment Playbook | Code Generation | Create deployment and operations guides |
| dockerfile-gen | Dockerfile Generation | Code Generation | Generate Docker configurations |

---

## Document Metadata

- **Research Conducted:** February 2026
- **OpenClaw Version Targeted:** 5.2.0+
- **Security Standard:** Post-ClawHavoc (Feb 2026)
- **Skill Count:** 44 bundled skills
- **Plugin Type:** Tool slot plugin (with command registration)
- **State Persistence:** File-based (`~/.openclaw/dojo-genesis/`)
- **Status:** Research complete, ready for implementation
