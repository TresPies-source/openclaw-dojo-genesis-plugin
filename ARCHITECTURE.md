# Dojo Genesis for OpenClaw — Architecture Specification

**Version:** 0.4.0
**Date:** 2026-02-12
**Status:** Design Phase (Grounded in OpenClaw Plugin API, UI architecture defined, all questions resolved)
**Supersedes:** v0.2.0 (AgenticGateway draft — wrong target platform)
**Correction Note:** v0.2.0 incorrectly dismissed OpenClaw as non-existent and rewrote everything around AgenticGateway (Go). OpenClaw is a real, massively popular open-source AI agent platform with millions of installs and 5,700+ ClawHub skills. This version corrects that error.

---

## I. Vision

Enable OpenClaw users to orchestrate specification-driven development workflows using the Dojo Genesis methodology. Projects move through strategic scouting, specification, parallel track decomposition, commission, and retrospective — with full state management and coordination across 44 behavioral skills, published to ClawHub.

**Core Principle:** OpenClaw already provides skill loading, prompt injection, plugin lifecycle, multi-channel routing, and ClawHub distribution. Dojo Genesis is an **OpenClaw plugin** that adds project orchestration and workflow state management on top of these existing capabilities.

---

## II. Architecture Overview

### Integration Model: OpenClaw Plugin with Bundled Skills

Dojo Genesis integrates with OpenClaw as a TypeScript plugin registered through the standard `openclaw.extensions` mechanism. It ships 44 skills as SKILL.md files and adds project orchestration via commands and hooks.

```
┌─────────────────────────────────────────────────────────────┐
│              OpenClaw Gateway (Existing)                      │
│                                                              │
│  Agent ──→ System Prompt ──→ Skill XML Injection             │
│    │                              │                          │
│    │        ┌─────────────────────┤                          │
│    │        │ Bundled Skills      │                          │
│    │        │ (OpenClaw built-in) │                          │
│    │        ├─────────────────────┤                          │
│    │        │ Dojo Genesis Skills │  ← 44 SKILL.md files     │
│    │        │ (scout, spec,       │    injected into prompt  │
│    │        │  tracks, retro)     │    via plugin manifest   │
│    │        └─────────────────────┘                          │
│    │                                                         │
│    │  ┌──────────────────────────────────────────────────┐  │
│    │  │ Plugin: @openclaw/dojo-genesis                    │  │
│    │  │                                                   │  │
│    │  │  register(api) {                                  │  │
│    │  │    api.registerCommand("dojo", handler)           │  │
│    │  │    registerPluginHooksFromDir(api, "./hooks")     │  │
│    │  │  }                                                │  │
│    │  │                                                   │  │
│    │  │  Tools:                                           │  │
│    │  │    dojo_get_context → returns active project      │  │
│    │  │    dojo_save_artifact → saves to project dir      │  │
│    │  │    dojo_update_state → updates state.json         │  │
│    │  │                                                   │  │
│    │  │  State: ~/.openclaw/dojo-genesis/                 │  │
│    │  └──────────────────────────────────────────────────┘  │
│    │                                                         │
│  Channels: WhatsApp │ Telegram │ Slack │ Discord │ WebChat   │
└─────────────────────────────────────────────────────────────┘
```

### What OpenClaw Provides (we do NOT build)

- Skill loading and XML injection into agent prompts
- Multi-channel message routing (WhatsApp, Telegram, Slack, etc.)
- Plugin discovery, validation, and lifecycle management
- ClawHub publishing and distribution infrastructure
- Security scanning (VirusTotal, post-ClawHavoc requirements)
- Skill hot-reload via file watcher
- Session management and agent isolation

### What We Build

- `/dojo` command handler (auto-reply commands for project management)
- Project state management (file-based in `~/.openclaw/dojo-genesis/`)
- Orchestration tools (`dojo_get_context`, `dojo_save_artifact`, `dojo_update_state`)
- SKILL.md enhancements for project-awareness (orchestration instructions)
- Plugin hooks for skill execution lifecycle
- Plugin manifest (`package.json` with `openclaw.extensions`)

---

## III. Plugin Structure

### Directory Layout

