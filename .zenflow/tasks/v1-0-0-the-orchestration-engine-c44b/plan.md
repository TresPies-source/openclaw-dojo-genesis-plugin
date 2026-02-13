# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: e2f07650-8dc2-4d29-a425-25f770a6a180 -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: 9aa0b081-0533-45f3-9af7-6af80295b3bd -->

Create a technical specification based on the PRD in `{@artifacts_path}/requirements.md`.

1. Review existing codebase architecture and identify reusable components
2. Define the implementation approach

Save to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach referencing existing code patterns
- Source code structure changes
- Data model / API / interface changes
- Delivery phases (incremental, testable milestones)
- Verification approach using project lint/test commands

### [x] Step: Planning
<!-- chat-id: d60173e1-951c-4b60-825a-afe24ec93304 -->

Broke the spec into 10 implementation steps below. Each step includes its own unit tests. Foundation (steps 1-2) must complete first. Steps 3-7 (commands) and steps 8-9 (orchestration tools + hooks) can run in parallel. Step 10 (skills + E2E) depends on everything else.

### [x] Step: Project scaffold and build infrastructure
<!-- chat-id: df90ab5f-ccc9-4cb3-8a64-5bf30c170b2d -->
Set up the project from scratch: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, SDK type mocks, and test helpers.

- [ ] Create `package.json` with `@openclaw/dojo-genesis` name, `openclaw.extensions: "index.ts"`, peerDependencies (`openclaw: "*"`), dependencies (`@sinclair/typebox: "^0.32.0"`), devDependencies (`typescript: "^5.4.0"`, `vitest: "^1.6.0"`, `@vitest/coverage-v8: "^1.6.0"`)
- [ ] Create `tsconfig.json` — target ES2022, module NodeNext, strict, outDir dist, include `["index.ts", "src/**/*.ts", "hooks/**/*.ts"]`, exclude `["node_modules", "dist", "tests"]`
- [ ] Create `vitest.config.ts` — configure test root, globals
- [ ] Update `.gitignore` — add `node_modules/`, `dist/`, `coverage/`, `*.tmp`
- [ ] Create `tests/__mocks__/openclaw-types.ts` — mock interfaces for `PluginAPI` (registerCommand, registerTool, runtime.state.resolveStateDir, logger), `HookHandler`, `registerPluginHooksFromDir`
- [ ] Create `tests/helpers/test-utils.ts` — temp directory factory (`createTempDir`, `cleanupTempDir`), helper to create a pre-initialized `DojoStateManager` for tests
- [ ] Run `npm install` and verify `npx tsc --noEmit` compiles (with a minimal `index.ts` stub)

**Verification:** `npx tsc --noEmit` passes. `npx vitest run` executes (even if no tests yet).

### [x] Step: State types, file-ops, validation, and state manager
<!-- chat-id: beff2df1-3871-4b5e-b0a0-99af35847504 -->
Implement the core data layer: all TypeScript interfaces, file I/O utilities, input validation, and `DojoStateManager` with write-through cache + unit tests.

