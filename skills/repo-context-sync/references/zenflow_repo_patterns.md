# Zenflow Repository Patterns

This document describes how to work effectively with Zenflow's Git worktree-based workflow and how to integrate with existing codebases.

## Core Concept: Worktrees

Zenflow uses **Git worktrees** to isolate each task in its own directory with a dedicated branch. This prevents interference between concurrent tasks and enables clean, atomic development.

### Worktree Structure

```
project-root/
├── .git/                          # Shared Git database
├── .zenflow/
│   ├── tasks/
│   │   ├── task_001/              # Worktree for task 001
│   │   │   ├── plan.md
│   │   │   ├── spec.md
│   │   │   ├── implementation.md
│   │   │   └── [project files]
│   │   ├── task_002/              # Worktree for task 002
│   │   │   └── ...
│   └── workflows/                 # Custom workflow templates
│       ├── quick_change.md
│       ├── fix_bug.md
│       └── spec_and_build.md
├── src/                           # Main project source
└── [other project files]
```

### Key Rules

1. **One worktree per task** - Each task gets its own isolated directory
2. **Don't manually manage worktrees** - Let Zenflow handle `git worktree add/remove`
3. **Don't edit inside `.zenflow/tasks/` directly** - Use Zenflow's "Open in IDE" feature
4. **Archive completed tasks** - Reclaim disk space by archiving finished work
5. **All worktrees share `.git`** - Tags, branches, and config are shared

## Built-in Workflow Types

Zenflow ships with four starter workflow types, each with its own artifact set:

### 1. Quick Change
**Use for:** Small, single-step changes
**Artifacts:**
- `plan.md` - Brief description of the change

**When to use:** Bug fixes, typo corrections, minor refactors

### 2. Fix Bug
**Use for:** Debugging and fixing issues
**Artifacts:**
- `plan.md` - Bug description and approach
- `investigation.md` - Root cause analysis
- `solution.md` - Proposed solution
- `implementation.md` - Implementation details

**When to use:** Investigating and fixing bugs

### 3. Spec and Build
**Use for:** Feature development with specification
**Artifacts:**
- `plan.md` - High-level plan
- `spec.md` - Technical specification

**When to use:** New features that need upfront design

### 4. Full SDD Workflow
**Use for:** Complex features with full software design document
**Artifacts:**
- `requirements.md` - Requirements gathering
- `spec.md` - Detailed technical spec
- `plan.md` - Implementation plan
- Plus verifier stages

**When to use:** Major features or architectural changes

## Workflow Artifacts and File Hierarchy

Zenflow's workflow artifacts map to the standard file hierarchy:

| Zenflow Artifact | Standard Hierarchy Equivalent |
|------------------|------------------------------|
| `plan.md` | `/00_Roadmap/task_plan.md` |
| `requirements.md` | `/01_PRDs/{feature}_prd.md` |
| `spec.md` | `/02_Specs/{feature}_spec.md` |
| `implementation.md` | Development notes in `/05_Logs/` |

## Best Practices for Reading Existing Codebases

When Zenflow (or you) work with an existing codebase, follow these principles:

### 1. Read Before You Write

**Always** scan the existing codebase before generating new code. This ensures:
- Consistency with existing patterns
- Reuse of existing utilities
- Minimal refactoring needed

**How to read:**
```bash
# Use context_mapper.py to get an overview
python3.11 context_mapper.py /path/to/repo [keywords]

# Check for standard hierarchy
ls -la /path/to/repo/0*_*/

# Look for existing patterns
grep -r "pattern_name" /path/to/repo/
```

### 2. Follow Existing Patterns

**Naming conventions:**
- If the repo uses `camelCase`, continue using `camelCase`
- If the repo uses `snake_case`, continue using `snake_case`

**Import structure:**
- Match the existing import order (e.g., stdlib → third-party → local)
- Use the same import style (e.g., `import X` vs `from X import Y`)

**Architecture:**
- Follow existing component structure
- Use existing state management patterns
- Integrate with existing API patterns

### 3. Integrate Cleanly

**Avoid:**
- Creating parallel implementations of existing utilities
- Introducing new dependencies when existing ones can be used
- Breaking existing conventions

**Prefer:**
- Extending existing components
- Reusing existing utilities
- Adding to existing patterns

### 4. Minimize Refactoring

**Only refactor when:**
- The existing code is clearly broken
- The refactor is explicitly part of the task
- The refactor is minimal and localized

**Otherwise:**
- Work with the existing structure
- Note technical debt in comments or logs
- Suggest refactoring as a separate task

## Zenflow Automation Protocol

When working with Zenflow, define these four fields for each project:

### 1. Setup Script
**Purpose:** Install all dependencies
**Example:**
```bash
npm install && pip install -r requirements.txt
```

### 2. Dev Server Script
**Purpose:** Start development server(s)
**Example:**
```bash
concurrently "npm run dev" "uvicorn main:app --reload"
```

