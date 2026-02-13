---
seed_id: 10
name: Shared Infrastructure
version: 1.0
created: 2026-01-12
source: Dataiku Research
status: active
---

# Shared Infrastructure (Build Once, Reuse Everywhere)

## What It Is

Building foundational capabilities (validation frameworks, feedback loops, permission management, monitoring, integrations) as shared services that all agents use.

## Why It Matters

Building the same capabilities for every agent is wasteful. Shared infrastructure makes subsequent agents much easier to deploy. Faster iteration, less duplication.

## The Pattern

### Identify Common Needs
- Validation frameworks
- Feedback loops
- Permission management
- Monitoring and logging
- Integrations (APIs, databases)

### Build as Shared Services
- Central implementation
- Not per-agent duplication
- Versioned and documented

### Reuse Across Agents
- Every new agent inherits the foundation
- Less time rebuilding, more time on unique capabilities

## Revisit Trigger

When adding new agents, building new capabilities, or noticing duplication.

## Dojo Application

### Workbench
Shared infrastructure for storage, retrieval, and visualization of DojoPackets.

### Shared Context Bus
Central store for project spines, seed modules, and contracts.

### Trace Explorer
Unified trace visualization for all sessions (uses Harness Trace format).

### DojoPacket Schema
Standardized export format for all sessions.

### Perspective Validation
Reusable check across all modes (Mirror, Scout, Gardener, Implementation).

## What It Refuses

Per-agent duplication of foundational capabilities.

## Checks

- [ ] Common needs are identified before building per-agent solutions
- [ ] Shared services are versioned and documented
- [ ] New agents reuse existing infrastructure
- [ ] Duplication is actively prevented
- [ ] Infrastructure investment is justified by reuse

## Related Seeds

- **Seed 01 (Three-Tiered Governance):** Operational tier uses shared instruments
- **Seed 04 (Agent Connect):** Routing logic is shared infrastructure
- **Seed 06 (Cost Guard):** Shared infrastructure reduces per-agent costs