- [ ] Create `src/state/types.ts` — `DojoPhase`, `GlobalState`, `ProjectMetadata`, `PendingAction`, `ProjectState`, `Track`, `DecisionRef`, `SpecRef`, `ArtifactRef`, `ActivityEntry` (per spec §4.1)
- [ ] Create `src/utils/file-ops.ts` — `readJsonFile<T>`, `writeJsonFile` (atomic .tmp + rename), `writeTextFile` (atomic), `ensureDir`, `fileExists` (per spec §5.7)
- [ ] Create `src/utils/validation.ts` — `validateProjectName` (regex `/^[a-z0-9][a-z0-9-]{1,63}$/`, no consecutive hyphens), `sanitizeFilename` (lowercase, strip non-`[a-z0-9-_]`, collapse hyphens, max 128), `validateOutputDir` (allowlist: scouts, specs, prompts, retros, tracks, artifacts) (per spec §5.6)
- [ ] Create `src/utils/markdown.ts` — `generateProjectMd(name, description, date)` template helper
- [ ] Create `src/state/manager.ts` — `DojoStateManager` class with constructor(configDir), `getGlobalState`, `setActiveProject`, `addProject`, `getProjectState`, `updateProjectState`, `addActivity`. Write-through cache: `globalCache`, `projectCache: Map`. Module-level singleton export + `initStateManager(configDir)` (per spec §5.3)
- [ ] Create `src/state/migrations.ts` — `checkSchemaVersion(state)` stub that validates `version === "1.0.0"` and returns state unchanged
- [ ] Write `tests/state/manager.test.ts` — tests: create global state (first access creates default), add project, get project state, update project state, set active project, add activity (capped at 50), cache behavior (second read hits cache), concurrent update consistency
- [ ] Write `tests/utils/file-ops.test.ts` — tests: readJsonFile returns default on ENOENT, writeJsonFile creates parent dirs, atomic write (.tmp -> rename), writeTextFile, ensureDir idempotent
- [ ] Write `tests/utils/validation.test.ts` — tests: valid names (a-z, digits, hyphens), invalid names (uppercase, special chars, `../`, empty, too long, consecutive hyphens, starts with hyphen), sanitizeFilename edge cases, validateOutputDir allowlist

**Verification:** `npx vitest run tests/state tests/utils` — all pass. `npx tsc --noEmit` passes.

### [x] Step: Chat formatter
<!-- chat-id: fb9caf57-f85e-4ff2-a553-4e1ec036c6c8 -->
Implement `src/ui/chat-formatter.ts` with all output formatting functions used by commands.

- [ ] Create `src/ui/chat-formatter.ts` — `formatPhase(phase)` (returns indicator + phase name), `formatDate(iso)` (extracts date portion), `formatTrackTable(tracks)` (markdown table with ID, Name, Status, Dependencies), `formatProjectList(projects, showArchived, activeId)` (markdown table with Project, Phase, Last Active, Active indicator `>>>`) (per spec §3.4 SDD)
- [ ] Write tests inline with command tests (step 4) — formatter functions are simple, tested via command output assertions

**Verification:** `npx tsc --noEmit` passes.

### [x] Step: Init and archive commands
<!-- chat-id: 8990986f-fccd-493e-a378-478117c1deec -->
Implement the project creation and archival commands with full test coverage.

- [ ] Create `src/commands/init.ts` — `handleInit(args)`: validate name, check duplicate, parse `--desc`, create `ProjectMetadata` + `ProjectState`, create directory tree (scouts/, specs/, prompts/, retros/, tracks/, artifacts/), write PROJECT.md + decisions.md, persist via state manager, return `{ text }` confirmation (per spec §5.2, SDD §3.4)
- [ ] Create `src/commands/archive.ts` — `handleArchive(args)`: validate project exists, set `archived: true` on metadata, clear `activeProjectId` if archived project was active, return `{ text }` confirmation
- [ ] Write `tests/commands/init.test.ts` — tests: happy path (creates dirs, files, state), duplicate name error, invalid name errors (uppercase, path traversal, empty, too long, consecutive hyphens), `--desc` flag parsing, verify PROJECT.md content, verify decisions.md created
- [ ] Write `tests/commands/archive.test.ts` — tests: happy path, archive active project clears activeProjectId, archive nonexistent project error, archive already-archived project

**Verification:** `npx vitest run tests/commands/init tests/commands/archive` — all pass.

### [x] Step: Switch, status, and list commands
<!-- chat-id: d7773189-a00e-4f33-aa5d-d333fca96835 -->
Implement the remaining deterministic commands.

