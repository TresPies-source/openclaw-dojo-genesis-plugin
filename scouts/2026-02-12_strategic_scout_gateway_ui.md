# Strategic Scout: Gateway UI for the ClawHub Plugin

**Date:** 2026-02-12
**Tension:** The richness of what Dojo Genesis orchestration needs to show vs. the constraints of what OpenClaw's channels can show.
**Scope:** `@openclaw/dojo-genesis` ClawHub plugin — NOT the dojo-genesis Tauri desktop shell.

---

## Context

The `@openclaw/dojo-genesis` plugin (ARCHITECTURE.md v0.3.1) provides specification-driven development orchestration through OpenClaw. Users interact via `/dojo` commands and 44 skills across multi-channel chat (WhatsApp, Telegram, Slack, Discord, WebChat).

The orchestration workflow involves multi-phase projects, parallel tracks with dependencies, specification documents, state transitions, decision logs, and artifact outputs. This is fundamentally a *dashboard* experience — timelines, status boards, document trees. But the primary interaction surface is *chat*.

OpenClaw does have a richer surface: **Canvas (A2UI)** — a separate WebView server (port 18793) where the agent pushes interactive HTML. A2UI supports declarative interactive elements (`a2ui-component`, `a2ui-action`, `a2ui-param-*`) that send action events back to the agent. But Canvas is node-dependent — available on WebChat, macOS, Windows, iOS/Android nodes — not on WhatsApp/Telegram/Slack directly.

---

## Routes Explored

| | Pure Chat | Canvas Dashboard | Chat + Artifacts | Companion Web App | Hybrid Chat-Canvas |
|---|---|---|---|---|---|
| **Thesis** | The orchestration experience IS the conversation. No visual dashboard needed — chat is the dashboard. | Canvas (A2UI) as a persistent project dashboard. Agent pushes interactive HTML on every state change. | Chat for commands. Agent saves specs, scouts, retros as downloadable artifact files. | Standalone web app at localhost:18794 reading from `~/.openclaw/dojo-genesis/` state files. | Chat for quick interactions. Canvas activates for complex views only when needed. |
| **Risk** | Complex state (5 tracks, 44 skills, phase transitions) becomes walls of text. Can't *see* the project. | Canvas is node-dependent. Ties experience to desktop/web only. A2UI is v0.8 — young API. | Artifacts live outside conversation. Context-switching between chat and file viewer. No real-time dashboard. | Separate codebase, maintenance, auth. Plugin becomes two products. | Complexity in deciding when to escalate from chat to Canvas. Two rendering paths. |
| **Impact** | Works on ALL channels. Zero dependencies. Fastest to build. | Full visual orchestration — Kanban boards, dependency graphs, spec previews. Richest experience. | Tangible outputs users can share, version, reference. Specs become real documents. | Full UI control. Could match Tauri shell quality. Independent of OpenClaw's UI limits. | Best of both worlds. Degrades gracefully across channels. |
| **Optimizes for** | Universality, simplicity, speed to ship | Visual richness, interactive orchestration | Tangible outputs, document-centric workflow | UI control, product independence | Adaptive UX, graceful degradation |
| **Sacrifices** | Visual richness, spatial overview | Channel universality, mobile users | Real-time awareness, spatial overview | Simplicity, single-product identity | Simplicity — two rendering paths |

---

## What Each Route Is Uniquely Good At

| Route | Unique Contribution |
|---|---|
| **Pure Chat** | Universality is non-negotiable. If it doesn't work in text, it doesn't work. |
| **Canvas Dashboard** | Complex state needs spatial representation. You can't *see* 5 parallel tracks in a text message. |
| **Chat + Artifacts** | The workflow produces *documents*. Specs, scouts, retros should outlive the conversation as files. |
| **Companion Web App** | File-based state enables a standalone UI later without changing the plugin. The escape hatch exists. |
| **Hybrid Chat-Canvas** | The UI should escalate based on complexity, not force one mode. Progressive enhancement. |

---

## Synthesized Direction: "Three Surfaces, One Experience"

A progressive orchestration UI that layers three rendering surfaces. Each is independently useful. Each adds richness when available. A user on WhatsApp gets a complete experience. A user on WebChat with Canvas gets a richer one. Nobody gets a broken one.

### Surface 1: Chat (Base Layer — All Channels)

Every interaction starts and ends in chat. All `/dojo` commands work here. This is the universal floor.

**Renders:**
- `/dojo status` → Formatted markdown: current phase, active track, recent activity, next action
- `/dojo list` → Project table with phase indicators
- `/dojo init`, `/dojo switch`, `/dojo archive` → Confirmation with state summaries
- Skill outputs (scout, spec, retro) → Conversational summaries with key decisions

