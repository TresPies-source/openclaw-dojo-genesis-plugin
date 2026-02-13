# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification

- **Difficulty:** Hard (greenfield plugin, ~30 source files, SDK discrepancies)
- **Spec:** `.zenflow/tasks/v1-0-0-clawhubplugin-by-dojogene-bca0/spec.md`
- Reviewed real OpenClaw Plugin SDK (`openclaw/openclaw@main src/plugins/types.ts`)
- Identified 5 critical SDK discrepancies (no `shouldContinue`, different hook names, etc.)
- Defined adapted architecture that works with the real SDK
- All source files and data models identified

---

### [ ] Step: Plugin Foundation (Track 0)

Scaffold the plugin project and implement core infrastructure.

- [ ] Create `package.json` with `openclaw.extensions`, peerDependencies, devDependencies (typescript, vitest, @sinclair/typebox)
- [ ] Create `tsconfig.json` (ES2022, NodeNext)
- [ ] Create `vitest.config.ts`
- [ ] Update `.gitignore` with node_modules/, dist/, coverage/, *.tmp
- [ ] Create `index.ts` plugin entry point (register function skeleton)
- [ ] Implement `src/state/types.ts` — all TypeScript interfaces
- [ ] Implement `src/utils/file-ops.ts` — readJsonFile, writeJsonFile, writeTextFile, ensureDir, fileExists
- [ ] Implement `src/utils/validation.ts` — validateProjectName, sanitizeFilename, validateOutputDir
- [ ] Implement `src/state/manager.ts` — DojoStateManager with write-through cache
- [ ] Implement `src/state/migrations.ts` — schema version stub
- [ ] Implement `src/utils/markdown.ts` — PROJECT.md template helpers
- [ ] Implement `src/ui/chat-formatter.ts` — formatPhase, formatDate, formatTrackTable, formatProjectList
- [ ] Write unit tests for state manager, validation, and file-ops
- [ ] Verify: `npx tsc --noEmit` passes, `npx vitest run` passes

---

### [ ] Step: Command System (Track A)

Implement all 10 `/dojo` subcommands with formatted chat output.

- [ ] Implement `src/commands/router.ts` — registerDojoCommands with full dispatch
- [ ] Implement `src/commands/init.ts` — create project, dirs, PROJECT.md, decisions.md, state.json
- [ ] Implement `src/commands/switch.ts` — validate project exists, set active
- [ ] Implement `src/commands/status.ts` — read state, format phase/tracks/activity/next action
- [ ] Implement `src/commands/list.ts` — list projects with phase, active indicator, --all flag
- [ ] Implement `src/commands/archive.ts` — set archived flag, clear active if needed
- [ ] Implement skill-invoking subcommands (scout, spec, tracks, commission, retro) as guidance-reply commands
- [ ] Implement help text for `/dojo` and `/dojo help`
- [ ] Wire commands into `index.ts`
- [ ] Write unit tests for each command handler (happy path + error cases)
- [ ] Write integration test: init → status → list → switch → status → archive → list
- [ ] Verify: `npx tsc --noEmit` passes, `npx vitest run` passes

---

### [ ] Step: Orchestration Tools (Track B)

Implement 3 registered tools + lifecycle hooks.

- [ ] Implement `src/tools/get-context.ts` — dojo_get_context tool
- [ ] Implement `src/tools/save-artifact.ts` — dojo_save_artifact tool
- [ ] Implement `src/tools/update-state.ts` — dojo_update_state tool
- [ ] Implement `src/tools/registry.ts` — registerOrchestrationTools
- [ ] Implement `src/hooks/after-tool-call.ts` — detect phase changes, update PROJECT.md
- [ ] Implement `src/hooks/before-agent-start.ts` — prepend active project context
- [ ] Wire tools and hooks into `index.ts`
- [ ] Write unit tests for each tool (valid inputs, missing project, invalid outputDir)
- [ ] Write unit tests for hooks (standalone mode skip, orchestration mode fire)
- [ ] Write integration test: get_context → save_artifact → update_state sequence
- [ ] Verify: `npx tsc --noEmit` passes, `npx vitest run` passes

---

### [ ] Step: Skill Migration (Track C)

Create 8 core SKILL.md files with Dojo Genesis Integration sections.

- [ ] Create `skills/strategic-scout/SKILL.md` (STRATEGIZE, outputDir: scouts, phase: scouting)
- [ ] Create `skills/release-specification/SKILL.md` (SPECIFY, outputDir: specs, phase: specifying)
- [ ] Create `skills/parallel-tracks/SKILL.md` (SPECIFY, outputDir: tracks, phase: decomposing)
- [ ] Create `skills/implementation-prompt/SKILL.md` (SPECIFY, outputDir: prompts, phase: commissioning)
- [ ] Create `skills/retrospective/SKILL.md` (LEARN, outputDir: retros, phase: retrospective)
- [ ] Create `skills/context-ingestion/SKILL.md` (ORCHESTRATE, outputDir: artifacts, no phase change)
- [ ] Create `skills/pre-implementation-checklist/SKILL.md` (SPECIFY, outputDir: artifacts, no phase change)
- [ ] Create `skills/handoff-protocol/SKILL.md` (ORCHESTRATE, outputDir: artifacts, no phase change)
- [ ] Each skill: add OpenClaw-compatible frontmatter + Dojo Genesis Integration section
- [ ] Write validation test: each SKILL.md parses correctly, contains integration section

---

### [ ] Step: Integration and QA

End-to-end testing, error handling, and final verification.

- [ ] Write E2E test: full workflow — init → scout → spec → tracks → commission → retro
- [ ] Test dual-mode: verify skills work without a project (no state side effects)
- [ ] Test error handling: invalid project names, missing projects, path traversal
- [ ] Test multi-project: create 2 projects, switch between them, verify isolation
- [ ] Security review: path traversal attempts, oversized inputs, special characters
- [ ] Final `npx tsc --noEmit` and `npx vitest run` pass
- [ ] Write report to `.zenflow/tasks/v1-0-0-clawhubplugin-by-dojogene-bca0/report.md`
