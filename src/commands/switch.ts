import { stateManager } from "../state/manager.js";

export async function handleSwitch(args: string[]): Promise<{ text: string }> {
  const name = args[0];
  if (!name) {
    return { text: "Project name is required. Usage: `/dojo switch <name>`" };
  }

  const global = await stateManager.getGlobalState();
  const meta = global.projects.find((p) => p.id === name);

  if (!meta) {
    return { text: `Project \`${name}\` not found.` };
  }

  if (meta.archived) {
    return { text: `Project \`${name}\` is archived. Unarchive it first before switching.` };
  }

  await stateManager.setActiveProject(name);

  return {
    text: `**Switched to:** \`${name}\`\n\n**Phase:** ${meta.phase}`,
  };
}
