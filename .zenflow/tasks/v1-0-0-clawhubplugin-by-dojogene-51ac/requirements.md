# Product Requirements Document: @openclaw/dojo-genesis v1.0.0

## Overview

Build a TypeScript OpenClaw plugin (`@openclaw/dojo-genesis`) that adds specification-driven development orchestration to OpenClaw. The plugin introduces persistent projects that move through phases (scouting, specifying, decomposing, commissioning, implementing, retrospective) with real markdown artifacts saved to disk.

## Problem Statement

OpenClaw conversations are stateless. There is no concept of a "project" that persists across sessions, accumulates decisions, and guides structured development workflows. Dojo Genesis adds the orchestration layer: projects as first-class entities with phases, tracks, decisions, and artifacts.

## Target Users

OpenClaw users who want structured development workflows. Works across all OpenClaw channels (WhatsApp, Telegram, Slack, Discord, WebChat) via markdown-in-chat output.

## Functional Requirements

### FR-1: Command System

Register `/dojo` with 10 subcommands split into two categories:

**Auto-reply commands** (deterministic, no agent invocation, `shouldContinue: false`):

| Command | Syntax | Behavior |
|---------|--------|----------|
| init | `/dojo init <name> [--desc "..."]` | Create project, set as active, create directory structure |
| switch | `/dojo switch <name>` | Change active project |
| status | `/dojo status [@project]` | Show project phase, tracks, activity, next action suggestion |
| list | `/dojo list [--all]` | List projects with phase, last active, active indicator |
| archive | `/dojo archive [@project]` | Archive project, clear active if needed |
| help | `/dojo help` or `/dojo` | Show command reference |

**Skill-invoking commands** (pass context to agent, `shouldContinue: true` + `updatedCtx`):

| Command | Syntax | Skill Invoked | Phase On Complete |
|---------|--------|---------------|-------------------|
| scout | `/dojo scout <tension> [@project]` | strategic-scout | scouting |
| spec | `/dojo spec <feature> [@project]` | release-specification | specifying |
| tracks | `/dojo tracks [@project]` | parallel-tracks | decomposing |
| commission | `/dojo commission [@project]` | implementation-prompt | commissioning |
| retro | `/dojo retro [@project]` | retrospective | retrospective |

**Multi-project targeting**: One active project + explicit `@project-name` override in any command. `resolveTargetProject` checks for `@` args first, falls back to active project.

### FR-2: State Management

Singleton `DojoStateManager` with write-through cache and file-based persistence at `~/.openclaw/dojo-genesis/`.

**Global state** (`global-state.json`):
- Schema version, active project ID, project metadata list, last updated timestamp

**Per-project state** (`projects/{name}/state.json`):
- Project ID, phase, tracks, decisions, specs, artifacts, current track, last skill, activity log (capped at 50 entries), last updated

**Project directory structure** (created on `init`):
```
projects/{name}/
├── state.json
├── PROJECT.md
├── decisions.md
├── scouts/
├── specs/
├── prompts/
├── retros/
├── tracks/
└── artifacts/
```

**Phase state machine**:
```
initialized → scouting → specifying → decomposing → commissioning → implementing → retrospective
```
Each phase transition triggered by the corresponding `/dojo` command.

### FR-3: Orchestration Tools

3 tools registered via `api.registerTool()`:

1. **dojo_get_context** — Returns full project state (phase, tracks, decisions, recent activity) or `{ active: false }` if no project. Agent calls this at the start of skill execution.

2. **dojo_save_artifact** — Saves markdown content to a project subdirectory. Validates output directory (scouts, specs, prompts, retros, tracks, artifacts), sanitizes filename, writes atomically (tmp + rename), records artifact in state.

3. **dojo_update_state** — Updates phase, lastSkill, currentTrack, adds tracks/decisions/specs. Supports partial updates.

### FR-4: Plugin Hooks

2 event-driven hooks:

1. **on-skill-complete** — When a skill finishes in orchestration mode: advance phase, log activity. Skip silently in standalone mode.

2. **on-phase-change** — When project phase changes: update PROJECT.md header and activity log.

### FR-5: Skill System (8 Core Skills)

8 SKILL.md files with dual-mode operation:

| Skill | Category | Output Dir | Phase On Complete |
|-------|----------|------------|-------------------|
| strategic-scout | STRATEGIZE | scouts | scouting |
| release-specification | SPECIFY | specs | specifying |
| parallel-tracks | SPECIFY | tracks | decomposing |
| implementation-prompt | SPECIFY | prompts | commissioning |
| retrospective | LEARN | retros | retrospective |
| context-ingestion | ORCHESTRATE | artifacts | (no phase change) |
| pre-implementation-checklist | SPECIFY | artifacts | (no phase change) |
| handoff-protocol | ORCHESTRATE | artifacts | (no phase change) |