```
@openclaw/dojo-genesis/
├── package.json                    # Plugin manifest with openclaw.extensions
├── index.ts                        # Plugin entry: register(api) function
├── src/
│   ├── commands/
│   │   ├── init.ts                 # /dojo init handler
│   │   ├── switch.ts               # /dojo switch handler
│   │   ├── status.ts               # /dojo status handler
│   │   ├── list.ts                 # /dojo list handler
│   │   ├── archive.ts              # /dojo archive handler
│   │   └── router.ts               # Subcommand dispatch
│   ├── state/
│   │   ├── global-state.ts         # Active project, project list
│   │   ├── project-state.ts        # Per-project state management
│   │   └── types.ts                # TypeScript interfaces
│   ├── orchestration/
│   │   ├── context-provider.ts     # dojo_get_context tool
│   │   ├── artifact-saver.ts       # dojo_save_artifact tool
│   │   ├── state-updater.ts        # dojo_update_state tool
│   │   └── hooks.ts                # Skill execution lifecycle hooks
│   └── utils/
│       ├── validation.ts           # Input sanitization
│       └── file-ops.ts             # Safe file operations
├── hooks/
│   ├── on-skill-complete/
│   │   ├── HOOK.md
│   │   └── handler.ts
│   └── on-project-phase-change/
│       ├── HOOK.md
│       └── handler.ts
├── skills/                         # 44 bundled SKILL.md files
│   ├── strategic-scout/
│   │   └── SKILL.md
│   ├── release-specification/
│   │   └── SKILL.md
│   ├── parallel-tracks/
│   │   └── SKILL.md
│   ├── retrospective/
│   │   └── SKILL.md
│   └── ... (40 more)
└── README.md
```

### Plugin Manifest (`package.json`)

```json
{
  "name": "@openclaw/dojo-genesis",
  "version": "0.1.0",
  "description": "Specification-driven development orchestration for OpenClaw. 44 behavioral skills organized into 7 categories: STRATEGIZE, SPECIFY, REMEMBER, OBSERVE, LEARN, ORCHESTRATE, BUILD.",
  "openclaw.extensions": "index.ts",
  "keywords": ["dojo-genesis", "specification", "orchestration", "development", "workflow"],
  "peerDependencies": {
    "openclaw": "*"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

### Plugin Entry (`index.ts`)

```typescript
import type { PluginAPI } from "openclaw/plugin-sdk";
import { registerDojoCommands } from "./src/commands/router";
import { registerOrchestrationTools } from "./src/orchestration/context-provider";
import { registerPluginHooksFromDir } from "openclaw/plugin-sdk";

export default {
  id: "dojo-genesis",
  name: "Dojo Genesis",
  slotType: "tool",

  configSchema: {
    type: "object",
    properties: {
      projectsDir: {
        type: "string",
        default: "dojo-genesis/projects",
        description: "Directory for project state (relative to ~/.openclaw/)"
      }
    }
  },

  register(api: PluginAPI) {
    // Register /dojo command with subcommand routing
    registerDojoCommands(api);

    // Register orchestration tools (dojo_get_context, etc.)
    registerOrchestrationTools(api);

    // Register event-driven hooks for skill lifecycle
    registerPluginHooksFromDir(api, "./hooks");

    api.logger.info("Dojo Genesis plugin initialized");
  }
};
```

---

## IV. Command System

### Command Types

Dojo Genesis registers a single `/dojo` command and dispatches subcommands internally:

**Auto-reply commands** (execute directly, no AI agent invocation):

| Command | Syntax | Behavior |
|---------|--------|----------|
| init | `/dojo init <name> [--desc "..."]` | Create project, set as active |
| switch | `/dojo switch <name>` | Change active project |
| status | `/dojo status [@project]` | Show project phase and recent activity |
| list | `/dojo list [--all]` | List active (and optionally archived) projects |
| archive | `/dojo archive [@project]` | Archive a project |

**Skill-invoking commands** (route to agent for skill execution):

| Command | Syntax | Skill Invoked |
|---------|--------|---------------|
| scout | `/dojo scout <tension> [@project]` | strategic-scout |
| spec | `/dojo spec <feature> [@project]` | release-specification |
| tracks | `/dojo tracks [@project]` | parallel-tracks |
| commission | `/dojo commission [@project]` | implementation-prompt |
| retro | `/dojo retro [@project]` | retrospective |

### Multi-Project Targeting

Hybrid approach: one active project + explicit `@project-name` override.

```
/dojo scout should we build X           # Targets active project
/dojo scout @backend should we build X  # Targets "backend" project explicitly
/dojo switch backend                    # Changes active project
```

### Command Handler

```typescript
export function registerDojoCommands(api: PluginAPI) {
  api.registerCommand({
    name: "dojo",
    description: "Dojo Genesis: specification-driven development orchestration",
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx) => {
      const { args, commandBody } = ctx;
      const subcommand = args[0];

      switch (subcommand) {
        case "init":    return handleInit(ctx);
        case "switch":  return handleSwitch(ctx);
        case "status":  return handleStatus(ctx);
        case "list":    return handleList(ctx);
        case "archive": return handleArchive(ctx);
        case "scout":
        case "spec":
        case "tracks":
        case "commission":
        case "retro":
          // Set project context, then continue to agent for skill execution
          const project = resolveTargetProject(ctx);
          return {
            shouldContinue: true,
            updatedCtx: { dojoProject: project.projectId, dojoPhase: project.phase }
          };
        default:
          return { text: "Unknown command. Try: init, switch, status, list, scout, spec, tracks, commission, retro" };
      }
    }
  });
}
```

---

## V. State Management

### Global State (`~/.openclaw/dojo-genesis/global-state.json`)

```typescript
interface GlobalState {
  activeProjectId: string | null;
  projects: ProjectMetadata[];
  lastUpdated: string;
}

interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  phase: string;
  createdAt: string;
  lastAccessedAt: string;
  archived: boolean;
}
```

### Per-Project State (`~/.openclaw/dojo-genesis/projects/<name>/state.json`)

```typescript
interface ProjectState {
  projectId: string;
  phase: DojoPhase;
  tracks: Track[];
  decisions: DecisionRef[];
  specs: SpecRef[];
  currentTrack: string | null;
  lastSkill: string;
  lastUpdated: string;
}

type DojoPhase =
  | "initialized"
  | "scouting"
  | "specifying"
  | "decomposing"
  | "commissioning"
  | "implementing"
  | "retrospective";
```

### File System Layout

```
~/.openclaw/dojo-genesis/
├── global-state.json
└── projects/
    ├── mobile-redesign/
    │   ├── PROJECT.md                       # Human-readable overview
    │   ├── state.json                       # Machine-readable state
    │   ├── decisions/                       # Scout outputs
    │   │   └── 2026-02-12_scout_build-x.md
    │   ├── specs/                           # Specification documents
    │   │   └── mobile-redesign-spec.md
    │   ├── tracks/                          # Parallel track specs
    │   │   ├── track-1-api.md
    │   │   └── track-2-ui.md
    │   ├── prompts/                         # Implementation prompts
    │   │   └── track-1-api-prompt.md
    │   ├── artifacts/                       # Other generated files
    │   └── retrospectives/                  # Post-sprint learnings
    └── backend-refactor/
        ├── PROJECT.md
        ├── state.json
        └── ...
```

---

## VI. Skill System

### Dual-Mode Operation

Every skill operates in two modes without code changes:

**Standalone mode**: User invokes skill directly (e.g., "run the strategic scout on this tension"). Skill runs independently, outputs to chat. No project state involved.

**Orchestration mode**: User invokes via `/dojo scout <tension>`. Plugin injects project context. Skill runs with awareness of project phase and previous outputs. Plugin hooks save results to project files and update state.

### Mode Detection

The plugin exposes a `dojo_get_context` tool that the agent can call. SKILL.md instructions tell the agent to check for active project context:

```markdown
## Dojo Genesis Integration

If a Dojo Genesis project is active (check via `dojo_get_context`), save your outputs
to the project directory using `dojo_save_artifact` and update the project phase using
`dojo_update_state`. If no project is active, output results directly to chat.
```

### SKILL.md Format (Enhanced)

```yaml
---
name: strategic-scout
description: Explore strategic tensions and scout multiple routes to find the best path forward
metadata:
  openclaw:
    emoji: "🔭"
    requires:
      bins: []
      env: []
    dojo:
      category: STRATEGIZE
      pattern: single_output
      outputDir: decisions
      phaseOnComplete: scouting
---

# Strategic Scout

[... skill workflow instructions ...]

## Dojo Genesis Integration

