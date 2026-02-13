# Semantic Action-Verb Clusters — Reference Guide

**Purpose:** This reference explains how to identify, assign, and maintain semantic clusters when generating a `.status.md` for a software repository.

---

## What Are Semantic Clusters?

Most codebases are organized by *where files live* (directories, packages, modules). Semantic clusters reorganize the same codebase by *what it does* — each cluster is named with an action verb that captures a behavioral capability.

This matters because:
- A feature often spans multiple directories (frontend + backend + database + tests)
- A directory often contains components serving different purposes
- Understanding a system's *capabilities* is more useful than understanding its *file layout*

---

## The Starter Verbs

These 13 verbs cover most software systems. Not every project needs all of them, and some projects will need verbs not on this list.

### CONVERSE
**Meaning:** The system communicates with users in real-time.
**Typical components:** Chat UI, message models, WebSocket/SSE handlers, input components, notification systems.
**Signals you need this cluster:** The app has a chat, messaging, or real-time communication feature.

### REASON
**Meaning:** The system thinks, plans, or makes decisions.
**Typical components:** AI agents, intent classifiers, orchestration engines, DAG planners, rule engines, recommendation systems.
**Signals:** The app has an AI agent, a planning system, or automated decision-making.

### REMEMBER
**Meaning:** The system stores and recalls knowledge over time.
**Typical components:** Memory systems, caching layers, embeddings, vector search, knowledge bases, seed/snippet systems.
**Signals:** The app has a memory, knowledge base, or learning component that persists across sessions.

### OBSERVE
**Meaning:** The system watches itself and reports what it sees.
**Typical components:** Trace loggers, metrics collectors, event buses, cost trackers, monitoring dashboards, audit logs.
**Signals:** The app has logging, tracing, analytics, or monitoring features.

### LEARN
**Meaning:** The system adapts based on feedback or patterns.
**Typical components:** Calibration engines, feedback systems, preference learning, A/B testing, recommendation tuning.
**Signals:** The app changes its behavior based on user feedback or observed patterns.

### ACT
**Meaning:** The system does things in the world.
**Typical components:** Tool registries, API clients, file operations, email senders, webhook dispatchers, cron jobs.
**Signals:** The app executes side effects — writes files, calls APIs, sends emails, triggers external systems.

### PROTECT
**Meaning:** The system enforces boundaries and safety.
**Typical components:** Auth middleware, RBAC, encryption, secure storage, rate limiters, input validation, CSRF protection.
**Signals:** The app has authentication, authorization, or security features.

### CONNECT
**Meaning:** The system integrates with external services.
**Typical components:** Plugin systems, gRPC/REST clients, OAuth flows, webhook receivers, bot integrations, import/export.
**Signals:** The app talks to third-party services, has a plugin architecture, or supports integrations.

### PRESENT
**Meaning:** The system renders UI for humans.
**Typical components:** Layout shells, routing, component libraries, style systems, theme engines, responsive breakpoints.
**Signals:** The app has a user-facing frontend.

### PERSIST
**Meaning:** The system stores data durably.
**Typical components:** Database managers, ORMs, migration systems, seed data, backup scripts, cache layers.
**Signals:** The app has a database, file storage, or persistent state.

### BUILD
**Meaning:** The system builds, tests, and ships itself.
**Typical components:** CI/CD workflows, Docker configs, build scripts, test suites, linters, release automation.
**Signals:** The project has CI/CD, Dockerfiles, or build scripts.

### THINK
**Meaning:** The system reasons about itself at a meta level.
**Typical components:** Skills, prompts, templates, knowledge artifacts, retrospectives, design documents.
**Signals:** The project has a meta-cognitive layer — skills, prompts, or structured thinking artifacts.

### ORCHESTRATE
**Meaning:** The system coordinates multi-step work.
**Typical components:** DAG engines, task queues, workflow managers, saga patterns, state machines.
**Signals:** The app decomposes complex tasks into sub-tasks and manages their execution.

---

## How to Assign Clusters

### Step 1: Walk the inventory

For each significant component found during the deep inventory (Phase 2), ask: **"What verb describes what this does?"**

Most components map clearly to one verb. Some map to two (cross-cluster). Very few map to three or more — if they do, the component may be doing too much.

### Step 2: Build the component table

For each cluster, create a table:

```markdown
| Component | Location | Status | LOC |
|-----------|----------|--------|-----|
| ChatContext | frontend/src/features/chat/contexts/ | Active | 1,434 |
| MessageList | frontend/src/components/chat/ | Active | ~2,000 |
```

### Step 3: Assess cluster health

After the table, write 2-3 lines:
- **Health:** Overall status with emoji (✅/🔄/⚠️/❌)
- **Audit Notes:** Key technical details, constraints, or risks

### Step 4: Identify cross-cluster components

Some components serve multiple clusters. List these in a separate table under the PRESENT cluster (since they're usually frontend components that bridge behavioral layers):

```markdown
| Component | Directory | Primary Cluster | Notes |
|-----------|-----------|----------------|-------|
| vision/ | components/vision/ | ACT | Image analysis via tool execution |
```

### Step 5: Identify backend-only integrations

Some backend services have no frontend counterpart. Note these explicitly so future developers know the UI gap is intentional (or a TODO).

---

## Creating New Verbs

If a component doesn't fit any of the 13 starter verbs, create a new one. Good custom verbs:

- **TRANSLATE** — For i18n-heavy apps
- **SIMULATE** — For apps with simulation engines
- **COMPOSE** — For content creation tools (editors, IDEs)
- **GOVERN** — For apps with complex compliance/policy systems
- **DISCOVER** — For search-heavy or recommendation apps

Bad custom verbs (too vague):
- MANAGE (manage what?)
- PROCESS (process what?)
- HANDLE (handle what?)

The verb should be specific enough that reading it tells you what the cluster *does*.

---

## Common Pitfalls

1. **Over-clustering:** Don't create 30 clusters for a 50-file project. If a cluster has only 1-2 components, merge it with a related cluster.

2. **Under-clustering:** Don't dump everything into "PRESENT" and "PERSIST". If a cluster has 20+ components, consider splitting it.

3. **Confusing location with behavior:** A file in `frontend/src/components/` isn't automatically in the PRESENT cluster. A dashboard component that displays traces belongs in OBSERVE.

4. **Ignoring test files:** Tests belong in BUILD, not in the cluster of the code they test. They're part of the build and verify pipeline.

5. **Forgetting infrastructure:** CI/CD, Docker, and deployment configs are real features of the system. They belong in BUILD.
