import type { HookHandler } from "../../tests/__mocks__/openclaw-types.js";
import { stateManager } from "../../src/state/manager.js";

const SKILL_INSTRUCTIONS: Record<string, string> = {
  "strategic-scout":
    "Run the strategic-scout skill. Explore the tension from multiple perspectives, then synthesize a direction.",
  "release-specification":
    "Run the release-specification skill. Write a production-ready specification for this feature/release.",
  "parallel-tracks":
    "Run the parallel-tracks skill. Decompose the specification into independent parallel implementation tracks.",
  "implementation-prompt":
    "Run the implementation-prompt skill. Generate structured implementation prompts for each track.",
  retrospective:
    "Run the retrospective skill. Reflect on what went well, what was hard, and what to improve.",
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
