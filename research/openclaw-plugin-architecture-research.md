# OpenClaw Plugin Architecture Research

**Date:** 2026-02-12
**Author:** Opus Implementation Agent
**Purpose:** Ground the ClawHubPluginsByDojoGenesis architecture in OpenClaw's actual plugin API
**Sources:** github.com/openclaw/openclaw, docs.openclaw.ai, deepwiki.com/openclaw

---

## 1. What Is OpenClaw?

OpenClaw (formerly Clawdbot, then Moltbot) is a free, open-source autonomous AI agent created by Peter Steinberger. It runs locally on user devices and communicates through messaging platforms (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Teams, Google Chat, Matrix, WebChat). Written in TypeScript (ESM), it uses a WebSocket-based gateway as its control plane.

As of February 2026, OpenClaw has millions of installs and its skill marketplace (ClawHub) hosts 5,700+ community-built skills.

**Key architectural features:**
- Local-first gateway (default: `ws://127.0.0.1:18789`)
- Multi-agent routing with isolated workspaces
- First-class tools: browser control, canvas, cron, webhooks, session-to-session messaging
- Companion apps: macOS menu bar, iOS/Android nodes
- Plugin system via TypeScript modules loaded at runtime (jiti)

---

## 2. OpenClaw Plugin System

### 2.1 Plugin Structure

Plugins are TypeScript modules discovered by scanning `extensions/` for `package.json` files containing an `openclaw.extensions` field. Minimal plugin:

```
extensions/dojo-genesis/
  package.json          # Must contain openclaw.extensions field
  index.ts              # Entry point exporting register(api) or plugin definition
  skills/               # Bundled skills (SKILL.md files)
    strategic-scout/
      SKILL.md
    release-specification/
      SKILL.md
  README.md
```

### 2.2 Plugin Manifest (`package.json`)

```json
{
  "name": "@openclaw/dojo-genesis",
  "version": "0.1.0",
  "description": "Specification-driven development orchestration for OpenClaw",
  "openclaw.extensions": "index.ts",
  "peerDependencies": {
    "openclaw": "*"
  }
}
```

Note: `openclaw` must be in `peerDependencies`, not `dependencies`. Avoid `workspace:*` specs.

### 2.3 Plugin Registration API

Plugins export a `register(api)` function. The `api` object provides:

| Method | Purpose |
|--------|---------|
| `api.registerCommand(config)` | Register auto-reply slash commands (execute without AI agent) |
| `api.registerGatewayMethod(name, handler)` | Register RPC methods on the gateway |
| `api.registerCli(callback, options)` | Register CLI commands |
| `api.registerService(config)` | Register background services with start/stop lifecycle |
| `api.registerProvider(config)` | Register model provider auth flows |
| `api.registerChannel(config)` | Register messaging channel adapters |
| `api.logger` | Structured logging |

**Auto-reply commands** (most relevant for `/dojo` commands):

```typescript
api.registerCommand({
  name: "dojo",
  description: "Dojo Genesis specification-driven development orchestration",
  acceptsArgs: true,
  requireAuth: true,
  handler: async (ctx) => {
    // ctx includes: senderId, channel, isAuthorizedSender, args, commandBody, config
    const subcommand = ctx.args[0]; // "init", "scout", "status", etc.
    // Parse and dispatch to appropriate handler
    return { text: "Result message" };
  }
});
```

### 2.4 Plugin Slot Types

OpenClaw plugins implement one of four slot types:

1. **Channel** — messaging platform adapters
2. **Tool** — new agent capabilities (most relevant for Dojo Genesis)
3. **Provider** — AI model backends
4. **Memory** — search/retrieval backends

For Dojo Genesis, the primary integration is as a **Tool slot** with bundled skills, plus auto-reply commands for direct `/dojo` invocations.

### 2.5 Plugin Lifecycle

1. **Discovery**: Gateway scans `extensions/` for `openclaw.extensions` in `package.json`
2. **Validation**: Config schema validated via TypeBox, no plugin code executed
3. **Loading**: Module imported via jiti (TypeScript loaded at runtime)
4. **Initialization**: `init(config, deps)` called, slots registered
5. **Runtime**: Plugin active, integrated with gateway subsystems

The `init()` function receives `deps` with:
- `logger` — structured logging
- `configDir` — `~/.openclaw/` path
- `workspaceDir` — agent workspace path
- `rpc` — Gateway RPC client

### 2.6 Hooks

Plugins can bundle event-driven automation via `registerPluginHooksFromDir(api, "./hooks")`. Hooks appear as `plugin:<id>` in `openclaw hooks list`. Hook structure: `HOOK.md` + `handler.ts`.

---

## 3. OpenClaw Skill System

### 3.1 SKILL.md Format

Each skill is a directory with a `SKILL.md` file containing YAML frontmatter and natural language instructions:

```yaml
---
name: strategic-scout
description: Explore strategic tensions and scout multiple routes
metadata:
  openclaw:
    emoji: "🔭"
    requires:
      bins: []
      env: []
---

# Strategic Scout

## When to Use
When facing a strategic decision with no clear answer...

## Workflow
1. Identify the strategic tension
2. Scout 3-5 routes...

## Quality Checklist
- [ ] Tension clearly articulated
- [ ] Multiple routes explored...
```

### 3.2 Skill Loading Precedence

1. **Workspace skills** (`<workspace>/skills/`) — highest priority
2. **Managed/local skills** (`~/.openclaw/skills/`)
3. **Bundled skills** (shipped with OpenClaw) — lowest priority
4. **Plugin skills** — declared in plugin manifest, enabled via `plugins.entries.<id>.enabled`

Each agent has its own workspace. Per-agent skills live in `workspace/skills/`; shared skills in `~/.openclaw/skills/`.

