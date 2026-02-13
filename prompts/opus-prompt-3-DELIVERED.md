# Multi-Project Support Design for OpenClaw Dojo Genesis Plugin

**Delivered:** 2026-02-12
**Target Platform:** OpenClaw (TypeScript) — ClawHub Plugin
**Agent:** Strategic Thinking Scout
**Status:** Corrected from previous version (which incorrectly assumed AgenticGateway)

---

## Executive Summary

The Dojo Genesis plugin for OpenClaw needs to support users managing multiple projects concurrently. OpenClaw provides no built-in project management — we must design it from scratch. This document recommends **Option 3 (Hybrid)**: an active project with `@project-name` override syntax. The approach is gentle for beginners, powerful for multi-project users, and aligned with natural mental models (git branches, Python virtualenvs, tmux sessions).

---

## 1. Recommendation: Hybrid (Option 3) — Active Project + Explicit Override

### Why This Approach

**For beginners:** Create a project once, use all commands without thinking about project context.
```
User: /dojo init "mobile redesign"
User: /dojo scout should we rebuild or refactor?
```
The scout targets the active project automatically. No explicit project reference needed.

**For power users:** Manage 3+ concurrent projects by name.
```
User: /dojo scout @backend-refactor monolith vs microservices?
User: /dojo status @api-redesign
```
The `@project-name` syntax makes the target explicit without noise when implicit selection would work.

**For context switching:** Explicit activation when you want to change focus.
```
User: /dojo switch api-v3
User: /dojo status
```
Status now shows api-v3 (the newly active project).

### Comparison to Familiar Systems

| System | Pattern | Dojo Equivalent |
|--------|---------|-----------------|
| **git** | Explicit checkout (`git checkout branch`), implicit operations (`git commit` on current branch) | Explicit switch (`/dojo switch project`), implicit targeting (`/dojo scout` on active project) |
| **Python virtualenvs** | Explicit activation (`source venv/bin/activate`), implicit operations in that env | Switch via `/dojo switch`, operations target active project |
| **tmux sessions** | Switch sessions (`tmux select-session`), then operate in that session | `/dojo switch` changes active project |
| **VS Code workspaces** | Last workspace you opened is active, but you can explicitly open another | Access a project (e.g., `/dojo status @project`) makes it most recent |

**The key insight:** Users already understand this pattern. The activation is explicit and discoverable. Most operations use implicit targeting (simpler), but you can always override (more powerful).

### Learning Curve

**Beginner (Day 1):**
- User creates one project: `/dojo init "my app"`
- All subsequent commands target that project automatically
- User never learns about `@project-name` syntax
- Success criteria: User runs `/dojo scout <tension>` and it works

**Intermediate (Week 2):**
- User creates a second project for a different initiative
- User sees `/dojo list` output showing two projects
- User tries: `/dojo scout @second-project <tension>`
- User realizes `@` syntax overrides the active project
- User learns `/dojo switch second-project` to change active project

**Power User (Week 3+):**
- User manages 3-5 concurrent projects
- User uses `@project-name` consistently for deterministic targeting
- User might create shell aliases: `alias dojo-mobile="/dojo @mobile-redesign"`
- User chains commands: `/dojo switch analytics && /dojo status && /dojo spec...`

The progression is natural. Beginners never see the complexity. Power users access it when needed.

### Scaling to 5+ Projects

The `/dojo list` command shows all projects with status and last-accessed time:
```
Your projects:
1. mobile-redesign      (specification phase, accessed 2 min ago) ← ACTIVE
2. backend-refactor     (scouting phase, accessed 1 day ago)
3. api-v3              (idle, accessed 3 days ago)
4. analytics-redesign   (specifying, accessed 2 weeks ago)
5. docs-overhaul       (archived, accessed 1 month ago)

Most recently accessed = active for /dojo commands
Use @project-name to target a specific project
Use /dojo switch <name> to change active project
```

With 5+ projects, users still interact with the two most recent naturally. Archiving old projects keeps the list clean.

