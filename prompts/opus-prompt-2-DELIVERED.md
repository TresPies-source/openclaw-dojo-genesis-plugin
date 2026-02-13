# Skill Enhancement Pattern for Dual-Mode Operation — OpenClaw Design

**Delivered:** 2026-02-12
**Target Platform:** OpenClaw (TypeScript AI Agent Platform)
**Source:** CoworkPluginsByDojoGenesis (44 skills) → OpenClaw Plugin System

---

## Executive Summary

44 skills must operate in dual modes:
- **Standalone**: User invokes skill directly via `/skillname`. Runs independently, outputs to chat.
- **Orchestration**: User invokes via `/dojo`. Plugin reads project state, writes artifacts to project files, updates `state.json`.

This document designs a reusable pattern for both modes using OpenClaw's skill and hook system.

---

## 1. Architecture Overview

### How OpenClaw Loads Skills

OpenClaw injects skills as a compact XML list into the system prompt at session start. The skill format is YAML frontmatter + natural language instructions:

```
skills/<name>/SKILL.md
├── Frontmatter (YAML)
│   ├── name, description
│   ├── metadata.openclaw
│   │   ├── emoji
│   │   ├── requires: {bins, env}
│   │   └── install specs
│   └── Optional: user-invocable, disable-model-invocation, command-dispatch
└── Instructions (natural language)
    └── Workflow steps, quality checklist
```

**Key fact:** The agent reads SKILL.md instructions and decides how to execute. The SKILL.md tells the agent whether to save outputs if a project is active.

### Dual-Mode Detection Pattern

Skills check for active project via a standardized pattern:

1. **Plugin exposes `dojo_get_context` tool** → Agent can call to check for active project
2. **SKILL.md instructions** → Tell agent: "If Dojo project is active, save outputs to project directory"
3. **TypeScript plugin handler** → Performs actual file operations and state updates

This separates **skill logic** (agent-driven via SKILL.md) from **project integration** (TypeScript-driven via hooks and tools).

### Execution Flow

```
User invokes skill (standalone or via /dojo)
  ↓
Agent reads SKILL.md
  ↓
Agent calls dojo_get_context (checks for active project)
  ↓
If project exists:
  ├─ Agent runs skill with project context in mind
  ├─ Agent generates output + structured metadata
  └─ Plugin hook: afterExecution saves to project directory

If no project:
  ├─ Agent runs skill standalone
  └─ Output goes to chat only

Agent returns result to user
```

---

## 2. Component Interfaces (TypeScript)

### ProjectContext

```typescript
interface ProjectContext {
  projectId: string;
  projectPath: string;
  phase: string;
  state: ProjectState;
  outputDir: string;
  trackIds?: string[];
}

interface ProjectState {
  phase: string;
  tracks: Track[];
  decisions: Decision[];
  specs: Spec[];
  lastUpdated: string;
  lastSkill?: string;
  totalDecisions: number;
  totalSpecs: number;
}

interface Track {
  id: string;
  name: string;
  status: string;
  dependencies: string[];
}

interface Decision {
  id: string;
  tension: string;
  routes: string[];
  chosen: string;
  timestamp: string;
}

interface Spec {
  id: string;
  title: string;
  tracks: string[];
  timestamp: string;
}
```

### SkillResult

```typescript
interface SkillResult {
  content: string;              // Markdown output
  mode: 'standalone' | 'orchestrated';
  filePath?: string;            // Where artifact was saved
  filePathList?: string[];      // Multi-output skills
  phase?: string;               // Updated phase
  metadata?: Record<string, unknown>;
  trackIds?: string[];          // For track-based skills
}

interface SkillOrchestrationHooks {
  beforeExecution?: (context: ProjectContext) => Promise<void>;
  afterExecution?: (context: ProjectContext, result: SkillResult) => Promise<void>;
  onError?: (context: ProjectContext, error: Error) => Promise<void>;
}
```

### Tool: dojo_get_context

