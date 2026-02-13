---
seed_id: 02
name: Harness Trace
version: 1.0
created: 2026-01-12
source: Dataiku Research
status: active
---

# Harness Trace (Nested Spans + Events)

## What It Is

A complete tracing system that records the entire trace of what an agent does, even through multiple layers of calling LLMs, as a nested JSON object.

## Why It Matters

"Traceability breaks at every hop" when decision chains multiply. You can't evaluate what you don't understand. Transparency builds trust.

## The Pattern

### Spans
- Have start/end time
- Have children spans (nesting)
- Have name, inputs, outputs
- Have attributes (metadata)

### Events
- Points in time with timestamp
- Have name, inputs, outputs
- Have attributes (metadata)

### Nesting
Represents the lifeline of the query as it goes through various systems.

### Three Views
- **Tree:** Structure and hierarchy
- **Timeline:** Performance and duration
- **Explorer:** Detailed analysis

## Revisit Trigger

When debugging unexpected behavior, evaluating performance, or building trust through transparency.

## Dojo Application

```json
{
  "trace_id": "dojo_session_12345",
  "spans": [
    {
      "span_id": "perspective_capture",
      "name": "Perspective Capture",
      "start_time": "2026-01-29T10:00:00Z",
      "end_time": "2026-01-29T10:00:05Z",
      "inputs": {"user_query": "How should we architect..."},
      "outputs": {"perspectives": ["P1", "P2", "P3"]},
      "metadata": {"perspective_count": 3}
    },
    {
      "span_id": "mode_selection",
      "name": "Mode Selection",
      "start_time": "2026-01-29T10:00:05Z",
      "end_time": "2026-01-29T10:00:07Z",
      "inputs": {"perspectives": ["P1", "P2", "P3"]},
      "outputs": {"mode": "Scout"},
      "metadata": {"reasoning": "Complex query requires route exploration"}
    },
    {
      "span_id": "scout_execution",
      "name": "Scout Mode Execution",
      "start_time": "2026-01-29T10:00:07Z",
      "end_time": "2026-01-29T10:00:30Z",
      "children": [
        {
          "span_id": "route_1_analysis",
          "name": "Route 1: Centralized Architecture",
          "inputs": {},
          "outputs": {"tradeoffs": "..."}
        },
        {
          "span_id": "route_2_analysis",
          "name": "Route 2: Distributed Architecture",
          "inputs": {},
          "outputs": {"tradeoffs": "..."}
        }
      ]
    },
    {
      "span_id": "artifact_generation",
      "name": "Artifact Generation",
      "start_time": "2026-01-29T10:00:30Z",
      "end_time": "2026-01-29T10:00:35Z",
      "outputs": {"artifact": "architecture_comparison.md"}
    }
  ],
  "usage_metadata": {
    "total_tokens": 4523,
    "estimated_cost": 0.0234
  }
}
```

## What It Refuses

Opaque decision-making where users can't see how Dojo arrived at recommendations.

## Usage Examples

### Example 1: Debugging Mode Selection
**Problem:** Why did Dojo choose Scout instead of Mirror?
**Solution:** Check `mode_selection` span in trace, read `metadata.reasoning`

### Example 2: Performance Optimization
**Problem:** Session feels slow
**Solution:** View Timeline, identify longest spans, optimize bottlenecks

### Example 3: Trust Building
**Problem:** User doesn't understand recommendation
**Solution:** Share Tree view, show decision path from query to artifact

## Checks

- [ ] Every significant decision is logged as a span
- [ ] Spans have start/end times for performance analysis
- [ ] Nesting represents actual decision hierarchy
- [ ] Metadata includes reasoning for key decisions
- [ ] Trace is exportable and inspectable
- [ ] Users can view trace in Tree, Timeline, and Explorer views

## Related Seeds

- **Seed 01 (Three-Tiered Governance):** Tactical tier defines trace format
- **Seed 05 (Go-Live Bundles):** Traces are part of DojoPacket exports
- **Meta-Seed (Governance Multiplies Velocity):** Traces build trust, accelerate delivery