Each skill includes:
- OpenClaw-compatible YAML frontmatter (name, description, metadata.openclaw.emoji, metadata.openclaw.dojo)
- "Dojo Genesis Integration" section with tool call instructions for orchestration mode
- Detection rule: if `dojo_get_context` returns `{ active: false }`, run in standalone mode

### FR-6: Chat Formatting (Surface 1)

All output is well-formatted markdown usable in any OpenClaw channel:
- Phase indicators with text markers (`[ ]`, `[~]`, `[>]`, `[*]`)
- Track tables with status and dependencies
- Project lists with active indicator
- Suggested next actions based on current phase
- Date formatting (ISO date portion only)

### FR-7: Plugin Entry and Registration

- Plugin ID: `dojo-genesis`
- Entry: `index.ts` with `register(api: PluginAPI)` function
- Config schema: `projectsDir` (string, default `"dojo-genesis"`, relative to `~/.openclaw/`)
- Registers commands, tools, and hooks in `register()`
- State manager initialized from `api.deps.configDir`

## Non-Functional Requirements

### NFR-1: Performance

- Auto-reply commands: < 200ms (target < 50ms)
- Orchestration tools: < 100ms per call
- Benchmarks: `handleInit` < 30ms, `handleStatus` < 10ms (cache hit), `dojo_save_artifact` < 50ms
- Full 6-phase state operations: < 2s total (excluding agent turns)
- Memory: DojoStateManager < 100KB with 50 projects cached

### NFR-2: Data Integrity

- Atomic writes via tmp file + rename for all file operations
- Write-through cache ensures consistency between memory and disk
- Activity log capped at 50 entries (no unbounded growth)
- Schema version field for future migrations

### NFR-3: Security

- Project names validated: `/^[a-z0-9][a-z0-9-]{1,63}$/`, no consecutive hyphens
- Output directories validated against allowlist
- Filenames sanitized (lowercase, alphanumeric + hyphens/underscores, max 128 chars)
- File system access scoped to `~/.openclaw/dojo-genesis/`
- No secrets stored in project files
- Path traversal prevention via validation

### NFR-4: Testing

- Unit tests for: state manager, validation, file-ops, commands, tools, hooks
- Integration tests for: command lifecycle, tool chain, full workflow
- E2E test: full 6-phase workflow with real file system
- Target: 90%+ line coverage on `src/`
- Test framework: Vitest

### NFR-5: Compatibility

- TypeScript, targeting ES2022, module NodeNext
- Node.js 18+
- OpenClaw Plugin SDK (`openclaw/plugin-sdk`)
- macOS, Linux, Windows (via WSL2)

## Out of Scope (v1.0.0)

- Canvas / A2UI visual dashboard (deferred to v1.1.0)
- Porting all 44 skills (v1.0.0 ships 8; remaining 36 in v1.0.x batches)
- Multi-user collaboration
- Cloud sync or remote state storage
- Integration with external issue trackers (GitHub Issues, Jira)

## Success Criteria

1. Full workflow: `init` → `scout` → `spec` → `tracks` → `commission` → `retro` with all outputs saved as files on disk
2. All 5 auto-reply commands return well-formatted markdown in < 200ms
3. All 5 skill-invoking commands correctly set project context via `shouldContinue` + `updatedCtx`
4. 3 orchestration tools registered and callable by the agent
5. Skills produce identical quality output in standalone and orchestration modes
6. Plugin passes `openclaw skill validate` for all bundled skills
7. Plugin installs cleanly via `openclaw plugins install @openclaw/dojo-genesis`
8. All tests pass with `vitest run`

## Assumptions

1. OpenClaw Plugin SDK types (`openclaw/plugin-sdk`) are available as peer dependency — the SDK provides `PluginAPI`, `CommandContext`, `CommandResult`, `Type` (TypeBox schema builder), and `registerPluginHooksFromDir`
2. OpenClaw's `shouldContinue` + `updatedCtx` pattern works as documented for routing skill-invoking commands to the agent
3. `api.registerTool()` registers tools visible to the agent during the current session
4. `api.registerHook()` registers hooks that fire on the documented event names
5. `api.deps.configDir` resolves to `~/.openclaw/`
6. Existing SKILL.md content for the 8 core skills is available from the Dojo Genesis skill ecosystem (to be adapted with OpenClaw frontmatter and orchestration sections)
