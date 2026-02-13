import { stateManager } from "../state/manager.js";
import type { PendingAction } from "../state/types.js";

export async function handleSkillInvoke(
  skillName: string,
  args: string[],
): Promise<{ text: string }> {
  const atProject = args.find((a) => a.startsWith("@"));
  const remainingArgs = args.filter((a) => !a.startsWith("@"));
  const projectId = atProject
    ? atProject.slice(1)
    : (await stateManager.getGlobalState()).activeProjectId;

  if (!projectId) {
    return { text: "No active project. Run `/dojo init <name>` first." };
  }

  const state = await stateManager.getProjectState(projectId);
  if (!state) {
    return { text: `Project \`${projectId}\` not found.` };
  }

  const pendingAction: PendingAction = {
    skill: skillName,
    args: remainingArgs.join(" "),
    requestedAt: new Date().toISOString(),
  };
  await stateManager.updateProjectState(projectId, { pendingAction });
  await stateManager.addActivity(projectId, `command:${skillName}`, `Requested ${skillName}`);

  return {
    text: `**Starting ${skillName}** for project \`${projectId}\` (phase: ${state.phase})\n\nThe agent will pick up this request and run the skill with your project context.`,
  };
}
