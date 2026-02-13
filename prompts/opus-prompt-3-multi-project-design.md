# Opus Prompt 3: Multi-Project Support Design

**Agent Level:** Opus 4.5
**Estimated Duration:** 2-3 hours
**Output:** Multi-project strategy + state management design + UX specification

---

## Context

The Dojo Genesis orchestration plugin manages specification-driven development projects. Users will likely work on multiple projects over time, and possibly concurrently.

**Current architecture** assumes a single "active" project, but this may not match real-world usage. We need to decide:

1. **Can users work on multiple projects simultaneously?**
2. **How do users select which project commands apply to?**
3. **How do we prevent state conflicts between concurrent projects?**
4. **What's the UX for switching between projects?**

This decision affects:
- Command interface design (`/dojo` commands)
- State management (where state lives, how it's loaded)
- User cognitive load (complexity vs. power)
- File system structure (`~/.openclaw/dojo-genesis/projects/`)

---

## Your Task

Design a multi-project support strategy that balances power user needs with simplicity for beginners.

---

## Design Space to Explore

### Option 1: Single Active Project

**Model:** One project is "active" at a time. All `/dojo` commands apply to the active project.

**Pros:**
- Simple mental model
- No ambiguity about which project a command affects
- Easier state management (load one project at a time)

**Cons:**
- Switching between projects requires explicit command
- Can't run commands on multiple projects without switching
- Doesn't match real-world usage (users work on multiple things)

**Commands:**
```
/dojo init mobile-redesign        # Creates and activates
/dojo switch backend-refactor     # Switch active project
/dojo status                      # Shows active project status
/dojo scout should we X           # Applies to active project
```

**State Management:**
- `~/.openclaw/dojo-genesis/active-project.json` stores current project ID
- Commands load active project context automatically

### Option 2: Explicit Project Selection Per Command

**Model:** No "active" project. Every command takes an explicit project argument.

**Pros:**
- Maximum flexibility
- No hidden state (always explicit which project)
- Can operate on any project without switching

**Cons:**
- More verbose
- Higher cognitive load
- Beginners might find it confusing

**Commands:**
```
/dojo init mobile-redesign
/dojo scout mobile-redesign should we X
/dojo status mobile-redesign
/dojo spec backend-refactor track-1
```

**State Management:**
- No global "active" state
- Each command loads the specified project
- Must validate project exists on every command

### Option 3: Hybrid (Active + Explicit Override)

**Model:** One active project, but commands can explicitly target others.

**Pros:**
- Best of both worlds
- Simple for single-project users
- Power for multi-project users

**Cons:**
- Two ways to do things (complexity)
- Need clear syntax for explicit targeting

**Commands:**
```
/dojo init mobile-redesign        # Creates and activates
/dojo scout should we X           # Applies to active
/dojo scout @backend-refactor should we Y  # Explicit target
/dojo switch backend-refactor     # Change active
/dojo status                      # Active project
/dojo status --all                # All projects
```

**State Management:**
- `active-project.json` + support for `@project-name` syntax
- Commands check for explicit target first, fall back to active

### Option 4: Directory-Based Context

**Model:** Active project is determined by current working directory.

**Pros:**
- Aligns with git/filesystem mental model
- Natural for users familiar with terminal workflows
- No explicit switching needed

**Cons:**
- Requires OpenClaw to track working directory
- May not work in all messaging channels
- Confusing if OpenClaw is remote

**Commands:**
```
/dojo init mobile-redesign --in ~/projects/mobile
cd ~/projects/mobile
/dojo scout should we X           # Applies to mobile-redesign
cd ~/projects/backend
/dojo scout should we Y           # Applies to backend-refactor
```

**State Management:**
- Detect project by inspecting current directory for PROJECT.md
- Fall back to active project if not in a project directory

---

## Your Deliverables

### 1. Recommendation

**Choose one approach** (or propose a 5th option) and justify:

- Why this approach is best for Dojo Genesis users
- How it balances simplicity and power
- How it compares to similar tools (git branches, Python virtualenvs, etc.)
- What the learning curve is
- How it scales to 5+ concurrent projects

### 2. State Management Design

**Describe the complete state management strategy:**

```typescript
// What state is global?
interface GlobalState {
  activeProjectId: string | null;
  projects: ProjectMetadata[];
}

// What state is per-project?
interface ProjectState {
  projectId: string;
  phase: string;
  tracks: Track[];
  // ... etc
}

// How is state loaded?
function loadProjectContext(
  projectId?: string // optional explicit target
): ProjectContext {
  // Implementation strategy
}
```

**Address:**
- Where state files live (`active-project.json`? `config.json`?)
- When state is loaded (every command? cached in memory?)
- How to handle concurrent access (file locks? timestamps?)
- How to recover from corrupted state

### 3. Command Interface Specification

**Define the complete command interface** for your chosen approach:

| Command | Syntax | Behavior | Examples |
|---------|--------|----------|----------|
| init | `/dojo init <name> [options]` | Create and activate new project | `/dojo init mobile-redesign` |
| switch | `/dojo switch <name>` | Change active project | `/dojo switch backend` |
| status | `/dojo status [project]` | Show project status | `/dojo status` or `/dojo status backend` |
| list | `/dojo list` | Show all projects | `/dojo list` |
| archive | `/dojo archive [project]` | Archive project | `/dojo archive mobile-redesign` |
| ... | ... | ... | ... |

**For every skill-invoking command** (scout, spec, commission, etc.):
- How to target active project
- How to target explicit project (if applicable)
- What happens if no project exists
- What happens if specified project doesn't exist

### 4. User Experience Flow

**Describe the user experience** for common scenarios:

**Scenario 1: Beginner (single project)**
```
User: /dojo init my-first-project
      [What happens? What does the user see?]

User: /dojo scout should we build X
      [What happens? How does the user know it worked?]
```

**Scenario 2: Power User (3 concurrent projects)**
```
User: /dojo list
      [What do they see? How are projects displayed?]

User: /dojo scout [targeting project 2]
      [What's the syntax? How do they select the target?]

User: [Switches between projects multiple times]
      [What's the UX for context switching?]
```

**Scenario 3: Error Handling**
```
User: /dojo scout should we X
      [But no project exists - what happens?]

User: /dojo switch nonexistent-project
      [What error message? What suggestions?]

User: /dojo status
      [Multiple projects exist, none active - what happens?]
```

### 5. Migration Path

**If your design differs from the initial single-project assumption:**

- How do we migrate existing state?
- Is the change backward compatible?
- What's the upgrade path for users?

---

## Success Criteria

- [ ] Recommendation is clear and justified
- [ ] State management design is complete and implementable
- [ ] Command interface is fully specified
- [ ] UX flows cover common scenarios and edge cases
- [ ] Error handling is well-defined
- [ ] Design is scalable to 10+ projects
- [ ] Design is simple enough for beginners

---

## Evaluation Criteria

Judge your design against:

1. **Simplicity:** Can a beginner create one project and use it without confusion?
2. **Power:** Can a power user manage 5+ projects efficiently?
3. **Explicitness:** Is it always clear which project a command affects?
4. **Consistency:** Does the design align with OpenClaw conventions?
5. **Robustness:** How does it handle edge cases and errors?

---

## References

- Git branch model (inspiration, not direct copy)
- Python virtualenv / conda environments (project isolation patterns)
- tmux sessions (context switching UX)
- OpenClaw command conventions (research `/new`, `/reset` for patterns)

---

## Timeline

Start immediately, deliver within 2-3 hours of design work.

**Priority:** Get the UX right. Users will interact with this every day.
