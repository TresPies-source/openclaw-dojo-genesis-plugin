# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: fe249e1c-7293-4c33-a011-6d19fff8764c -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: 5b690dc2-af36-4f80-8f88-5039f9066983 -->

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
<!-- chat-id: eb632699-a17a-471f-9c30-b8f7955feae7 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

### [ ] Step: Project scaffold and build configuration

Set up the TypeScript project from scratch with all build/test tooling.

- Create `package.json` with `name: "@openclaw/dojo-genesis"`, `type: "module"`, `main: "dist/index.js"`, peer dependency on `openclaw/plugin-sdk`, dev dependencies on `typescript`, `vitest`, `@types/node`. Include `openclaw.extensions` field with plugin ID `dojo-genesis`.
- Create `tsconfig.json` targeting ES2022, module NodeNext, moduleResolution NodeNext, outDir `dist`, rootDir `.`, strict mode, include `["index.ts", "src/**/*.ts"]`.
- Create `vitest.config.ts` with default config.
- Update `.gitignore` to include `node_modules/`, `dist/`, `*.log`, `.cache/`.
- Create skeleton `index.ts` exporting plugin object with `id`, `name`, `slotType`, `configSchema`, and empty `register(api)`.
- Run `npm install` and verify `npx tsc --noEmit` passes.

### [ ] Step: State types, file-ops utilities, and validation

Implement the foundational modules that everything else depends on.

- Implement `src/state/types.ts` — all TypeScript interfaces: `DojoPhase`, `GlobalState`, `ProjectMetadata`, `ProjectState`, `Track`, `DecisionRef`, `SpecRef`, `ArtifactRef`, `ActivityEntry` (per spec section 4).
- Implement `src/utils/file-ops.ts` — `readJsonFile<T>`, `writeJsonFile`, `writeTextFile`, `ensureDir`, `fileExists`. All writes use atomic tmp+rename pattern (per spec section 3.3).
- Implement `src/utils/validation.ts` — `validateProjectName` (regex `/^[a-z0-9][a-z0-9-]{1,63}$/` + no consecutive hyphens), `sanitizeFilename` (lowercase, alphanumeric + hyphens/underscores, max 128), `validateOutputDir` (allowlist: scouts, specs, prompts, retros, artifacts, tracks).
- Implement `src/utils/markdown.ts` — `generateProjectMd(name, description, phase, createdDate)` for PROJECT.md template.
- Write `tests/utils/file-ops.test.ts` — atomic write, ENOENT default, ensureDir idempotency, concurrent writes.
- Write `tests/utils/validation.test.ts` — valid names, invalid names (uppercase, path traversal, consecutive hyphens, empty, too long), sanitizeFilename edge cases, validateOutputDir allowlist.
- Run `npx vitest run` and `npx tsc --noEmit` — all must pass.

### [ ] Step: State manager and chat formatter

Implement the core state management singleton and the UI formatting module.

- Implement `src/state/manager.ts` — `DojoStateManager` class with write-through cache: `getGlobalState()`, `setActiveProject()`, `addProject()`, `getProjectState()`, `updateProjectState()`, `addActivity()` (capped at 50 entries), `archiveProject()`. Module-level `let stateManager` + `initStateManager(configDir)`. Expose `basePath` via getter for hooks.
- Implement `src/state/migrations.ts` — stub that checks `version` field and returns state unchanged for v1.0.0.
- Implement `src/ui/chat-formatter.ts` — `formatPhase(phase)` with text markers (`[ ]`, `[~]`, `[>]`, `[*]`), `formatDate(iso)` (date portion only), `formatTrackTable(tracks)` (markdown table), `formatProjectList(projects, showArchived, activeId)` (markdown table with active indicator).
- Create `tests/helpers/test-utils.ts` — temp directory factory (creates temp dir, returns path and cleanup fn), mock `PluginAPI` builder (stubs for `registerCommand`, `registerTool`, `registerHook`, `logger`, `deps.configDir`).
- Write `tests/state/manager.test.ts` — init global state on first read, add project, get project state, update project state, set active project, activity log capping at 50, cache consistency (read after write returns updated data), archive project.
- Run `npx vitest run` and `npx tsc --noEmit` — all must pass.

