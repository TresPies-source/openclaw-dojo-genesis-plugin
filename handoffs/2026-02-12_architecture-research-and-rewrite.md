# Agent Handoff Package

**From:** Manus (Strategic Planning Agent)
**To:** Opus Implementation Agent
**Date:** 2026-02-12
**Subject:** Research AgenticGateway Architecture and Rewrite ARCHITECTURE.md

---

## 1. Objective

Research the AgenticGateway codebase to understand its extension mechanisms, then rewrite the ARCHITECTURE.md file to ground Dojo Genesis as a skill layer within AgenticGateway rather than as an OpenClaw plugin (which does not exist).

---

## 2. Required Context

**Core Documents:**
- **Current Architecture (v0.2.0):** `/sessions/elegant-epic-ritchie/mnt/ZenflowProjects/ClawHubPluginsByDojoGenesis/ARCHITECTURE.md`
  - Already updated based on AgenticGateway reality
  - Your task is to verify and refine this based on deeper research

- **Research Prompts (Foundation Knowledge):**
  - `/sessions/elegant-epic-ritchie/mnt/ZenflowProjects/ClawHubPluginsByDojoGenesis/prompts/opus-prompt-1-plugin-api-deep-dive.md`
  - `/sessions/elegant-epic-ritchie/mnt/ZenflowProjects/ClawHubPluginsByDojoGenesis/prompts/opus-prompt-2-skill-enhancement-pattern.md`
  - `/sessions/elegant-epic-ritchie/mnt/ZenflowProjects/ClawHubPluginsByDojoGenesis/prompts/opus-prompt-3-multi-project-design.md`

**Codebase to Research:**
- **AgenticGateway Repository:** User has access to the AgenticGateway codebase
  - Focus areas:
    - `server/tools/` - Tool registration and execution
    - `server/projects/` - ProjectManager implementation
    - `server/orchestration/` - DAG engine and workflow execution
    - `server/types/` - Project metadata structure
    - Any existing skill registration patterns

**Key Discoveries Already Made:**
- AgenticGateway exists and is written in Go
- It has a ProjectManager with SQLite + filesystem storage
- It has a tool registry (`tools.RegisterTool()`)
- It has a DAG orchestration engine for multi-step workflows
- It uses `project.Metadata` JSON field for extensible state
- It stores projects in `~/DojoProjects/`
- Skills are registered as tools, not as plugins

---

## 3. Task Definition

### Phase 1: Deep Research (2-4 hours)

Execute the three research prompts in parallel to understand:

**Prompt 1 - Tool Registration & Execution:**
- How tools are registered via `tools.RegisterTool()`
- Tool definition structure (name, description, parameters, function, timeout)
- How tools receive context and parameters
- How tools return results
- Error handling and validation patterns
- Security considerations for tool execution

**Prompt 2 - Skill Enhancement Pattern:**
- Design the dual-mode operation pattern
  - Standalone mode: no `project_id`, output to chat
  - Orchestrated mode: `project_id` present, save to project files, update metadata
- Create TypeScript/Go interface definitions for project context
- Provide 3 concrete examples (strategic-scout, release-specification, parallel-tracks)
- Specify before/after for SKILL.md format
- Document wrapper pattern for injecting project awareness

**Prompt 3 - Multi-Project Support:**
- Confirm AgenticGateway's existing multi-project approach
- Verify that `last_accessed_at` ordering provides implicit "active" project
- Design command interface (if needed) or confirm tool invocation pattern
- Document UX for project selection and context switching
- Address edge cases (no projects, wrong project ID, concurrent access)

### Phase 2: Architecture Document Refinement (2-3 hours)

Update `/sessions/elegant-epic-ritchie/mnt/ZenflowProjects/ClawHubPluginsByDojoGenesis/ARCHITECTURE.md` based on research findings:

**Verify and Refine Sections:**
- **Section IV: Skill Registration** - Confirm tool registration code is accurate
- **Section V: Workflow Orchestration** - Verify DAG engine integration is correct
- **Section VI: Package Structure** - Confirm Go package layout matches gateway conventions
- **Section X: Open Questions** - Answer as many as possible based on research

**Add New Sections:**
- **Section XII: Tool Implementation Guide** - Step-by-step guide for adding a new Dojo skill
- **Section XIII: Testing Strategy** - How to test both standalone and orchestrated modes
- **Section XIV: Integration Checklist** - Pre-launch verification checklist

**Update Based on Findings:**
- Correct any misunderstandings about AgenticGateway architecture
- Add code examples grounded in actual gateway patterns
- Reference specific files/functions from the gateway codebase
- Flag any blockers or missing gateway capabilities

### Phase 3: Research Document (1 hour)

Create a comprehensive research document:

**File:** `/sessions/elegant-epic-ritchie/mnt/ZenflowProjects/ClawHubPluginsByDojoGenesis/research/agentic-gateway-architecture-research.md`

**Contents:**
- Summary of AgenticGateway architecture relevant to Dojo Genesis
- Tool registration API documentation (extracted from code)
- ProjectManager API documentation (extracted from code)
- DAG orchestration patterns (extracted from code)
- Metadata schema conventions (extracted from code)
- Security and validation patterns (extracted from code)
- Code snippets and examples from the gateway
- Links to specific gateway source files
- Answers to all open questions from Section X
- Recommendations for ARCHITECTURE.md improvements

