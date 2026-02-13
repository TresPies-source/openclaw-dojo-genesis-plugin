import type { HookHandler } from "openclaw";
import { stateManager } from "../../src/state/manager.js";
import { writeTextFile } from "../../src/utils/file-ops.js";
import { promises as fs } from "fs";

const MONITORED_TOOLS = ["dojo_save_artifact", "dojo_update_state", "dojo_get_context"];

const handler: HookHandler = async (event) => {
  if (event.type !== "agent") return;

  const toolName = event.context?.toolName as string | undefined;
  if (!toolName || !MONITORED_TOOLS.includes(toolName)) return;

  if (toolName === "dojo_update_state") {
    const params = event.context?.toolParams as Record<string, unknown> | undefined;
    const newPhase = params?.phase as string | undefined;
    if (newPhase) {
      await updateProjectMd(newPhase);
    }
  }
};

async function updateProjectMd(toPhase: string): Promise<void> {
  const global = await stateManager.getGlobalState();
  if (!global.activeProjectId) return;

  const basePath = stateManager.getBasePath();
  const projectMdPath = `${basePath}/projects/${global.activeProjectId}/PROJECT.md`;

  try {
    let content = await fs.readFile(projectMdPath, "utf-8");
    content = content.replace(/\*\*Phase:\*\* .+/, `**Phase:** ${toPhase}`);
    const logEntry = `- ${new Date().toISOString().split("T")[0]} — Phase changed to ${toPhase}\n`;
    content = content.replace(/(## Activity Log\n\n)/, `$1${logEntry}`);
    await writeTextFile(projectMdPath, content);
  } catch {
    // PROJECT.md may not exist yet — not critical
  }
}

export default handler;
