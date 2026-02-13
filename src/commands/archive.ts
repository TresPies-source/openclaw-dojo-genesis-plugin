import { stateManager } from "../state/manager.js";

export async function handleArchive(args: string[]): Promise<{ text: string }> {
  const name = args[0];
  if (!name) {
    return { text: "Project name is required. Usage: `/dojo archive <name>`" };
  }

  const global = await stateManager.getGlobalState();
  const meta = global.projects.find((p) => p.id === name);

  if (!meta) {
    return { text: `Project \`${name}\` not found.` };
  }

  if (meta.archived) {
    return { text: `Project \`${name}\` is already archived.` };
  }

  await stateManager.archiveProject(name);

  return {
    text: `**Project archived:** \`${name}\`\n\nThe project files remain on disk. It will no longer appear in \`/dojo list\` (use \`--all\` to see archived projects).`,
  };
}