---

## 4. Definition of Done

Research Phase:
- [ ] All three research prompts executed with comprehensive findings
- [ ] AgenticGateway codebase explored for tool registration, ProjectManager, DAG engine
- [ ] Code examples extracted and documented
- [ ] Open questions from ARCHITECTURE.md Section X answered (or flagged as blockers)
- [ ] Security and validation patterns documented

Architecture Update Phase:
- [ ] ARCHITECTURE.md updated with verified, code-grounded information
- [ ] All code examples are syntactically correct for Go/AgenticGateway
- [ ] Sections IV-VI refined based on actual gateway patterns
- [ ] New sections added (XII-XIV) with actionable guidance
- [ ] No references to "OpenClaw" remain (that system doesn't exist)
- [ ] Document is ready to guide Phase 1 implementation

Research Document Phase:
- [ ] Research document created with comprehensive findings
- [ ] Gateway API documentation extracted and organized
- [ ] Code snippets include file paths and line numbers (for verification)
- [ ] Recommendations are specific and actionable
- [ ] Document serves as implementation reference

---

## 5. Constraints & Boundaries

**DO:**
- Read actual AgenticGateway source code to verify assumptions
- Extract real code examples and patterns
- Document both what exists and what needs to be built
- Flag uncertainties clearly
- Recommend changes to ARCHITECTURE.md based on findings

**DO NOT:**
- Make up API patterns if they're not found in the code
- Assume AgenticGateway works like OpenClaw or other systems
- Skip sections because they seem obvious
- Leave open questions unanswered without attempting research
- Break the existing ARCHITECTURE.md v0.2.0 structure (refine, don't rewrite from scratch)

**MUST:**
- Prioritize accuracy over speed
- Include source file references for all code examples
- Flag any blocking issues discovered during research
- Keep ARCHITECTURE.md aligned with AgenticGateway's actual capabilities

---

## 6. Next Steps (After Completion)

Upon completion:

1. **Review with User (Cruz):** Present research findings and updated ARCHITECTURE.md
2. **Address Questions:** Resolve any blocking issues or uncertainties
3. **Handoff to Implementation Agent:** If architecture is approved, create handoff package for Phase 1 implementation (orchestration foundation)
4. **Update Project Plan:** Refine Phase 1-3 timelines based on research complexity

---

## 7. Additional Notes

**Why This Matters:**

The v0.1.0 architecture was based on "OpenClaw" research, which turned out to be a non-existent system. The v0.2.0 update corrected course by recognizing AgenticGateway as the actual platform, but it was written with limited codebase access.

This research phase is critical because:
- We're building on an existing, real platform (not a hypothetical one)
- We must work with AgenticGateway's existing patterns, not invent new ones
- The foundation (tool registration, state management) determines everything else
- 44 skills depend on getting the dual-mode pattern right

**Research Strategy:**

1. **Start with existing patterns:** Look for any existing skills or tools in the gateway that could serve as templates
2. **Trace execution flows:** Follow a tool invocation from registration → execution → result handling
3. **Examine ProjectManager:** Understand how projects are created, loaded, updated, and accessed
4. **Study metadata conventions:** Look for examples of how other features extend `project.Metadata`
5. **Test hypotheses:** If unclear, propose 2-3 approaches and evaluate based on gateway conventions

**Success Criteria:**

The updated ARCHITECTURE.md should be so clear and code-grounded that a Go developer unfamiliar with Dojo Genesis could:
- Understand where Dojo Genesis fits in the gateway
- Register a new Dojo skill by following the pattern
- Test both standalone and orchestrated modes
- Extend the metadata schema for new workflow phases

---

## 8. File Locations Reference

**Project Root:** `/sessions/elegant-epic-ritchie/mnt/ZenflowProjects/ClawHubPluginsByDojoGenesis/`

**Files to Update:**
- `ARCHITECTURE.md` - Main architecture document (current: v0.2.0)

**Files to Create:**
- `research/agentic-gateway-architecture-research.md` - Research findings
- `research/tool-registration-api.md` - Tool API documentation (optional, can be part of main research doc)
- `research/code-examples/` - Directory for extracted code snippets (optional)

**Files to Reference:**
- `prompts/opus-prompt-1-plugin-api-deep-dive.md` - Research guide for tools/skills
- `prompts/opus-prompt-2-skill-enhancement-pattern.md` - Dual-mode pattern design guide
- `prompts/opus-prompt-3-multi-project-design.md` - Multi-project strategy guide

---

## 9. Timeline

**Target Completion:** 5-7 hours total research + writing time

**Phase Breakdown:**
- Research Phase (Parallel): 2-4 hours
  - Prompt 1: 1.5-2 hours
  - Prompt 2: 2-3 hours (most complex)
  - Prompt 3: 1-2 hours
- Architecture Update: 2-3 hours
- Research Document: 1 hour

**Priority:** Get it right over getting it fast. This is the foundation.

---

**End of Handoff Package**

The baton is yours. Good luck! 🦞
