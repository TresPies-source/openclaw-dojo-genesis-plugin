import type { HookHandler } from "../../tests/__mocks__/openclaw-types.js";
import { stateManager } from "../../src/state/manager.js";

const SKILL_INSTRUCTIONS: Record<string, string> = {
  // Pipeline
  "strategic-scout":
    "Run the strategic-scout skill (see skills/strategic-scout/SKILL.md). Explore the tension from multiple perspectives, then synthesize a direction.",
  "release-specification":
    "Run the release-specification skill (see skills/release-specification/SKILL.md). Write a production-ready specification for this feature/release.",
  "parallel-tracks":
    "Run the parallel-tracks skill (see skills/parallel-tracks/SKILL.md). Decompose the specification into independent parallel implementation tracks.",
  "implementation-prompt":
    "Run the implementation-prompt skill (see skills/implementation-prompt/SKILL.md). Generate structured implementation prompts for each track.",
  "retrospective":
    "Run the retrospective skill (see skills/retrospective/SKILL.md). Reflect on what went well, what was hard, and what to improve.",

  // Workflow
  "iterative-scouting":
    "Run the iterative-scouting skill (see skills/iterative-scouting/SKILL.md). Iterate through scouting cycles with feedback-driven reframes.",
  "strategic-to-tactical-workflow":
    "Run the strategic-to-tactical-workflow skill (see skills/strategic-to-tactical-workflow/SKILL.md). Execute the full scout → spec → commission workflow.",
  "pre-implementation-checklist":
    "Run the pre-implementation-checklist skill (see skills/pre-implementation-checklist/SKILL.md). Verify specifications are ready before commissioning.",
  "context-ingestion":
    "Run the context-ingestion skill (see skills/context-ingestion/SKILL.md). Create actionable plans grounded in the uploaded files.",
  "frontend-from-backend":
    "Run the frontend-from-backend skill (see skills/frontend-from-backend/SKILL.md). Write frontend specifications grounded in backend architecture.",
  "spec-constellation-to-prompt-suite":
    "Run the spec-constellation-to-prompt-suite skill (see skills/spec-constellation-to-prompt-suite/SKILL.md). Convert multiple specs into coordinated parallel-track prompts.",
  "planning-with-files":
    "Run the planning-with-files skill (see skills/planning-with-files/SKILL.md). Route file-based planning to the right specialized mode.",

  // Research
  "research-modes":
    "Run the research-modes skill (see skills/research-modes/SKILL.md). Conduct deep or wide research using structured approaches.",
  "research-synthesis":
    "Run the research-synthesis skill (see skills/research-synthesis/SKILL.md). Synthesize multiple research sources into actionable insights.",
  "project-exploration":
    "Run the project-exploration skill (see skills/project-exploration/SKILL.md). Explore a new project to assess collaboration potential.",
  "era-architecture":
    "Run the era-architecture skill (see skills/era-architecture/SKILL.md). Architect multi-release eras with shared vocabulary and constraints.",
  "repo-context-sync":
    "Run the repo-context-sync skill (see skills/repo-context-sync/SKILL.md). Sync and extract context from a repository.",
  "documentation-audit":
    "Run the documentation-audit skill (see skills/documentation-audit/SKILL.md). Audit documentation for drift and accuracy.",
  "health-audit":
    "Run the health-audit skill (see skills/health-audit/SKILL.md). Conduct a comprehensive repository health check.",

  // Forge
  "skill-creation":
    "Run the skill-creation skill (see skills/skill-creation/SKILL.md). Create a new reusable skill with proper structure.",
  "skill-maintenance":
    "Run the skill-maintenance skill (see skills/skill-maintenance/SKILL.md). Maintain and improve existing skills.",
  "skill-audit-upgrade":
    "Run the skill-audit-upgrade skill (see skills/skill-audit-upgrade/SKILL.md). Audit all skills and upgrade to quality standards.",
  "process-extraction":
    "Run the process-extraction skill (see skills/process-extraction/SKILL.md). Transform a completed workflow into a reusable skill.",

  // Garden
  "memory-garden":
    "Run the memory-garden skill (see skills/memory-garden/SKILL.md). Write structured memory entries for context management.",
  "seed-extraction":
    "Run the seed-extraction skill (see skills/seed-extraction/SKILL.md). Extract reusable patterns from this experience.",
  "seed-library":
    "Run the seed-library skill (see skills/seed-library/SKILL.md). Access and apply the Dojo Seed Patches as thinking modules.",
  "compression-ritual":
    "Run the compression-ritual skill (see skills/compression-ritual/SKILL.md). Distill conversation history into potent memory artifacts.",
  "seed-to-skill-converter":
    "Run the seed-to-skill-converter skill (see skills/seed-to-skill-converter/SKILL.md). Elevate a proven seed into a full skill.",

  // Orchestration
  "handoff-protocol":
    "Run the handoff-protocol skill (see skills/handoff-protocol/SKILL.md). Prepare a clean handoff package for another agent.",
  "decision-propagation":
    "Run the decision-propagation skill (see skills/decision-propagation/SKILL.md). Record and propagate a decision across all dependent documents.",
  "workspace-navigation":
    "Run the workspace-navigation skill (see skills/workspace-navigation/SKILL.md). Navigate and organize the shared workspace.",
  "agent-teaching":
    "Run the agent-teaching skill (see skills/agent-teaching/SKILL.md). Teach a peer through shared practice.",

  // System
  "semantic-clusters":
    "Run the semantic-clusters skill (see skills/semantic-clusters/SKILL.md). Map system capabilities using action-verb clusters.",
  "repo-status":
    "Run the repo-status skill (see skills/repo-status/SKILL.md). Generate a comprehensive repo status document.",
  "status-template":
    "Run the status-template skill (see skills/status-template/SKILL.md). Write status using the 10-section template.",
  "status-writing":
    "Run the status-writing skill (see skills/status-writing/SKILL.md). Write and update a STATUS.md file.",

  // Tools
  "patient-learning-protocol":
    "Run the patient-learning-protocol skill (see skills/patient-learning-protocol/SKILL.md). Learn at the pace of understanding.",
  "file-management":
    "Run the file-management skill (see skills/file-management/SKILL.md). Organize files and directories with flexible principles.",
  "product-positioning":
    "Run the product-positioning skill (see skills/product-positioning/SKILL.md). Reframe a binary product decision into a positioning opportunity.",
  "multi-surface-strategy":
    "Run the multi-surface-strategy skill (see skills/multi-surface-strategy/SKILL.md). Design a coherent multi-surface product strategy.",
};

