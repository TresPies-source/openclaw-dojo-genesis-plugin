# Product Requirements Document: @openclaw/dojo-genesis v1.0.0

**Status:** Final
**Date:** 2026-02-12
**Source:** v1.0.0 SDD (specs/v1.0.0_specification.md), ARCHITECTURE.md v0.4.0

---

## 1. Product Overview

An OpenClaw plugin that adds specification-driven development orchestration. Projects persist across sessions with phases, tracks, decisions, and artifacts. Users manage the full development lifecycle — from scouting strategic tensions through specification, decomposition, commissioning, and retrospective — via `/dojo` commands in any OpenClaw channel.

---

## 2. Actors

- **User**: An OpenClaw user interacting via any supported channel (WhatsApp, Telegram, Slack, Discord, WebChat)
- **Agent**: The OpenClaw AI agent that executes skills and calls tools
- **Plugin**: The dojo-genesis plugin running in-process with the OpenClaw Gateway

---

## 3. Functional Requirements

### 3.1 Plugin Registration

| ID | Requirement |
|----|-------------|
| FR-01 | Plugin exports an object with `id`, `name`, `configSchema`, and `register(api)` |
| FR-02 | `register()` initializes the state manager using `api.runtime.state.resolveStateDir("dojo-genesis")` with a hardcoded fallback to `~/.openclaw/dojo-genesis` |
| FR-03 | `register()` registers the `/dojo` command, 3 orchestration tools, and lifecycle hooks |
| FR-04 | Plugin hooks are discovered via `registerPluginHooksFromDir(api, "./hooks")` from HOOK.md manifests |

### 3.2 Command System

All commands return `{ text: string }` — the only return type the OpenClaw Plugin SDK supports.

#### 3.2.1 Deterministic Commands (5)

| ID | Command | Behavior |
|----|---------|----------|
| FR-10 | `/dojo init <name> [--desc "..."]` | Validate name, create project directory tree, write PROJECT.md + decisions.md + state.json, set as active project. Return confirmation. |
| FR-11 | `/dojo switch <name>` | Validate project exists and is not archived. Set as active. Return confirmation. |
| FR-12 | `/dojo status [@project]` | Read project state. Return formatted markdown: phase, tracks (if any), last 5 activity entries, suggested next action. |
| FR-13 | `/dojo list [--all]` | List non-archived projects (or all with `--all`). Show table with project ID, phase, last active date, active indicator. |
| FR-14 | `/dojo archive <name>` | Set `archived: true` on project metadata. If it was the active project, clear `activeProjectId`. Return confirmation. |
| FR-15 | `/dojo help` or `/dojo` (no args) | Return help text listing all commands with syntax. |

#### 3.2.2 Skill-Invoking Commands (5)

These commands use the **pending action pattern**: write a `pendingAction` to state.json, return instructional text. The `before_agent_start` hook detects the pending action on the next agent turn and injects project context + skill instructions into the system prompt.

| ID | Command | Skill | Phase On Complete |
|----|---------|-------|-------------------|
| FR-20 | `/dojo scout <tension> [@project]` | strategic-scout | scouting |
| FR-21 | `/dojo spec <feature> [@project]` | release-specification | specifying |
| FR-22 | `/dojo tracks [@project]` | parallel-tracks | decomposing |
| FR-23 | `/dojo commission [@project]` | implementation-prompt | commissioning |
| FR-24 | `/dojo retro [@project]` | retrospective | retrospective |

#### 3.2.3 Multi-Project Targeting

| ID | Requirement |
|----|-------------|
| FR-30 | All skill-invoking commands and `/dojo status` accept `@project-name` to target a specific project instead of the active one |
| FR-31 | If no `@project` specified and no active project exists, return an error message |

### 3.3 State Management

| ID | Requirement |
|----|-------------|
| FR-40 | `DojoStateManager` singleton with write-through cache (in-memory + disk) |
| FR-41 | Global state at `{stateDir}/global-state.json`: schema version, active project ID, project metadata list, lastUpdated |
| FR-42 | Per-project state at `{stateDir}/projects/{id}/state.json`: phase, tracks, decisions, specs, artifacts, pendingAction, activityLog (capped at 50 entries), lastUpdated |
| FR-43 | All writes use atomic file operations (write to `.tmp`, then `rename`) |
| FR-44 | Global state includes a `version` field for future schema migrations |
| FR-45 | Project names validated: `/^[a-z0-9][a-z0-9-]{1,63}$/`, no consecutive hyphens |
| FR-46 | Path traversal prevention via project name validation (no `/`, `..`, etc.) |