**Purpose:** Agent-callable tool that returns project context if active.

```typescript
interface DojoGetContextRequest {
  projectId?: string;  // Optional: explicitly request a project
}

interface DojoGetContextResponse {
  isActive: boolean;
  context?: ProjectContext;
  error?: string;
}
```

**Agent behavior:** Calls this tool early in skill execution. If `isActive: true`, agent saves outputs to project directory. If `isActive: false`, agent outputs to chat only.

---

## 3. Implementation Guide

### Step 1: Enhance SKILL.md with Orchestration Awareness

**Before (CoworkPlugins):**
```yaml
---
name: strategic-scout
description: Explore 3-5 strategic routes for a given tension
metadata.openclaw:
  emoji: 🗺️
  requires:
    bins: []
    env: []
---

# Strategic Scout

When given a tension, explore 3-5 distinct strategic routes...
```

**After (OpenClaw with Dojo):**
```yaml
---
name: strategic-scout
description: Explore 3-5 strategic routes for a given tension
metadata.openclaw:
  emoji: 🗺️
  requires:
    bins: []
    env: []
  dojo:
    outputDir: decisions
    pattern: single_output
    phaseOnComplete: scouted
---

# Strategic Scout

## Core Task
When given a tension, explore 3-5 distinct strategic routes with clear tradeoffs.

## Orchestration Awareness
**If a Dojo Genesis project is active:**
1. Call `dojo_get_context` to check project status
2. If active, include project phase and prior decisions in your reasoning
3. Generate output following the structure below
4. The system will save your output to `decisions/` in the project directory

**If no project is active:**
1. Output goes to chat only

## Output Structure (used by plugin for file-based storage)
Include this metadata block at the top of your output:
\`\`\`json
{
  "projectId": "<projectId if active>",
  "tension": "<the input tension>",
  "timestamp": "<ISO 8601>",
  "routes": [<array of route objects>]
}
\`\`\`

## Workflow Steps
1. Understand the strategic tension...
2. Explore Route A: ...
3. Explore Route B: ...
[etc.]
```

**Key addition:** The "Orchestration Awareness" section tells the agent the pattern, and includes metadata structure the plugin can parse.

### Step 2: Add TypeScript Plugin Handler

**File:** `plugins/dojo-genesis/hooks/skillExecution.ts`

```typescript
import { registerPluginHooksFromDir } from '@openclaw/api';

export async function registerSkillHooks(api: PluginAPI) {
  // Register dojo_get_context tool for agent use
  api.registerTool({
    name: 'dojo_get_context',
    description: 'Check if Dojo Genesis project is active and get its context',
    execute: async (params: DojoGetContextRequest) => {
      const projectId = params.projectId || api.projects.getActiveProjectId();
      if (!projectId) {
        return { isActive: false };
      }

      const projectPath = api.projects.getProjectPath(projectId);
      const stateFile = `${projectPath}/state.json`;
      const state = await api.files.read(stateFile);

      return {
        isActive: true,
        context: {
          projectId,
          projectPath,
          phase: state.phase,
          state,
          outputDir: projectPath,
          trackIds: state.tracks?.map((t: Track) => t.id)
        }
      };
    }
  });

  // afterExecution hook: saves skill outputs to project if active
  api.hooks.register('skillExecution:after', async (skillName, result) => {
    // Check if result contains project context
    const metadata = result.metadata;
    if (!metadata?.projectId) {
      return; // No project, output already went to chat
    }

    const projectPath = api.projects.getProjectPath(metadata.projectId);
    const outputDir = metadata.dojo?.outputDir || 'artifacts';

    // Determine output filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${timestamp}_${sanitize(skillName)}.md`;
    const filePath = `${projectPath}/${outputDir}/${filename}`;

    // Save artifact
    await api.files.ensureDir(`${projectPath}/${outputDir}`);
    await api.files.write(filePath, result.content);

    // Update state.json
    const statePath = `${projectPath}/state.json`;
    const state = await api.files.read(statePath);
    state.lastSkill = skillName;
    state.lastUpdated = new Date().toISOString();
    if (metadata.dojo?.phaseOnComplete) {
      state.phase = metadata.dojo.phaseOnComplete;
    }
    await api.files.write(statePath, JSON.stringify(state, null, 2));
  });
}

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9-]/gi, '_').toLowerCase();
}
```

**File:** `plugins/dojo-genesis/hooks/HOOK.md`

```yaml
---
name: dojo-skill-execution
description: Hooks for dual-mode skill execution (standalone vs orchestrated)
events:
  - skillExecution:after
