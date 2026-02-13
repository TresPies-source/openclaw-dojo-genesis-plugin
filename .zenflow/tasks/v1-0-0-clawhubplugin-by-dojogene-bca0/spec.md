# Technical Specification: @openclaw/dojo-genesis v1.0.0

## Difficulty Assessment: **Hard**

- Greenfield TypeScript plugin (~30 source files + 8 SKILL.md files)
- Integration with OpenClaw Plugin SDK (real API differs from spec assumptions)
- File-based state management with caching, atomic writes, validation
- 10 subcommands, 3 orchestration tools, lifecycle hooks, 8 skills
- Dual-mode skill architecture (standalone vs orchestration)

---

## 1. Technical Context

- **Language:** TypeScript (ES2022, module: NodeNext)
- **Runtime:** Node.js ≥ 22
- **Target platform:** OpenClaw plugin ecosystem (`openclaw.extensions`)
- **Dependencies:**
  - `openclaw` (peer dependency — provides plugin SDK types)
  - `@sinclair/typebox` (schema definitions — already used by OpenClaw)
  - `typescript` ^5.9 (dev)
  - `vitest` ^4.0 (dev)

---

## 2. Critical SDK Discrepancies

The v1.0.0 specification was written against an **assumed** OpenClaw Plugin SDK API. After reviewing the real SDK source (`openclaw/openclaw@main`), these discrepancies must be reconciled:

### 2.1 Command Result Type

**Spec assumes:**
```typescript
return {
  shouldContinue: true,
  updatedCtx: { dojoProject, dojoPhase, dojoSubcommand },
};
```

**Real SDK:**
```typescript
type PluginCommandResult = ReplyPayload; // { text?: string; ... }
```

`PluginCommandResult` is `ReplyPayload` — there is **no** `shouldContinue` or `updatedCtx` field. Plugin commands return text/media directly and **cannot** pass context to the agent turn.

**Adaptation:** Skill-invoking commands (`scout`, `spec`, `tracks`, `commission`, `retro`) will:
1. Return a `ReplyPayload` with text that instructs the user and sets expectations
2. Inject project context into a state file that `dojo_get_context` reads
3. Rely on the skill's SKILL.md instructions to tell the agent to call `dojo_get_context`

This means the "skill-invoking" commands are also auto-reply in the real SDK. The agent picks up project awareness via the `dojo_get_context` tool call pattern, not via injected message context.

### 2.2 Hook Event Names

**Spec assumes:** `on-skill-complete`, `on-phase-change`

**Real SDK hook names:**
```typescript
type PluginHookName =
  | "before_agent_start" | "agent_end"
  | "before_tool_call" | "after_tool_call"
  | "message_received" | "message_sending" | "message_sent"
  | "session_start" | "session_end"
  | "gateway_start" | "gateway_stop"
  | ... (others)
```

There is no `on-skill-complete` or `on-phase-change` hook. These are custom concepts from the spec.

**Adaptation:**
- Use `after_tool_call` to detect when `dojo_update_state` or `dojo_save_artifact` completes and trigger side effects (PROJECT.md update, activity logging)
- The `on-phase-change` logic triggers inside `dojo_update_state` tool itself when `params.phase` differs from current state
- HOOK.md files become unnecessary; hooks register via `api.on()`

### 2.3 State Directory Resolution

**Spec assumes:** `api.deps.configDir` → `~/.openclaw/`

**Real SDK:** `api.runtime.state.resolveStateDir()` returns the state directory path

### 2.4 Tool Registration

**Spec assumes:** `api.registerTool({ name, description, parameters: Type.Object(...), async execute(_id, params) {} })`

**Real SDK:** `api.registerTool(tool: AnyAgentTool | OpenClawPluginToolFactory)` where `AnyAgentTool` comes from `@mariozechner/pi-agent-core`. Tools use the pi-agent-core tool definition format with TypeBox schemas.

### 2.5 registerPluginHooksFromDir

**Spec assumes:** `registerPluginHooksFromDir(api, "./hooks")` as an import from SDK

**Real SDK:** No such function exported. Hooks are registered programmatically via `api.registerHook()` or `api.on()`.

---

## 3. Implementation Approach

### 3.1 Architecture (Adapted to Real SDK)

