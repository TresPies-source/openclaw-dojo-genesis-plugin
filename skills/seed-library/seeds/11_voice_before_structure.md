---
seed_id: 11
name: Voice Before Structure
version: 1.0
created: 2026-02-12
source: Marketplace Build Sprint
status: experimental
---

# Voice Before Structure

## What It Is

A practice of reading the project's design language and philosophy documents before writing any structural artifacts — manifests, descriptions, READMEs, schemas.

## Why It Matters

Structure without voice produces generic output. Manifests written without philosophy grounding had to be rewritten. Voice informs structure — the descriptions, the naming, the framing all change when you understand the project's philosophy. The difference between "strategic planning tools" and "begin with a tension, not a solution" is the difference between cargo and cargo with identity.

## The Pattern

### Before Writing Structure
1. Identify the project's philosophy documents (README, design language, reflections, founding documents)
2. Read 2-3 of them — enough to hear the voice, not so many that execution stalls
3. Let the voice inform naming, descriptions, and framing
4. Check: would someone who knows this project recognize these descriptions as belonging here?

### The Test
Read the structural artifact aloud. Does it sound like it came from this project, or could it belong to any project? If the latter, you haven't grounded in the voice yet.

## Revisit Trigger

- Starting any ecosystem-level work (plugin builds, marketplace setup, documentation overhauls)
- Creating manifests, READMEs, or descriptions for a project with established design language
- When the word "description" appears in a template
- When writing metadata that carries the project's identity

## Dojo Application

### How Dojo Uses This Pattern
- Marketplace manifests carry growth language ("planted, cultivated, harvested") because the philosophy documents were read first
- Plugin descriptions use nature metaphors and governance principles because the Design Language was grounded before structure was written
- Cruz's mid-sprint interrupt — "before you write the manifest make sure you ground yourself in the philosophy" — was the single highest-leverage moment of the sprint

### In Practice
Make "read the design language" Step 0 of any ecosystem-level work. Encode this in handoff templates and commission documents.

## What It Refuses

Writing structural artifacts in a vacuum. Treating manifests, descriptions, and READMEs as boilerplate to be filled in generically.

## Usage Examples

### Example 1: Plugin Marketplace Build
**Without Voice:** Plugin description reads "A collection of strategic planning tools."
**With Voice:** Plugin description reads "Begin with a tension, not a solution. Scout multiple routes, align on vision, and only then commit to a plan."

### Example 2: Documentation Overhaul
**Without Voice:** Section headings are functional ("Getting Started", "Configuration", "API Reference").
**With Voice:** Section headings carry identity — framed in the project's own language and metaphors.

## Checks

- [ ] Philosophy documents identified before writing began
- [ ] 2-3 documents read (not just skimmed)
- [ ] Structural artifacts carry the project's voice, not generic language
- [ ] Someone familiar with the project would recognize the voice
- [ ] Execution was not delayed indefinitely by reading everything

## Related Seeds

- **Seed 05 (Go-Live Bundles):** Bundles should carry voice too — export artifacts are identity-carrying
- **Seed 08 (Implicit Perspective Extraction):** Both seeds are about drawing richness from context rather than imposing generic structure
- **Seed 13 (Granular Visibility):** Both emerged from the same sprint; together they represent "ground first, then track visibly"