---

## 2. State Management Design

### Global State Structure

The plugin maintains a single global state file at `~/.openclaw/dojo-genesis/global-state.json`:

```typescript
interface GlobalState {
  activeProjectId: string | null;           // Currently active project ID
  projects: ProjectMetadata[];              // All projects (active + archived)
  lastUpdated: string;                      // ISO 8601 timestamp
  version: "1.0";                           // Schema version for migrations
}

interface ProjectMetadata {
  id: string;                               // Unique project ID (slug format)
  name: string;                             // Human-readable name
  description: string;                      // Optional description
  phase: ProjectPhase;                      // Current workflow phase
  createdAt: string;                        // ISO 8601
  lastAccessedAt: string;                   // ISO 8601 (updated on any access)
  archived: boolean;                        // Archive flag (soft delete)
}

type ProjectPhase =
  | "idle"               // Just created, no work started
  | "scouting"          // Running strategic scouts
  | "deciding"          // Evaluating scout outputs
  | "grounding"         // Syncing codebase context
  | "specifying"        // Writing specifications
  | "decomposing"       // Defining parallel tracks
  | "commissioning"     // Generating implementation prompts
  | "implementing"      // Development in progress
  | "retrospective";    // Post-implementation learning
```

### Per-Project State Structure

Each project has a state file at `~/.openclaw/dojo-genesis/projects/{projectId}/state.json`:

```typescript
interface ProjectState {
  projectId: string;
  projectName: string;
  phase: ProjectPhase;
  workflow: WorkflowState;
  tracks: Track[];
  decisions: Decision[];
  specs: Spec[];
  metadata: Record<string, unknown>;       // Extensible field for skill outputs
  lastUpdated: string;
  notes: string;                           // User notes about this project
}

interface WorkflowState {
  currentStep: number;                     // Index into steps array
  steps: StepState[];                      // 8 phases of the workflow
  completedAt: string | null;              // When workflow finished
}

interface StepState {
  name: string;                            // "scouting", "specifying", etc.
  status: "pending" | "in_progress" | "complete" | "skipped";
  startedAt: string | null;
  completedAt: string | null;
}

interface Track {
  id: string;                              // track-1, track-2, etc.
  name: string;                            // "Foundation", "Features", etc.
  status: "defined" | "specified" | "in_progress" | "complete";
  dependencies: string[];                  // Track IDs this depends on
  specContent: string;                     // Raw spec text
  createdAt: string;
}

interface Decision {
  id: string;
  tension: string;                         // The strategic tension
  routes: string[];                        // Scouted routes
  chosen: string | null;                   // Which route was chosen
  reasoning: string;                       // Why chosen
  createdAt: string;
}

interface Spec {
  id: string;
  title: string;
  content: string;                         // Markdown spec text
  trackId: string | null;                  // Which track, if decomposed
  createdAt: string;
}
```

### File System Layout

```
~/.openclaw/dojo-genesis/
├── config.json                                # Plugin config
├── global-state.json                          # Active project + project list
├── projects/
│   ├── mobile-redesign/                       # projectId folder
│   │   ├── PROJECT.md                         # Human-readable overview
│   │   ├── state.json                         # Machine-readable state
│   │   ├── decisions/
│   │   │   ├── 2026-02-12_scout_rebuild-vs-refactor.md
│   │   │   └── 2026-02-12_decision_chosen-progressive-enhancement.md
│   │   ├── specs/
│   │   │   ├── mobile-redesign-spec.md        # Main specification
│   │   │   ├── track-1-foundation.md          # Track specs
│   │   │   └── track-2-features.md
│   │   ├── prompts/
│   │   │   ├── track-1-implementation-prompt.md
│   │   │   └── track-2-implementation-prompt.md
│   │   ├── artifacts/
│   │   │   ├── compressions/
│   │   │   ├── memories/
│   │   │   └── seeds/
│   │   └── retrospectives/
│   │       └── 2026-02-20_retro.md
│   └── backend-refactor/
│       ├── PROJECT.md
│       ├── state.json
│       ├── decisions/
│       ├── specs/
│       └── ...
└── hooks/                                     # Orchestration hooks
    └── on-skill-complete/
        └── handler.ts
```

