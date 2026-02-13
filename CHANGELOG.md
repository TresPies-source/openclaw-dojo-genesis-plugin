# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-12

### Added

- `/dojo init <name>` — create a new project with persistent state
- `/dojo status` — view active project phase, tracks, and recent activity
- `/dojo list` — list all projects with status indicators
- `/dojo switch <name>` — switch active project context
- `/dojo archive <name>` — archive a completed project
- `/dojo scout <tension>` — run a strategic scout to explore options before committing
- `/dojo spec <feature>` — write a release specification grounded in project context
- `/dojo tracks` — decompose a spec into parallel implementation tracks
- `/dojo commission` — generate implementation prompts from specs
- `/dojo retro` — run a structured retrospective and harvest learnings
- `/dojo run <skill>` — invoke any of 40 bundled skills by name
- `/dojo skills [category]` — browse available skills by category
- `dojo_get_context` tool — returns active project state for agent use
- `dojo_save_artifact` tool — saves markdown artifacts to project directory
- `dojo_update_state` tool — updates project phase, tracks, or decisions
- `before_agent_start` hook — injects project context and skill instructions into system prompt
- File-based state management at `~/.openclaw/dojo-genesis-plugin/`
- 40 bundled behavioral skills across 8 categories (pipeline, workflow, research, forge, garden, orchestration, system, tools)
- Dual-mode operation: skills work standalone and inside project orchestration
