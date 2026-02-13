# File Hierarchy Patterns in 11-11 and Dojo Genesis Repos

This document describes the common file organization patterns found in the 11-11 and Dojo Genesis repositories, based on the "Planning with Files" philosophy.

## Core Philosophy: Planning with Files

The filesystem is the absolute source of truth. All plans, specifications, prompts, logs, and artifacts are stored as human-readable files in a well-defined hierarchy. This ensures the system remains inspectable, debuggable, and version-controllable.

## Standard Directory Structure

### `/00_Roadmap/`
**Purpose:** High-level goals and strategic planning

**Common Files:**
- `task_plan.md` - Current task breakdown and priorities
- `vision.md` - Long-term vision and goals
- `milestones.md` - Key milestones and deadlines

**When to Read:** When understanding project direction, priorities, or long-term strategy

### `/01_PRDs/`
**Purpose:** Product Requirement Documents

**Common Files:**
- `{feature_name}_prd.md` - Detailed product requirements for specific features
- `core_features.md` - Overview of core product features

**Naming Convention:** Lowercase with underscores, descriptive names
**When to Read:** When implementing new features or understanding product scope

### `/02_Specs/`
**Purpose:** Technical specifications and architecture

**Common Files:**
- `architecture.md` - System architecture overview
- `api_spec.md` - API design and endpoints
- `database_schema.md` - Database structure
- `{component}_spec.md` - Component-specific technical specs

**When to Read:** When implementing technical features, refactoring, or understanding system design

### `/03_Prompts/`
**Purpose:** Local prompt library (reusable AI prompts)

**Common Files:**
- Individual prompt files with `.md` extension
- `index.md` - Catalog of available prompts

**Metadata Pattern:**
```markdown
---
public: true/false
version: 1.0
tags: [tag1, tag2]
---
```

**When to Read:** When crafting new prompts or looking for reusable patterns

### `/04_System/`
**Purpose:** AI Personas and system prompts

**Common Files:**
- `dojo_agent.md` - Dojo agent persona and instructions
- `supervisor_agent.md` - Supervisor routing logic
- `librarian_agent.md` - Librarian search and retrieval
- `builder_agent.md` - Code generation agent

**When to Read:** When understanding agent behavior, routing logic, or system-level instructions

### `/05_Logs/`
**Purpose:** Development traces, journals, and audit logs

**Common Files:**
- `JOURNAL.md` - Development journal and notes
- `AUDIT_LOG.md` - Audit trail of key decisions
- `trace_{timestamp}.json` - Harness trace logs
- `session_{id}.md` - Session summaries

**When to Read:** When debugging, understanding historical decisions, or tracking changes

## File Naming Conventions

### General Rules
- **Lowercase with underscores:** `task_plan.md`, not `TaskPlan.md` or `task-plan.md`
- **Descriptive names:** `agent_routing_spec.md`, not `spec1.md`
- **Consistent extensions:** `.md` for documentation, `.json` for structured data

### Versioning Pattern
- Append version to filename when maintaining multiple versions: `api_spec_v1.md`, `api_spec_v2.md`
- Use `_draft` suffix for work-in-progress: `architecture_draft.md`

### Timestamps
- Use ISO 8601 format: `trace_2026-01-28T17-48-00.json`
- For logs and traces, timestamp in filename helps with chronological sorting

## Metadata Patterns

### Frontmatter (YAML)
Many markdown files include YAML frontmatter for metadata:

```markdown
---
title: "Feature Name"
author: "Manus AI"
date: "2026-01-28"
status: "draft" | "final" | "archived"
version: "1.0"
public: true | false
tags: ["tag1", "tag2"]
---
```

### Public Flag
- `public: true` - Can be shared in Commons (Wikipedia of Prompts)
- `public: false` - Private to project

## Integration with Hybrid Storage

### Google Drive
- Used for personal, "calm" work
- Roadmaps, PRDs, documentation
- Synced via Google Drive API

### GitHub
- Used for collaborative, version-controlled development
- Code, prompts, specs
- Synced via Octokit (GitHub API)

## Common Patterns When Reading Repos

### 1. Start with Roadmap
Always check `/00_Roadmap/task_plan.md` first to understand current priorities

### 2. Check Specs for Technical Context
Read relevant files in `/02_Specs/` to understand architecture before making changes

### 3. Review System Prompts for Agent Behavior
Check `/04_System/` to understand how agents should behave

### 4. Look for Existing Patterns in Prompts
Browse `/03_Prompts/` to find reusable patterns before creating new ones

### 5. Consult Logs for Historical Context
Check `/05_Logs/JOURNAL.md` to understand recent decisions and changes

## Zenflow Integration

When working with Zenflow, these directories map to workflow artifacts:

- **Zenflow `plan.md`** → Similar to `/00_Roadmap/task_plan.md`
- **Zenflow `spec.md`** → Similar to `/02_Specs/{feature}_spec.md`
- **Zenflow `implementation.md`** → Detailed implementation notes

Zenflow tasks run in isolated worktrees under `.zenflow/tasks/{task_id}/`, but should follow the same file hierarchy patterns for consistency.

## Best Practices

### When Syncing Repos
1. **Identify relevant directories first** - Don't clone everything
2. **Check for numbered directories** (`00_`, `01_`, etc.) - These follow the standard pattern
3. **Look for `index.md` or `README.md`** - Often provide navigation guides
4. **Read frontmatter** - Metadata tells you status, version, and visibility

### When Writing New Files
1. **Follow the hierarchy** - Put files in the appropriate numbered directory
2. **Use consistent naming** - Lowercase with underscores
3. **Add frontmatter** - Include status, version, and public flag
4. **Update indexes** - If there's an `index.md`, add your new file to it

### When Refactoring
1. **Preserve the hierarchy** - Don't break the numbered directory structure
2. **Update related files** - If you change a spec, update the corresponding PRD
3. **Archive, don't delete** - Move old versions to `/05_Logs/archived/` instead of deleting

## Quick Reference: What to Read When

| Task | Directories to Check |
|------|---------------------|
| Understanding project goals | `/00_Roadmap/` |
| Implementing new feature | `/01_PRDs/`, `/02_Specs/` |
| Refactoring architecture | `/02_Specs/`, `/05_Logs/` |
| Writing Zenflow prompt | `/02_Specs/`, `/03_Prompts/` |
| Understanding agent behavior | `/04_System/` |
| Debugging issues | `/05_Logs/`, `/02_Specs/` |
| Finding reusable patterns | `/03_Prompts/` |