### State Loading Strategy

The plugin loads state lazily on each command invocation:

```typescript
async function loadProjectContext(
  configDir: string,
  explicitProjectId?: string
): Promise<ProjectContext | null> {
  // 1. Load global state
  const globalState = await readGlobalState(configDir);

  // 2. Determine target project
  const projectId = explicitProjectId ?? globalState.activeProjectId;
  if (!projectId) {
    return null; // No project specified or active
  }

  // 3. Validate project exists
  const projectPath = path.join(configDir, "dojo-genesis", "projects", projectId);
  if (!fs.existsSync(projectPath)) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // 4. Load project state
  const state = await readProjectState(projectPath);

  // 5. Update lastAccessedAt
  await updateProjectAccess(configDir, projectId);

  return {
    projectId,
    projectPath,
    projectName: state.projectName,
    phase: state.phase,
    state,
    globalState,
    outputDir: projectPath
  };
}

interface ProjectContext {
  projectId: string;
  projectPath: string;
  projectName: string;
  phase: ProjectPhase;
  state: ProjectState;
  globalState: GlobalState;
  outputDir: string;
}
```

**Why lazy loading?**
- Simple. No background processes or caching layers needed.
- Correct. State is always fresh (no stale caches).
- Testable. Each call is independent.

### File Locking Strategy

Since OpenClaw may have multiple agents or concurrent users accessing the same project:

```typescript
async function acquireProjectLock(
  projectPath: string,
  timeoutMs: number = 5000
): Promise<() => Promise<void>> {
  const lockFile = path.join(projectPath, ".lock");
  const startTime = Date.now();

  while (true) {
    try {
      // Try to create lock file exclusively
      const fd = await fs.promises.open(lockFile, "wx");
      await fd.write(`${Date.now()}\n`);
      await fd.close();

      // Lock acquired — return release function
      return async () => {
        await fs.promises.unlink(lockFile).catch(() => {});
      };
    } catch (err) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Failed to acquire project lock after ${timeoutMs}ms`);
      }
      // Wait 10ms and retry
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