```
User ──→ /dojo scout "tension X"
           │
           ▼
┌──────────────────────────────────────┐
│  Plugin Command Handler              │
│    └── returns ReplyPayload          │
│         (text: "Scout started...")   │
│                                      │
│  Agent Turn (user message follows)   │
│    ├── System Prompt + SKILL.md      │
│    └── Tool Calls                    │
│          ├── dojo_get_context        │
│          ├── dojo_save_artifact      │
│          └── dojo_update_state       │
│                                      │
│  Lifecycle Hooks (api.on)            │
│    ├── after_tool_call               │
│    └── before_agent_start            │
└──────────────────────────────────────┘
```

### 3.2 Plugin Structure (Final)

```
@openclaw/dojo-genesis/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── index.ts                        # Plugin entry
├── src/
│   ├── commands/
│   │   ├── router.ts               # /dojo dispatch
│   │   ├── init.ts
│   │   ├── switch.ts
│   │   ├── status.ts
│   │   ├── list.ts
│   │   └── archive.ts
│   ├── state/
│   │   ├── manager.ts              # DojoStateManager singleton
│   │   ├── types.ts                # All interfaces
│   │   └── migrations.ts           # Schema version stub
│   ├── tools/
│   │   ├── registry.ts             # registerOrchestrationTools
│   │   ├── get-context.ts          # dojo_get_context
│   │   ├── save-artifact.ts        # dojo_save_artifact
│   │   └── update-state.ts         # dojo_update_state
│   ├── hooks/
│   │   ├── after-tool-call.ts      # Phase change detection
│   │   └── before-agent-start.ts   # Inject project awareness
│   ├── ui/
│   │   └── chat-formatter.ts       # Markdown output formatters
│   └── utils/
│       ├── validation.ts
│       ├── file-ops.ts
│       └── markdown.ts
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
    ├── commands/
    │   ├── router.test.ts
    │   ├── init.test.ts
    │   ├── status.test.ts
    │   └── list.test.ts
    ├── state/
    │   └── manager.test.ts
    ├── tools/
    │   ├── get-context.test.ts
    │   ├── save-artifact.test.ts
    │   └── update-state.test.ts
    └── e2e/
        └── full-workflow.test.ts
```

### 3.3 Key Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | All 10 commands return `ReplyPayload` (auto-reply) | Real SDK has no `shouldContinue` mechanism |
| 2 | Skill-invoking commands set "pending skill" in state, return guidance text | Agent picks up context via `dojo_get_context` tool |
| 3 | Use `api.on("after_tool_call", ...)` instead of custom hook events | Maps to real SDK hook system |
| 4 | Use `api.on("before_agent_start", ...)` to prepend project context | Supplements the tool-pull pattern |
| 5 | Tools implemented as `OpenClawPluginToolFactory` returning `AnyAgentTool` | Matches real SDK registration pattern |
| 6 | State directory: `${api.runtime.state.resolveStateDir()}/dojo-genesis/` | Follows OpenClaw conventions |

---

## 4. Data Model

All TypeScript interfaces as specified in `specs/v1.0.0_specification.md` Section 3.3:

- `DojoPhase` (7 phases)
- `GlobalState` (version, activeProjectId, projects[], lastUpdated)
- `ProjectMetadata` (id, name, description, phase, createdAt, lastAccessedAt, archived)
- `ProjectState` (projectId, phase, tracks[], decisions[], specs[], artifacts[], currentTrack, lastSkill, activityLog[], lastUpdated)
- `Track`, `DecisionRef`, `SpecRef`, `ArtifactRef`, `ActivityEntry`

No changes needed to the data model — it's internal to the plugin.

---

## 5. Verification Approach

- **Unit tests:** vitest for state manager, validation, file-ops, each command handler, each tool
- **Integration tests:** Full workflow (init → scout → spec → tracks → commission → retro) with real file system in temp directories
- **Lint:** TypeScript strict mode compilation
- **Type checking:** `tsc --noEmit`
- **Skill validation:** `openclaw skill validate` on each SKILL.md (if available in dev env)

---

## 6. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| `AnyAgentTool` type shape unknown without installing openclaw | High | Examine pi-agent-core tool types from source; define compatible interface |
| No `shouldContinue` — skill-invoking flow less seamless | Medium | Strong SKILL.md instructions + `dojo_get_context` as primary context mechanism |
| `before_agent_start` hook may not fire for command-triggered flows | Medium | Test early; fallback is tool-only context (already the primary path per spec) |
