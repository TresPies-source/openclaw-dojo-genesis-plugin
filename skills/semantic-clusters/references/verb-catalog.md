# Verb Catalog — Complete Reference

**Purpose:** Detailed definitions, typical components, signals, and examples for each of the 13 starter action verbs plus guidance on creating custom verbs.

---

## The 13 Starter Verbs

### CONVERSE
**Definition:** The system communicates with users in real-time through conversational interfaces.

**Typical components:**
- Chat UI components (message lists, input bars, bubbles)
- WebSocket or SSE handlers for real-time streaming
- Message models and serialization
- Command parsers and slash-command handlers
- Notification/toast systems for message delivery
- Typing indicators, read receipts, presence

**Signals you need this cluster:** The app has a chat, messaging, real-time communication, or conversational interface.

**Not CONVERSE:** A static contact form (that's PRESENT + ACT). Email sending (that's ACT). Push notifications (that's NOTIFY or ACT).

---

### REASON
**Definition:** The system thinks, plans, classifies, or makes autonomous decisions.

**Typical components:**
- AI agents and assistants
- Intent classifiers and NLU pipelines
- Orchestration engines and planners
- Rule engines and decision trees
- Recommendation algorithms
- Response caching and deduplication

**Signals:** The app has an AI agent, automated planning, intent classification, or autonomous decision-making that goes beyond simple if/else logic.

**Not REASON:** A form validation rule (that's PROTECT). A simple switch/case router (that's ACT). A user-configured filter (that's PRESENT).

---

### REMEMBER
**Definition:** The system stores and recalls knowledge over time, beyond simple data persistence.

**Typical components:**
- Memory managers with multi-tier storage
- Vector embeddings and semantic search
- Knowledge base systems
- Seed/snippet/template libraries
- Compression and summarization services
- Context builders that assemble relevant memory

**Signals:** The app has a memory, knowledge base, or learning component that persists across sessions and influences future behavior. Distinct from PERSIST, which is raw data storage.

**Not REMEMBER:** A database table (that's PERSIST). A user preferences file (that's LEARN or PERSIST). A cache layer (that's PERSIST or ACT).

**REMEMBER vs PERSIST:** PERSIST stores data. REMEMBER stores *knowledge* — data with semantic meaning, retrieval by relevance, and influence on system behavior. If the system just saves and loads rows, that's PERSIST. If it embeds, searches by similarity, compresses, and builds context from memories, that's REMEMBER.

---

### OBSERVE
**Definition:** The system watches itself and reports what it sees — monitoring, tracing, and metrics.

**Typical components:**
- Trace loggers and span trackers
- Cost calculators and budget trackers
- Event buses and event sourcing
- Metrics collectors and dashboards
- Audit logs and activity feeds
- Health check endpoints

**Signals:** The app has logging, tracing, analytics, monitoring, or cost-tracking features. Any form of self-awareness about its own behavior.

**Not OBSERVE:** Application error handling (that's PROTECT). User analytics (that could be OBSERVE or a custom DISCOVER/ANALYZE verb depending on depth).

---

### LEARN
**Definition:** The system adapts its behavior based on feedback, patterns, or observations.

**Typical components:**
- Calibration engines
- Feedback collection and processing
- Preference systems (user and system)
- Pattern learners and trend detectors
- A/B testing frameworks
- Recommendation tuning

**Signals:** The system changes its behavior over time based on user feedback, observed patterns, or calibration. Not just storing preferences (that's PERSIST) — actually using them to modify behavior.

**LEARN vs REMEMBER:** REMEMBER stores knowledge for retrieval. LEARN changes behavior based on feedback. A system that remembers your name is REMEMBER. A system that learns to give shorter answers because you prefer conciseness is LEARN.

---

### ACT
**Definition:** The system executes side effects — doing things in the world beyond its own boundaries.

**Typical components:**
- Tool registries and tool execution engines
- File operations (read, write, search)
- API client calls to external services
- Email/SMS/notification sending
- Webhook dispatching
- Cron jobs and scheduled tasks
- Code execution sandboxes

**Signals:** The app executes side effects — writes files, calls external APIs, sends communications, triggers external systems.

**Not ACT:** Reading data from a database (that's PERSIST). Rendering UI (that's PRESENT). Internal event emission (that's OBSERVE).

---

### PROTECT
**Definition:** The system enforces boundaries, safety, and security constraints.

**Typical components:**
- Authentication middleware (JWT, OAuth, sessions)
- Authorization and RBAC
- Encryption services (at rest and in transit)
- Secure storage (keychains, vaults)
- Rate limiters and throttling
- Input validation and sanitization
- CSRF/XSS protection
- Budget enforcement and spending limits

**Signals:** The app has authentication, authorization, encryption, rate limiting, or any form of boundary enforcement.

---

### CONNECT
**Definition:** The system integrates with external services and platforms.

**Typical components:**
- Plugin architectures (gRPC, IPC, WASM)
- OAuth flows and token management
- Webhook receivers
- Bot integrations (Slack, Telegram, Discord)
- Import/export services
- Third-party SDK wrappers

**Signals:** The app talks to third-party services, has a plugin system, or supports integrations.

**CONNECT vs ACT:** ACT is about executing a side effect (sending an email, calling an API). CONNECT is about the *infrastructure* for integration — the plugin system, the OAuth flow, the webhook receiver. If you're building a Telegram bot integration, the bot framework is CONNECT; sending a specific message through it is ACT.

---

### PRESENT
**Definition:** The system renders user interfaces for human interaction.

**Typical components:**
- Layout shells and responsive containers
- Routing configurations
- Component libraries
- Style systems and themes
- Sidebar/panel/drawer management
- Form components and interactive controls

**Signals:** The app has a user-facing frontend — web, mobile, or desktop.

**Caveat:** Not every frontend component is PRESENT. A dashboard showing traces is OBSERVE. A settings page managing API keys is PROTECT. Let the *purpose* of the component determine the cluster, not its location in the frontend directory.

---

### PERSIST
**Definition:** The system stores data durably and reliably.

**Typical components:**
- Database managers and connection pools
- ORMs and query builders
- Migration systems (schema evolution)
- Seed data and fixtures
- Backup and restore scripts
- Cache layers (Redis, in-memory)
- File storage services

**Signals:** The app has a database, file storage, or any form of durable state.

---

### BUILD
**Definition:** The system builds, tests, and ships itself.

**Typical components:**
- CI/CD workflows (GitHub Actions, Jenkins, CircleCI)
- Docker configurations
- Build scripts and Makefiles
- Test suites (unit, integration, e2e)
- Linters and formatters
- Release automation
- Storybook or component playgrounds
- Performance benchmarks

**Signals:** The project has CI/CD, Docker, build scripts, or test infrastructure.

---

### THINK
**Definition:** The system reasons about itself at a meta level — meta-cognition.

**Typical components:**
- Skills and prompt libraries
- Knowledge artifacts and compressions
- Retrospectives and lessons learned
- Design documents and architectural decision records
- Template libraries for common tasks

**Signals:** The project has a meta-cognitive layer — skills, prompts, structured thinking artifacts, or self-reflective documentation that influences how the system is built and maintained.

**Not THINK:** A README (that's documentation, part of BUILD). API documentation (that's BUILD). THINK is specifically about meta-cognition — the system's knowledge about how to work on itself.

---

### ORCHESTRATE
**Definition:** The system coordinates multi-step, potentially parallel work.

**Typical components:**
- DAG engines and workflow managers
- Task queue systems
- Saga patterns and compensating transactions
- State machines for complex flows
- Parallel execution coordinators
- Circuit breakers and retry logic

**Signals:** The app decomposes complex tasks into sub-tasks and manages their execution, potentially in parallel with dependency tracking.

**ORCHESTRATE vs REASON:** REASON decides *what* to do. ORCHESTRATE manages *how* to execute it across multiple steps. An intent classifier is REASON. A DAG engine that runs 5 tasks in parallel with dependency ordering is ORCHESTRATE.

---

## Creating Custom Verbs

When the 13 starters don't cover your system, create new verbs.

### Process

1. **Identify the gap.** You have components that don't fit any existing cluster.
2. **Name the behavior.** What do these orphan components *do*? Use a single, active verb.
3. **Test the name.** Can someone unfamiliar with the project guess what components belong in this cluster? If not, try a different verb.
4. **Pick an emoji.** Visual distinctiveness helps scanning.
5. **Write a one-sentence definition.** Same format as the starters above.

### Good Custom Verbs

| Verb | Emoji | Use When |
|------|-------|----------|
| TRANSLATE | 🌐 | i18n, multi-language, localization is a core feature |
| SIMULATE | 🧪 | Physics engines, digital twins, what-if scenarios |
| COMPOSE | ✏️ | Rich text editors, content creation tools |
| GOVERN | ⚖️ | Compliance, approval workflows, policy engines |
| DISCOVER | 🔍 | Search, exploration, recommendation discovery |
| TRANSFORM | 🔄 | Data pipelines, ETL, media conversion |
| SCHEDULE | 📅 | Booking systems, calendar management, cron |
| NOTIFY | 🔔 | Notification delivery as a core capability (beyond ACT) |
| RENDER | 🖼️ | 3D rendering, video processing, image generation |
| MEASURE | 📊 | Measurement/sensor systems (beyond OBSERVE) |

### Verbs to Avoid

| Bad Verb | Why | Better Alternative |
|----------|-----|-------------------|
| MANAGE | Too vague — manage what? | Use the specific behavior verb |
| PROCESS | Too vague — process what? | TRANSFORM, ANALYZE, CONVERT |
| HANDLE | Too vague — handle what? | Name the specific handling |
| DO | Everything "does" something | Not a useful cluster name |
| RUN | Same as DO | EXECUTE, ORCHESTRATE, or ACT |
| WORK | Meaningless | Name the specific work |
