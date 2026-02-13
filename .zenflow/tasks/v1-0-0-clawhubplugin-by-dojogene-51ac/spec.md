# Technical Specification: @openclaw/dojo-genesis v1.0.0

## 1. Technical Context

- **Language**: TypeScript (ES2022, module: NodeNext, moduleResolution: NodeNext)
- **Runtime**: Node.js 18+
- **Test framework**: Vitest
- **Peer dependency**: `openclaw/plugin-sdk` (provides `PluginAPI`, `CommandContext`, `CommandResult`, `Type` TypeBox schema builder, `registerPluginHooksFromDir`)
- **Dev dependencies**: `typescript`, `vitest`, `@types/node`
- **Package scope**: `@openclaw/dojo-genesis`
- **Plugin ID**: `dojo-genesis`
- **State storage**: `~/.openclaw/dojo-genesis/` (file-based JSON + markdown artifacts)

### Current Codebase

The repository currently contains only design documents (ARCHITECTURE.md, specs/, research/, prompts/, handoffs/). There is no existing source code — this is a greenfield implementation. The v1.0.0 specification (`specs/v1.0.0_specification.md`) provides detailed pseudo-code for every module.

---

## 2. Implementation Approach

Follow the specification's architecture closely. The plugin is a standard OpenClaw extension that registers commands, tools, and hooks in a single `register(api)` entry point.

### Core Patterns

1. **Write-through cache**: `DojoStateManager` caches global and per-project state in memory; every mutation writes to disk first (atomic tmp+rename), then updates the cache.
2. **Command dispatch**: Single `/dojo` command with subcommand routing. Auto-reply commands return `{ shouldContinue: false, reply }`. Skill-invoking commands return `{ shouldContinue: true, updatedCtx }`.
3. **Tool registration**: 3 tools registered via `api.registerTool()` with TypeBox parameter schemas. Tools interact with the state manager and file system.
4. **Hook registration**: 2 hooks (`on-skill-complete`, `on-phase-change`) registered via `api.registerHook()`. Hooks are lazy-imported.
5. **Dual-mode skills**: Each SKILL.md contains a "Dojo Genesis Integration" section. Skills detect orchestration mode by calling `dojo_get_context` — if `{ active: false }`, they run standalone.
6. **Atomic file writes**: All file mutations use tmp file + `fs.rename` for crash safety.
7. **Input validation**: Project names validated against `/^[a-z0-9][a-z0-9-]{1,63}$/` (no consecutive hyphens). Filenames sanitized. Output directories validated against allowlist.

---

## 3. Source Code Structure

```
@openclaw/dojo-genesis/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── index.ts                          # Plugin entry: default export with register(api)
├── src/
│   ├── commands/
│   │   ├── router.ts                 # registerDojoCommands + resolveTargetProject + HELP_TEXT
│   │   ├── init.ts                   # handleInit
│   │   ├── switch.ts                 # handleSwitch
│   │   ├── status.ts                 # handleStatus
│   │   ├── list.ts                   # handleList
│   │   └── archive.ts               # handleArchive
│   ├── state/
│   │   ├── types.ts                  # DojoPhase, GlobalState, ProjectState, Track, etc.
│   │   ├── manager.ts               # DojoStateManager class + singleton + initStateManager
│   │   └── migrations.ts            # Schema version check (stub for v1.0.0)
│   ├── orchestration/
│   │   └── tool-registry.ts          # registerOrchestrationTools (3 tools)
│   ├── hooks/
│   │   ├── on-skill-complete.ts      # Phase advancement + activity logging
│   │   └── on-phase-change.ts        # PROJECT.md update
│   ├── ui/
│   │   └── chat-formatter.ts         # formatPhase, formatDate, formatTrackTable, formatProjectList
│   └── utils/
│       ├── validation.ts             # validateProjectName, sanitizeFilename, validateOutputDir
│       ├── file-ops.ts               # readJsonFile, writeJsonFile, writeTextFile, ensureDir, fileExists
│       └── markdown.ts               # PROJECT.md template generation
├── hooks/
│   ├── on-skill-complete/
│   │   └── HOOK.md                   # OpenClaw hook manifest
│   └── on-project-phase-change/
│       └── HOOK.md                   # OpenClaw hook manifest
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
    ├── helpers/
    │   └── test-utils.ts             # Temp dir factory, mock PluginAPI, mock state manager
    ├── commands/
    │   ├── router.test.ts
    │   ├── init.test.ts
    │   ├── switch.test.ts
    │   ├── status.test.ts
    │   ├── list.test.ts
    │   └── archive.test.ts
    ├── state/
    │   └── manager.test.ts
    ├── orchestration/
    │   ├── context-provider.test.ts
    │   ├── artifact-saver.test.ts
    │   └── state-updater.test.ts
    ├── hooks/
    │   ├── on-skill-complete.test.ts
    │   └── on-phase-change.test.ts
    ├── utils/
    │   ├── validation.test.ts
    │   └── file-ops.test.ts
    └── e2e/
        └── full-workflow.test.ts
```

---

## 4. Data Models and Interfaces

All interfaces from `src/state/types.ts`:

### DojoPhase

```typescript
export type DojoPhase =
  | "initialized"
  | "scouting"
  | "specifying"
  | "decomposing"
  | "commissioning"
  | "implementing"
  | "retrospective";
```

### GlobalState

Stored at `~/.openclaw/dojo-genesis/global-state.json`:

```typescript
export interface GlobalState {
  version: string;               // "1.0.0" — schema version for migrations
  activeProjectId: string | null;
  projects: ProjectMetadata[];
  lastUpdated: string;           // ISO 8601
}
```

### ProjectMetadata

Stored inside `GlobalState.projects[]`:

```typescript
export interface ProjectMetadata {
  id: string;                    // URL-safe slug: /^[a-z0-9][a-z0-9-]{1,63}$/
  name: string;
  description: string;
  phase: DojoPhase;
  createdAt: string;
  lastAccessedAt: string;
  archived: boolean;
}
```

### ProjectState

Stored at `~/.openclaw/dojo-genesis/projects/{id}/state.json`:

```typescript
export interface ProjectState {
  projectId: string;
  phase: DojoPhase;
  tracks: Track[];
  decisions: DecisionRef[];
  specs: SpecRef[];
  artifacts: ArtifactRef[];
  currentTrack: string | null;
  lastSkill: string;
  activityLog: ActivityEntry[];  // Capped at 50 entries
  lastUpdated: string;
}
```

### Supporting Interfaces

```typescript
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

---

## 5. API / Interface Contracts

### 5.1 Plugin Entry (`index.ts`)

Default export with:
- `id`: `"dojo-genesis"`
- `name`: `"Dojo Genesis"`
- `slotType`: `"tool"`
- `configSchema`: object with `projectsDir` (string, default `"dojo-genesis"`)
- `register(api: PluginAPI)`: initializes state manager, registers commands, tools, hooks

### 5.2 Command System

Single `/dojo` command registered via `api.registerCommand()`. Dispatch table:

| Subcommand | Handler | Returns |
|------------|---------|---------|
| `init <name> [--desc "..."]` | `handleInit` | `{ shouldContinue: false, reply }` |
| `switch <name>` | `handleSwitch` | `{ shouldContinue: false, reply }` |
| `status [@project]` | `handleStatus` | `{ shouldContinue: false, reply }` |
| `list [--all]` | `handleList` | `{ shouldContinue: false, reply }` |
| `archive [@project]` | `handleArchive` | `{ shouldContinue: false, reply }` |
| `scout <tension> [@project]` | route to agent | `{ shouldContinue: true, updatedCtx }` |
| `spec <feature> [@project]` | route to agent | `{ shouldContinue: true, updatedCtx }` |
| `tracks [@project]` | route to agent | `{ shouldContinue: true, updatedCtx }` |
| `commission [@project]` | route to agent | `{ shouldContinue: true, updatedCtx }` |
| `retro [@project]` | route to agent | `{ shouldContinue: true, updatedCtx }` |
| `help` / undefined | inline | `{ shouldContinue: false, reply }` |

`resolveTargetProject(ctx)`: checks for `@project-name` in args first, falls back to `globalState.activeProjectId`.

### 5.3 Orchestration Tools

Registered via `api.registerTool()` with TypeBox schemas:

**dojo_get_context**
- Params: `{ projectId?: string }`
- Returns: `{ active: true, projectId, phase, tracks, decisions, specs, currentTrack, lastSkill, recentActivity }` or `{ active: false }`

**dojo_save_artifact**
- Params: `{ filename: string, content: string, outputDir: string, projectId?: string }`
- Validates `outputDir` against allowlist: `["scouts", "specs", "prompts", "retros", "artifacts", "tracks"]`
- Sanitizes filename, writes atomically, records artifact in state
- Returns: `{ saved: true, path }` or `{ error: string }`

**dojo_update_state**
- Params: `{ phase?, lastSkill?, currentTrack?, addTrack?, addDecision?, addSpec?, projectId? }`
- Supports partial updates
- Returns: `{ updated: true, phase }` or `{ error: string }`

### 5.4 Hooks

**on-skill-complete**
- Event: `{ skillName: string, result: string, context: Record<string, unknown> }`
- If `context.dojoProject` exists: advance phase, log activity
- If no project context: skip silently

**on-phase-change**
- Event: `{ projectId: string, fromPhase: string, toPhase: string }`
- Updates PROJECT.md header and activity log

---

## 6. Per-Project File System Structure

Created on `/dojo init`:

```
~/.openclaw/dojo-genesis/projects/{name}/
├── state.json          # ProjectState
├── PROJECT.md          # Human-readable project overview
├── decisions.md        # Append-only decision log
├── scouts/             # Strategic scout outputs
├── specs/              # Release specification outputs
├── prompts/            # Implementation prompt outputs
├── retros/             # Retrospective outputs
├── tracks/             # Parallel track outputs
└── artifacts/          # Misc artifacts (context-ingestion, checklist, handoff)
```

---

## 7. Phase State Machine

```
initialized → scouting → specifying → decomposing → commissioning → implementing → retrospective
```

Transitions triggered by corresponding `/dojo` commands and skill completions:

| Trigger | From → To |
|---------|-----------|
| `/dojo scout` + skill complete | initialized → scouting |
| `/dojo spec` + skill complete | scouting → specifying |
| `/dojo tracks` + skill complete | specifying → decomposing |
| `/dojo commission` + skill complete | decomposing → commissioning |
| external implementation | commissioning → implementing |
| `/dojo retro` + skill complete | implementing → retrospective |

---

## 8. Delivery Phases

### Phase 1: Foundation (Track 0)
Build project scaffold, types, state manager, utilities, chat formatter, and test infrastructure.

**Testable milestone**: `vitest run` passes. State manager can CRUD global and project state. Validation rejects bad inputs. Atomic file writes work.

**Files**:
- `package.json`, `tsconfig.json`, `vitest.config.ts`
- `index.ts` (skeleton)
- `src/state/types.ts`, `src/state/manager.ts`, `src/state/migrations.ts`
- `src/utils/file-ops.ts`, `src/utils/validation.ts`, `src/utils/markdown.ts`
- `src/ui/chat-formatter.ts`
- `tests/helpers/test-utils.ts`
- `tests/state/manager.test.ts`, `tests/utils/validation.test.ts`, `tests/utils/file-ops.test.ts`

### Phase 2: Command System (Track A)
Implement all 10 `/dojo` subcommands with chat-formatted output.

**Testable milestone**: All command handlers return correctly formatted markdown. Integration test: init → status → list → switch → archive lifecycle.

**Files**:
- `src/commands/router.ts`, `init.ts`, `switch.ts`, `status.ts`, `list.ts`, `archive.ts`
- `tests/commands/*.test.ts`

### Phase 3: Orchestration Engine (Track B)
Implement 3 tools and 2 hooks.

**Testable milestone**: Tools registered and callable. Artifacts saved atomically. Hooks fire in orchestration mode, skip in standalone.

**Files**:
- `src/orchestration/tool-registry.ts`
- `src/hooks/on-skill-complete.ts`, `src/hooks/on-phase-change.ts`
- `hooks/on-skill-complete/HOOK.md`, `hooks/on-project-phase-change/HOOK.md`
- `tests/orchestration/*.test.ts`, `tests/hooks/*.test.ts`

### Phase 4: Skill Migration (Track C)
Create 8 SKILL.md files with OpenClaw frontmatter and Dojo Genesis Integration sections.

**Testable milestone**: All 8 skills contain valid frontmatter and orchestration sections.

**Files**:
- `skills/*/SKILL.md` (8 files)

### Phase 5: Integration & QA
Wire everything together. E2E test full workflow. Multi-project isolation. Dual-mode validation.

**Testable milestone**: E2E test passes full 6-phase workflow with real file system. All tests pass with `vitest run`.

**Files**:
- Final wiring in `index.ts`
- `tests/e2e/full-workflow.test.ts`

---

## 9. Verification Approach

### Commands

```bash
# Type checking
npx tsc --noEmit

