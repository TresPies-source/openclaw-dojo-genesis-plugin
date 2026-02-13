export interface SkillEntry {
  name: string;
  category: string;
  description: string;
}

export const SKILL_CATALOG: Record<string, SkillEntry> = {
  // Pipeline (also available as /dojo scout, spec, tracks, commission, retro)
  "strategic-scout": {
    name: "strategic-scout",
    category: "pipeline",
    description: "Explore strategic tensions and scout multiple routes",
  },
  "release-specification": {
    name: "release-specification",
    category: "pipeline",
    description: "Write a production-ready release specification",
  },
  "parallel-tracks": {
    name: "parallel-tracks",
    category: "pipeline",
    description: "Decompose specs into independent parallel tracks",
  },
  "implementation-prompt": {
    name: "implementation-prompt",
    category: "pipeline",
    description: "Generate structured implementation prompts",
  },
  "retrospective": {
    name: "retrospective",
    category: "pipeline",
    description: "Reflect on what went well, what was hard, what to improve",
  },

  // Workflow
  "iterative-scouting": {
    name: "iterative-scouting",
    category: "workflow",
    description: "Iterate scout cycles with reframes",
  },
  "strategic-to-tactical-workflow": {
    name: "strategic-to-tactical-workflow",
    category: "workflow",
    description: "Full scout → spec → commission pipeline",
  },
  "pre-implementation-checklist": {
    name: "pre-implementation-checklist",
    category: "workflow",
    description: "Verify specs are ready before commissioning",
  },
  "context-ingestion": {
    name: "context-ingestion",
    category: "workflow",
    description: "Create plans grounded in uploaded files",
  },
  "frontend-from-backend": {
    name: "frontend-from-backend",
    category: "workflow",
    description: "Write frontend specs from backend architecture",
  },
  "spec-constellation-to-prompt-suite": {
    name: "spec-constellation-to-prompt-suite",
    category: "workflow",
    description: "Convert multiple specs into coordinated prompts",
  },
  "planning-with-files": {
    name: "planning-with-files",
    category: "workflow",
    description: "Route file-based planning to specialized modes",
  },

  // Research
  "research-modes": {
    name: "research-modes",
    category: "research",
    description: "Deep and wide research with structured approaches",
  },
  "research-synthesis": {
    name: "research-synthesis",
    category: "research",
    description: "Synthesize multiple sources into actionable insights",
  },
  "project-exploration": {
    name: "project-exploration",
    category: "research",
    description: "Explore new projects to assess collaboration potential",
  },
  "era-architecture": {
    name: "era-architecture",
    category: "research",
    description: "Architect multi-release eras with shared vocabulary",
  },
  "repo-context-sync": {
    name: "repo-context-sync",
    category: "research",
    description: "Sync and extract context from repositories",
  },
  "documentation-audit": {
    name: "documentation-audit",
    category: "research",
    description: "Audit documentation for drift and accuracy",
  },
  "health-audit": {
    name: "health-audit",
    category: "research",
    description: "Comprehensive repository health check",
  },

  // Forge
  "skill-creation": {
    name: "skill-creation",
    category: "forge",
    description: "Create new reusable skills",
  },
  "skill-maintenance": {
    name: "skill-maintenance",
    category: "forge",
    description: "Maintain skill health through systematic review",
  },
  "skill-audit-upgrade": {
    name: "skill-audit-upgrade",
    category: "forge",
    description: "Audit and upgrade skills to quality standards",
  },
  "process-extraction": {
    name: "process-extraction",
    category: "forge",
    description: "Transform workflows into reusable skills",
  },

  // Garden
  "memory-garden": {
    name: "memory-garden",
    category: "garden",
    description: "Write structured memory entries for context management",
  },
  "seed-extraction": {
    name: "seed-extraction",
    category: "garden",
    description: "Extract reusable patterns from experiences",
  },
  "seed-library": {
    name: "seed-library",
    category: "garden",
    description: "Access and apply Dojo Seed Patches",
  },
  "compression-ritual": {
    name: "compression-ritual",
    category: "garden",
    description: "Distill conversation history into memory artifacts",
  },
  "seed-to-skill-converter": {
    name: "seed-to-skill-converter",
    category: "garden",
    description: "Elevate proven seeds into full skills",
  },

  // Orchestration
  "handoff-protocol": {
    name: "handoff-protocol",
    category: "orchestration",
    description: "Hand off work between agents cleanly",
  },
  "decision-propagation": {
    name: "decision-propagation",
    category: "orchestration",
    description: "Propagate decisions across document ecosystem",
  },
  "workspace-navigation": {
    name: "workspace-navigation",
    category: "orchestration",
    description: "Navigate shared agent workspaces",
  },
  "agent-teaching": {
    name: "agent-teaching",
    category: "orchestration",
    description: "Teach peers through shared practice",
  },

  // System
  "semantic-clusters": {
    name: "semantic-clusters",
    category: "system",
    description: "Map system capabilities with action-verb clusters",
  },
  "repo-status": {
    name: "repo-status",
    category: "system",
    description: "Generate comprehensive repo status documents",
  },
  "status-template": {
    name: "status-template",
    category: "system",
    description: "Write status docs using 10-section template",
  },
  "status-writing": {
    name: "status-writing",
    category: "system",
    description: "Write and update STATUS.md files",
  },

  // Tools
  "patient-learning-protocol": {
    name: "patient-learning-protocol",
    category: "tools",
    description: "Learn at the pace of understanding",
  },
  "file-management": {
    name: "file-management",
    category: "tools",
    description: "Organize files and directories flexibly",
  },
  "product-positioning": {
    name: "product-positioning",
    category: "tools",
    description: "Reframe binary product decisions",
  },
  "multi-surface-strategy": {
    name: "multi-surface-strategy",
    category: "tools",
    description: "Design coherent multi-surface strategies",
  },
};

export const CATEGORIES = [
  "pipeline",
  "workflow",
  "research",
  "forge",
  "garden",
  "orchestration",
  "system",
  "tools",
] as const;

export function listSkills(category?: string): string {
  const entries = Object.values(SKILL_CATALOG);
  const filtered = category
    ? entries.filter((e) => e.category === category)
    : entries;

  if (filtered.length === 0) {
    return category
      ? `No skills in category "${category}". Available: ${CATEGORIES.join(", ")}`
      : "No skills found.";
  }

  const grouped: Record<string, SkillEntry[]> = {};
  for (const entry of filtered) {
    (grouped[entry.category] ??= []).push(entry);
  }

  const lines: string[] = ["**Dojo Genesis Skill Catalog**\n"];
  for (const cat of CATEGORIES) {
    if (!grouped[cat]) continue;
    const label =
      cat === "pipeline"
        ? `${cat} (shorthand: /dojo scout|spec|tracks|commission|retro)`
        : cat;
    lines.push(`**${label}:**`);
    for (const s of grouped[cat]) {
      lines.push(`  \`${s.name}\` — ${s.description}`);
    }
    lines.push("");
  }

  lines.push("Run any skill with: `/dojo run <skill-name> [args]`");
  return lines.join("\n");
}