When invoked via `/dojo scout`, this skill operates in orchestration mode:
1. Call `dojo_get_context` to get the active project context
2. Use the project's current phase and prior decisions as input context
3. After completing the scout, call `dojo_save_artifact` with your output
4. Call `dojo_update_state` to advance the project phase to "scouting"
```

### Skill Catalogue (44 Skills, 7 Categories)

**STRATEGIZE (5 skills)**
- strategic-scout, product-positioning, multi-surface-strategy, iterative-scouting, strategic-to-tactical-workflow

**SPECIFY (7 skills)**
- release-specification, frontend-from-backend, implementation-prompt, parallel-tracks, pre-implementation-checklist, specification-writer, zenflow-prompt-writer

**REMEMBER (5 skills)**
- memory-garden, seed-extraction, compression-ritual, seed-library, seed-to-skill-converter

**OBSERVE (6 skills)**
- health-audit, documentation-audit, repo-context-sync, repo-status, semantic-clusters, status-writing

**LEARN (5 skills)**
- debugging, research-modes, research-synthesis, retrospective, project-exploration

**ORCHESTRATE (5 skills)**
- handoff-protocol, workspace-navigation, agent-teaching, decision-propagation, context-ingestion

**BUILD (11 skills)**
- skill-creation, skill-maintenance, skill-audit-upgrade, process-extraction, file-management, era-architecture, patient-learning-protocol, plus 4 coordination skills

### Skill Patterns

| Pattern | Count | Description | Example |
|---------|-------|-------------|---------|
| Single Output | 28 | Produces one artifact | strategic-scout |
| Multi-Output | 4 | Produces multiple files | parallel-tracks |
| Stateful | 8 | Reads prior project artifacts | implementation-prompt |
| Coordination | 4 | Orchestrates other skills | strategic-to-tactical |

---

## VII. Orchestration Tools

The plugin registers three tools the agent can call during skill execution:

### dojo_get_context

Returns the active project context (or null if no project is active).

```typescript
{
  name: "dojo_get_context",
  description: "Get the active Dojo Genesis project context",
  parameters: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "Optional: target a specific project instead of the active one"
      }
    }
  }
}
```

### dojo_save_artifact

Saves a skill output to the project directory.

```typescript
{
  name: "dojo_save_artifact",
  description: "Save a skill output to the active project directory",
  parameters: {
    type: "object",
    properties: {
      filename: { type: "string", description: "Output filename" },
      content: { type: "string", description: "File content" },
      outputDir: { type: "string", description: "Subdirectory (decisions, specs, tracks, etc.)" },
      projectId: { type: "string", description: "Optional: target specific project" }
    },
    required: ["filename", "content", "outputDir"]
  }
}
```

### dojo_update_state

Updates the project state (phase, tracks, etc.).

```typescript
{
  name: "dojo_update_state",
  description: "Update the active project's state",
  parameters: {
    type: "object",
    properties: {
      phase: { type: "string", description: "New project phase" },
      lastSkill: { type: "string", description: "Name of the skill that ran" },
      metadata: { type: "object", description: "Additional state updates" },
      projectId: { type: "string", description: "Optional: target specific project" }
    }
  }
}
```

---

## VIII. Workflow Lifecycle

### The Dojo Genesis Workflow

```
Initialize ──→ Scout ──→ Specify ──→ Decompose ──→ Commission ──→ Implement ──→ Retrospective
    │              │          │           │              │              │              │
 /dojo init   /dojo scout  /dojo spec  /dojo tracks  /dojo         (external)    /dojo retro
                                                     commission