metadata.openclaw:
  requires:
    bins: []
    env: []
---

# Dojo Skill Execution Hooks

Registers the `dojo_get_context` tool for agent use and handles post-execution file saving.

## Events

### skillExecution:after
Fired after a skill completes. Saves artifact to project directory if project is active.
```

### Step 3: Register Plugin with Dojo Skills

**File:** `plugins/dojo-genesis/plugin.ts`

```typescript
import { PluginAPI } from '@openclaw/api';
import { registerSkillHooks } from './hooks/skillExecution';

export async function activate(api: PluginAPI) {
  console.log('Activating Dojo Genesis plugin...');

  // Register hooks
  await registerSkillHooks(api);

  // Load all SKILL.md files from skills/ directory
  const skillFiles = await api.files.glob('skills/*/SKILL.md');

  for (const skillFile of skillFiles) {
    const skillMd = await api.files.read(skillFile);
    // OpenClaw automatically injects SKILL.md files into system prompt
    // Agent reads them and decides whether to call dojo_get_context
  }

  console.log(`Loaded ${skillFiles.length} Dojo skills`);
}

export async function deactivate(api: PluginAPI) {
  console.log('Deactivating Dojo Genesis plugin');
}
```

### Step 4: Test Both Modes

**Test file:** `plugins/dojo-genesis/__tests__/dual-mode.test.ts`

```typescript
import { test, expect } from '@jest/globals';
import { PluginAPI } from '@openclaw/api';

test('skill runs standalone mode (no project)', async () => {
  // Agent invokes skill without project_id
  const result = await agentExecuteSkill('strategic-scout', {
    tension: 'Should we rebuild or refactor?'
  });

  expect(result.mode).toBe('standalone');
  expect(result.content).toContain('Route A');
  expect(result.filePath).toBeUndefined();
});

test('skill runs orchestrated mode (with project)', async () => {
  const projectId = await createTestProject();

  // Agent invokes skill with project context
  const result = await agentExecuteSkill('strategic-scout', {
    tension: 'Should we rebuild or refactor?',
    projectId
  });

  expect(result.mode).toBe('orchestrated');
  expect(result.filePath).toMatch(/decisions\/.*scout.*\.md/);

  // Verify file exists
  const fileContent = await api.files.read(result.filePath);
  expect(fileContent).toContain('Route A');

  // Verify state.json updated
  const state = await api.projects.getState(projectId);
  expect(state.lastSkill).toBe('strategic-scout');
  expect(state.phase).toBe('scouted');
});
```

---

## 4. Three Concrete Examples

### Example 1: strategic-scout (Simple, Single Output)

**SKILL.md enhancement:**

```yaml
---
name: strategic-scout
metadata.openclaw:
  emoji: 🗺️
  dojo:
    outputDir: decisions
    pattern: single_output
    phaseOnComplete: scouted
---

# Strategic Scout

When given a tension, explore 3-5 distinct strategic routes.

## Orchestration Awareness
If a Dojo Genesis project is active (call `dojo_get_context`):
- Include project phase and prior decisions
- Save your output to decisions/
- Structure your response as markdown with JSON metadata block

## Output Structure
\`\`\`json
{
  "projectId": "<if active>",
  "tension": "<input>",
  "timestamp": "<ISO 8601>",
  "routes": [
    {
      "name": "Route A",
      "pros": [...],
      "cons": [...],
      "risks": [...]
    }
  ]
}
\`\`\`

[Workflow steps...]
```