### [ ] Step: Command system (all 10 subcommands)

Implement the `/dojo` command router and all subcommand handlers.

- Implement `src/commands/router.ts` — `registerDojoCommands(api)` with full dispatch table (init, switch, status, list, archive → `shouldContinue: false`; scout, spec, tracks, commission, retro → `shouldContinue: true` + `updatedCtx`). Implement `resolveTargetProject(ctx)` for `@project-name` parsing with active project fallback. Include `HELP_TEXT` constant.
- Implement `src/commands/init.ts` — `handleInit(ctx)`: validate name, check duplicate, parse `--desc`, create project dirs (scouts/, specs/, prompts/, retros/, tracks/, artifacts/), write PROJECT.md + decisions.md + state.json, add to global state, set active.
- Implement `src/commands/switch.ts` — `handleSwitch(ctx)`: validate project exists and is not archived, set active, update lastAccessedAt.
- Implement `src/commands/status.ts` — `handleStatus(ctx)`: resolve target project, format phase/tracks/activity/suggested next action using chat-formatter.
- Implement `src/commands/list.ts` — `handleList(ctx)`: parse `--all` flag, format project list using `formatProjectList`.
- Implement `src/commands/archive.ts` — `handleArchive(ctx)`: resolve target, set archived flag, clear active if it was the active project.
- Write `tests/commands/router.test.ts` — dispatch to correct handler for each subcommand, unknown command returns error, help returns HELP_TEXT, skill-invoking commands return `shouldContinue: true` with correct `updatedCtx`.
- Write `tests/commands/init.test.ts` — happy path (creates dirs, files, state), duplicate name error, invalid name error, `--desc` flag parsing.
- Write `tests/commands/switch.test.ts` — happy path, nonexistent project error, archived project error.
- Write `tests/commands/status.test.ts` — with tracks, without tracks, no active project error, `@project` override.
- Write `tests/commands/list.test.ts` — empty list, multiple projects, `--all` shows archived, active indicator.
- Write `tests/commands/archive.test.ts` — happy path, clears active if needed, already archived error.
- Run `npx vitest run` and `npx tsc --noEmit` — all must pass.

### [ ] Step: Orchestration tools (3 tools)

Implement the three tools registered via `api.registerTool()`.

- Implement `src/orchestration/tool-registry.ts` — `registerOrchestrationTools(api)` registering all 3 tools with TypeBox parameter schemas (`Type` from `openclaw/plugin-sdk`).
- **dojo_get_context**: returns `{ active: true, projectId, phase, tracks, decisions, specs, currentTrack, lastSkill, recentActivity }` or `{ active: false }`. Params: `{ projectId?: string }`.
- **dojo_save_artifact**: validates `outputDir` against allowlist, sanitizes filename, writes file atomically, records artifact in project state, logs activity. Params: `{ filename, content, outputDir, projectId? }`. Returns `{ saved: true, path }` or `{ error }`.
- **dojo_update_state**: supports partial updates — phase, lastSkill, currentTrack, addTrack, addDecision, addSpec. Params per spec section 5.3. Returns `{ updated: true, phase }` or `{ error }`.
- Write `tests/orchestration/context-provider.test.ts` — returns context when project active, returns `{ active: false }` when no project, explicit `projectId` override.
- Write `tests/orchestration/artifact-saver.test.ts` — saves file to correct dir, rejects invalid outputDir, sanitizes filename, records artifact in state, handles missing project.
- Write `tests/orchestration/state-updater.test.ts` — updates phase, adds track, adds decision, adds spec, partial update, missing project error.
- Run `npx vitest run` and `npx tsc --noEmit` — all must pass.