### 3.4 Project Directory Structure

| ID | Requirement |
|----|-------------|
| FR-50 | `/dojo init` creates: `{stateDir}/projects/{name}/` with subdirectories: `scouts/`, `specs/`, `prompts/`, `retros/`, `tracks/`, `artifacts/` |
| FR-51 | `/dojo init` creates `PROJECT.md` (human-readable overview) and `decisions.md` (append-only decision log) |

### 3.5 Phase State Machine

| ID | Requirement |
|----|-------------|
| FR-60 | 7 phases: `initialized` → `scouting` → `specifying` → `decomposing` → `commissioning` → `implementing` → `retrospective` |
| FR-61 | Phase transitions are driven by `dojo_update_state` tool calls from the agent (not hardcoded in commands) |
| FR-62 | Phase is stored in both per-project `state.json` and global `ProjectMetadata` |

### 3.6 Orchestration Tools (3)

Registered via `api.registerTool()` with `@sinclair/typebox` schemas. Agent calls these during skill execution.

| ID | Tool | Purpose |
|----|------|---------|
| FR-70 | `dojo_get_context` | Return full project context (phase, tracks, decisions, recent activity) or `{ active: false }` if no project |
| FR-71 | `dojo_save_artifact` | Write markdown file to project subdirectory. Validate `outputDir` against allowlist (`scouts`, `specs`, `prompts`, `retros`, `tracks`, `artifacts`). Sanitize filename. Record artifact ref in state. |
| FR-72 | `dojo_update_state` | Update phase, lastSkill, currentTrack. Add tracks, decisions, specs. All updates persisted atomically. |

### 3.7 Plugin Hooks (3)

| ID | Hook Event | Purpose |
|----|------------|---------|
| FR-80 | `before_agent_start` | Detect `pendingAction` in active project state. If present, push project context + skill instructions into `event.messages`. |
| FR-81 | `after_tool_call` | Monitor orchestration tool usage. When `dojo_update_state` changes the phase, update PROJECT.md. |
| FR-82 | `agent_end` | Clear `pendingAction` from project state after agent turn completes. |

### 3.8 Skill System (8 Core Skills)

Each skill is a SKILL.md file with OpenClaw-compatible frontmatter and a "Dojo Genesis Integration" section.

| ID | Skill | Category | Output Dir |
|----|-------|----------|------------|
| FR-90 | strategic-scout | STRATEGIZE | scouts |
| FR-91 | release-specification | SPECIFY | specs |
| FR-92 | parallel-tracks | SPECIFY | tracks |
| FR-93 | implementation-prompt | SPECIFY | prompts |
| FR-94 | retrospective | LEARN | retros |
| FR-95 | context-ingestion | ORCHESTRATE | artifacts |
| FR-96 | pre-implementation-checklist | SPECIFY | artifacts |
| FR-97 | handoff-protocol | ORCHESTRATE | artifacts |

| ID | Requirement |
|----|-------------|
| FR-98 | Every skill works in **standalone mode** (no project active — output to chat only) and **orchestration mode** (project active — use tools to save artifacts and update state) |
| FR-99 | Every SKILL.md includes a "Dojo Genesis Integration" section with instructions for `dojo_get_context`, `dojo_save_artifact`, `dojo_update_state` |
| FR-100 | All skills pass `openclaw skill validate` |

### 3.9 Chat Output (Surface 1)

| ID | Requirement |
|----|-------------|
| FR-110 | All command output is well-formatted markdown (tables, bold, code blocks) |
| FR-111 | `/dojo status` includes: project name, phase with indicator, last updated date, tracks table (if any), last 5 activity entries, suggested next action |
| FR-112 | `/dojo list` includes: project table with ID, phase, last active date, active indicator (`>>>`) |
| FR-113 | Chat output is **complete** — never a teaser requiring Canvas. Chat-only users are fully productive. |

---

## 4. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | Deterministic commands respond in < 200ms (target < 50ms) |
| NFR-02 | Orchestration tool calls complete in < 100ms |
| NFR-03 | `handleInit` < 30ms (create dirs + write 3 files) |
| NFR-04 | `handleStatus` < 10ms (cache hit path) |
| NFR-05 | `dojo_save_artifact` < 50ms (atomic write) |
| NFR-06 | Full 6-phase state operations < 2s total (excluding agent turns) |
| NFR-07 | DojoStateManager memory < 100KB with 50 projects cached |
| NFR-08 | Activity log capped at 50 entries per project |
| NFR-09 | TypeScript, ES2022 target, NodeNext module resolution |
| NFR-10 | Vitest for testing, 90%+ line coverage on `src/` |
| NFR-11 | `@sinclair/typebox` for tool parameter schemas |
| NFR-12 | `openclaw` as peerDependency |
| NFR-13 | Works on macOS, Linux, Windows (via WSL2) |