# Run all tests
npx vitest run

# Run with coverage
npx vitest run --coverage
```

### Test Strategy

- **Unit tests**: Each module tested in isolation with mocked dependencies (temp dirs, mock PluginAPI)
- **Integration tests**: Command lifecycle, tool call chains, state consistency
- **E2E test**: Full 6-phase workflow with real file system operations in temp directory
- **Target**: 90%+ line coverage on `src/`

### Performance Benchmarks (in test suite)

| Operation | Target |
|-----------|--------|
| `handleInit` | < 30ms |
| `handleStatus` (cache hit) | < 10ms |
| `dojo_save_artifact` | < 50ms |
| Full 6-phase state operations | < 2s total |

### Validation Checks

- Project names: regex + no consecutive hyphens
- Output directories: allowlist check
- Filenames: sanitized (lowercase, alphanumeric + hyphens/underscores, max 128)
- Path traversal: prevented by validation (no `..`, no absolute paths in user input)
- Activity log: capped at 50 entries

---

## 10. Key Implementation Decisions

1. **Singleton state manager**: Module-level `let stateManager` initialized in `register()`. Avoids passing state manager through every function. Tests reinitialize with temp directories.

2. **TypeBox for tool schemas**: Uses `Type` from `openclaw/plugin-sdk` for tool parameter definitions. Matches OpenClaw's expected pattern.

3. **Lazy hook imports**: Hooks use dynamic `import()` in the register function to avoid loading hook code until needed.

4. **No external dependencies beyond peer dep**: The plugin uses only Node.js built-ins (`fs`, `path`) and the OpenClaw Plugin SDK. No lodash, no zod, no external FS libraries.

5. **Markdown-first output**: All chat output is markdown. No HTML, no rich formatting beyond what markdown supports. Works across all OpenClaw channels.

6. **Schema version field**: `global-state.json` includes `version: "1.0.0"`. `migrations.ts` is a stub in v1.0.0 but establishes the migration pattern for future versions.

7. **SKILL.md content**: Skills will be authored based on the Dojo Genesis methodology patterns. Each includes OpenClaw-compatible YAML frontmatter and the standardized orchestration integration section from spec section 3.9.