**Standalone output:** Returns markdown with 3-5 routes to chat.

**Orchestrated output:**
- Saves to `decisions/2026-02-12_scout_rebuild-or-refactor.md`
- Updates `state.json`: `phase: "scouted"`, `lastSkill: "strategic-scout"`
- Agent called `dojo_get_context`, received active project, included context in reasoning

---

### Example 2: release-specification (Moderate, Reads Project State)

**SKILL.md enhancement:**

```yaml
---
name: release-specification
metadata.openclaw:
  emoji: 📋
  dojo:
    outputDir: specs
    pattern: single_output
    phaseOnComplete: specified
---

# Release Specification

Write a comprehensive release specification for a feature or module.

## Orchestration Awareness
If a Dojo Genesis project is active:
1. Call `dojo_get_context`
2. Read prior decisions from the project's decisions/ directory
3. Ground your specification in the strategic context
4. Save to specs/

## Input Parameters
- **feature:** The feature or module to specify
- **grounding:** Optional backend/codebase context

## Output Structure
\`\`\`json
{
  "projectId": "<if active>",
  "feature": "<input>",
  "priorDecision": "<from decisions/>",
  "timestamp": "<ISO 8601>",
  "specification": {
    "overview": "...",
    "requirements": [...],
    "acceptance_criteria": [...]
  }
}
\`\`\`

[Workflow steps...]
```

**Plugin handler (stateful variant):**