---

## 5. Security Requirements

| ID | Requirement |
|----|-------------|
| SEC-01 | Project names validated against path traversal (`../`, `/`, special chars) |
| SEC-02 | `sanitizeFilename` strips all characters except `[a-z0-9-_]`, max 128 chars |
| SEC-03 | `validateOutputDir` checks against allowlist — no arbitrary directory writes |
| SEC-04 | No hardcoded credentials in any file |
| SEC-05 | No secrets stored in project state files |
| SEC-06 | File system access scoped to the resolved state directory |

---

## 6. Out of Scope (v1.0.0)

- Canvas / A2UI visual dashboard (deferred to v1.1.0)
- Porting all 44 skills (v1.0.0 ships 8; remaining 36 in v1.0.x batches)
- Multi-user collaboration
- Cloud sync or remote state storage
- Integration with external issue trackers
- OpenClaw SDK type package (mock for testing)

---

## 7. Assumptions

| # | Assumption |
|---|-----------|
| A1 | The task description's SDD (Section 8.5 SDK Corrections) is authoritative over ARCHITECTURE.md where they conflict. Commands return `{ text: string }`, not `{ shouldContinue, reply, updatedCtx }`. Skill-invoking commands use the "pending action" pattern, not `shouldContinue: true`. |
| A2 | The 8 SKILL.md files will be written from scratch as part of this project (no existing skill content to copy from an external repo). |
| A3 | `openclaw/plugin-sdk` types will be mocked for development and testing. The real SDK is a peerDependency only. |
| A4 | `registerPluginHooksFromDir` auto-discovers hooks from `hooks/*/HOOK.md` manifests. If unavailable, hooks will be registered programmatically in `register()`. |
| A5 | `api.runtime.state.resolveStateDir()` is the SDK method for state directory resolution. Fallback: `path.join(os.homedir(), ".openclaw", "dojo-genesis")`. |

---

## 8. User Flows

### 8.1 Full Workflow (Happy Path)

```
/dojo init my-app --desc "Mobile redesign"
  → Project created, directories set up, active

/dojo status
  → Phase: initialized, suggested: /dojo scout

/dojo scout "native vs PWA"
  → pendingAction written, agent picks up, runs strategic-scout skill
  → Agent calls dojo_get_context, produces scout, calls dojo_save_artifact + dojo_update_state
  → File saved to scouts/, phase → scouting

/dojo spec "mobile-redesign"
  → Agent runs release-specification skill
  → File saved to specs/, phase → specifying

/dojo tracks
  → Agent decomposes into parallel tracks
  → Files saved to tracks/, phase → decomposing

/dojo commission
  → Agent generates implementation prompts
  → Files saved to prompts/, phase → commissioning

/dojo retro
  → Agent runs retrospective
  → File saved to retros/, phase → retrospective
```

### 8.2 Multi-Project

```
/dojo init project-a
/dojo init project-b        → project-b now active
/dojo list                   → both shown, project-b marked active
/dojo scout @project-a "X"  → targets project-a despite project-b active
/dojo switch project-a      → project-a now active
```

### 8.3 Error Paths

```
/dojo init                   → "Project name is required"
/dojo init MY_APP            → "must be lowercase alphanumeric + hyphens"
/dojo init ../../etc/passwd  → "must be 2-64 chars, start with letter/number"
/dojo scout "tension"        → "No active project" (if none set)
/dojo switch nonexistent     → "Project not found"
/dojo archive my-app + /dojo status → "No active project"
```

---

## 9. Acceptance Criteria

1. User can execute the full workflow (init → scout → spec → tracks → commission → retro) and find all output files on disk at `~/.openclaw/dojo-genesis/projects/{name}/`
2. All 5 deterministic commands return formatted markdown in < 200ms
3. All 5 skill-invoking commands write `pendingAction` to state and return instructional text
4. `before_agent_start` hook injects project context when `pendingAction` exists
5. `agent_end` hook clears `pendingAction` after agent turn
6. All 3 orchestration tools are registered and functional
7. All 8 skills have SKILL.md files with valid frontmatter and Dojo Genesis Integration sections
8. Skills work in both standalone and orchestration mode
9. All tests pass with `vitest run` at 90%+ line coverage on `src/`
10. No path traversal possible via project names or artifact filenames
11. Plugin installs cleanly as `@openclaw/dojo-genesis`
