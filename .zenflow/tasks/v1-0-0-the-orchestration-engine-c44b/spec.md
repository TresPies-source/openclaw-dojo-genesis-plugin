# Technical Specification: @openclaw/dojo-genesis v1.0.0

**Status:** Final
**Date:** 2026-02-12
**Based on:** requirements.md, SDD (task description — authoritative for SDK patterns), ARCHITECTURE.md v0.4.0

---

## 1. Technical Context

- **Language:** TypeScript (ES2022 target, NodeNext module resolution)
- **Runtime:** Node.js 18+ (OpenClaw Gateway runtime)
- **Testing:** Vitest
- **Schema validation:** `@sinclair/typebox` (peer dep used by OpenClaw for tool parameter schemas)
- **Peer dependency:** `openclaw` (types via `openclaw/plugin-sdk`)
- **State storage:** Local file system (JSON + Markdown)
- **Package scope:** `@openclaw/dojo-genesis` (npm)

**SDK Corrections (from task SDD Section 8.5 — authoritative over ARCHITECTURE.md):**

| ARCHITECTURE.md Pattern | Corrected Pattern (SDD) |
|---|---|
| `{ shouldContinue, reply, updatedCtx }` command return | `{ text: string }` — only return type |
| `api.deps.configDir` | `api.runtime.state.resolveStateDir()` |
| `on-skill-complete`, `on-phase-change` hooks | `before_agent_start`, `after_tool_call`, `agent_end` |
| `import { Type } from "openclaw/plugin-sdk"` | `import { Type } from "@sinclair/typebox"` |

---

## 2. Implementation Approach

### 2.1 Overall Strategy

This is a greenfield plugin — no existing source code. The project is currently documentation-only (ARCHITECTURE.md, specs, scouts, research). All code will be created from scratch following the directory layout and interfaces defined in the SDD.

The plugin consists of 5 subsystems that compose together:

1. **State Manager** — Singleton with write-through cache, file-based persistence
2. **Command System** — `/dojo` with 10 subcommands (5 deterministic, 5 skill-invoking)
3. **Orchestration Tools** — 3 agent-callable tools registered via `api.registerTool()`
4. **Plugin Hooks** — 3 lifecycle hooks discovered via `registerPluginHooksFromDir()`
5. **Skill Files** — 8 SKILL.md files with orchestration integration sections

### 2.2 SDK Mock Strategy

Since `openclaw/plugin-sdk` is a peer dependency (not available for local dev), we need type mocks:

- Create `tests/__mocks__/openclaw-types.ts` with interfaces for `PluginAPI`, `HookHandler`, `registerPluginHooksFromDir`
- Use these as dev-time types; real SDK provides them at runtime
- Tool schemas use `@sinclair/typebox` directly (real dependency, not mocked)

---

## 3. Source Code Structure