- [ ] Create `src/commands/switch.ts` — `handleSwitch(args)`: validate project exists and not archived, set as active via `stateManager.setActiveProject`, return `{ text }` confirmation
- [ ] Create `src/commands/status.ts` — `handleStatus(args)`: parse optional `@project`, get project state, format with `formatPhase`, `formatDate`, `formatTrackTable`, show last 5 activity entries, show `suggestNextAction(phase)`, return `{ text }` (per spec §5.2, SDD §3.4)
- [ ] Create `src/commands/list.ts` — `handleList(args)`: parse `--all` flag, get global state, filter by archived status, format with `formatProjectList`, return `{ text }`
- [ ] Write `tests/commands/switch.test.ts` — tests: happy path, nonexistent project error, archived project error
- [ ] Write `tests/commands/status.test.ts` — tests: active project status, `@project` targeting, no active project error, status with tracks, status with activity entries, next action suggestions per phase
- [ ] Write `tests/commands/list.test.ts` — tests: empty list, multiple projects, `--all` shows archived, active indicator on correct project

**Verification:** `npx vitest run tests/commands/switch tests/commands/status tests/commands/list` — all pass.

### [x] Step: Skill-invoke handler and command router
<!-- chat-id: 787f08f3-f042-4c81-b03f-7c0a5969a7ef -->
Implement the shared skill-invoke handler and the top-level command router that wires everything together.

- [ ] Create `src/commands/skill-invoke.ts` — `handleSkillInvoke(skillName, args)`: resolve target project (parse `@project` or use active), validate project exists, write `pendingAction: { skill, args, requestedAt }` to project state, add activity log entry, return `{ text }` with skill name + project ID + phase (per spec §5.2, SDD §3.4)
- [ ] Create `src/commands/router.ts` — `registerDojoCommands(api)`: register `/dojo` command, dispatch on subcommand (init/switch/status/list/archive → deterministic handlers; scout/spec/tracks/commission/retro → `handleSkillInvoke` with SKILL_MAP lookup; help/undefined → HELP_TEXT; default → unknown command error). SKILL_MAP: `{ scout: "strategic-scout", spec: "release-specification", tracks: "parallel-tracks", commission: "implementation-prompt", retro: "retrospective" }`
- [ ] Write `tests/commands/skill-invoke.test.ts` — tests: happy path (pendingAction written with correct skill + args), `@project` targeting, no active project error, missing project error
- [ ] Write `tests/commands/router.test.ts` — tests: each subcommand dispatches to correct handler, help text returned for no args, unknown command error, args passed correctly to handlers

**Verification:** `npx vitest run tests/commands/skill-invoke tests/commands/router` — all pass.

### [x] Step: Command integration test
<!-- chat-id: 75a7b08c-58a1-4de4-888a-c6f636986a3a -->
End-to-end command lifecycle test using real file system.

- [ ] Write `tests/commands/integration.test.ts` — test the full deterministic command lifecycle: `init("test-project")` → `status()` → `list()` → `init("project-b")` → `list()` (two projects) → `switch("test-project")` → `status()` → `archive("test-project")` → `list()` (only project-b) → `list(["--all"])` (both). Verify file system state at each step. Verify `@project` targeting for status and skill-invoke.

**Verification:** `npx vitest run tests/commands/integration` — passes.

### [x] Step: Orchestration tools
<!-- chat-id: 92b3835e-69b2-4eaa-b944-caa2f4585c46 -->
Implement the 3 agent-callable tools with `@sinclair/typebox` schemas and unit tests.

- [ ] Create `src/orchestration/tool-registry.ts` — `registerOrchestrationTools(api)`: register `dojo_get_context` (returns full project context JSON or `{ active: false }`), `dojo_save_artifact` (validate outputDir, sanitize filename, atomic write, record ArtifactRef + activity), `dojo_update_state` (update phase, lastSkill, currentTrack, addTrack, addDecision, addSpec). All return `{ content: [{ type: "text", text: JSON.stringify(...) }] }`. Use `Type.Object()` from `@sinclair/typebox` for parameter schemas. (per spec §5.4, SDD §3.5)
- [ ] Write `tests/orchestration/tool-registry.test.ts` — tests per tool:
  - `dojo_get_context`: active project returns full context, no project returns `{ active: false }`, specific projectId targeting
  - `dojo_save_artifact`: writes file to correct dir, sanitizes filename, records artifact in state, rejects invalid outputDir, rejects when no active project
  - `dojo_update_state`: updates phase, updates lastSkill, adds track, adds decision, adds spec, updates multiple fields at once, rejects when no project