// Usage
const releaseLock = await acquireProjectLock(projectPath);
try {
  const state = await readProjectState(projectPath);
  // Modify state
  await writeProjectState(projectPath, state);
} finally {
  await releaseLock();
}
```

### Corrupted State Recovery

If `state.json` is malformed:

```typescript
async function readProjectState(projectPath: string): Promise<ProjectState> {
  const stateFile = path.join(projectPath, "state.json");

  try {
    const raw = await fs.promises.readFile(stateFile, "utf-8");
    const state = JSON.parse(raw) as ProjectState;

    // Validate structure
    if (!state.projectId || !state.phase) {
      throw new Error("Incomplete state structure");
    }

    return state;
  } catch (err) {
    // Corrupted state — return fresh default
    logger.warn(`Corrupted state at ${projectPath}, resetting: ${err.message}`);

    return {
      projectId: path.basename(projectPath),
      projectName: path.basename(projectPath),
      phase: "idle",
      workflow: {
        currentStep: 0,
        steps: [
          { name: "scouting", status: "pending", startedAt: null, completedAt: null },
          { name: "specifying", status: "pending", startedAt: null, completedAt: null },
          { name: "decomposing", status: "pending", startedAt: null, completedAt: null },
          { name: "commissioning", status: "pending", startedAt: null, completedAt: null },
          { name: "retrospective", status: "pending", startedAt: null, completedAt: null },
        ],
        completedAt: null,
      },
      tracks: [],
      decisions: [],
      specs: [],
      metadata: {},
      lastUpdated: new Date().toISOString(),
      notes: "",
    };
  }
}
```

---

## 3. Command Interface Specification

The plugin registers auto-reply commands (no AI agent) for project management, and skill-invoking commands that route through the agent.

### Full Command Table

| Command | Syntax | Handler Type | Behavior | Output |
|---------|--------|--------------|----------|--------|
| **init** | `/dojo init <name> [--desc "..."]` | Auto-reply | Create new project + set active | Confirmation + new project details |
| **list** | `/dojo list [--all]` | Auto-reply | Show projects (active first) | Formatted project list |
| **status** | `/dojo status [@project]` | Auto-reply | Show project phase + workflow | Project overview |
| **switch** | `/dojo switch <name>` | Auto-reply | Change active project | Confirmation + new active project |
| **archive** | `/dojo archive [@project]` | Auto-reply | Soft-delete project | Confirmation |
| **scout** | `/dojo scout <tension> [@project]` | Skill-invoking | Run strategic scout | Agent executes skill, saves output |
| **spec** | `/dojo spec <feature> [@project]` | Skill-invoking | Write specification | Agent executes skill, saves output |
| **tracks** | `/dojo tracks <spec> [@project]` | Skill-invoking | Decompose into parallel tracks | Agent executes skill, saves output |
| **commission** | `/dojo commission [@project]` | Skill-invoking | Generate implementation prompts | Agent executes skill, saves output |
| **retro** | `/dojo retro [@project]` | Skill-invoking | Run retrospective | Agent executes skill, saves output |

### Auto-Reply Command Implementations

These commands execute synchronously and return immediately — no AI agent involved.

#### `/dojo init`

```typescript
api.registerCommand({
  name: "dojo",
  acceptsArgs: true,
  handler: async (ctx) => {
    const [subcommand, ...rest] = ctx.args;

    if (subcommand === "init") {
      const name = rest[0];
      const desc = rest.includes("--desc")
        ? rest[rest.indexOf("--desc") + 1]
        : "";

      const projectId = slugify(name);
      const globalState = await readGlobalState(configDir);

      // Check name not already used
      if (globalState.projects.some(p => p.id === projectId && !p.archived)) {
        return { text: `Project "${name}" already exists. Use /dojo list to see all projects.` };
      }

      // Create project directory and initial files
      const projectPath = path.join(configDir, "dojo-genesis", "projects", projectId);
      await fs.promises.mkdir(projectPath, { recursive: true });

      // Create PROJECT.md
      const projectMarkdown = `# ${name}\n\n${desc}\n\nCreated: ${new Date().toISOString()}\n`;
      await fs.promises.writeFile(path.join(projectPath, "PROJECT.md"), projectMarkdown);

      // Create initial state.json
      const initialState: ProjectState = {
        projectId,
        projectName: name,
        phase: "idle",
        workflow: { currentStep: 0, steps: [...], completedAt: null },
        tracks: [],
        decisions: [],
        specs: [],
        metadata: {},
        lastUpdated: new Date().toISOString(),
        notes: desc,
      };
      await writeProjectState(projectPath, initialState);

      // Create subdirectories
      for (const dir of ["decisions", "specs", "prompts", "artifacts", "retrospectives"]) {
        await fs.promises.mkdir(path.join(projectPath, dir), { recursive: true });
      }

      // Update global state: add project and set as active
      globalState.projects.push({
        id: projectId,
        name,
        description: desc,
        phase: "idle",
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        archived: false,
      });
      globalState.activeProjectId = projectId;
      await writeGlobalState(configDir, globalState);

      return {
        text: `✓ Created project "${name}" (${projectId})\n\nNow active. Try:\n/dojo status\n/dojo scout <tension>`,
      };
    }
  }
});
```

**User sees:**
```
✓ Created project "mobile redesign" (mobile-redesign)