**Design principle:** Chat output is *complete* — not a teaser that says "open Canvas for more." A user who never leaves chat is fully productive.

### Surface 2: Artifacts (Document Layer — File System)

The workflow produces real documents, saved to the project directory.

**Produces:**
- `project/scouts/[date]_[topic].md` — Strategic scouts
- `project/specs/[version]_specification.md` — Release specifications
- `project/prompts/track_[n]_prompt.md` — Implementation prompts
- `project/retros/[date]_retrospective.md` — Retrospectives
- `project/decisions.md` — Append-only decision log

**Integration with chat:** When a skill produces an artifact, chat response includes summary + file path. Agent calls `dojo_save_artifact` to persist.

### Surface 3: Canvas (Visual Layer — When Available)

When OpenClaw Canvas (A2UI) is available, the plugin pushes interactive HTML for complex state.

**Renders:**
- **Project dashboard** — Phase indicator, track status cards, recent decisions, next actions
- **Track board** — Parallel tracks with progress bars, dependencies, status
- **Specification viewer** — Rendered spec markdown with section navigation
- **Retrospective timeline** — Visual timeline of sprint events

**Activation:** Canvas supplements chat, never replaces it. `/dojo status` with Canvas available → pushes dashboard to Canvas AND returns text summary to chat. Without Canvas → text summary only.

**A2UI interaction:** Track cards use `a2ui-action="switch-track"` + `a2ui-param-id="track-b"`. Clicking sends an action event to the agent, which updates state and refreshes Canvas. Common actions become clickable, not typed.

### The Escape Hatch (Designed For, Not Built)

If Canvas proves insufficient, architecture allows a future Surface 4: standalone web app reading from `~/.openclaw/dojo-genesis/` state files. File-based state (ARCHITECTURE.md Q6) makes this possible without changing the plugin.

---

## Implementation Phasing

| Phase | Surface | Scope | Rationale |
|---|---|---|---|
| **Phase 1** | Chat | All commands return well-formatted markdown. All skills produce chat-appropriate summaries. | Launch experience. Must be complete standalone. |
| **Phase 2** | Artifacts | `dojo_save_artifact` persists to project directories. Chat responses link to files. | Makes the plugin produce *real work*. Without artifacts, it's a chatbot. |
| **Phase 3** | Canvas | Dashboard, track board, spec viewer. A2UI interactions. | Visual upgrade. Makes it *feel* like a product. |

---

## Next Steps

1. **Define the chat output contract** — for each `/dojo` command and each of the 5 core skills, specify exactly what the markdown output looks like. This is the design work for Surface 1.

2. **Design the artifact directory structure** — formalize the file layout under `~/.openclaw/dojo-genesis/projects/[id]/`. This is partially in ARCHITECTURE.md but needs artifact-specific expansion.

3. **Prototype the Canvas dashboard** — build a single HTML page (the project dashboard) that renders from a `state.json` file. Test it in OpenClaw Canvas to validate A2UI interactions work as expected.

4. **Update ARCHITECTURE.md** — add a "UI Architecture" section documenting the three-surface model and the progressive enhancement principle.

5. **Evaluate A2UI v0.8 constraints** — build a minimal A2UI prototype to validate that interactive elements (buttons, track cards) work reliably. The API is young — confirm before designing around it.

---

## Open Questions

- **Canvas HTML templating:** Should the plugin ship pre-built HTML templates for each Canvas view, or generate HTML dynamically from state? Templates are faster but less flexible. Dynamic is flexible but more code.

- **A2UI event handling:** How does the plugin receive A2UI action events? Does the Canvas server forward them as tool calls to the agent (per the architecture docs), or is there a direct plugin hook?

- **Cross-channel state visibility:** If a user pushes a Canvas dashboard on WebChat, then switches to WhatsApp, can they reference the dashboard? Or is each channel session isolated?

- **Artifact format:** Should artifacts be pure markdown (universal, simple) or HTML (richer, but harder to edit manually)? Markdown is more aligned with the text-first philosophy.

---

## Sources

- [OpenClaw Canvas / A2UI Architecture](https://ppaolo.substack.com/p/openclaw-system-architecture-overview)
- [OpenClaw Control UI Documentation](https://docs.openclaw.ai/web/control-ui)
- [OpenClaw Nodes Documentation](https://docs.openclaw.ai/nodes)
- [OpenClaw Skills Documentation](https://docs.openclaw.ai/tools/skills)
- [OpenClaw Command Reference (DeepWiki)](https://deepwiki.com/openclaw/openclaw/9.1-command-reference)
- [ClawHub Plugin ARCHITECTURE.md v0.3.1](ARCHITECTURE.md)
