import { stateManager } from "../state/manager.js";
import { formatPhase, formatDate, formatTrackTable } from "../ui/chat-formatter.js";
import type { DojoPhase } from "../state/types.js";

export async function handleStatus(args: string[]): Promise<{ text: string }> {
  const atProject = args.find((a) => a.startsWith("@"));
  const projectId = atProject?.slice(1) || undefined;
  const state = await stateManager.getProjectState(projectId);

  if (!state) {
    return { text: "No active project. Run `/dojo init <name>` to create one." };
  }

  const recentActivity = state.activityLog.slice(0, 5);
  const nextAction = suggestNextAction(state.phase);

  let output = `**Project:** \`${state.projectId}\`\n`;
  output += `**Phase:** ${formatPhase(state.phase)}\n`;
  output += `**Last updated:** ${formatDate(state.lastUpdated)}\n\n`;

  if (state.tracks.length > 0) {
    output += `**Tracks:**\n${formatTrackTable(state.tracks)}\n\n`;
  }

  if (recentActivity.length > 0) {
    output += `**Recent activity:**\n`;
    for (const entry of recentActivity) {
      output += `- ${formatDate(entry.timestamp)} — ${entry.summary}\n`;
    }
    output += "\n";
  }

  if (nextAction) {
    output += `**Suggested next:** ${nextAction}`;
  }

  return { text: output };
}

function suggestNextAction(phase: DojoPhase): string {
  const suggestions: Record<string, string> = {
    initialized: "`/dojo scout <tension>` — Start with a strategic scout",
    scouting: "`/dojo spec <feature>` — Write a release specification",
    specifying: "`/dojo tracks` — Decompose into parallel tracks",
    decomposing: "`/dojo commission` — Generate implementation prompts",
    commissioning: "Hand off prompts to implementation agents",
    implementing: "`/dojo retro` — Run a retrospective when done",
    retrospective: "`/dojo init <name>` — Start a new project, or continue iterating",
  };
  return suggestions[phase] || "";
}