```

### Phase Transitions

Each `/dojo` command advances the project through phases:

| Phase | Triggered By | Skills Involved | Outputs |
|-------|-------------|-----------------|---------|
| initialized | `/dojo init` | — | PROJECT.md, state.json |
| scouting | `/dojo scout` | strategic-scout | decisions/*.md |
| specifying | `/dojo spec` | release-specification | specs/*.md |
| decomposing | `/dojo tracks` | parallel-tracks | tracks/*.md |
| commissioning | `/dojo commission` | implementation-prompt | prompts/*.md |
| implementing | External | — | Code changes |
| retrospective | `/dojo retro` | retrospective | retrospectives/*.md |

---

## IX. Plugin Hooks

### Skill Completion Hook

Fires after any Dojo Genesis skill completes in orchestration mode:

```
hooks/on-skill-complete/
├── HOOK.md
└── handler.ts
```

```typescript
// handler.ts
export default async function onSkillComplete(event: SkillCompleteEvent) {
  const { skillName, result, projectContext } = event;

  if (!projectContext) return; // Standalone mode, no action

  // Save artifact to project directory
  await saveArtifact(projectContext, skillName, result);

  // Update project state
  await updateProjectState(projectContext, skillName);

  // Log activity
  console.log(`[dojo-genesis] ${skillName} completed for project ${projectContext.projectId}`);
}
```

### Phase Change Hook

Fires when a project transitions between phases:

```typescript
export default async function onPhaseChange(event: PhaseChangeEvent) {
  const { projectId, fromPhase, toPhase } = event;

  // Update PROJECT.md with new phase information
  await updateProjectMd(projectId, toPhase);

  // Suggest next action based on workflow
  const nextAction = getNextSuggestedAction(toPhase);
  if (nextAction) {
    return { suggestion: nextAction };
  }
}
```

---

## X. Security

### Post-ClawHavoc Requirements

- No hardcoded credentials in skill files or plugin code
- All outbound network calls must be transparent and documented
- VirusTotal scanning applied before ClawHub publication
- GitHub account (>1 week old) required for publishing

### Plugin Security Model

- Plugin runs **in-process** with the Gateway (trusted code)
- File system access scoped to `deps.configDir` (`~/.openclaw/`)
- Project names validated against path traversal: `/^[a-z0-9][a-z0-9-]*$/`
- No secrets stored in project files
- Skills cannot access other users' projects (single-user, local-first)

### Input Validation

```typescript
function validateProjectName(name: string): boolean {
  // Only lowercase alphanumeric + hyphens, 2-64 chars
  return /^[a-z0-9][a-z0-9-]{1,63}$/.test(name) && !name.includes("--");
}
```

---

## XI. ClawHub Distribution

### Publishing

```bash
# Validate plugin structure
openclaw skill validate ./skills/strategic-scout

# Authenticate
openclaw auth login

# Publish individual skills (for standalone use)
openclaw skill publish ./skills/strategic-scout

# Publish the full plugin
npm publish --access public
```

### Installation

Users install the plugin via:

```bash
# Install plugin
openclaw plugins install @openclaw/dojo-genesis

