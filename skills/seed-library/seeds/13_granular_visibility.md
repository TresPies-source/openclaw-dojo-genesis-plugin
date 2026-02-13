---
seed_id: 13
name: Granular Visibility
version: 1.0
created: 2026-02-12
source: Marketplace Build Sprint
status: experimental
---

# Granular Visibility

## What It Is

On complex multi-phase work, maintain granular progress tracking that serves the user's need for visibility — not the agent's preference for tidiness. The user steers the work. Compressed progress updates remove their ability to see what's happening, what's next, and what might need course correction.

## Why It Matters

During the marketplace build, the todo list was compressed from 17 items to 8 mid-sprint. The user explicitly asked to "return to the more complex and complete version." The instinct to simplify felt helpful to the agent but removed the user's ability to monitor and steer. Visibility enables trust. Trust enables delegation. Delegation enables velocity.

## The Pattern

### Progress Tracking Principles
1. Create granular items from the start — one per discrete deliverable or decision point, not one per phase
2. Update status in real-time as items complete
3. If the list feels long, that's a signal the work is complex — the list is accurate, not bloated
4. Let the user request compression if they want it — don't pre-compress for them

### The Chain
Granular visibility → User sees progress → User can steer → User trusts the process → User delegates more → Agent moves faster → Better outcomes

### The Anti-Pattern
Compressed visibility → User can't see progress → User interrupts to check status → Agent stops to explain → Both lose momentum → Trust erodes

## Revisit Trigger

- Any task with more than 10 discrete steps
- Multi-phase work spanning multiple tool calls or agents
- When the instinct arises to "simplify" or "clean up" progress tracking
- When working with a user who values steering over delegation

## Dojo Application

### How Dojo Uses This Pattern
- The marketplace build maintained a 24-item todo list across 4 phases
- Each SKILL.md update, each verification step, each version bump had its own line item
- The user could see at a glance: what's done, what's in progress, what's next
- Course corrections (like the philosophy grounding interrupt) were possible because the user could see where the work was heading

### The Rule
Default to granular. Let the user ask for compression, not the other way around. The user's need for visibility outweighs the agent's preference for tidiness.

## What It Refuses

- Pre-compressing progress updates for aesthetic reasons
- Assuming the user wants less detail
- Treating "long todo list" as a problem to solve rather than an accurate reflection of complex work
- Simplifying for the agent's convenience at the cost of the user's steering ability

## Usage Examples

### Example 1: Marketplace Build Sprint
**Without Seed:** 8-item todo list: "Phase 1: Reorganize", "Phase 2: Improve", etc. User can't see which of 49 skills have been updated.
**With Seed:** 24-item list: individual items for trigger phrases, version bumps, verification, each plugin's README. User can steer at any point.

### Example 2: Documentation Overhaul
**Without Seed:** "Update all docs" as one item. Done when done.
**With Seed:** Separate items for each document group, with progress visible throughout. User notices a section was missed and corrects before completion.

## Checks

- [ ] Todo items represent discrete deliverables or decision points (not phases)
- [ ] Status is updated in real-time
- [ ] User has not been asked to accept a compressed view
- [ ] The list length matches the work complexity
- [ ] Truly trivial sub-steps (like "read file X") are not individually tracked

## Related Seeds

- **Seed 02 (Harness Trace):** Both seeds are about transparency — traces for decisions, visibility for progress
- **Seed 01 (Three-Tiered Governance):** Granular visibility is operational governance applied to progress tracking
- **Seed 11 (Voice Before Structure):** Both emerged from the same sprint; together they represent the mindfulness axis of the work
- **Meta-Seed (Governance Multiplies Velocity):** Granular visibility is governance that accelerates rather than slows — the user steers faster when they can see