```typescript
// In skillExecution.ts, afterExecution hook:
if (skillName === 'release-specification') {
  const projectPath = api.projects.getProjectPath(metadata.projectId);

  // Read prior decisions for context
  const decisionsDir = `${projectPath}/decisions`;
  const decisionFiles = await api.files.glob(`${decisionsDir}/*.md`);
  const decisions = await Promise.all(
    decisionFiles.map(f => api.files.read(f))
  );

  // Plugin could inject into agent's next turn if needed
  // But typically the agent already read them during execution
}
```

**Standalone output:** Returns spec to chat.

**Orchestrated output:**
- Saves to `specs/track-1-foundation.md`
- Agent read prior decisions from project for grounding
- Updates `state.json`: `phase: "specified"`

---

### Example 3: parallel-tracks (Complex, Multi-Output)

**SKILL.md enhancement:**

```yaml
---
name: parallel-tracks
metadata.openclaw:
  emoji: 🚦
  dojo:
    outputDir: specs
    pattern: multi_output
    phaseOnComplete: tracks_defined
---

# Parallel Tracks Decomposition

Decompose a release specification into 2-4 parallel tracks.

## Orchestration Awareness
If a Dojo Genesis project is active:
1. Call `dojo_get_context`
2. Read the spec from specs/ directory
3. Decompose into parallel tracks with dependencies
4. Plugin will save each track as a separate file
5. Update state.json with track metadata

## Input Parameters
- **specification:** The specification to decompose

## Output Structure (multiple sections)
\`\`\`json
{
  "projectId": "<if active>",
  "timestamp": "<ISO 8601>",
  "tracks": [
    {
      "id": "track-1",
      "name": "Foundation",
      "description": "...",
      "dependencies": [],
      "content": "Full markdown specification for this track"
    },
    {
      "id": "track-2",
      "name": "Features",
      "dependencies": ["track-1"],
      "content": "..."
    }
  ]
}
\`\`\`

[Workflow steps...]
```

**Plugin handler (multi-output variant):**

```typescript
// In skillExecution.ts, afterExecution hook:
if (skillName === 'parallel-tracks' && Array.isArray(result.metadata?.tracks)) {
  const projectPath = api.projects.getProjectPath(metadata.projectId);
  const specsDir = `${projectPath}/specs`;

  const filePaths = [];
  const trackMeta = [];

  for (const track of result.metadata.tracks) {
    const filename = `track-${track.id}-${sanitize(track.name)}.md`;
    const filePath = `${specsDir}/${filename}`;

    // Save each track
    await api.files.write(filePath, track.content);
    filePaths.push(filePath);

    // Collect metadata
    trackMeta.push({
      id: track.id,
      name: track.name,
      status: 'specified',
      dependencies: track.dependencies
    });
  }

  // Update state.json with tracks
  const state = await api.projects.getState(metadata.projectId);
  state.tracks = trackMeta;
  state.phase = 'tracks_defined';
  await api.projects.setState(metadata.projectId, state);
}
```

**Standalone output:** Returns combined markdown with all tracks to chat.

**Orchestrated output:**
- Saves `specs/track-1-foundation.md`, `specs/track-2-features.md`, etc.
- Updates `state.json`:
  - `phase: "tracks_defined"`
  - `tracks: [{id: "track-1", name: "Foundation", dependencies: []}, ...]`

---

## 5. Pattern Library

### Pattern A: Single Output (28 of 44 skills)

Used by: strategic-scout, product-positioning, release-specification, implementation-prompt, memory-garden, seed-extraction, health-audit, retrospective, etc.

**SKILL.md additions:**
```yaml
metadata.openclaw:
  dojo:
    outputDir: <decisions|specs|prompts|artifacts|retrospectives>
    pattern: single_output
    phaseOnComplete: <phase_name>
```

**Plugin behavior:**
1. Agent executes skill (reads SKILL.md)
2. Agent calls `dojo_get_context` to check for active project
3. If active: Agent outputs markdown with JSON metadata block
4. Plugin hook: Saves file to `{projectPath}/{outputDir}/YYYY-MM-DD_{skillName}.md`
5. Plugin hook: Updates `state.json` phase and lastSkill

**Example executor (agent-perspective):**
```markdown
You are executing the strategic-scout skill.

1. Call `dojo_get_context` first
2. If project is active, include prior decisions in your reasoning
3. Generate 3-5 distinct routes with tradeoffs
4. Include JSON metadata block (projectId, timestamp, routes array)
5. Return as markdown
```

---

### Pattern B: Multi-Output (4 of 44 skills)

Used by: parallel-tracks, spec-constellation-to-prompt-suite, multi-surface-strategy, iterative-scouting.

**SKILL.md additions:**
```yaml
metadata.openclaw:
  dojo:
    outputDir: specs
    pattern: multi_output
    phaseOnComplete: tracks_defined
```

**Plugin behavior:**
1. Agent executes skill, generates output with multiple `tracks` array
2. Plugin hook: For each track, saves separate file
3. Plugin hook: Updates `state.json` with track array

**Example executor (agent-perspective):**
```markdown
You are executing the parallel-tracks skill.

1. Read the specification (from prior skill or input)
2. Decompose into 2-4 parallel tracks
3. For each track, include:
   - id: "track-N"
   - name: "Human-readable name"
   - dependencies: ["track-1", ...]
   - content: Full markdown specification for this track
4. Return JSON structure with tracks array
```

---

### Pattern C: Stateful (8 of 44 skills)

Used by: release-specification, implementation-prompt, pre-implementation-checklist, strategic-to-tactical-workflow, repo-context-sync, decision-propagation, iterative-scouting (reads), skill-maintenance.

**Key behavior:** Agent reads prior artifacts before executing.

**Agent instruction (in SKILL.md):**
```markdown
## Orchestration Awareness
If a Dojo Genesis project is active:
1. Call `dojo_get_context` to get project path
2. Read prior artifacts:
   - decisions/*.md (for strategic context)
   - specs/*.md (for spec context)
   - artifacts/*.md (for technical context)
3. Ground your work in the project's history
4. Output includes JSON metadata for plugin
```

**Plugin handler:**
```typescript
if (skillName === 'release-specification') {
  const projectPath = metadata.projectId ?
    api.projects.getProjectPath(metadata.projectId) : null;

  if (projectPath) {
    // Agent already read decisions during execution
    // Plugin just needs to save the output
    const outputPath = `${projectPath}/specs/${filename}`;
    await api.files.write(outputPath, result.content);
  }
}
```

---

### Pattern D: Coordination (4 of 44 skills)

Used by: strategic-to-tactical-workflow, spec-constellation-to-prompt-suite, iterative-scouting, seed-to-skill-converter.

**Key behavior:** Invokes other skills via the agent's tool calling.

**Agent instruction (in SKILL.md):**
```markdown
## Orchestration Awareness
This is a coordination skill. You will invoke other skills:

1. Call dojo_get_context to get project info
2. Invoke strategic-scout with {tension: ..., projectId: ...}
3. Invoke release-specification with {feature: ..., projectId: ...}
4. Collect results and synthesize
5. Return combined output

The projectId ensures each invoked skill saves to the same project.
```

**Agent execution:**
```typescript
// Agent reads SKILL.md and sees it should invoke other skills
// Agent calls: dojo_strategic_scout, dojo_release_specification, etc.
// Each skill's handler manages its own file saving
// Agent returns combined synthesis
```

**Plugin handler:**
```typescript
// Coordination skills don't need special handler logic
// The invoked skills' handlers manage file saving
// Coordination skill result goes to chat or project depending on own project_id
```

---

## 6. State Management

### state.json Structure

**Location:** `{projectPath}/state.json`

```json
{
  "projectId": "proj-123",
  "projectName": "Mobile Refactor",
  "phase": "specified",
  "createdAt": "2026-02-12T10:00:00Z",
  "lastUpdated": "2026-02-12T15:30:00Z",
  "lastSkill": "release-specification",
  "totalDecisions": 3,
  "totalSpecs": 2,
  "tracks": [
    {
      "id": "track-1",
      "name": "Foundation",
      "status": "specified",
      "dependencies": []
    },
    {
      "id": "track-2",
      "name": "Features",
      "status": "in_progress",
      "dependencies": ["track-1"]
    }
  ],
  "decisions": [
    {
      "id": "decision-1",
      "tension": "Rebuild or refactor?",
      "chosen": "Foundation-first refactor",
      "timestamp": "2026-02-12T10:15:00Z"
    }
  ],
  "specs": [
    {
      "id": "spec-1",
      "title": "Foundation Specification",
      "tracks": ["track-1"],
      "timestamp": "2026-02-12T14:00:00Z"
    }
  ]
}
```

### Updating state.json

**After any skill execution:**

```typescript
// In plugin's afterExecution hook
const state = await api.projects.getState(projectId);
state.lastSkill = skillName;
state.lastUpdated = new Date().toISOString();

if (metadata.dojo?.phaseOnComplete) {
  state.phase = metadata.dojo.phaseOnComplete;
}

// For multi-output skills (parallel-tracks)
if (skillName === 'parallel-tracks' && metadata.tracks) {
  state.tracks = metadata.tracks.map(t => ({
    id: t.id,
    name: t.name,
    status: 'specified',
    dependencies: t.dependencies || []
  }));
}

await api.projects.setState(projectId, state);
```

---

## 7. Directory Structure

**OpenClaw Plugin Directory:**

```
plugins/dojo-genesis/
├── plugin.ts                      # Plugin activation/deactivation
├── package.json
├── hooks/
│   ├── HOOK.md                    # Hook metadata
│   └── skillExecution.ts          # Handler for afterExecution event
├── skills/
│   ├── strategic-scout/
│   │   └── SKILL.md               # Agent-readable skill instructions
│   ├── release-specification/
│   │   └── SKILL.md
│   ├── parallel-tracks/
│   │   └── SKILL.md
│   └── ... (44 skills total)
├── __tests__/
│   ├── dual-mode.test.ts
│   ├── single-output.test.ts
│   ├── multi-output.test.ts
│   └── stateful.test.ts
└── README.md
```

---

## 8. Checklist for Enhancing Each Skill

For each of the 44 skills, follow this checklist:

### Pre-Migration
- [ ] Locate original SKILL.md in CoworkPluginsByDojoGenesis
- [ ] Identify output directory (decisions, specs, prompts, artifacts, retrospectives)
- [ ] Determine pattern (single, multi, stateful, coordination)
- [ ] List any file reads (for stateful pattern)

### SKILL.md Enhancement
- [ ] Add `metadata.openclaw.dojo` section to frontmatter
- [ ] Add "Orchestration Awareness" section to instructions
- [ ] Include JSON metadata structure in output format
- [ ] Keep original workflow steps (agent will follow them)

### Testing
- [ ] Test standalone mode (no projectId) → outputs to chat
- [ ] Test orchestrated mode (with projectId) → saves to project directory
- [ ] Test state.json update
- [ ] Test file exists and has correct content

### Plugin Handler
- [ ] Verify afterExecution hook processes output correctly
- [ ] Handle multi-output if applicable (parallel-tracks pattern)
- [ ] Verify state.json structure is correct after skill execution

---

## 9. Scalability Assessment

The pattern scales cleanly to 44 skills:

1. **28 Single-Output Skills** — Use basic single_output pattern. One hook handler supports all.
2. **4 Multi-Output Skills** — Plugin hook detects `pattern: multi_output`, saves each artifact separately.
3. **8 Stateful Skills** — Agent reads prior artifacts via `dojo_get_context` and file reads. Plugin saves normally.
4. **4 Coordination Skills** — Agent invokes other skills. Each skill's handler manages its own saving.

**No skill needs custom code.** Plugin hook is generic:
- Parse `metadata.dojo.pattern` to determine behavior
- Save to `{projectPath}/{outputDir}` with timestamped filename
- Update `state.json` with phase and artifact metadata

---

## 10. Agent Workflow (How the Agent Executes Skills)

### Skill Discovery

Agent reads SKILL.md as system prompt instruction:

```
Available Skills:
<skill-1>
  name: strategic-scout
  description: Explore 3-5 routes for a tension
  instructions: [SKILL.md content]

<skill-2>
  name: release-specification
  ...
```

### Standalone Execution

```
User: "Scout 3-5 routes for: 'Should we rebuild or refactor?'"

Agent:
1. Reads strategic-scout SKILL.md
2. Calls dojo_get_context → {isActive: false}
3. Executes scout workflow locally
4. Returns markdown to user
```

### Orchestrated Execution

```
User invokes /dojo (context says project is active)

Agent:
1. Reads strategic-scout SKILL.md
2. Calls dojo_get_context → {isActive: true, context: {...}}
3. Executes scout workflow with project context
4. Includes JSON metadata block with projectId
5. Returns markdown
6. Plugin hook: Saves to decisions/2026-02-12_scout_*.md
7. Plugin hook: Updates state.json phase=scouted
```

---

## 11. Summary

**The dual-mode pattern is:**

| Mode | Triggered By | Agent Behavior | Plugin Behavior |
|------|--------------|----------------|-----------------|
| **Standalone** | Direct skill invocation, no project active | Execute skill, output to chat | No file saving, pass-through |
| **Orchestrated** | `/dojo` context or explicit projectId | Call dojo_get_context, include context, return with metadata | Parse metadata, save to project dir, update state.json |

**Reusable components:**
- `dojo_get_context` tool (1 tool, used by all 44 skills)
- `afterExecution` hook (1 hook, handles all 4 patterns)
- SKILL.md template (add 3 sections, agent reads instructions)

**No skill duplicates logic.** 28 + 4 + 8 + 4 = 44 skills, all variations of the same pattern.

---

**Conclusion:** Dual-mode is not a mode switch—it's a parameter (active project or not). If project exists, save to disk and update state. If not, output to chat. The agent decides via `dojo_get_context`; the plugin handles persistence. Clean separation of concerns.

**Status:** Ready to port 44 skills from CoworkPluginsByDojoGenesis → OpenClaw.