Now active. Try:
/dojo status
/dojo scout <tension>
```

#### `/dojo list`

```typescript
if (subcommand === "list") {
  const globalState = await readGlobalState(configDir);
  const showArchived = ctx.args.includes("--all");

  const projects = globalState.projects
    .filter(p => !p.archived || showArchived)
    .sort((a, b) =>
      new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );

  if (projects.length === 0) {
    return { text: "No projects. Try: /dojo init <name>" };
  }

  const lines = projects.map((p, i) => {
    const marker = p.id === globalState.activeProjectId ? " ← ACTIVE" : "";
    const timeAgo = formatTimeAgo(new Date(p.lastAccessedAt));
    return `${i + 1}. ${p.name.padEnd(25)} (${p.phase.padEnd(12)} ${timeAgo})${marker}`;
  });

  return { text: "Your projects:\n\n" + lines.join("\n") };
}
```

**User sees:**
```
Your projects:

1. mobile redesign        (scouting      2 minutes ago) ← ACTIVE
2. backend refactor       (idle          1 day ago)
3. api redesign          (specification 3 days ago)
```

#### `/dojo status`

```typescript
if (subcommand === "status") {
  const projectName = ctx.args.find(a => a.startsWith("@"))?.slice(1);
  const ctx = await loadProjectContext(configDir, projectName);

  if (!ctx) {
    return { text: "No active project. Use /dojo init or /dojo switch." };
  }

  const workflow = ctx.state.workflow;
  const stepsDisplay = workflow.steps
    .map((s, i) => {
      const symbol = s.status === "complete" ? "✓"
                   : s.status === "in_progress" ? "→"
                   : "◯";
      return `${symbol} ${s.name.padEnd(15)} ${s.status}`;
    })
    .join("\n");

  const tracksSummary = ctx.state.tracks.length > 0
    ? `\nTracks: ${ctx.state.tracks.map(t => `${t.name} (${t.status})`).join(", ")}`
    : "";

  return {
    text: `Project: ${ctx.projectName}\nPhase: ${ctx.phase}\n\nWorkflow:\n${stepsDisplay}${tracksSummary}`,
  };
}
```

**User sees:**
```
Project: mobile redesign
Phase: scouting

Workflow:
✓ scouting          complete
◯ specifying        pending
◯ decomposing       pending
◯ commissioning     pending
◯ retrospective     pending

Tracks: Foundation (specified), Features (in_progress)
```

#### `/dojo switch`

```typescript
if (subcommand === "switch") {
  const projectName = rest[0];
  const globalState = await readGlobalState(configDir);

  const project = globalState.projects.find(
    p => p.name.toLowerCase() === projectName.toLowerCase() && !p.archived
  );

  if (!project) {
    const suggestions = globalState.projects
      .filter(p => !p.archived)
      .slice(0, 3)
      .map(p => `  • ${p.name}`)
      .join("\n");

    return {
      text: `Project "${projectName}" not found.\n\nYour projects:\n${suggestions}`,
    };
  }

  globalState.activeProjectId = project.id;
  project.lastAccessedAt = new Date().toISOString();
  await writeGlobalState(configDir, globalState);

  return { text: `✓ Active project: ${project.name} (${project.phase})` };
}
```

**User sees:**
```
✓ Active project: backend refactor (idle)
```

#### `/dojo archive`

```typescript
if (subcommand === "archive") {
  const projectName = ctx.args.find(a => a.startsWith("@"))?.slice(1);
  const context = await loadProjectContext(configDir, projectName);

  if (!context) {
    return { text: "No project specified. Use @project-name or set active project." };
  }

  const globalState = await readGlobalState(configDir);
  const project = globalState.projects.find(p => p.id === context.projectId);

  if (project) {
    project.archived = true;
  }

  // If we archived the active project, switch to most recent
  if (globalState.activeProjectId === context.projectId) {
    const active = globalState.projects.find(p => !p.archived);
    globalState.activeProjectId = active?.id ?? null;
  }

  await writeGlobalState(configDir, globalState);

  return { text: `✓ Archived "${context.projectName}". ${globalState.activeProjectId ? `Active: ${globalState.projects.find(p => p.id === globalState.activeProjectId)?.name}` : "No active project."}` };
}
```

**User sees:**
```
✓ Archived "old-initiative". Active: mobile redesign
```

### Skill-Invoking Commands

These commands parse arguments and invoke skills through the OpenClaw agent. The command handler does minimal parsing; the agent handles the skill execution.

#### `/dojo scout` (Invokes skill-invoking command)

```typescript
if (subcommand === "scout") {
  const tension = rest.join(" ");
  const projectName = tension.match(/@([a-zA-Z0-9-]+)/)
    ? RegExp.$1
    : undefined;

  // Remove @project from tension string
  const cleanTension = tension.replace(/@[a-zA-Z0-9-]+\s*/, "");

  // Validate active project exists if not explicit
  if (!projectName && !globalState.activeProjectId) {
    return { text: "No active project. Use /dojo init <name> or /dojo switch <name>." };
  }

  // Return a marker that tells the agent to invoke the skill
  return {
    text: `Scouting: "${cleanTension}"${projectName ? ` (project: ${projectName})` : ` (active project)`}\n\n(Agent will execute strategic-scout skill...)`,
    skipAgent: false,  // Let agent continue to skill invocation
    skillInvocation: {
      skill: "strategic-scout",
      params: {
        tension: cleanTension,
        projectName: projectName || undefined,
      }
    }
  };
}
```

The agent then:
1. Receives the command response with `skillInvocation` metadata
2. Loads the active or specified project context
3. Invokes the strategic-scout skill with full context
4. Skill outputs to the project's `decisions/` directory
5. Updates project state

---

## 4. User Experience Flows

### Scenario 1: Beginner (Single Project)

**Setup:**
```
User: /dojo init "mobile app redesign"
Bot:  ✓ Created project "mobile app redesign" (mobile-app-redesign)
      Now active. Try:
      /dojo status
      /dojo scout <tension>
