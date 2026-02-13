---
seed_id: 03
name: Context Iceberg
version: 1.0
created: 2026-01-12
source: Dataiku Research
status: active
---

# Context Iceberg (6x Token Multiplier)

## What It Is

The hidden cost structure where production responses use 6x more tokens than demo responses due to conversation history, validation, error handling, and trace logging.

## Why It Matters

"Context re-feed is the big tax." Juggling multiple projects requires constant restatement of "what matters right now." Naive token budgeting assumes demo = production costs, leading to 5x cost overruns.

## The Pattern

### Demo Usage
- **Input:** 50 tokens (clean query)
- **Output:** 150 tokens (simple response)
- **Total:** 200 tokens

### Production Usage
- **Conversation History:** 400 tokens
- **User Profiles:** 100 tokens
- **System State:** 200 tokens
- **Validation:** 100 tokens
- **Error Handling:** 200 tokens
- **Trace Logging:** 200 tokens
- **Total:** 1,200 tokens (6x multiplier)

### Cost Model Error
If you budget for demo usage, you'll be 5x off in production.

## Revisit Trigger

When token usage spikes, costs exceed budget, or context window approaches limit.

## Dojo Application

### Hierarchical Context Loading

**Tier 1 (Always On):**
- Core system prompt
- Dojo principles
- Current user query

**Tier 2 (On Demand):**
- Active seed patches
- Relevant project memory
- Current session context

**Tier 3 (When Referenced):**
- Full text of specific files
- Previous session logs
- Detailed documentation

**Tier 4 (Pruned Aggressively):**
- General conversation history
- Less relevant details
- Archived context

### Context Pruning Triggers

- **80% capacity:** Prune Tier 4 (general history)
- **90% capacity:** Prune Tier 3 (referenced files)
- **95% capacity:** Alert user, suggest export and new session

### Shared Context Bus

Central store for:
- Project spines (core project info)
- Seed modules (reusable patterns)
- Contracts (API schemas, DojoPacket format)

### Implicit Perspective Extraction

Treat constraints and metaphors as perspectives to reduce overhead:
- "no autopilot" → perspective about autonomy
- "artifact-first" → perspective about output format

## What It Refuses

Naive token budgeting that assumes demo = production costs.

## Usage Examples

### Example 1: Simple Query
**Query:** "What's the DojoPacket schema?"
**Context:** Tier 1 + Tier 2 (schema from Shared Context Bus)
**Tokens:** ~500 (minimal overhead)

### Example 2: Complex Query
**Query:** "How should we architect the multi-agent system?"
**Context:** Tier 1 + Tier 2 + Tier 3 (seed modules, project docs, previous architecture discussions)
**Tokens:** ~2,000 (full context)

### Example 3: Context Approaching Limit
**Scenario:** 90% capacity reached
**Action:** Prune Tier 3, alert user
**Message:** "Context window at 90%. Consider exporting this session and starting fresh."

## Checks

- [ ] Hierarchical context tiers are defined
- [ ] Pruning triggers are implemented
- [ ] Shared Context Bus exists for reusable artifacts
- [ ] Token usage is monitored per session
- [ ] Users are alerted before hitting limits
- [ ] Budget accounts for 6x multiplier (not demo costs)

## Related Seeds

- **Seed 06 (Cost Guard):** Budget for the full iceberg, not just API bills
- **Seed 07 (Safety Switch):** Context drift triggers fallback mode
- **Seed 09 (Mode-Based Complexity Gating):** Match context loading to complexity