```
@openclaw/dojo-genesis/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── index.ts                          # Plugin entry (object export form)
├── src/
│   ├── commands/
│   │   ├── router.ts                 # registerDojoCommands + dispatch + help text
│   │   ├── init.ts                   # handleInit
│   │   ├── switch.ts                 # handleSwitch
│   │   ├── status.ts                 # handleStatus
│   │   ├── list.ts                   # handleList
│   │   ├── archive.ts               # handleArchive
│   │   └── skill-invoke.ts          # handleSkillInvoke (shared for 5 skill commands)
│   ├── state/
│   │   ├── types.ts                  # All TypeScript interfaces
│   │   ├── manager.ts               # DojoStateManager singleton
│   │   └── migrations.ts            # Schema version check (stub for v1.0.0)
│   ├── orchestration/
│   │   └── tool-registry.ts         # registerOrchestrationTools (all 3 tools)
│   ├── ui/
│   │   └── chat-formatter.ts        # formatPhase, formatDate, formatTrackTable, formatProjectList
│   └── utils/
│       ├── validation.ts            # validateProjectName, sanitizeFilename, validateOutputDir
│       ├── file-ops.ts              # readJsonFile, writeJsonFile, writeTextFile, ensureDir, fileExists
│       └── markdown.ts              # PROJECT.md template generation
├── hooks/
│   ├── before-agent-start/
│   │   ├── HOOK.md                  # events: ["before_agent_start"]
│   │   └── handler.ts              # Detect pendingAction, inject context
│   ├── after-tool-call/
│   │   ├── HOOK.md                  # events: ["after_tool_call"]
│   │   └── handler.ts              # Monitor tools, update PROJECT.md on phase change
│   └── agent-end/
│       ├── HOOK.md                  # events: ["agent_end"]
│       └── handler.ts              # Clear pendingAction
├── skills/
│   ├── strategic-scout/SKILL.md
│   ├── release-specification/SKILL.md
│   ├── parallel-tracks/SKILL.md
│   ├── implementation-prompt/SKILL.md
│   ├── retrospective/SKILL.md
│   ├── context-ingestion/SKILL.md
│   ├── pre-implementation-checklist/SKILL.md
│   └── handoff-protocol/SKILL.md
└── tests/
    ├── __mocks__/
    │   └── openclaw-types.ts        # SDK type mocks
    ├── helpers/
    │   └── test-utils.ts            # Temp dir factory, state manager helpers
    ├── commands/
    │   ├── router.test.ts
    │   ├── init.test.ts
    │   ├── switch.test.ts
    │   ├── status.test.ts
    │   ├── list.test.ts
    │   ├── archive.test.ts
    │   └── skill-invoke.test.ts
    ├── state/
    │   └── manager.test.ts
    ├── orchestration/
    │   └── tool-registry.test.ts
    ├── hooks/
    │   ├── before-agent-start.test.ts
    │   ├── after-tool-call.test.ts
    │   └── agent-end.test.ts
    └── e2e/
        └── full-workflow.test.ts
```

---

## 4. Data Model

### 4.1 Type Definitions (`src/state/types.ts`)

```typescript
export type DojoPhase =
  | "initialized"
  | "scouting"
  | "specifying"
  | "decomposing"
  | "commissioning"
  | "implementing"
  | "retrospective";

export interface GlobalState {
  version: string;
  activeProjectId: string | null;
  projects: ProjectMetadata[];
  lastUpdated: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  phase: DojoPhase;
  createdAt: string;
  lastAccessedAt: string;
  archived: boolean;
}

export interface PendingAction {
  skill: string;
  args: string;
  requestedAt: string;
}

export interface ProjectState {
  projectId: string;
  phase: DojoPhase;
  tracks: Track[];
  decisions: DecisionRef[];
  specs: SpecRef[];
  artifacts: ArtifactRef[];
  currentTrack: string | null;
  lastSkill: string;
  pendingAction: PendingAction | null;
  activityLog: ActivityEntry[];
  lastUpdated: string;
}

export interface Track {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  dependencies: string[];
  promptFile: string | null;
}

export interface DecisionRef {
  date: string;
  topic: string;
  file: string;
}

export interface SpecRef {
  version: string;
  file: string;
}

export interface ArtifactRef {
  category: string;
  filename: string;
  createdAt: string;
  skill: string;
}

export interface ActivityEntry {
  timestamp: string;
  action: string;
  summary: string;
}
```

### 4.2 File System State Layout

```
{stateDir}/
├── global-state.json          # GlobalState
└── projects/{id}/
    ├── state.json             # ProjectState
    ├── PROJECT.md             # Human-readable overview
    ├── decisions.md           # Append-only decision log
    ├── scouts/*.md
    ├── specs/*.md
    ├── prompts/*.md
    ├── retros/*.md
    ├── tracks/*.md
    └── artifacts/*.md
```

### 4.3 Phase State Machine

```
initialized ──→ scouting ──→ specifying ──→ decomposing ──→ commissioning ──→ implementing ──→ retrospective
  /dojo init   /dojo scout  /dojo spec   /dojo tracks   /dojo commission   (external)      /dojo retro
```

Phase transitions are driven by the agent calling `dojo_update_state` with a `phase` parameter, not hardcoded in commands.

---

## 5. Interface Design

### 5.1 Plugin Entry (`index.ts`)

Object export form with `configSchema`:

