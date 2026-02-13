import { stateManager } from "../state/manager.js";
import { formatProjectList } from "../ui/chat-formatter.js";

export async function handleList(args: string[]): Promise<{ text: string }> {
  const showArchived = args.includes("--all");
  const global = await stateManager.getGlobalState();

  const table = formatProjectList(global.projects, showArchived, global.activeProjectId);

  return { text: table };
}