# Or install individual skills from ClawHub
npx clawhub@latest install dojo-genesis-strategic-scout
```

### Configuration

After installation, add to `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "dojo-genesis": {
        "enabled": true,
        "config": {
          "projectsDir": "dojo-genesis/projects"
        }
      }
    }
  }
}
```

---

## XII. Implementation Strategy

### Phase 1: Foundation (Week 1-2)

- [ ] Create plugin scaffold (`package.json`, `index.ts`)
- [ ] Implement `/dojo init`, `/dojo list`, `/dojo status`, `/dojo switch`
- [ ] Implement global state management (`global-state.json`)
- [ ] Implement per-project state (`state.json`, `PROJECT.md`)
- [ ] Register `dojo_get_context` tool
- [ ] Port 5 core skills: strategic-scout, release-specification, parallel-tracks, implementation-prompt, retrospective

### Phase 2: Orchestration (Week 3-4)

- [ ] Implement `dojo_save_artifact` and `dojo_update_state` tools
- [ ] Add plugin hooks for skill completion and phase change
- [ ] Implement dual-mode detection in all 5 core skills
- [ ] Port remaining 39 skills (batch by category)
- [ ] Add SKILL.md orchestration sections to all skills

### Phase 3: Polish and Publish (Week 5-6)

- [ ] End-to-end testing: full workflow (init → scout → spec → tracks → commission → retro)
- [ ] Error handling and edge cases
- [ ] Security audit (ClawHavoc compliance)
- [ ] Write README and documentation
- [ ] Publish to ClawHub
- [ ] Publish plugin to npm as `@openclaw/dojo-genesis`

---

## XIII. Architectural Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | OpenClaw plugin, not standalone tool | ClawHub distribution to millions of users; leverage existing skill loading, multi-channel routing |
| 2 | File-based state, not database | Matches OpenClaw's local-first philosophy; portable; human-readable; no additional dependencies |
| 3 | Hybrid multi-project (active + @override) | Simple for beginners, powerful for multi-project users |
| 4 | `shouldContinue: false` for management, `shouldContinue: true` + `updatedCtx` for skills | Management commands are deterministic (no AI needed); skill commands pass project context downstream and let the agent handle via `shouldContinue` flag (see Q1 resolution) |
| 5 | SKILL.md orchestration section (not wrapper code) | Skills remain self-contained; orchestration awareness is instructions to the agent, not code changes |
| 6 | Three orchestration tools (get_context, save_artifact, update_state) | Clean separation; agent decides when to use them based on SKILL.md instructions |
| 7 | Plugin hooks for lifecycle events | Event-driven; extensible; follows OpenClaw's hook pattern |
| 8 | TypeScript throughout | Matches OpenClaw's language; plugin SDK provides types; jiti loads TS at runtime |
| 9 | Three Surfaces UI (Chat → Artifacts → Canvas) | Progressive enhancement: chat works everywhere, artifacts produce real documents, Canvas adds visual richness when available (see Section XIII-B) |
| 10 | A2UI declarative JSON for Canvas (not raw HTML) | Security-first: agent sends component catalog requests, not executable code. Template structure, dynamic data. |
| 11 | Markdown for all artifacts | Human-editable, universal, versionable. Canvas rendering handled separately via A2UI. |

---

## XIII-B. UI Architecture: Three Surfaces, One Experience

_Added 2026-02-12 based on gateway UI strategic scout. See `scouts/2026-02-12_strategic_scout_gateway_ui.md`._

### Design Principle: Progressive Enhancement

The plugin operates across three rendering surfaces that layer on top of each other. Each is independently useful. A user on WhatsApp gets a complete experience. A user on WebChat with Canvas gets a richer one. Nobody gets a broken one.

### Surface 1: Chat (Base Layer — All Channels)

Every `/dojo` command and skill invocation produces well-formatted markdown output in chat. This is the universal floor.

| Command/Skill | Chat Output |
|---|---|
| `/dojo status` | Phase indicator, active track, recent activity, next suggested action |
| `/dojo list` | Project table with phase and last-updated |
| `/dojo init` | Confirmation with project ID, initial state |
| Skill output (scout, spec, etc.) | Conversational summary with key decisions, link to saved artifact |

**Constraint:** Chat output is *complete* — never a teaser that requires Canvas. A chat-only user is fully productive.

### Surface 2: Artifacts (Document Layer — File System)

Skills produce persistent markdown documents saved via `dojo_save_artifact`.

```
~/.openclaw/dojo-genesis/projects/{projectId}/
├── scouts/
│   └── {date}_{topic}.md
├── specs/
│   └── {version}_specification.md
├── prompts/
│   └── track_{n}_prompt.md
├── retros/
│   └── {date}_retrospective.md
└── decisions.md                    # Append-only decision log
```

**Integration:** Chat response includes summary + file path. Agent calls `dojo_save_artifact` with `{ projectId, category, filename, content }`.

### Surface 3: Canvas (Visual Layer — A2UI, When Available)

When OpenClaw Canvas is available (WebChat, macOS, Windows node, iOS/Android), the plugin pushes A2UI declarative JSON for complex state visualization.

**A2UI approach:** The agent sends a flat JSON list of components from the trusted catalog (Column, Text, Card, Button, TextField). The Canvas server pushes this over WebSocket to connected clients. The client renders natively.

**Canvas views:**

| View | Trigger | Components |
|---|---|---|
| Project Dashboard | `/dojo status` (Canvas available) | Phase indicator card, track status cards, recent decisions list, next actions |
| Track Board | `/dojo tracks` (Canvas available) | Track cards with progress bars, dependency arrows, status badges |
| Spec Viewer | After spec generation | Rendered markdown with section navigation |
| Retro Timeline | After retrospective | Timeline component with sprint events |

**A2UI user interaction:** When a user clicks an A2UI button (e.g., switch track), the client sends an action event to the Canvas server, which forwards it to the agent. The agent processes the action via `dojo_update_state` and refreshes the Canvas. The plugin does not need direct event hooks — the agent mediates all interactions.

**Canvas availability:** Canvas is node-specific (not available on WhatsApp/Telegram/Slack natively). Canvas state is session-scoped, stored under Application Support. No cross-channel Canvas sharing.

### Resolved UI Questions

| # | Question | Resolution |
|---|---|---|
| UI-1 | Canvas HTML templating: pre-built or dynamic? | A2UI declarative JSON. Template in structure, dynamic in data. Agent sends component catalog requests populated from state. |
| UI-2 | A2UI event handling: how does the plugin receive interactions? | Events route Canvas → Gateway → agent turn. Agent uses `dojo_update_state` to handle. No direct plugin event hook needed. |
| UI-3 | Cross-channel state: can WhatsApp see Canvas? | No. Canvas is node-specific, session-scoped. Chat (Surface 1) is the universal layer. |
| UI-4 | Artifact format: markdown or HTML? | Markdown. Human-editable, universal, versionable. Canvas uses A2UI separately. |

---

## XIV. Resolved Questions

_All 6 original open questions were resolved via iterative scouting (2026-02-12). The initial framing treated these as "unknowns about OpenClaw." After research, the reframe was: OpenClaw's API is richer than initially assumed — the real question for each was not "can we do X" but "which of OpenClaw's existing mechanisms is the best fit?"_

### Q1: Command-to-agent routing for skill-invoking subcommands

**Resolution:** Do not use `{ text: null }`. OpenClaw command handlers return `{ shouldContinue: boolean, reply?: ReplyPayload, updatedCtx?: Partial<MsgContext> }`. For skill-invoking subcommands (`/dojo scout`, `/dojo spec`, etc.), the handler returns `{ shouldContinue: true, updatedCtx: { dojoProject, dojoPhase } }` — this passes project context downstream and lets the agent handle the remaining message. Auto-reply subcommands (`/dojo init`, `/dojo status`, etc.) return `{ shouldContinue: false, reply: { text: "..." } }`.

**Architectural consequence:** The original "5 auto-reply + 5 agent-routed" split stands, but the mechanism is `shouldContinue` flag, not null routing. Additionally, for skills that have `command-dispatch: tool` + `command-tool` in their SKILL.md frontmatter, OpenClaw can dispatch directly to a registered tool without agent involvement — this provides a third routing option if needed.

**Sources:** [DeepWiki — Command Reference](https://deepwiki.com/openclaw/openclaw/9.1-command-reference)

### Q2: Project context injection for skill commands

**Resolution:** Use the **tool-pull** pattern as the primary mechanism. The plugin registers `dojo_get_context` via `api.registerTool()`. Each skill's SKILL.md orchestration section instructs the agent to call `dojo_get_context` before proceeding. This is the cleanest approach because the agent explicitly requests what it needs, the tool returns structured JSON, and there is no fragile prompt injection to maintain.

**Supplementary mechanism:** The `shouldContinue` + `updatedCtx` pattern (from Q1) can inject lightweight project metadata (project ID, current phase) into the message context that flows to the agent. This gives skills basic awareness without a tool call, while `dojo_get_context` provides full detail when needed.

**Decision:** Tool-pull primary, context-push supplementary. Skills use `dojo_get_context` for full state; `updatedCtx` provides minimal ambient context.

**Sources:** [DeepWiki — Creating Custom Plugins](https://deepwiki.com/openclaw/openclaw/10.3-creating-custom-plugins)

### Q3: Plugin-level tool registration

**Resolution:** Confirmed. Plugins register tools via `api.registerTool()`:

```typescript
api.registerTool({
  name: "dojo_get_context",
  description: "Get the current Dojo Genesis project context",
  parameters: Type.Object({
    projectId: Type.Optional(Type.String({ description: "Project ID override" }))
  }),
  async execute(_id, params) {
    const ctx = await stateManager.getProjectContext(params.projectId);
    return { content: [{ type: "text", text: JSON.stringify(ctx) }] };
  },
});
```

Tools support `{ optional: true }` for non-critical tools. Visibility is controlled via allowlists: specific tool names, all tools from a plugin ID, or the `"group:plugins"` wildcard. This fully confirms the three-tool architecture (`dojo_get_context`, `dojo_save_artifact`, `dojo_update_state`) as first-class agent tools.

**Sources:** [DeepWiki — Creating Custom Plugins](https://deepwiki.com/openclaw/openclaw/10.3-creating-custom-plugins), [DeepWiki — Tools and Skills](https://deepwiki.com/openclaw/openclaw/6-tools-and-skills)

### Q4: Skill versioning strategy

**Resolution:** Ship all 44 skills at the plugin version. Per-skill independent versioning is unnecessary overhead for a single plugin package. OpenClaw's `clawhub update` operates at the skill/plugin level, and bundled plugin skills inherit the plugin's npm version.

**Rationale:** Independent skill versioning would require either (a) splitting into 44 separate ClawHub entries (fragments the offering, high maintenance), or (b) building a custom version layer (added complexity with no user-facing benefit). The plugin's `CHANGELOG.md` can document per-skill changes when needed.

**Decision:** Monolith versioning at the plugin level. If a future need arises for independent release cycles, the affected skill(s) can be extracted to standalone ClawHub entries at that point.

### Q5: Performance impact of 44 skills in system prompt

**Resolution:** Acceptable with a mitigation path. Estimated overhead: 195 chars base + 44 × (~97 + ~60 avg name/desc/location) ≈ 7,100 chars ≈ 1,775 tokens. This is injected once at session start and reused across turns.

**Mitigation (no custom machinery needed):** OpenClaw's existing `enabled` config allows users to selectively disable skills. Document recommended "skill profiles" in the plugin README:

- **Full (default):** All 44 skills loaded (~1,775 tokens overhead)
- **Core:** 8 workflow skills only: strategic-scout, release-specification, parallel-tracks, implementation-prompt, retrospective, context-ingestion, pre-implementation-checklist, handoff-protocol (~320 tokens)
- **Minimal:** 3 essentials: strategic-scout, release-specification, retrospective (~135 tokens)

Individual skills can be toggled via `plugins.entries.dojo-genesis.skills.<name>.enabled: false`. No custom selective-loading code needed.

### Q6: Hook access to project state

**Resolution:** Use a module-level singleton `DojoStateManager` with lazy-loaded, write-through cache. The plugin's `register()` function initializes the singleton; hooks and command handlers import it.

**Why this works:** OpenClaw processes one message at a time per session (no concurrent access risk). File reads happen on first access. Writes update both cache and disk (write-through). The cache is invalidated naturally on writes.

```typescript
// src/state/manager.ts
class DojoStateManager {
  private globalCache: GlobalState | null = null;
  private projectCache: Map<string, ProjectState> = new Map();