```

**First scout:**
```
User: /dojo status
Bot:  Project: mobile app redesign
      Phase: idle

      Workflow:
      ◯ scouting          pending
      ◯ specifying        pending
      ◯ decomposing       pending
      ◯ commissioning     pending
      ◯ retrospective     pending

User: /dojo scout Should we rebuild the app from scratch or incrementally improve the current version?
Bot:  Scouting: "Should we rebuild the app from scratch or incrementally improve the current version?"
      (active project)

      (Agent executes strategic-scout skill with project context...)

      [Scout output showing 4 routes with tradeoffs]

      Saved to: mobile-app-redesign/decisions/2026-02-12_scout_rebuild-vs-improve.md
```

**Recording a decision:**
```
User: We're going with route 2 — progressive enhancement
Bot:  Decision recorded. Ready to write specifications?

User: Yes, write the spec
Bot:  (Agent executes release-specification skill...)

      Spec written for: mobile-app-redesign

      [Specification output]

      Saved to: mobile-app-redesign/specs/mobile-app-redesign-spec.md
```

**All subsequent operations target mobile-app-redesign automatically.**

### Scenario 2: Power User (3 Concurrent Projects)

**Project setup:**
```
User: /dojo list
Bot:  Your projects:

      1. mobile redesign        (specification      2 hours ago) ← ACTIVE
      2. backend refactor       (scouting           1 day ago)
      3. api-v3               (idle               1 week ago)

User: /dojo status @backend-refactor
Bot:  Project: backend refactor
      Phase: scouting

      Workflow:
      ✓ scouting          complete
      ◯ specifying        pending
      ...

User: /dojo scout @backend-refactor Should we build microservices or keep the monolith?
Bot:  Scouting: "Should we build microservices or keep the monolith?"
      (project: backend-refactor)

      (Agent executes scout with backend-refactor context...)

      [Scout output with routes]

      Saved to: backend-refactor/decisions/2026-02-12_scout_monolith-vs-micro.md
```

**Switching context:**
```
User: /dojo switch api-v3
Bot:  ✓ Active project: api-v3 (idle)

User: /dojo status
Bot:  Project: api-v3
      Phase: idle

      (Now all /dojo commands target api-v3 unless overridden with @)
