# Opus Prompt 2: Skill Enhancement Pattern for Dual-Mode Operation

**Agent Level:** Opus 4.5
**Estimated Duration:** 3-5 hours
**Output:** Design pattern + implementation guide + 3 concrete examples

---

## Context

We're porting 44 skills from CoworkPluginsByDojoGenesis (Claude Code plugins) to OpenClaw. These skills must operate in TWO modes:

**Standalone Mode:** User invokes skill directly (e.g., `/strategic-scout should we build X`). Skill runs independently, outputs to chat, no project context.

**Orchestration Mode:** User invokes skill via `/dojo` command (e.g., `/dojo scout should we build X`). Skill reads project state, writes outputs to project files, updates state.json, coordinates with other skills.

**Challenge:** Make skills orchestration-aware WITHOUT breaking standalone mode. Minimize code changes. Keep skills usable by both humans and AI.

---

## Your Task

Design a skill enhancement pattern that enables dual-mode operation with minimal modifications to existing SKILL.md files.

### Requirements

1. **Minimal Code Changes**
   - Existing SKILL.md files should require minimal modification
   - Orchestration logic should be injected, not embedded
   - Skills should remain self-contained and readable

2. **Backward Compatibility**
   - Standalone mode ALWAYS works
   - If no project context exists, skill runs independently
   - Skills degrade gracefully when orchestration is unavailable

3. **Type-Safe Implementation**
   - Use TypeScript for all orchestration hooks
   - Clear interfaces for project context
   - Compile-time guarantees that skills can't break orchestration

4. **Separation of Concerns**
   - Skill logic (what the skill does) vs. orchestration logic (where outputs go)
   - Skills focus on their domain, orchestration handles state management
   - Clear boundaries between layers

### Design Constraints

**Skills must:**
- Check for project context on invocation
- Save outputs to correct project locations when orchestrated
- Update state.json to reflect completion
- Work identically in standalone mode

**Skills must NOT:**
- Hardcode file paths (receive paths from orchestration layer)
- Directly modify state.json (use provided state manager)
- Break if project context is missing
- Duplicate logic between modes

---

## Your Deliverables

### 1. Pattern Design Document

Describe the enhancement pattern with:

**Architecture Overview:**
- How skills receive project context
- How skills decide which mode they're in
- How outputs are routed (chat vs. file system)
- How state is updated

**Component Interfaces:**
```typescript
interface ProjectContext {
  projectId: string;
  projectPath: string;
  phase: string;
  state: ProjectState;
  // ... what else?
}

interface SkillHooks {
  beforeExecution: (context: ProjectContext) => void;
  afterExecution: (context: ProjectContext, result: any) => void;
  // ... what else?
}
```

**Execution Flow:**
```
User invokes skill
  ↓
Orchestration layer checks for active project
  ↓
If project exists: inject ProjectContext
  ↓
Skill runs (uses context if available)
  ↓
Skill returns result
  ↓
If orchestrated: save to project, update state
  ↓
Return result to user
```

### 2. Implementation Guide

Step-by-step guide for enhancing a skill:

**Step 1: Modify SKILL.md**
- What changes are needed? (frontmatter? new sections?)
- Example showing before/after

**Step 2: Add TypeScript Wrapper**
- Where does the wrapper code live?
- How does it inject context?
- Example wrapper implementation

**Step 3: Register with Plugin**
- How to declare skill in plugin manifest?
- How to wire up orchestration hooks?
- Example registration code

**Step 4: Test Both Modes**
- How to verify standalone mode works?
- How to verify orchestration mode works?
- Example test scenarios

### 3. Concrete Examples

Provide full implementations for THREE skills (increasing complexity):

**Example 1: strategic-scout (simple)**
- Inputs: Strategic tension (text)
- Outputs: 3-5 routes (markdown)
- Standalone: Output routes to chat
- Orchestrated: Save routes to `decisions/[date]_scout_[topic].md`, update state.json

**Example 2: release-specification (moderate)**
- Inputs: Feature description, backend grounding
- Outputs: Complete specification document
- Standalone: Output spec to chat
- Orchestrated: Save to `specs/[name].md`, update PROJECT.md, mark phase as "specified"

**Example 3: parallel-tracks (complex)**
- Inputs: Specification document
- Outputs: Multiple track specifications + dependency graph
- Standalone: Output tracks to chat
- Orchestrated: Save each track to `specs/track-[N].md`, update state.json with track array, create dependency visualization in `artifacts/`

For each example, provide:
- Original SKILL.md (simplified)
- Enhanced SKILL.md (with orchestration awareness)
- TypeScript wrapper code
- Expected file outputs in orchestration mode
- Test scenarios for both modes

---

## Success Criteria

- [ ] Pattern is clear and well-documented
- [ ] Implementation guide is step-by-step and executable
- [ ] All 3 examples are complete and correct
- [ ] TypeScript code compiles and follows best practices
- [ ] Pattern minimizes changes to SKILL.md files
- [ ] Backward compatibility is guaranteed
- [ ] Pattern is scalable to 44 skills

---

## Bonus: Pattern Library

If time permits, identify common skill patterns and create reusable templates:

**Pattern 1: Single Output Skill**
- Skill produces one artifact (decision doc, spec, etc.)
- Template for wiring up file saving

**Pattern 2: Multi-Output Skill**
- Skill produces multiple artifacts (parallel track specs, etc.)
- Template for organizing outputs

**Pattern 3: Stateful Skill**
- Skill depends on previous skill outputs
- Template for reading project state

**Pattern 4: Coordination Skill**
- Skill orchestrates other skills
- Template for multi-skill workflows

---

## References

- `ARCHITECTURE.md` - Full architecture specification
- `CoworkPluginsByDojoGenesis/` - Existing skill implementations (for reference, not direct porting)
- OpenClaw SKILL.md format specification (research this!)

---

## Timeline

Start immediately, deliver within 3-5 hours of focused design work.

**Priority:** Get the pattern right. All 44 skills depend on this foundation.