```typescript
export default {
  id: "dojo-genesis",
  name: "Dojo Genesis",
  configSchema: { type: "object", properties: { projectsDir: { type: "string", default: "dojo-genesis" } } },
  register(api: PluginAPI) {
    const stateDir = api.runtime.state.resolveStateDir("dojo-genesis");
    initStateManager(stateDir);
    registerDojoCommands(api);
    registerOrchestrationTools(api);
    registerPluginHooksFromDir(api, "./hooks");
  },
};
```

**Fallback:** If `api.runtime.state.resolveStateDir()` is unavailable, use `path.join(os.homedir(), ".openclaw", "dojo-genesis")`.

### 5.2 Command Interface

All commands return `{ text: string }`. No other return shape.

**Deterministic commands:**

| Function | Input | Output |
|---|---|---|
| `handleInit(args: string[])` | `["project-name", "--desc", "..."]` | `{ text: string }` — confirmation or validation error |
| `handleSwitch(args: string[])` | `["project-name"]` | `{ text: string }` — confirmation or "not found" |
| `handleStatus(args: string[])` | `["@project-name"]` (optional) | `{ text: string }` — formatted status |
| `handleList(args: string[])` | `["--all"]` (optional) | `{ text: string }` — project table |
| `handleArchive(args: string[])` | `["project-name"]` | `{ text: string }` — confirmation |

**Skill-invoking commands (all share `handleSkillInvoke`):**

| Function | Input | Output |
|---|---|---|
| `handleSkillInvoke(skillName: string, args: string[])` | skill name + remaining args | `{ text: string }` — writes `pendingAction` to state, returns instructional text |

### 5.3 State Manager Interface

```typescript
class DojoStateManager {
  constructor(configDir: string)

  // Global state
  getGlobalState(): Promise<GlobalState>
  setActiveProject(projectId: string | null): Promise<void>
  addProject(meta: ProjectMetadata): Promise<void>

  // Project state
  getProjectState(projectId?: string): Promise<ProjectState | null>
  updateProjectState(projectId: string, update: Partial<ProjectState>): Promise<void>
  addActivity(projectId: string, action: string, summary: string): Promise<void>
}

// Module-level singleton
export let stateManager: DojoStateManager;
export function initStateManager(configDir: string): void;
```

**Cache strategy:** Write-through. `globalCache: GlobalState | null`, `projectCache: Map<string, ProjectState>`. Safe due to OpenClaw's single-message-at-a-time processing.

**Activity log:** Capped at 50 entries (newest first). `addActivity` prepends and truncates.

### 5.4 Orchestration Tools Interface

All 3 tools registered via `api.registerTool()` with `@sinclair/typebox` schemas.

| Tool | Parameters | Returns |
|---|---|---|
| `dojo_get_context` | `{ projectId?: string }` | JSON with project state or `{ active: false }` |
| `dojo_save_artifact` | `{ filename, content, outputDir, projectId? }` | `{ saved: true, path }` or `{ error }` |
| `dojo_update_state` | `{ phase?, lastSkill?, currentTrack?, addTrack?, addDecision?, addSpec?, projectId? }` | `{ updated: true, phase }` or `{ error }` |

All return `{ content: [{ type: "text", text: JSON.stringify(...) }] }` (MCP tool result format).

### 5.5 Hook Interface

Each hook is a default-exported `HookHandler` async function.

| Hook | Event | Behavior |
|---|---|---|
| `before-agent-start/handler.ts` | `before_agent_start` | If `pendingAction` exists in active project, push context block into `event.messages` |
| `after-tool-call/handler.ts` | `after_tool_call` | If `dojo_update_state` called with phase change, update PROJECT.md |
| `agent-end/handler.ts` | `agent_end` | Clear `pendingAction` from active project state |

### 5.6 Validation Interface

```typescript
validateProjectName(name: string): { valid: boolean; error?: string }
sanitizeFilename(input: string): string
validateOutputDir(dir: string): boolean
```

**Project name rules:** `/^[a-z0-9][a-z0-9-]{1,63}$/`, no consecutive hyphens.
**Output dir allowlist:** `["scouts", "specs", "prompts", "retros", "tracks", "artifacts"]`.
**Filename sanitize:** lowercase, strip non-`[a-z0-9-_]`, collapse hyphens, trim, max 128 chars.

