---
seed_id: 04
name: Agent Connect
version: 1.0
created: 2026-01-12
source: Dataiku Research
status: active
---

# Agent Connect (Routing-First, Not Swarm-First)

## What It Is

A central hub for managing interactions with multiple agents, handling routing, permissions, and task handoff from a single entry point.

## Why It Matters

"Agent sprawl" creates a patchwork of disconnected tools that no one can fully monitor or govern. Users don't need to know which agent does what—they just ask, and the right agent responds.

## The Pattern

### Single Entry Point
Users interact with one interface (the Supervisor).

### Routing Logic
Behind the scenes, route to the right agent based on:
- Context (what is the user asking?)
- User role and permissions
- Task complexity
- Agent availability

### Task Handoff
Agents can hand off to other agents when needed:
- Dojo → Librarian (retrieve seed modules)
- Dojo → Debugger (resolve conflicts)
- Dojo → Builder (execute code)

### Permission Management
Leverage existing permission systems:
- Groups, projects, workspaces
- Agents access only what the user has access to

### Prevent Sprawl
Centralized console for IT to deploy and route all agents.

## Revisit Trigger

When adding new specialized agents (Librarian, Debugger, Referee) or coordinating multi-agent workflows.

## Dojo Application

### Supervisor as Router
- **Single entry point:** User talks to Supervisor
- **Routing logic:** Supervisor routes to Dojo, Librarian, Debugger, Builder
- **Transparent handoff:** "Routing to Librarian to retrieve seed modules..."

### Mode-Based Routing (Within Dojo)
- **Mirror:** Simple reflection, minimal context
- **Scout:** Explore routes, recommend paths
- **Gardener:** Identify strong ideas, prune weak ones
- **Implementation:** Generate concrete next steps

### Agent Roster
- **Dojo Agent:** Core thinking partnership (Mirror/Scout/Gardener/Implementation)
- **Librarian Agent:** Semantic search and retrieval from knowledge base
- **Debugger Agent:** Resolve conflicting perspectives or logical errors
- **Builder Agent:** Code generation and execution

### Permission Inheritance
Agents access only what the user has access to:
- Google Drive files
- GitHub repositories
- Project memory

## What It Refuses

Multi-agent swarm where every agent talks to every other agent (coordination complexity explodes).

## Usage Examples

### Example 1: User Asks "What's the DojoPacket schema?"
**Routing:** Supervisor → Librarian (retrieve schema) → Dojo (explain)
**Result:** User gets answer without knowing which agents were involved

### Example 2: User Asks "How should we architect the Workbench?"
**Routing:** Supervisor → Dojo (Scout mode) → analyze routes → recommend
**Result:** Dojo provides architectural guidance

### Example 3: User Asks "These perspectives conflict"
**Routing:** Supervisor → Debugger → resolve conflict → Dojo (present resolution)
**Result:** Conflict resolved transparently

## Checks

- [ ] Single entry point exists (Supervisor)
- [ ] Routing logic is explicit and documented
- [ ] Agents can hand off to other agents
- [ ] Permissions are inherited from user
- [ ] Handoffs are transparent to user
- [ ] No agent-to-agent sprawl (all routing through Supervisor)

## Related Seeds

- **Seed 01 (Three-Tiered Governance):** Tactical tier defines routing logic
- **Seed 10 (Shared Infrastructure):** Routing logic is shared infrastructure
- **Seed 09 (Mode-Based Complexity Gating):** Routing within Dojo uses mode selection
