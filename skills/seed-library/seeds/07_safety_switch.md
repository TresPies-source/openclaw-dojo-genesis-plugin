---
seed_id: 07
name: Safety Switch
version: 1.0
created: 2026-01-12
source: Dataiku Research
status: active
---

# Safety Switch (Fallback to Conservative Mode)

## What It Is
An automated pattern where the system forces fallback to a conservative operating mode and alerts the user when real-time data drifts outside tolerance.

## Why It Matters
Most failures start small. A prompt tweak siphons tokens, or an embedding model upgrade shifts outputs. Builder-level controls catch these changes before they propagate.

## The Pattern
- **Trigger:** Real-time monitoring detects drift outside tolerance band
- **Action:** Automatically fall back to conservative mode
- **Alert:** Ping user through appropriate channel (Slack, Teams, or in-app)
- **Recovery:** User reviews, adjusts, and re-enables full mode

## Revisit Trigger
When context approaching limit, perspectives conflict, or output feels like "smart fog."

## Dojo Application
- **Context drift:** If context window > 95% → prune and alert
- **Perspective conflict:** If perspectives contradict → enter Debugger mode
- **Output validation:** If output doesn't match expected artifact type → trigger "Press to Reality" module
- **Cost overrun:** If session cost approaching budget → alert and suggest pruning

## What It Refuses
Silent failures that compound without user awareness.

## Checks
- [ ] Drift detection is implemented
- [ ] Fallback mode is defined
- [ ] Alerts are sent to user
- [ ] Recovery path is clear
- [ ] Failures are logged for analysis
