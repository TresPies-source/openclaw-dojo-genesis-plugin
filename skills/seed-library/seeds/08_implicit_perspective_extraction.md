---
seed_id: 08
name: Implicit Perspective Extraction
version: 1.0
created: 2026-01-12
source: Dataiku Research
status: active
---

# Implicit Perspective Extraction

## What It Is
Treating constraints, metaphors, and scope boundaries as implicit perspectives rather than requiring explicit "Perspective 1/2/3" format.

## Why It Matters
Asking for numbered perspectives feels like homework. Users naturally provide perspectives through constraints, goals, and context—we just need to extract them.

## The Pattern
- **User input:** "no autopilot, artifact-first, 11/10 UI, avoid overbuilding"
- **Extraction:** Identify 4 implicit perspectives (autonomy constraint, output preference, quality standard, scope boundary)
- **Reflection:** "Captured 4 perspectives: [list]. Need more?"
- **Benefit:** Reduces context overhead while maintaining perspective-driven approach

## Revisit Trigger
When users provide rich context but don't explicitly number perspectives.

## Dojo Application
- **Constraint extraction:** "no X" → perspective about what to avoid
- **Metaphor extraction:** "Wikipedia of Prompts" → perspective about collaborative, open-source model
- **Scope extraction:** "Workbench for prompt engineering" → perspective about target use case
- **Quality extraction:** "11/10 UI" → perspective about design standards

## What It Refuses
Rigid perspective format that creates friction.

## Checks
- [ ] Constraints are extracted as perspectives
- [ ] Metaphors are extracted as perspectives
- [ ] Scope boundaries are extracted as perspectives
- [ ] User is asked to confirm extracted perspectives
- [ ] Extraction reduces overhead (doesn't add it)
