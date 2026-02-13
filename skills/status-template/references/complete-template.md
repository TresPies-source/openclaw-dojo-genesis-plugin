# Complete .status.md Template

**Purpose:** Copy this template and fill in every section. Delete all HTML comments and placeholders before saving.

---

```markdown
# [Project Name] — Comprehensive System Status

**Author:** [Who generated this]
**Status:** [Active & Evolving | On Hold | Complete]
**Last Updated:** [YYYY-MM-DD]
**Methodology:** status-template skill (status-writing + file-management + health-audit)

---

## 1. Vision & Purpose

> [One compelling sentence capturing what this project is and why it exists.]

**Core Principles:** [3-5 comma-separated principles, e.g., Privacy-first, Observable, Adaptive]

---

## 2. Current State

| Area | Status | Notes |
| :--- | :--- | :--- |
| **[Major Area 1]** | [emoji] | [Brief note] |
| **[Major Area 2]** | [emoji] | [Brief note] |
| **[Major Area 3]** | [emoji] | [Brief note] |

**Status Key:**
- ✅ **Complete/Healthy:** Done and verified.
- 🔄 **In Progress:** Actively being worked on.
- ⏸️ **Paused:** Intentionally on hold.
- ⚠️ **Concern:** Needs attention but not blocking.
- ❌ **Blocked/Critical:** Halted or failing.

---

## 3. Directory Structure & Folder Status

```
project-root/                          [emoji] [short note]
├── [dir1]/                            [emoji] [note]
│   ├── [subdir1]/                     [emoji] [note]
│   └── [subdir2]/                     [emoji] [note]
├── [dir2]/                            [emoji] [note]
│   └── [subdir]/                      [emoji] [note]
├── [file1.ext]                        [emoji] [note]
└── [file2.ext]                        [emoji] [note]
```

---

## 4. Semantic Action-Verb Clusters

<!-- Use the semantic-clusters skill for the full framework.
     For simpler projects, replace with a flat feature list. -->

### [emoji] [VERB] — [Short Description]

> [One sentence explaining what this capability means for the system.]

| Component | Location | Status | LOC |
|-----------|----------|--------|-----|
| [Name] | [path/to/component/] | [emoji] | [number] |

**Health:** [emoji] [1-line assessment]
**Audit Notes:** [Key technical details, 1-2 lines max.]

---

<!-- Repeat for each cluster. -->

### Cross-Cluster Components

| Component | Directory | Primary Cluster | Notes |
|-----------|-----------|----------------|-------|
| [Name] | [path/] | [VERB] | [Why it's cross-cluster] |

---

## 5. File Importance Ranking

### Tier 1 — Critical (System won't function without these)

| Rank | File | Why |
|------|------|-----|
| 1 | [path/to/file] | [One-line justification] |

### Tier 2 — Important (Core features break without these)

| Rank | File | Why |
|------|------|-----|
| 11 | [path/to/file] | [One-line justification] |

### Tier 3 — Supporting (Degrade gracefully without these)

| Rank | File | Why |
|------|------|-----|
| 21-25 | [path/to/files] | [Category description] |

### Tier 4 — Knowledge (Essential for development, not runtime)

| Rank | File | Why |
|------|------|-----|
| 51 | [path/to/file] | [One-line justification] |

---

## 6. Health Assessment

### Critical Issues
- **[None / List issues]**

### Security

| Area | Status | Notes |
|------|--------|-------|
| Secret management | [emoji] | [Assessment] |
| Authentication | [emoji] | [Assessment] |
| Authorization | [emoji] | [Assessment] |
| Encryption | [emoji] | [Assessment] |

### Sustainability

| Area | Status | Notes |
|------|--------|-------|
| Backend test coverage | [emoji] | [Percentage + assessment] |
| Frontend test coverage | [emoji] | [Percentage + assessment] |
| CI/CD automation | [emoji] | [Workflow count + assessment] |
| Technical debt | [emoji] | [Assessment] |
| Documentation | [emoji] | [File count + assessment] |
| Manual processes | [emoji] | [List any] |

---

## 7. Active Workstreams

| Workstream | Owner/Agent | Status | Focus |
|------------|-------------|--------|-------|
| [Name] | [Who] | [emoji] | [What they're doing] |

---

## 8. Blockers & Dependencies

- **[Blocker description]** — [Impact and who owns resolution]

---

## 9. Next Steps

1. [emoji] [Concrete, actionable task]
2. [emoji] [Concrete, actionable task]
3. [emoji] [Concrete, actionable task]

---

## 10. Aggregate Statistics

| Metric | Value |
|--------|-------|
| Total [primary language] LOC | ~[number] |
| Total [primary language] files | [number] |
| Total [secondary language] LOC | ~[number] |
| Total [secondary language] files | [number] |
| Total [tools/endpoints] | [number] |
| Total documentation files | [number] |
| Total migrations | [number] |
| Total CI/CD workflows | [number] |
| Versions shipped | [number] |

---
```

---

## Template Notes

1. **Delete all HTML comments** before saving the final document.
2. **Adapt section count to project size:**
   - Small (< 50 files): Sections 1, 2, 3, 6, 7, 9
   - Medium (50-300 files): Sections 1-3, 4 (simplified), 6-10
   - Large (300+ files): All 10 sections
3. **Emoji status key must be consistent** across all sections.
4. **LOC is approximate.** Use `~` prefix. Within 10% accuracy is fine.
5. **Directory tree depth:** 2-3 levels default, deeper for architecturally significant areas.
6. **Cross-cluster table** (Section 4) is only needed when using semantic action-verb clusters. For simpler projects using a flat feature list, skip it.
