# Seed Module Catalog

This document provides a quick reference to all 10 Dojo Seed Patches plus the Meta-Seed.

## The 10 Core Seeds

### 01. Three-Tiered Governance
**What:** Strategic/Tactical/Operational governance framework
**Trigger:** Adding new capabilities, governance complexity, multi-agent coordination
**Refuses:** Single-layer governance

### 02. Harness Trace
**What:** Nested spans + events for complete traceability
**Trigger:** Debugging, performance evaluation, building trust
**Refuses:** Opaque decision-making

### 03. Context Iceberg
**What:** 6x token multiplier, hierarchical context loading
**Trigger:** Token spikes, cost overruns, context limit approaching
**Refuses:** Naive token budgeting

### 04. Agent Connect
**What:** Routing-first, not swarm-first multi-agent coordination
**Trigger:** Adding specialized agents, multi-agent workflows
**Refuses:** Agent sprawl

### 05. Go-Live Bundles
**What:** Reusable artifacts (DojoPacket) with approval evidence
**Trigger:** Exporting sessions, sharing work, building repeatability
**Refuses:** One-off sessions that can't be reused

### 06. Cost Guard
**What:** Budget for full iceberg (5-10x multiplier), not just API bills
**Trigger:** Planning features, estimating costs, justifying infrastructure
**Refuses:** Simple mental models (AI costs = API bills)

### 07. Safety Switch
**What:** Fallback to conservative mode when drift detected
**Trigger:** Context approaching limit, perspective conflicts, output validation failures
**Refuses:** Silent failures

### 08. Implicit Perspective Extraction
**What:** Extract perspectives from constraints, metaphors, scope
**Trigger:** Users provide rich context without explicit numbering
**Refuses:** Rigid perspective format

### 09. Mode-Based Complexity Gating
**What:** 3-question test to match mode to complexity
**Trigger:** Mode selection, context loading, token estimation
**Refuses:** One-size-fits-all complexity

### 10. Shared Infrastructure
**What:** Build once, reuse everywhere (validation, permissions, monitoring)
**Trigger:** Adding agents, building capabilities, noticing duplication
**Refuses:** Per-agent duplication

## Meta-Seed

### Governance Multiplies Velocity
**What:** Stronger governance accelerates delivery
**Trigger:** Governance feels like friction, trust is lacking
**Refuses:** False dichotomy between speed and governance

## Field Seeds (From Practice)

Seeds 11-13 emerged from the Marketplace Build Sprint (2026-02-12). Unlike the core seeds (derived from Dataiku Research), these were extracted from direct experience and are marked as experimental.

### 11. Voice Before Structure
**What:** Read the project's design language before writing any structural artifacts
**Trigger:** Ecosystem-level work, creating manifests or descriptions, projects with established design language
**Refuses:** Writing structural artifacts in a vacuum

### 12. Pointer Directories
**What:** Empty directories are often intentional references, not missing content
**Trigger:** Encountering empty directories, coverage metrics showing gaps, audit or reorganization
**Refuses:** Automatically filling empty directories without investigating provenance

### 13. Granular Visibility
**What:** Progress tracking serves the user's steering needs, not the agent's tidiness preference
**Trigger:** Tasks with 10+ steps, multi-phase work, the instinct to simplify progress tracking
**Refuses:** Pre-compressing progress updates for aesthetic reasons

## Seed Relationships

### Foundational Seeds (Start Here)
- **01. Three-Tiered Governance** - Framework for all other seeds
- **Meta. Governance Multiplies Velocity** - Philosophy behind the approach

### Operational Seeds (Day-to-Day)
- **02. Harness Trace** - Transparency and debugging
- **03. Context Iceberg** - Token and cost management
- **07. Safety Switch** - Error handling and recovery
- **09. Mode-Based Complexity Gating** - Query routing

### Architectural Seeds (System Design)
- **04. Agent Connect** - Multi-agent coordination
- **10. Shared Infrastructure** - Reusable services

### Delivery Seeds (Shipping)
- **05. Go-Live Bundles** - Packaging and reuse
- **06. Cost Guard** - Budgeting and planning

### UX Seeds (User Experience)
- **08. Implicit Perspective Extraction** - Reduce friction

### Field Seeds (From Practice)
- **11. Voice Before Structure** - Ground in philosophy before writing
- **12. Pointer Directories** - Understand provenance before filling gaps
- **13. Granular Visibility** - Track progress for the user, not the agent

## Usage Patterns

### Pattern 1: Starting a New Feature
1. Apply **Seed 01** (Three-Tiered Governance) - Define strategic/tactical/operational
2. Apply **Seed 06** (Cost Guard) - Budget for full iceberg
3. Apply **Seed 10** (Shared Infrastructure) - Identify reusable components

### Pattern 2: Debugging an Issue
1. Apply **Seed 02** (Harness Trace) - Review decision path
2. Apply **Seed 07** (Safety Switch) - Check if fallback triggered
3. Apply **Seed 03** (Context Iceberg) - Check token usage

### Pattern 3: Adding a New Agent
1. Apply **Seed 04** (Agent Connect) - Define routing logic
2. Apply **Seed 10** (Shared Infrastructure) - Reuse existing services
3. Apply **Seed 01** (Three-Tiered Governance) - Ensure alignment

### Pattern 4: Optimizing Costs
1. Apply **Seed 03** (Context Iceberg) - Implement hierarchical loading
2. Apply **Seed 06** (Cost Guard) - Budget for 5-10x multiplier
3. Apply **Seed 09** (Mode-Based Complexity Gating) - Match complexity to need

### Pattern 5: Improving UX
1. Apply **Seed 08** (Implicit Perspective Extraction) - Reduce friction
2. Apply **Seed 09** (Mode-Based Complexity Gating) - Faster simple queries
3. Apply **Seed 02** (Harness Trace) - Transparent decision-making

### Pattern 6: Ecosystem-Level Work (Plugin Builds, Marketplace Setup)
1. Apply **Seed 11** (Voice Before Structure) - Ground in philosophy before writing
2. Apply **Seed 12** (Pointer Directories) - Map provenance before filling gaps
3. Apply **Seed 13** (Granular Visibility) - Maintain detailed progress tracking

### Pattern 7: Auditing or Reorganizing a Codebase
1. Apply **Seed 12** (Pointer Directories) - Check what's intentionally empty
2. Apply **Seed 10** (Shared Infrastructure) - Identify shared components
3. Apply **Seed 01** (Three-Tiered Governance) - Assess governance at each layer

## Seed Maintenance

### When to Update a Seed
- Pattern evolves based on new learnings
- Better approach discovered
- User feedback suggests improvement

### When to Archive a Seed
- Pattern no longer applies
- Superseded by better approach
- Context has fundamentally changed

### Versioning Convention
- **1.0** - Initial version from Dataiku research
- **1.1** - Minor update (clarification, example added)
- **2.0** - Major update (pattern changed)

### Update Process
1. Identify need for update
2. Draft new version
3. Test with real scenarios
4. Update seed file with "Revised:" section
5. Update this catalog
6. Notify users of change