### 5.7 File Operations Interface

```typescript
readJsonFile<T>(path: string, defaultValue: T): Promise<T>
writeJsonFile(path: string, data: unknown): Promise<void>     // Atomic: .tmp + rename
writeTextFile(path: string, content: string): Promise<void>   // Atomic: .tmp + rename
ensureDir(dir: string): Promise<void>
fileExists(path: string): Promise<boolean>
```

---

## 6. Key Design Decisions

### 6.1 The Pending Action Pattern

This is the core orchestration mechanism. Since commands can only return `{ text: string }` (SDK constraint), skill-invoking commands cannot directly trigger agent behavior. Instead:

1. Command writes `pendingAction = { skill, args, requestedAt }` to `state.json`
2. Command returns `{ text: "Starting {skill} for project {id}..." }`
3. The user's message continues to the agent turn
4. `before_agent_start` hook fires, detects `pendingAction`, injects context into `event.messages`
5. Agent sees injected context and runs the skill
6. `agent_end` hook fires, clears `pendingAction`

**Fallback:** If hook injection fails, the SKILL.md orchestration section instructs the agent to call `dojo_get_context` as its first step (pure tool-pull path).

### 6.2 Dual-Mode Skill Operation

Every skill works in two modes without code changes:

- **Standalone:** No project active. Agent runs skill, outputs to chat. No `dojo_*` tool calls.
- **Orchestrated:** Project active. Agent calls `dojo_get_context` (gets state), runs skill with context, calls `dojo_save_artifact` + `dojo_update_state`.

Mode detection: `dojo_get_context` returns `{ active: false }` when no project exists.

### 6.3 Atomic File Writes

All JSON and text writes go through a `.tmp` + `rename` pattern. This prevents corrupted state files on crash or power loss. On ext4/APFS, `rename` is atomic.

### 6.4 State Manager Initialization

The `DojoStateManager` is initialized in `register()` with the SDK-provided state directory path. A module-level `let stateManager` export allows all modules to import and use it. The `initStateManager(configDir)` function must be called before any other module accesses `stateManager`.

---

## 7. Delivery Phases

### Phase 1: Foundation (Track 0)

**Deliverables:** Compilable scaffold, types, state manager, utilities, test infrastructure.

- `package.json` with dependencies and `openclaw.extensions`
- `tsconfig.json` (ES2022, NodeNext)
- `vitest.config.ts`
- `src/state/types.ts` — all interfaces
- `src/state/manager.ts` — DojoStateManager with write-through cache
- `src/state/migrations.ts` — version check stub
- `src/utils/file-ops.ts` — atomic file I/O
- `src/utils/validation.ts` — input validation
- `src/utils/markdown.ts` — PROJECT.md template generation
- `src/ui/chat-formatter.ts` — output formatting
- `tests/__mocks__/openclaw-types.ts` — SDK type mocks
- `tests/helpers/test-utils.ts` — temp dir factory
- Unit tests for state manager, validation, file-ops

**Verification:** `npx vitest run` passes. All types compile. Temp dirs cleaned up.

### Phase 2: Commands + Chat UI (Track A)

**Deliverables:** All 10 `/dojo` subcommands with formatted output.

- `src/commands/router.ts` — dispatch + help text
- `src/commands/init.ts` — create project + directories + files
- `src/commands/switch.ts` — set active project
- `src/commands/status.ts` — formatted status with tracks/activity/suggestions
- `src/commands/list.ts` — project table with `--all` flag
- `src/commands/archive.ts` — archive project, clear active if needed
- `src/commands/skill-invoke.ts` — write pendingAction, return text
- Unit tests for each command handler
- Integration test: init → status → list → switch → archive

**Verification:** `npx vitest run` passes. All commands return `{ text: string }` with valid markdown.

### Phase 3: Orchestration Engine (Track B)

**Deliverables:** 3 tools + 3 hooks.

