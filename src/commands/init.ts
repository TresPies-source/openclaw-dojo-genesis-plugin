import { stateManager } from "../state/manager.js";
import { validateProjectName } from "../utils/validation.js";
import { writeTextFile, writeJsonFile, ensureDir } from "../utils/file-ops.js";
import { generateProjectMd } from "../utils/markdown.js";
import type { ProjectMetadata, ProjectState } from "../state/types.js";

export async function handleInit(args: string[]): Promise<{ text: string }> {
  const name = args[0];
  const validation = validateProjectName(name);
  if (!validation.valid) {
    return { text: `Invalid project name: ${validation.error}` };
  }

  const global = await stateManager.getGlobalState();
  if (global.projects.some((p) => p.id === name && !p.archived)) {
    return { text: `Project \`${name}\` already exists. Use \`/dojo switch ${name}\` to activate it.` };
  }

  const descIdx = args.indexOf("--desc");
  const description =
    descIdx >= 0 ? args.slice(descIdx + 1).join(" ").replace(/^"|"$/g, "") : "";

  const now = new Date().toISOString();
  const date = now.split("T")[0];

  const meta: ProjectMetadata = {
    id: name,
    name,
    description,
    phase: "initialized",
    createdAt: now,
    lastAccessedAt: now,
    archived: false,
  };

  const state: ProjectState = {
    projectId: name,
    phase: "initialized",
    tracks: [],
    decisions: [],
    specs: [],
    artifacts: [],
    currentTrack: null,
    lastSkill: "",
    pendingAction: null,
    activityLog: [{ timestamp: now, action: "command:init", summary: "Project created" }],
    lastUpdated: now,
  };

  const projectDir = `${stateManager.getBasePath()}/projects/${name}`;
  await ensureDir(projectDir);
  await ensureDir(`${projectDir}/scouts`);
  await ensureDir(`${projectDir}/specs`);
  await ensureDir(`${projectDir}/prompts`);
  await ensureDir(`${projectDir}/retros`);
  await ensureDir(`${projectDir}/tracks`);
  await ensureDir(`${projectDir}/artifacts`);

  await writeTextFile(`${projectDir}/PROJECT.md`, generateProjectMd(name, description, date));
  await writeTextFile(`${projectDir}/decisions.md`, `# Decision Log: ${name}\n\n---\n\n`);
  await writeJsonFile(`${projectDir}/state.json`, state);

  await stateManager.addProject(meta);

  return {
    text: `**Project created:** \`${name}\`\n\n**Phase:** initialized\n**Active:** yes\n\nNext: Run \`/dojo scout <tension>\` to start scouting.`,
  };
}
