---
seed_id: 12
name: Pointer Directories
version: 1.0
created: 2026-02-12
source: Marketplace Build Sprint
status: experimental
---

# Pointer Directories

## What It Is

Empty directories in a project registry are often intentional references to content that lives elsewhere — not missing content. The instinct to "fill the gap" can produce unnecessary duplication. Understanding why something is empty is more valuable than filling it.

## Why It Matters

During the marketplace build, 7 skill directories appeared to be missing SKILL.md files. The instinct was to create new content for each. Investigation revealed they were intentional pointers — 4 referenced Anthropic Cowork platform skills (docx, pdf, pptx, xlsx), and 3 referenced Dojo Genesis skills installed at the system level (specification-writer, zenflow-prompt-writer, project-exploration). Understanding the provenance eliminated unnecessary work and produced a more accurate changelog.

## The Pattern

### Before Creating Content for Empty Directories
1. Ask: "Is this directory a pointer or a gap?"
2. Check if the content exists elsewhere — installed system, platform, external dependency, parent repository
3. If it's a pointer, copy from the authoritative source rather than writing from scratch
4. Document the provenance in the changelog

### The Provenance Model
In any registry system, content may live at multiple levels:
- **Source:** The original authoring location (e.g., `dojo-genesis/skills/`)
- **System-installed:** Deployed to runtime (e.g., `.skills/skills/`)
- **Platform:** Provided by the host platform (e.g., Cowork system skills)

An empty directory at one level doesn't mean the content is missing — it may live at another level by design.

## Revisit Trigger

- Encountering empty directories during an audit or reorganization
- Finding skills, components, or modules that exist in a registry but have no local content
- When a coverage metric shows "gaps" that nobody has complained about
- Before creating content to "fill" something that feels incomplete

## Dojo Application

### How Dojo Uses This Pattern
- The 49-skill marketplace achieved 100% SKILL.md coverage by copying from authoritative sources rather than writing new content
- The CHANGELOG documents each skill's provenance (platform vs. system-installed vs. source)
- Empty directories in `dojo-genesis/skills/` are understood as part of the architecture, not defects

### The Decision
Rather than writing 7 new SKILL.md files from scratch, the sprint copied content from where it actually lived. This preserved quality, maintained consistency with the Cowork platform, and avoided divergence between the marketplace copy and the authoritative source.

## What It Refuses

- Automatically creating content for every empty directory without investigating why it's empty
- Treating coverage metrics as the only measure of completeness
- Duplicating content when a reference to the authoritative source would be more accurate

## Usage Examples

### Example 1: Marketplace Build
**Without Seed:** Create 7 new SKILL.md files from scratch. Result: divergent content, maintenance burden, potential inaccuracies.
**With Seed:** Investigate provenance, discover pointers, copy from authoritative sources. Result: consistent content, clear provenance, no maintenance drift.

### Example 2: Monorepo Audit
**Without Seed:** Report 15 packages as "missing documentation." File bugs for all 15.
**With Seed:** Check if packages reference docs from a shared documentation system or parent repo. Report only the genuine gaps.

## Checks

- [ ] Empty directories investigated before content creation
- [ ] Provenance checked at all levels (source, system, platform)
- [ ] Authoritative source identified and content copied (not rewritten)
- [ ] Provenance documented in changelog or README
- [ ] Genuine gaps distinguished from intentional pointers

## Related Seeds

- **Seed 10 (Shared Infrastructure):** Both patterns recognize that content may be shared across multiple consumers
- **Seed 02 (Harness Trace):** Tracing the provenance of a pointer is analogous to tracing a decision path
- **Seed 11 (Voice Before Structure):** Both emerged from the same sprint; voice informs what to write, pointers inform what not to write