const handler: HookHandler = async (event) => {
  if (event.type !== "agent" || event.action !== "start") return;

  const global = await stateManager.getGlobalState();
  if (!global.activeProjectId) return;

  const state = await stateManager.getProjectState(global.activeProjectId);
  if (!state?.pendingAction) return;

  const { skill, args } = state.pendingAction;
  const instructions = SKILL_INSTRUCTIONS[skill] || `Run the ${skill} skill.`;

  const contextBlock = [
    `[DOJO GENESIS PROJECT CONTEXT]`,
    `Project: ${state.projectId}`,
    `Phase: ${state.phase}`,
    `Pending skill: ${skill}`,
    `User request: ${args}`,
    ``,
    `Active tracks: ${state.tracks.length > 0 ? state.tracks.map((t) => `${t.id} (${t.status})`).join(", ") : "none"}`,
    `Recent decisions: ${state.decisions.slice(-3).map((d) => d.topic).join(", ") || "none"}`,
    `Last skill: ${state.lastSkill || "none"}`,
    ``,
    `INSTRUCTIONS: ${instructions}`,
    `Start by calling dojo_get_context for full project state. When done, save output with dojo_save_artifact and update state with dojo_update_state.`,
    `[/DOJO GENESIS PROJECT CONTEXT]`,
  ].join("\n");

  event.messages.push(contextBlock);
};

export default handler;