### 3.3 Skill Injection

When a session starts, OpenClaw snapshots eligible skills and injects a compact XML list into the system prompt. Cost per skill: ~97 characters + field lengths + 195 base overhead.

Skills are filtered at load time based on: binary presence, environment variables, platform OS, and configuration paths.

### 3.4 Skill Hot-Reload

A watcher monitors `SKILL.md` files and refreshes the snapshot when changes occur, enabling mid-session hot reload.

---

## 4. ClawHub Marketplace

### 4.1 Overview

ClawHub is the public skill registry for OpenClaw. As of Feb 2026: 5,700+ skills, semantic search via OpenAI embeddings (text-embedding-3-small).

### 4.2 Publishing Flow

```bash
openclaw skill validate ./my-skill    # Validate skill structure
openclaw auth login                   # Authenticate with ClawHub
openclaw skill publish ./my-skill     # Publish to registry
openclaw skill status my-skill        # Check publication status
```

### 4.3 Installation

```bash
npx clawhub@latest install <skill-name>
```

Skills installed via ClawHub land in `~/.openclaw/skills/` or are managed via plugin configuration.

### 4.4 Security (Post-ClawHavoc)

After the ClawHavoc incident (malicious skills exploiting the platform):
- GitHub account required (>1 week old) for publishing
- VirusTotal scanning before publication
- No hardcoded credentials
- Minimal permissions
- Transparent networking (no obfuscated outbound calls)
- ClawHub security analysis checks declared requirements against actual behavior

---

## 5. State Management Patterns

### 5.1 Plugin Config

Plugin configuration lives in `~/.openclaw/openclaw.json` under the plugin's key:

```json
{
  "plugins": {
    "entries": {
      "dojo-genesis": {
        "enabled": true,
        "config": {
          "projectsDir": "~/.openclaw/dojo-genesis/projects"
        }
      }
    }
  }
}
```

### 5.2 File-Based Project State

OpenClaw plugins access the filesystem via `deps.configDir` (`~/.openclaw/`). For Dojo Genesis project state:

```
~/.openclaw/dojo-genesis/
  config.json                    # Plugin global config
  active-project.json            # Currently active project ID
  projects/
    mobile-redesign/
      PROJECT.md                 # Human-readable project overview
      state.json                 # Machine-readable project state
      decisions/                 # Scout outputs
      specs/                     # Specification documents
      artifacts/                 # Generated files
    backend-refactor/
      PROJECT.md
      state.json
      ...
```

### 5.3 Workspace Integration

Skills running in orchestration mode can write to the project directory. Skills running in standalone mode output to chat. The mode is determined by checking for an active project context.

---

## 6. Relationship: OpenClaw vs. AgenticGateway

| Aspect | OpenClaw | AgenticGateway |
|--------|----------|----------------|
| **Role** | External target platform for skill distribution | Dojo Genesis's own Go runtime |
| **Language** | TypeScript (ESM) | Go |
| **Architecture** | WebSocket gateway, multi-channel | HTTP server, DAG orchestration |
| **Skill format** | SKILL.md with YAML frontmatter | Tools via `tools.RegisterTool()` |
| **Marketplace** | ClawHub (5,700+ skills) | None (internal) |
| **Users** | Millions of installs | Dojo Genesis internal |

ClawHubPluginsByDojoGenesis is about packaging Dojo Genesis's behavioral skills for distribution on OpenClaw's ClawHub marketplace. It is NOT about integrating with AgenticGateway.

---

## 7. Key Findings for Architecture

### 7.1 What OpenClaw Provides (that we DON'T need to build)

- Skill loading and injection into agent prompts
- Multi-channel message routing
- Plugin discovery and lifecycle management
- ClawHub publishing and distribution infrastructure
- Security scanning and validation
- Hot-reload of skill files

### 7.2 What We Need to Build

- `/dojo` command handler (via `api.registerCommand()`)
- Project state management (file-based in `~/.openclaw/dojo-genesis/`)
- Dual-mode skill wrappers (standalone vs. orchestrated)
- TypeScript orchestration layer for skill coordination
- SKILL.md adaptations for project-awareness
- Plugin manifest and configuration schema

### 7.3 Critical Design Decisions

1. **Commands vs. Skills**: `/dojo init`, `/dojo switch`, `/dojo status` should be auto-reply commands (no AI agent needed). `/dojo scout`, `/dojo spec` should invoke skills through the agent.

2. **State Location**: Project state in `~/.openclaw/dojo-genesis/` (accessible via `deps.configDir`). Not in workspace (agent-specific). Not in the gateway's internal state.

3. **Skill Bundling**: Ship all 44 skills as `skills/<name>/SKILL.md` in the plugin directory. OpenClaw's plugin skill loading handles injection into agent prompts.

4. **Orchestration Hooks**: Use `registerPluginHooksFromDir()` for event-driven workflow coordination. Hook on skill completion to update project state.

---

## 8. Sources

- [OpenClaw GitHub Repository](https://github.com/openclaw/openclaw)
- [OpenClaw AGENTS.md](https://github.com/openclaw/openclaw/blob/main/AGENTS.md)
- [ClawHub Skills Registry](https://github.com/openclaw/clawhub)
- [OpenClaw Skills Documentation](https://docs.openclaw.ai/tools/skills)
- [OpenClaw Plugin Documentation](https://docs.openclaw.ai/tools/plugin)
- [Creating Custom Plugins (DeepWiki)](https://deepwiki.com/openclaw/openclaw/10.3-creating-custom-plugins)
- [Extensions and Plugins (DeepWiki)](https://deepwiki.com/openclaw/openclaw/10-extensions-and-plugins)
- [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)