```

**Chaining operations:**
```
User: /dojo scout @mobile-redesign Can we ship v1 in 4 weeks?
Bot:  [Scout output]

User: /dojo spec @mobile-redesign Write detailed spec based on the scouted routes
Bot:  [Specification output]

User: /dojo tracks @mobile-redesign Decompose into 3 parallel tracks
Bot:  [Parallel tracks output]
      Track 1: Foundation (API layer)
      Track 2: Frontend (UI implementation)
      Track 3: Polish (Animation + accessibility)
```

### Scenario 3: Error Handling

**No project exists:**
```
User: /dojo scout some tension
Bot:  No active project. Use /dojo init <name> or /dojo switch <name>.

User: /dojo init "first project"
Bot:  ✓ Created project "first project" (first-project)
      Now active. Try: /dojo status
```

**Invalid project name:**
```
User: /dojo switch nonexistent
Bot:  Project "nonexistent" not found.

      Your projects:
        • mobile redesign
        • backend refactor
        • api-v3
```

**Multiple active projects, ambiguous request:**
```
User: /dojo status
(Scenario: user had been using 3 projects, all archived then unarchived in a confusing order)
Bot:  Multiple projects with similar access times. Which one?

      1. mobile redesign (specification, 1 hour ago)
      2. backend refactor (scouting, 1 hour ago)

      Use: /dojo switch <name> or /dojo status @project-name
```

**Concurrent access conflict:**
```
User: /dojo spec @mobile-redesign
Bot:  Project locked (another agent is using it). Retrying...

      [Wait 3 seconds]

      [Spec continues]
```

---

## 5. Migration Path

OpenClaw Dojo Genesis is a new plugin. No migration needed from previous versions. However:

### Forward Compatibility

If users eventually migrate to AgenticGateway or another platform:
- Export project state as ZIP with PROJECT.md, state.json, all artifacts
- Importer on target platform can read state.json and reconstruct
- `/dojo export @project-name` → downloads ZIP
- `/dojo import` → accepts ZIP file and reconstructs projects

**Example export structure:**
```
mobile-redesign_2026-02-12.zip
├── PROJECT.md
├── state.json
├── decisions/
│   ├── 2026-02-12_scout_rebuild-vs-refactor.md
│   └── ...
├── specs/
│   ├── mobile-redesign-spec.md
│   └── ...
└── artifacts/
    ├── compressions/
    └── seeds/
```

### Extending to New Skills

When adding a new Dojo skill:
1. Create `skills/new-skill/SKILL.md` in the plugin
2. Register in `index.ts` with metadata
3. Add handler to route skill invocation through agent
4. Skill receives `projectId` and `projectPath` in context
5. Skill reads prior artifacts from project directory
6. Skill writes outputs to appropriate subdirectory
7. Orchestration hook updates project state

Example pattern for skill context injection:

```typescript
interface SkillContext {
  projectId: string;
  projectPath: string;
  projectName: string;
  projectPhase: ProjectPhase;
  projectState: ProjectState;
  outputDir: string;           // Where to write skill outputs
  artifactsDirs: {
    decisions: string;
    specs: string;
    prompts: string;
    artifacts: string;
    retrospectives: string;
  };
}

// Skill receives this in its inputs
interface SkillInput {
  // Skill-specific params
  tension?: string;
  feature?: string;
  specification?: string;

