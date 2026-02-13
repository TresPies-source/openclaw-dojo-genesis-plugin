---
seed_id: 06
name: Cost Guard
version: 1.0
created: 2026-01-12
source: Dataiku Research
status: active
---

# Cost Guard (Budget for the Full Iceberg)

## What It Is
A comprehensive approach to cost management that accounts for system complexity, context explosion, error handling, validation, integration, oversight, and scope expansion—not just API bills.

## Why It Matters
"Your API bill is just 10% to 20% of your real AI costs." Production costs are 5-10x pilot costs. This isn't failure—it's the cost of reliability, security, scalability, and usefulness.

## The Pattern
- **Seven hidden layers:** System complexity, context explosion, error handling, validation overhead, integration complexity, human oversight, scope expansion
- **Budget multiplier:** 5-10x from pilot to production
- **Strategies:** Start with hardest scenario, build shared infrastructure, make validation efficient, plan for deliberate expansion

## Revisit Trigger
When planning new features, estimating costs, or justifying infrastructure investments.

## Dojo Application
- **Token budgeting:** Warning at 80%, hard stop at 100%, offer to export and start new session
- **Cost estimation:** Show user estimated token usage before running Scout mode
- **Usage metadata tracking:** Track tokens/cost per mode, roll up to session level
- **Cost-aware mode selection:** If budget low, prefer Mirror over Scout; if ample, use full capabilities

## What It Refuses
Simple mental models that assume AI costs = API bills.

## Checks
- [ ] Budget accounts for 5-10x multiplier (not just API costs)
- [ ] Token usage is tracked per session
- [ ] Users are warned before hitting limits
- [ ] Cost estimation is shown before expensive operations
- [ ] Mode selection considers budget constraints