- `src/orchestration/tool-registry.ts` — all 3 tools with TypeBox schemas
- `hooks/before-agent-start/` — HOOK.md + handler.ts (context injection)
- `hooks/after-tool-call/` — HOOK.md + handler.ts (PROJECT.md update)
- `hooks/agent-end/` — HOOK.md + handler.ts (cleanup)
- `index.ts` — plugin entry wiring everything together
- Unit tests for each tool and hook
- Integration test: pendingAction lifecycle

**Verification:** `npx vitest run` passes. Tools return correct shapes. Hooks fire/skip appropriately.

### Phase 4: Skill Migration (Track C)

**Deliverables:** 8 SKILL.md files.

- Each skill gets OpenClaw-compatible frontmatter
- Each skill gets "Dojo Genesis Integration" section with correct `outputDir`, filename pattern, and next phase
- Validation tests for SKILL.md structure and content

**Verification:** All skills contain required sections. Frontmatter is valid YAML.

### Phase 5: Integration & QA

**Deliverables:** E2E tests, final wiring.

- E2E test: full init → scout → spec → tracks → commission → retro workflow
- Multi-project isolation test
- Dual-mode skill test
- Error handling tests (invalid names, missing projects, path traversal)
- Security review

**Verification:** `npx vitest run` passes with 90%+ coverage on `src/`. Full workflow produces correct files on disk.

---

## 8. Verification Approach

### 8.1 Test Commands

```bash
npx vitest run                    # All tests
npx vitest run --coverage         # With coverage report
npx tsc --noEmit                  # Type checking
```

### 8.2 Test Strategy

| Layer | What | How |
|---|---|---|
| Unit | State manager CRUD, cache behavior | Vitest + temp dirs |
| Unit | Validation (valid/invalid names, path traversal) | Vitest |
| Unit | File ops (atomic write, ENOENT, ensureDir) | Vitest + temp dirs |
| Unit | Each command handler (happy + error paths) | Vitest + mocked state manager |
| Unit | Each tool (valid inputs, missing project, invalid dir) | Vitest + mocked state manager |
| Unit | Each hook (pendingAction present/absent, phase change) | Vitest + mocked event objects |
| Integration | Command lifecycle: init → status → list → switch → archive | Vitest + real file system (temp dir) |
| Integration | Tool chain: get_context → save_artifact → update_state | Vitest + real file system |
| Integration | Pending action cycle: command → hook inject → tool calls → cleanup | Vitest + real file system |
| E2E | Full 6-phase workflow with file verification | Vitest + real file system |

### 8.3 Performance Benchmarks

| Operation | Target |
|---|---|
| `handleInit` | < 30ms |
| `handleStatus` (cache hit) | < 10ms |
| `dojo_save_artifact` | < 50ms |
| Full 6-phase state operations | < 2s total |

### 8.4 Security Checks

- Project name regex rejects `../`, `/`, special chars
- `sanitizeFilename` strips everything except `[a-z0-9-_]`
- `validateOutputDir` uses allowlist — no arbitrary directory writes
- No secrets in state files
- All file access scoped to resolved state directory

---

## 9. Dependencies

### 9.1 package.json

```json
{
  "name": "@openclaw/dojo-genesis",
  "version": "1.0.0",
  "description": "Specification-driven development orchestration for OpenClaw",
  "openclaw.extensions": "index.ts",
  "main": "index.ts",
  "peerDependencies": {
    "openclaw": "*"
  },
  "dependencies": {
    "@sinclair/typebox": "^0.32.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "@vitest/coverage-v8": "^1.6.0"
  }
}
```

### 9.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "declaration": true,
    "resolveJsonModule": true,
    "types": ["vitest/globals"]
  },
  "include": ["index.ts", "src/**/*.ts", "hooks/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## 10. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| `api.runtime.state.resolveStateDir()` unavailable | Fallback to `path.join(os.homedir(), ".openclaw", "dojo-genesis")` |
| `registerPluginHooksFromDir` doesn't discover HOOK.md | Fallback to programmatic hook registration in `register()` |
| `event.messages.push()` doesn't inject into system prompt | SKILL.md instructs agent to call `dojo_get_context` (tool-pull fallback) |
| OpenClaw SDK API changes | Pin peerDependency; mock types for dev; test against specific release |
| File permissions differ across OS | Use OpenClaw-managed state dir; test on macOS + Linux |
