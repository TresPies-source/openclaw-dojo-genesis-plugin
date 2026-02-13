---
seed_id: 09
name: Mode-Based Complexity Gating
version: 1.0
created: 2026-01-12
source: Dataiku Research
status: active
---

# Mode-Based Complexity Gating (3-Question Test)

## What It Is
A decision framework for determining whether to use simple or complex modes based on three questions about reasoning, data sources, and adaptive processing.

## Why It Matters
Don't load unnecessary context for simple queries. Match complexity to need.

## The Pattern

### Three Questions
1. Does this require reasoning across different inputs?
2. Does this involve multiple data sources?
3. Does this need adaptive processing?

### Routing Logic
- **No to all:** Stay simple (Mirror mode, minimal context)
- **Yes to some:** Moderate complexity (Scout mode, Tier 1+2 context)
- **Yes to all:** Full complexity (Scout + Debugger, Tier 1+2+3 context)

## Revisit Trigger
When selecting mode, loading context, or estimating token usage.

## Dojo Application
- **Simple query** ("What's the DojoPacket schema?"): Mirror mode, retrieve schema, done
- **Moderate query** ("How should we architect the Workbench?"): Scout mode, analyze routes, recommend
- **Complex query** ("Reconcile conflicting perspectives on multi-agent coordination"): Scout + Debugger, deep analysis

## What It Refuses
One-size-fits-all complexity that wastes tokens on simple queries.

## Checks
- [ ] Three questions are answered for each query
- [ ] Mode selection matches complexity
- [ ] Context loading matches mode
- [ ] Simple queries use minimal resources
- [ ] Complex queries get full capabilities