  async getGlobalState(): Promise<GlobalState> {
    if (!this.globalCache) {
      this.globalCache = await readJsonFile(this.globalStatePath);
    }
    return this.globalCache;
  }

  async updateProjectState(projectId: string, update: Partial<ProjectState>): Promise<void> {
    const current = await this.getProjectState(projectId);
    const updated = { ...current, ...update, lastUpdated: new Date().toISOString() };
    await writeJsonFile(this.projectStatePath(projectId), updated);
    this.projectCache.set(projectId, updated); // Write-through
  }
}

export const stateManager = new DojoStateManager(); // Module-level singleton
```

**Decision:** Singleton write-through cache. No disk reads on every hook call. No concurrent access concern due to OpenClaw's single-message-at-a-time processing model.

---

## XV. Sources

- [OpenClaw GitHub Repository](https://github.com/openclaw/openclaw)
- [OpenClaw Skills Documentation](https://docs.openclaw.ai/tools/skills)
- [OpenClaw Plugin Documentation](https://docs.openclaw.ai/tools/plugin)
- [ClawHub Skills Registry](https://github.com/openclaw/clawhub)
- [Creating Custom Plugins (DeepWiki)](https://deepwiki.com/openclaw/openclaw/10.3-creating-custom-plugins)
- [Extensions and Plugins (DeepWiki)](https://deepwiki.com/openclaw/openclaw/10-extensions-and-plugins)
- [Command Reference (DeepWiki)](https://deepwiki.com/openclaw/openclaw/9.1-command-reference) — Q1 resolution source
- [Tools and Skills (DeepWiki)](https://deepwiki.com/openclaw/openclaw/6-tools-and-skills) — Q3 resolution source
- [Skills System (DeepWiki)](https://deepwiki.com/openclaw/openclaw/6.3-skills-system) — Q5 resolution source
- [Dojo Genesis v0.0.19 Specification](dojo-genesis/docs/v0.0.x/v0.0.19/v0.0.19_specification.md)
- [Dojo Genesis v0.0.20 Specification](dojo-genesis/docs/v0.0.x/v0.0.20/v0.0.20_specification.md)
- [Strategic Scout: The Agentic Platform](2026-02-12_strategic_scout_agentic_platform.md)