**Verification:** `npx vitest run tests/orchestration` — all pass.

### [x] Step: Plugin hooks and entry point
<!-- chat-id: 999ba9bc-b0d5-4e44-9364-6d92c4c7d927 -->
Implement the 3 lifecycle hooks, HOOK.md manifests, and the plugin entry point (`index.ts`).

- [ ] Create `hooks/before-agent-start/HOOK.md` — YAML frontmatter with name, description, `events: ["before_agent_start"]`
- [ ] Create `hooks/before-agent-start/handler.ts` — detect `pendingAction` in active project, build context block (project ID, phase, pending skill, args, tracks, decisions, lastSkill, instructions), push into `event.messages`. Include `SKILL_INSTRUCTIONS` map for all 5 skills. No-op if no active project or no pendingAction. (per spec §5.5, SDD §3.7)
- [ ] Create `hooks/after-tool-call/HOOK.md` — YAML frontmatter with `events: ["after_tool_call"]`
- [ ] Create `hooks/after-tool-call/handler.ts` — check `event.context.toolName` against monitored tools list. If `dojo_update_state` with a `phase` param, read + update PROJECT.md (replace phase line, prepend activity log entry). (per SDD §3.7)
- [ ] Create `hooks/agent-end/HOOK.md` — YAML frontmatter with `events: ["agent_end"]`
- [ ] Create `hooks/agent-end/handler.ts` — if active project has `pendingAction`, clear it via `updateProjectState(id, { pendingAction: null })`. (per SDD §3.7)
- [ ] Create `index.ts` — plugin object export: `{ id: "dojo-genesis", name: "Dojo Genesis", configSchema, register(api) }`. In `register()`: resolve state dir (with fallback to `~/.openclaw/dojo-genesis`), `initStateManager`, `registerDojoCommands`, `registerOrchestrationTools`, `registerPluginHooksFromDir(api, "./hooks")`, `api.logger.info`. (per spec §5.1, SDD §3.6)
- [ ] Write `tests/hooks/before-agent-start.test.ts` — tests: injects context when pendingAction exists, no-op when no active project, no-op when no pendingAction, context block contains correct project/phase/skill info
- [ ] Write `tests/hooks/after-tool-call.test.ts` — tests: updates PROJECT.md on phase change, no-op for non-monitored tools, no-op when no phase param
- [ ] Write `tests/hooks/agent-end.test.ts` — tests: clears pendingAction, no-op when no pendingAction, no-op when no active project

**Verification:** `npx vitest run tests/hooks` — all pass. `npx tsc --noEmit` passes on full project.

### [x] Step: E2E workflow test and final verification
<!-- chat-id: d4cf0056-0d27-4d41-97a0-8e188468f922 -->
Write the E2E full-workflow test and run final checks. Skill SKILL.md files are handled separately by another agent.

- [ ] Write `tests/e2e/full-workflow.test.ts` — full lifecycle on real file system: init → skill-invoke(scout) + simulate before_agent_start hook + simulate tool calls (get_context, save_artifact, update_state) + simulate agent_end → repeat for spec, tracks, commission, retro → verify all files on disk, verify state.json has correct phase/tracks/artifacts, verify PROJECT.md updated, verify multi-project isolation
- [ ] Run `npx vitest run` — all tests pass
- [ ] Run `npx tsc --noEmit` — no type errors
- [ ] Run `npx vitest run --coverage` — verify 90%+ line coverage on `src/`

**Verification:** Full test suite green. Type check clean. Coverage target met.

### [x] Step: Review your work against the specification
<!-- chat-id: 2692c1a5-8049-414f-ba6c-33634f56a447 -->

then address all fixes and reasonable recommendations
