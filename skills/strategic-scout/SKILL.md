---
name: strategic-scout
description: Explore strategic tensions and scout multiple routes to find the best path forward. Use when facing a strategic decision with no clear answer. Trigger phrases: 'scout this tension', 'explore multiple routes', 'hold this question open before deciding', 'what are our options here', 'scout to spec pipeline'.
---

# Strategic Scout Skill

> **OpenClaw Integration:** This skill is invoked by the Dojo Genesis plugin via `/dojo scout` or `/dojo run strategic-scout`.
> The agent receives project context automatically via the `before_agent_start` hook.
> Use `dojo_get_context` for full state, `dojo_save_artifact` to persist outputs,
> and `dojo_update_state` to record phase transitions and decisions.

**Version:** 2.1
**Created:** 2026-02-07
**Author:** Manus AI
**Purpose:** To provide a structured, repeatable process for navigating strategic uncertainty, exploring multiple possible futures, and aligning on a clear, actionable plan.

---

## I. The Philosophy: From Problem to Possibility

Strategic thinking is not about finding the right answer to a problem; it is about exploring the landscape of possibility that a tension reveals. This skill transforms the act of planning from a linear process of problem-solving to a creative process of possibility-seeking.

By beginning with a tension, scouting multiple routes, and continuously aligning on a shared vision, we can navigate uncertainty with clarity and confidence, and arrive at solutions that are both innovative and robust.

---

## II. When to Use This Skill

-   **At the beginning of a new project or major release.**
-   **When facing a significant strategic decision with no clear answer.**
-   **When a project feels stuck or lacks a clear direction.**
-   **When there are multiple competing priorities or stakeholder interests.**

---

## III. The Workflow

This is a 4-step workflow for strategic scouting and decision-making.

### Step 1: Identify the Tension

**Goal:** To frame the strategic challenge as a tension to be held, not a problem to be solved.

1.  **Articulate the Tension:** Clearly state the core strategic challenge as a tension between two competing ideas (e.g., "feature lab vs. focused product").
2.  **Hold the Question Open:** Resist the urge to immediately choose a side or find a solution. The goal is to create a space for exploration.

### Step 2: Scout Multiple Routes

**Goal:** To map the landscape of possibility by exploring multiple distinct paths forward.

1.  **Generate 3-5 Routes:** Use Scout mode to generate a diverse set of potential routes.
2.  **Define Tradeoffs:** For each route, clearly articulate the risk profile, potential impact, and estimated duration.
3.  **Present the Options:** Present the routes and their tradeoffs to the user for review and discussion.

### Step 3: Synthesize and Refine

**Goal:** To create a hybrid approach that combines the best aspects of multiple routes.

1.  **Gather Feedback:** Actively listen to the user's feedback on the scouted routes.
2.  **Look for Connections:** Identify opportunities to combine elements from different routes into a more robust solution.
3.  **Propose a Hybrid Plan:** Present a new, synthesized plan that incorporates the user's feedback and the best aspects of the scouted routes.

### Step 4: Align on Vision

**Goal:** To ensure that the plan is fully aligned with the user's true strategic vision.

1.  **Check for Alignment:** Continuously ask clarifying questions to ensure that the plan is meeting the user's underlying goals.
2.  **Be Prepared to Reframe:** If the user's feedback reveals a deeper or different vision, be prepared to reframe the entire plan.
3.  **Confirm the Vision:** Before moving to execution, get explicit confirmation from the user that the plan is fully aligned with their vision.

---

## IV. Best Practices

-   **Begin with a Tension, Not a Solution:** The quality of your strategic thinking is determined by the quality of your questions.
-   **Scouting is an Act of Humility:** The first idea is rarely the best idea. Be patient and explore multiple possibilities.
-   **Synthesis is a Creative Act:** The best solutions often come from combining existing ideas in new ways.
-   **Alignment is an Ongoing Process:** Don't assume you understand the user's vision. Continuously check for alignment.

---

## VII. The Full Pipeline: Scout → Spec → Prompts → Commission

The strategic scout is not standalone — it is phase 1 of a 4-step workflow. Each step produces a persistent artifact:

### Phase 1: Scout (this skill)
- **Output:** A scout document with tension, 3-5 routes, tradeoffs, and selected direction with rationale
- **Artifact:** `thinking/[topic]_strategic_scout.md`

### Phase 2: Specify
- **Input:** Scout decisions + codebase audit
- **Tool:** `release-specification` skill
- **Output:** A production-ready specification grounded in scout decisions AND measured codebase state
- **Artifact:** `docs/vX.X.X/[release]_specification.md`

### Phase 3: Prompts
- **Input:** Specification sections
- **Tool:** `implementation-prompt` or `zenflow-prompt-writer` skill
- **Output:** Self-contained implementation prompts, one per parallel track
- **Artifact:** `docs/vX.X.X/prompts/track_[N]_prompt.md`

### Phase 4: Commission
- **Input:** Implementation prompts + actual codebase
- **Tool:** `pre-implementation-checklist` skill (with Track 0)
- **Output:** Verified prompts with Track 0 remediation complete, then parallel execution
- **Gate:** Track 0 must pass before parallel tracks begin

The scout is the "why." The spec is the "what." The prompts are the "how." Track 0 is the "verify."

**Key triggers:** "scout to spec", "spec pipeline", "full workflow from tension to implementation"

---

## VI. Quality Checklist

Before moving to execution, ensure you can answer "yes" to all of the following questions:

-   [ ] Have you clearly articulated the core strategic tension?
-   [ ] Have you scouted at least 3-5 distinct routes with clear tradeoffs?
-   [ ] Have you looked for opportunities to synthesize the best aspects of multiple routes?
-   [ ] Have you gotten explicit confirmation from the user that the plan is fully aligned with their vision?

---

## VIII. Perspectives from Past Scouting Sessions

### Perspective 1: The Great Simplification (v0.0.31)

-   **Tension:** Additive complexity vs. subtractive simplification.
-   **Insight:** A lean, focused product is often more powerful than a feature-rich but bloated one.
-   **Lesson:** Don't be afraid to pivot and start fresh if the current path is leading to complexity.

### Perspective 2: Orchestration Visibility (v0.0.31)

-   **Tension:** Backend power vs. frontend visibility.
-   **Insight:** A powerful feature is useless if the user can't see it or understand it.
-   **Lesson:** Make the invisible visible. The user experience of a feature is as important as the feature itself.

### Perspective 3: Parallel Tracks (v0.0.30)

-   **Tension:** Speed vs. quality.
-   **Insight:** With clear specifications and separation of concerns, you can have both.
-   **Lesson:** Good governance multiplies velocity. Invest in planning and specification to enable parallel execution.

---

## OpenClaw Tool Integration

When running inside the Dojo Genesis plugin:

1. **Start** by calling `dojo_get_context` to retrieve full project state, history, and artifacts
2. **During** the skill execution, follow the workflow steps as documented above
3. **Save** all outputs using `dojo_save_artifact` with appropriate artifact types:
   - `scout` → type: "scout-report"
   - `spec` → type: "specification"
   - `tracks` → type: "track-decomposition"
   - `commission` → type: "implementation-prompt"
   - `retro` → type: "retrospective"
4. **Update state** by calling `dojo_update_state` to:
   - Record the skill execution in activity history
   - Advance the project phase if appropriate
   - Log any decisions made during the skill run