### 3. Cleanup Script
**Purpose:** Lint and test before commit
**Example:**
```bash
npm run lint && npm run test && ruff check . && pytest
```

### 4. Copy Files
**Purpose:** Environment configuration files to copy into each worktree
**Example:**
```
.env.local, .env, .npmrc
```

## Working with Zenflow Tasks

### Task Lifecycle

1. **Create Task** - Zenflow creates worktree and branch
2. **Agent Execution** - AI agent reads codebase, generates code, commits
3. **Review** - Human reviews changes in worktree
4. **Merge** - Changes merged back to main branch
5. **Archive** - Worktree cleaned up

### Accessing Task Context

When writing prompts for Zenflow, you can reference:

```markdown
# Current task artifacts
See {@artifacts_path}/plan.md for the plan
See {@artifacts_path}/spec.md for the specification

# Project context
The project is located at {project_root}
The current task worktree is at {worktree_path}
```

### Auto-Commit Behavior

Zenflow **auto-commits each agent step**. This means:
- Every agent action creates a commit
- You can review the commit history to see what the agent did
- Manual edits show up as uncommitted changes

### Manual Edits

If you make manual edits in the IDE:
1. Zenflow surfaces them in the "Changes" page
2. You can commit or discard via the UI
3. Don't manually run `git commit` - use Zenflow's interface

## Integration with Standard File Hierarchy

When Zenflow works on a project that follows the standard file hierarchy:

### Reading Context
1. Check `/00_Roadmap/task_plan.md` for current priorities
2. Read relevant specs from `/02_Specs/`
3. Review system prompts in `/04_System/` if working with agents
4. Check logs in `/05_Logs/` for historical context

### Writing Artifacts
1. Zenflow's `plan.md` can reference `/00_Roadmap/`
2. Zenflow's `spec.md` can be copied to `/02_Specs/` after completion
3. Implementation notes can be logged to `/05_Logs/JOURNAL.md`

### Example Workflow

```markdown
# In Zenflow's plan.md

## Context
- Project follows standard file hierarchy
- Current roadmap: /00_Roadmap/task_plan.md
- Relevant spec: /02_Specs/agent_routing_spec.md

## Approach
1. Read existing agent routing implementation
2. Follow patterns in /04_System/supervisor_agent.md
3. Integrate with existing codebase
4. Update /02_Specs/agent_routing_spec.md with changes
5. Log decision to /05_Logs/JOURNAL.md
```

## Common Patterns

### Pattern 1: Feature Development

```
1. Create "Spec and Build" task in Zenflow
2. Read /01_PRDs/{feature}_prd.md for requirements
3. Write spec.md in task worktree
4. Agent reads existing codebase patterns
5. Agent generates code following patterns
6. Review and merge
7. Copy spec.md to /02_Specs/{feature}_spec.md
```

### Pattern 2: Bug Fix

```
1. Create "Fix Bug" task in Zenflow
2. Read /05_Logs/ for recent changes
3. Write investigation.md in task worktree
4. Agent debugs using existing test patterns
5. Agent fixes bug, adds test
6. Review and merge
7. Log fix to /05_Logs/AUDIT_LOG.md
```

### Pattern 3: Refactoring

```
1. Create "Spec and Build" task in Zenflow
2. Read /02_Specs/architecture.md for current design
3. Write refactoring spec in spec.md
4. Agent reads existing code structure
5. Agent refactors incrementally
6. Review and merge
7. Update /02_Specs/architecture.md
```

## Troubleshooting

### Issue: Worktree conflicts
**Solution:** Don't manually manage worktrees. Let Zenflow handle it.

### Issue: Agent generates code that doesn't match existing patterns
**Solution:** Explicitly instruct agent to read existing codebase first:
```markdown
Before generating code:
1. Read /src/components/ to understand component patterns
2. Read /src/utils/ to find existing utilities
3. Follow the same naming and structure conventions
```

### Issue: Changes break existing functionality
**Solution:** Ensure cleanup script includes tests:
```bash
npm run test && pytest
```

### Issue: Lost context between tasks
**Solution:** Reference standard file hierarchy in task artifacts:
```markdown
See /02_Specs/architecture.md for system design
See /04_System/dojo_agent.md for agent behavior
```

## Quick Reference

| Action | Command/Pattern |
|--------|----------------|
| Get repo overview | `python3.11 context_mapper.py <repo_path>` |
| Find relevant files | `python3.11 context_mapper.py <repo_path> <keywords>` |
| Check file hierarchy | `ls -la <repo_path>/0*_*/` |
| Read existing patterns | Scan `/02_Specs/`, `/03_Prompts/`, `/04_System/` |
| Reference task artifacts | `{@artifacts_path}/plan.md` |
| Follow existing conventions | Read codebase first, match style |
