---
name: file-management
description: Apply flexible principles and patterns for intuitive file organization adapted to project context. Use when starting new projects or refactoring disorganized structures. Trigger phrases: "organize this project structure", "plan a file layout", "design a directory hierarchy", "improve folder organization", "create a project structure".
---

> **OpenClaw Integration:** This skill is invoked by the Dojo Genesis plugin via `/dojo run file-management`.
> The agent receives project context automatically via the `before_agent_start` hook.
> Use `dojo_get_context` for full state, `dojo_save_artifact` to persist outputs,
> and `dojo_update_state` to record phase transitions and decisions.

# File Management & Organization Skill

**Version:** 1.0  
**Created:** 2026-02-04  
**Author:** Manus AI  
**Purpose:** To provide a set of flexible principles and recommended patterns for file and directory organization, adaptable to diverse project environments.

---

## I. The Philosophy: A Place for Everything, and Everything in Its Place

Good file organization is not about rigid, universal rules. It is about creating a system where the location of a file is intuitive and predictable within the context of its own project. A well-organized project is a pleasure to work in; a chaotic one is a source of constant friction.

This skill provides a set of guiding principles, not a strict mandate. It is a flexible framework that can be adapted to the unique needs of any project, from a simple static website to a complex multi-service application. The goal is to create a sense of order and clarity that makes the project easier to understand, navigate, and maintain.

---

## II. When to Use This Skill

-   **When starting a new project:** Use these principles to establish a clean and logical directory structure from the outset.
-   **When a project feels disorganized:** Use this skill to guide a refactoring of the existing file structure.
-   **When onboarding a new team member or agent:** Use this as a guide to explain the project's organizational philosophy.

---

## III. Core Principles

1.  **Group by Feature or Domain:** Whenever possible, group files related to a single feature or domain together. This is often preferable to grouping by file type (e.g., all controllers in one directory, all models in another).

2.  **Separate Public from Private:** Keep the public interface of a module or service separate from its internal implementation details.

3.  **Keep the Root Directory Clean:** The root of your project should be as clean as possible, containing only essential configuration files, the main entry point, and a few key directories.

4.  **Use a Consistent Naming Convention:** Choose a naming convention (e.g., `kebab-case`, `snake_case`, `PascalCase`) for your files and directories and stick to it.

5.  **Document Your Structure:** A project's `README.md` or `ARCHITECTURE.md` should briefly explain the organizational philosophy of the project.

---

## IV. Recommended Patterns

These are flexible patterns that can be adapted to different environments.

### 1. The Generic Web Application

This is a good starting point for many web applications.

```
/
├── public/             # Static assets (images, fonts, etc.)
├── src/                # Source code
│   ├── api/            # Backend API handlers/controllers
│   ├── components/     # Reusable UI components
│   ├── lib/            # Shared libraries, utilities, and helpers
│   ├── pages/          # Page-level components (if using a framework like Next.js)
│   ├── services/       # Business logic and external API clients
│   └── styles/         # Global styles
├── tests/              # Tests
├── .env                # Environment variables
├── .gitignore
├── package.json
└── README.md
```

### 2. The AROMA-style Contemplative Repository

This pattern is optimized for knowledge bases and contemplative practice repositories.

```
/
├── seeds/              # Reusable patterns of thinking
├── thinking/           # Philosophical reflections and insights
├── conversations/      # Summaries of key discussions
├── docs/               # Formal documentation (specifications, retrospectives)
├── SKILLS/             # Reusable workflow skills
├── prompts/            # Prompts for other agents (e.g., implementation agents)
├── .gitignore
└── README.md
```

### 3. The Go Backend Service

A common structure for a Go backend service.

```
/
├── cmd/                # Main application entry points
│   └── api/            # The main API server
├── internal/           # Private application and library code
│   ├── handlers/       # HTTP request handlers
│   ├── models/         # Database models
│   └── store/          # Database access layer
├── pkg/                # Public library code (if any)
├── .gitignore
├── go.mod
└── README.md
```

---

## V. Best Practices

-   **Don't Over-Organize:** A flat structure is often better than a deeply nested one, especially in the early stages of a project.
-   **Be Pragmatic:** The best structure is the one that works for your team and your project. Don't be afraid to deviate from these patterns if you have a good reason.
-   **Refactor as You Go:** A project's file structure is not set in stone. As the project evolves, don't be afraid to refactor the file structure to better reflect the current state of the codebase.
-   **Consistency is Key:** Whatever structure you choose, be consistent. An inconsistent structure is often worse than no structure at all.
---

## OpenClaw Tool Integration

When running inside the Dojo Genesis plugin:

1. **Start** by calling `dojo_get_context` to retrieve full project state, history, and artifacts
2. **During** the skill, follow the workflow steps documented above
3. **Save** outputs using `dojo_save_artifact` with the `artifacts` output directory
4. **Update** project state by calling `dojo_update_state` to record skill completion and any phase transitions

