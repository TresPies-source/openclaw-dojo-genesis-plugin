---
name: documentation-audit
description: Audit project documentation to identify and correct drift, ensuring all documents are accurate and reflect current codebase state. Use when documentation feels stale, after major releases, before onboarding new team members, or to combat documentation drift. Trigger phrases: 'docs seem out of date', 'audit the documentation', 'is the README accurate', 'check for broken links and outdated info', 'review docs for accuracy'.
---

> **OpenClaw Integration:** This skill is invoked by the Dojo Genesis plugin via `/dojo run documentation-audit`.
> The agent receives project context automatically via the `before_agent_start` hook.
> Use `dojo_get_context` for full state, `dojo_save_artifact` to persist outputs,
> and `dojo_update_state` to record phase transitions and decisions.

# Documentation Auditor Skill

**Version:** 1.0  
**Created:** 2026-02-04  
**Author:** Manus AI  
**Purpose:** To provide a structured, repeatable process for auditing project documentation, combating "documentation drift" and ensuring all documents remain a reliable source of truth.

---

## I. The Philosophy: Tending the Garden of Knowledge

Project documentation is a garden. When tended with care, it is a source of clarity, guidance, and shared understanding. When neglected, it becomes overgrown with outdated information, broken links, and misleading instructions—a phenomenon known as **documentation drift**. This drift erodes trust and creates confusion.

The Documentation Auditor skill is the practice of **tending the garden**. It is a recurring ritual where we mindfully walk through our documentation, pulling the weeds of inaccuracy and pruning the branches of irrelevance. It is an act of stewardship, ensuring that our shared garden of knowledge remains a welcoming and reliable resource for all agents and collaborators.

---

## II. When to Use This Skill

-   **After a major release:** To ensure all documentation reflects the new features and changes.
-   **Before a new team member or agent is onboarded:** To ensure they are given accurate information.
-   **As a scheduled, recurring task:** (e.g., on the first day of each month) to maintain a regular cadence of review.
-   **When you have a feeling that the documentation is out of sync with the code.**

---

## III. The Audit Workflow

### Step 1: Initiate the Audit

Announce the intention to perform a documentation audit. Define the scope of the audit (e.g., "a full audit of the Dojo Genesis repo" or "a targeted audit of the AROMA README").

### Step 2: Create an Audit Log

Create a new markdown file to log the findings of the audit (e.g., `docs/audits/2026-02-04_documentation_audit.md`). Use the template from Section IV.

### Step 3: Systematically Review Each Document

Using the checklist in Section V, go through each key document in the repository. For each document, check for:

-   **Accuracy:** Does the information reflect the current state of the code?
-   **Completeness:** Is anything missing?
-   **Clarity:** Is the language clear, concise, and easy to understand?
-   **Broken Links:** Do all internal and external links still work?

For each issue found, create an entry in the audit log.

### Step 4: Prioritize and Address the Issues

Once the review is complete, review the audit log and prioritize the issues. Address the high-priority issues immediately by creating pull requests to update the documentation.

### Step 5: Commit and Share the Findings

Commit the audit log and all documentation fixes to the repository. Share a summary of the findings, highlighting the key improvements made.

---

## IV. Audit Log Template

```markdown
# Documentation Audit: [Project Name]

**Date:** [YYYY-MM-DD]
**Auditor:** [Your Name]
**Scope:** [e.g., Full repository audit]

---

## Audit Findings

| File | Line(s) | Issue | Severity | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| `README.md` | 25-30 | The installation instructions are outdated and refer to a deprecated package. | High | Updated instructions in PR #123. |
| `docs/ARCHITECTURE.md` | 45 | The diagram does not include the new caching service. | Medium | Created issue #124 to update the diagram. |
| `CONTRIBUTING.md` | - | The link to the code of conduct is broken. | High | Fixed link in PR #125. |
| `SKILLS/retrospective.md` | 15 | A typo in the philosophy section. | Low | Corrected typo in PR #126. |

---

## Summary

-   **Total Issues Found:** [Number]
-   **Issues Resolved:** [Number]
-   **New Issues Created:** [Number]

[A brief summary of the overall health of the documentation and any recurring themes that were identified.]
```

---

## V. Core Documentation Checklist

**`README.md`**
-   [ ] Is the project purpose clear?
-   [ ] Are the installation and quickstart instructions accurate and functional?
-   [ ] Does it link to other key documents (e.g., `CONTRIBUTING.md`, `ARCHITECTURE.md`)?
-   [ ] Is the status badge (if any) correct?

**`CONTRIBUTING.md`**
-   [ ] Are the guidelines for contributing clear?
-   [ ] Is the process for submitting a pull request well-defined?
-   [ ] Does it link to the code of conduct?

**`ARCHITECTURE.md`**
-   [ ] Does the high-level overview reflect the current system architecture?
-   [ ] Are all major components and their interactions documented?
-   [ ] Are diagrams up-to-date?

**`docs/` Directory**
-   [ ] Are all specifications for past releases present?
-   [ ] Are all retrospective documents present?
-   [ ] Is there any outdated information in the guides or tutorials?

**`SKILLS/` Directory**
-   [ ] Does each skill have a clear `SKILL.md` file?
-   [ ] Is the description and purpose of each skill accurate?

---

## VI. Best Practices

-   **Audit in Small, Regular Batches:** It is less daunting to audit one section of the documentation each week than to audit the entire repository once a year.
-   **Automate Where Possible:** Use tools like `lychee` to check for broken links automatically.
-   **Link, Don't Copy:** When information needs to exist in multiple places, link to a single source of truth rather than copying and pasting it. This makes updates much easier.
-   **Every Fix is a Good Fix:** Even fixing a small typo improves the quality of the garden.
---

## OpenClaw Tool Integration

When running inside the Dojo Genesis plugin:

1. **Start** by calling `dojo_get_context` to retrieve full project state, history, and artifacts
2. **During** the skill, follow the workflow steps documented above
3. **Save** outputs using `dojo_save_artifact` with the `artifacts` output directory
4. **Update** project state by calling `dojo_update_state` to record skill completion and any phase transitions