### [ ] Step: Plugin hooks (on-skill-complete, on-phase-change)

Implement the two event-driven hooks and their manifests.

- Implement `src/hooks/on-skill-complete.ts` — `onSkillComplete(event)`: if `event.context.dojoProject` exists, advance phase based on `SKILL_TO_PHASE` mapping, log activity. Skip silently if no project context (standalone mode).
- Implement `src/hooks/on-phase-change.ts` — `onPhaseChange(event)`: update PROJECT.md `**Phase:**` line and prepend activity log entry with new phase.
- Create `hooks/on-skill-complete/HOOK.md` — OpenClaw hook manifest with event name, description.
- Create `hooks/on-project-phase-change/HOOK.md` — OpenClaw hook manifest with event name, description.
- Wire hooks into `index.ts` `register()` via lazy `import()` per spec section 3.6.
- Write `tests/hooks/on-skill-complete.test.ts` — fires phase advance + activity in orchestration mode, skips in standalone mode (no `dojoProject` in context), maps each skill to correct phase.
- Write `tests/hooks/on-phase-change.test.ts` — updates PROJECT.md phase line, adds activity log entry, handles missing PROJECT.md gracefully.
- Run `npx vitest run` and `npx tsc --noEmit` — all must pass.

### [ ] Step: Skill migration (8 SKILL.md files)

Create the 8 core skill files with OpenClaw frontmatter and Dojo Genesis integration sections.

- Create `skills/strategic-scout/SKILL.md` — category STRATEGIZE, outputDir scouts, phase on complete: scouting.
- Create `skills/release-specification/SKILL.md` — category SPECIFY, outputDir specs, phase on complete: specifying.
- Create `skills/parallel-tracks/SKILL.md` — category SPECIFY, outputDir tracks, phase on complete: decomposing.
- Create `skills/implementation-prompt/SKILL.md` — category SPECIFY, outputDir prompts, phase on complete: commissioning.
- Create `skills/retrospective/SKILL.md` — category LEARN, outputDir retros, phase on complete: retrospective.
- Create `skills/context-ingestion/SKILL.md` — category ORCHESTRATE, outputDir artifacts, no phase change.
- Create `skills/pre-implementation-checklist/SKILL.md` — category SPECIFY, outputDir artifacts, no phase change.
- Create `skills/handoff-protocol/SKILL.md` — category ORCHESTRATE, outputDir artifacts, no phase change.
- Each SKILL.md must include: OpenClaw-compatible YAML frontmatter (name, description, `metadata.openclaw.emoji`, `metadata.openclaw.dojo`), full skill instructions, and the "Dojo Genesis Integration" section per spec template (section 3.9) with correct outputDir, filename pattern, and next phase.
- Skills must support dual-mode: standalone (skip orchestration) and orchestrated (call `dojo_get_context`, `dojo_save_artifact`, `dojo_update_state`).

### [ ] Step: Integration wiring and E2E tests

Wire everything together in `index.ts` and write the E2E test suite.

- Complete `index.ts` — import and call `initStateManager`, `registerDojoCommands`, `registerOrchestrationTools`, register hooks with lazy imports. Ensure `register(api)` is fully functional.
- Write `tests/e2e/full-workflow.test.ts` — full 6-phase workflow: init → scout (simulate tool calls) → spec → tracks → commission → retro. After each phase: verify state.json phase field, verify artifact files exist on disk, verify PROJECT.md is updated.
- Add multi-project isolation test: create 2 projects, operate on each, verify no state cross-contamination.
- Add dual-mode test: simulate skill execution without a project, verify no state side effects.
- Add error handling tests: invalid project names, missing projects, path traversal attempts.
- Run `npx vitest run` — all tests pass (target 90%+ line coverage on `src/`).
- Run `npx tsc --noEmit` — zero type errors.
- Verify full test suite completes in < 10s.