  // Project context (injected by handler)
  _projectContext: SkillContext;
}
```

---

## 6. Design Evaluation

| Criterion | Score | Justification |
|-----------|-------|---------------|
| **Simplicity for beginners** | 9/10 | Create project once, forget about project management. All commands implicitly target active project. |
| **Power for multi-project users** | 8/10 | `@project-name` syntax is concise and unambiguous. Natural to switch context. Explicit when needed. |
| **Explicitness** | 8/10 | All operations show which project they're targeting. User is never confused about context. |
| **Consistency with OpenClaw patterns** | 9/10 | Auto-reply commands for management, skill invocation for orchestration. Follows OpenClaw conventions. |
| **Robustness** | 8/10 | File-based state with locking. Corrupted state recoverable. Lazy loading prevents caches. |
| **Scalability** | 8/10 | Handles 5+ projects smoothly. Archive keeps list clean. Sorts by last-accessed (MRU first). |
| **Onboarding friction** | 9/10 | Beginner path is short: init → scout → spec. No configuration needed. Power features are gradual. |

---

## 7. Implementation Checklist

### Phase 1: Foundation (Week 1)

- [ ] Define TypeScript interfaces for GlobalState, ProjectState, etc.
- [ ] Implement file I/O layer (read/write JSON, acquire locks)
- [ ] Implement `/dojo init`, `/dojo list`, `/dojo status`, `/dojo switch`
- [ ] Create plugin manifest (package.json) with extension hook
- [ ] Write integration tests for state management
- [ ] Document file layout and recovery procedures

### Phase 2: Skill Integration (Week 2-3)

- [ ] Implement `/dojo scout`, `/dojo spec`, `/dojo tracks`, `/dojo commission`, `/dojo retro`
- [ ] Adapt strategic-scout SKILL.md to receive project context
- [ ] Implement context injection for all 44 skills
- [ ] Add orchestration hooks for state updates after skill completion
- [ ] Test end-to-end: init → scout → spec → tracks

### Phase 3: Polish (Week 3-4)

- [ ] Error handling and recovery
- [ ] `/dojo archive` and soft-delete
- [ ] Export/import for backup and migration
- [ ] Hot-reload of skills (if needed)
- [ ] User-facing documentation
- [ ] Publish to ClawHub

---

## 8. Architectural Decisions

| # | Decision | Rationale | Trade-offs |
|---|----------|-----------|-----------|
| 1 | **Hybrid active + `@` override** | Simplicity for beginners, power for users | Slight mental model complexity |
| 2 | **File-based state in `~/.openclaw/dojo-genesis/`** | No external DB, portable, human-readable | Requires file locking for concurrency |
| 3 | **Global state + per-project state files** | Queryable project list, isolated per-project data | Two files to keep in sync |
| 4 | **Lazy loading, no background sync** | Simple, correct, testable | No real-time visibility into other agents' changes |
| 5 | **Auto-reply for management, skill-invoking for workflows** | Clear separation: CLI vs. orchestration | Slightly more routing logic |
| 6 | **Soft-delete (archive) not hard-delete** | Recoverable, audit trail | Directory clutter with old projects |
| 7 | **Lock file with timeout, not SQLite** | Matches OpenClaw's file-based philosophy | Less sophisticated than DB transactions |
| 8 | **ProjectPhase enum, not free-form string** | Type-safe, clear state machine | Requires code change to add phases |

---

## 9. Open Questions & Future Work

1. **Project sharing:** Should projects be shareable between OpenClaw users? If so, what's the auth model?

2. **Cloud sync:** Should projects auto-sync to cloud for backup? Separate feature or core?

3. **Skill versioning:** If a SKILL.md changes, should in-flight projects pin the old version? Pin at project creation or per-skill?

4. **Multi-agent coordination:** If two OpenClaw instances access the same project, what happens? Current design: first lock wins, others wait. Is that acceptable?

5. **Project templates:** Should we support project templates (e.g., "ML research", "mobile app", "backend service")? Bootstrap with predefined tracks?

6. **Analytics:** Track which skills are used, which paths are chosen, which projects succeed? Add telemetry?

---

## Conclusion

The Hybrid approach (Option 3) balances simplicity and power. Beginners create a project and forget about context management. Power users use `@project-name` for explicit targeting. The `/dojo switch` command provides explicit context switching when needed.

The file-based state model aligns with OpenClaw's philosophy: no external dependencies, portable, human-readable, git-compatible. State is lazy-loaded on each command, guaranteeing freshness. File locking prevents concurrent corruption.

This design enables users to orchestrate specification-driven development across multiple projects simultaneously, with a gentle learning curve and clean mental model.

---

**End of Design Document**
