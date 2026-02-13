# Dojo Genesis Plugin for OpenClaw

[![npm version](https://img.shields.io/npm/v/@openclaw/dojo-genesis-plugin.svg)](https://www.npmjs.com/package/@openclaw/dojo-genesis-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw Compatible](https://img.shields.io/badge/OpenClaw-2026.1.0+-blue.svg)](https://openclaw.dev)

Specification-driven development orchestration for OpenClaw — turn any channel into a development command center.

## What It Does

Dojo Genesis transforms OpenClaw into a specification-driven development orchestrator. It treats projects as first-class entities with explicit phases, parallel tracks, decision logs, and artifact management. The plugin bundles 40 behavioral skills across 8 categories, enabling strategic scouting, release specification, parallel track decomposition, implementation commissioning, and structured retrospectives. It works seamlessly on every OpenClaw channel — WhatsApp, Telegram, Slack, Discord, WebChat — bringing development discipline to wherever your team communicates.

## Quick Start

Install the plugin via OpenClaw CLI:

```bash
openclaw plugins install @openclaw/dojo-genesis-plugin
```

Add to your `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "dojo-genesis-plugin": {
        "enabled": true
      }
    }
  }
}
```

Restart the gateway:

```bash
openclaw restart
```

## Commands

| Command | Description |
|---------|-------------|
| `/dojo init <name>` | Create a new project |
| `/dojo status` | View active project state |
| `/dojo list` | List all projects |
| `/dojo switch <name>` | Switch active project |
| `/dojo archive <name>` | Archive a completed project |
| `/dojo scout <tension>` | Run a strategic scout |
| `/dojo spec <feature>` | Write a release specification |
| `/dojo tracks` | Decompose spec into parallel tracks |
| `/dojo commission` | Generate implementation prompts |
| `/dojo retro` | Run a structured retrospective |
| `/dojo run <skill>` | Invoke any bundled skill |
| `/dojo skills [category]` | Browse skills by category |

## Skills by Category

### Pipeline

Core development workflow skills (also available as shorthand commands):

- `strategic-scout` — Explore strategic tensions and scout multiple routes
- `release-specification` — Write a production-ready release specification
- `parallel-tracks` — Decompose specs into independent parallel tracks
- `implementation-prompt` — Generate structured implementation prompts
- `retrospective` — Reflect on what went well, what was hard, what to improve

### Workflow

Process integration and execution skills:

- `iterative-scouting` — Iterate scout cycles with reframes
- `strategic-to-tactical-workflow` — Full scout → spec → commission pipeline
- `pre-implementation-checklist` — Verify specs are ready before commissioning
- `context-ingestion` — Create plans grounded in uploaded files
- `frontend-from-backend` — Write frontend specs from backend architecture
- `spec-constellation-to-prompt-suite` — Convert multiple specs into coordinated prompts
- `planning-with-files` — Route file-based planning to specialized modes

### Research

Investigation and analysis skills:

- `research-modes` — Deep and wide research with structured approaches
- `research-synthesis` — Synthesize multiple sources into actionable insights
- `project-exploration` — Explore new projects to assess collaboration potential
- `era-architecture` — Architect multi-release eras with shared vocabulary
- `repo-context-sync` — Sync and extract context from repositories
- `documentation-audit` — Audit documentation for drift and accuracy
- `health-audit` — Comprehensive repository health check

### Forge

Skill creation and maintenance:

- `skill-creation` — Create new reusable skills
- `skill-maintenance` — Maintain skill health through systematic review
- `skill-audit-upgrade` — Audit and upgrade skills to quality standards
- `process-extraction` — Transform workflows into reusable skills

### Garden

Knowledge cultivation and memory management:

- `memory-garden` — Write structured memory entries for context management
- `seed-extraction` — Extract reusable patterns from experiences
- `seed-library` — Access and apply Dojo Seed Patches
- `compression-ritual` — Distill conversation history into memory artifacts
- `seed-to-skill-converter` — Elevate proven seeds into full skills

### Orchestration

Multi-agent coordination:

- `handoff-protocol` — Hand off work between agents cleanly
- `decision-propagation` — Propagate decisions across document ecosystem
- `workspace-navigation` — Navigate shared agent workspaces
- `agent-teaching` — Teach peers through shared practice

### System

Repository health and documentation:

- `semantic-clusters` — Map system capabilities with action-verb clusters
- `repo-status` — Generate comprehensive repo status documents
- `status-template` — Write status docs using 10-section template
- `status-writing` — Write and update STATUS.md files

### Tools

Specialized utilities:

- `patient-learning-protocol` — Learn at the pace of understanding
- `file-management` — Organize files and directories flexibly
- `product-positioning` — Reframe binary product decisions
- `multi-surface-strategy` — Design coherent multi-surface strategies

## Orchestration Tools

Dojo Genesis provides three agent tools for project state management:

- `dojo_get_context` — Returns the active project's current state, including phase, tracks, decisions, and artifact paths
- `dojo_save_artifact` — Saves outputs (specs, prompts, retro notes) to the project's directory structure
- `dojo_update_state` — Updates the project's phase, track status, or decision log

These tools enable agents to maintain continuity across conversations and channels.

## Configuration

The plugin stores project state in `~/.openclaw/dojo-genesis-plugin/` by default. You can customize this location:

```json
{
  "plugins": {
    "entries": {
      "dojo-genesis-plugin": {
        "enabled": true,
        "config": {
          "projectsDir": "custom-projects-directory"
        }
      }
    }
  }
}
```

Project directories contain:

- `project.json` — Current phase, tracks, decisions
- `specs/` — Release specifications
- `prompts/` — Implementation prompts
- `retros/` — Retrospective artifacts

## Development

Clone and build from source:

```bash
git clone https://github.com/TresPies-source/openclaw-dojo-genesis-plugin
cd openclaw-dojo-genesis-plugin
npm install
npm test
npm run build
```

Run tests with coverage:

```bash
npm run test:coverage
```

Typecheck without building:

```bash
npm run typecheck
```

## License

MIT License — see [LICENSE](LICENSE) for details.

For version history and release notes, see [CHANGELOG.md](CHANGELOG.md).
