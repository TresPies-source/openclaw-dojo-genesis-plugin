---
seed_id: 05
name: Go-Live Bundles
version: 1.0
created: 2026-01-12
source: Dataiku Research
status: active
---

# Go-Live Bundles (Reusable Artifacts)

## What It Is
Lightweight packages that pair technical artifacts with approval evidence, stored centrally for reuse across similar projects.

## Why It Matters
Teams spend less time renegotiating approvals when trust is embedded in reusable artifacts.

## The Pattern
- Bundle contents: Project standards, test results, version rollback plans, approval sign-off, lineage, trace logs
- Central storage: Reviewers know exactly where to look
- Reuse: Similar projects reuse bundles without starting governance from scratch

## Revisit Trigger
When exporting Dojo sessions, sharing work across projects, or building trust through repeatability.

## Dojo Application
- **DojoPacket Schema:** Standardized export format containing perspectives, mode, artifacts, next move, harness trace
- **Seed Modules:** Reusable thinking modules with triggers and checks
- **Workbench Storage:** Central hub for all DojoPackets, accessible across sessions
- **Copy-Paste Memory Patch:** Compact format for transferring context between sessions

## What It Refuses
One-off sessions that can't be inspected, reused, or learned from.

## Checks
- [ ] DojoPacket schema is defined and versioned
- [ ] Sessions are exportable
- [ ] Exports include trace logs for transparency
- [ ] Central storage exists (Workbench)
- [ ] Reuse is encouraged and tracked
