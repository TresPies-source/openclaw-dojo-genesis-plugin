import type { PluginAPI } from "../../tests/__mocks__/openclaw-types.js";
import { handleInit } from "./init.js";
import { handleSwitch } from "./switch.js";
import { handleStatus } from "./status.js";
import { handleList } from "./list.js";
import { handleArchive } from "./archive.js";
import { handleSkillInvoke } from "./skill-invoke.js";

const SKILL_MAP: Record<string, string> = {
  scout: "strategic-scout",
  spec: "release-specification",
  tracks: "parallel-tracks",
  commission: "implementation-prompt",
  retro: "retrospective",
};

const HELP_TEXT = `**Dojo Genesis** — Specification-driven development orchestration

**Project Management:**
\`/dojo init <name>\` — Create a new project
\`/dojo switch <name>\` — Switch active project
\`/dojo status\` — Show current project status
\`/dojo list\` — List all projects
\`/dojo archive <name>\` — Archive a project

**Workflow:**
\`/dojo scout <tension>\` — Run a strategic scout
\`/dojo spec <feature>\` — Write a release specification
\`/dojo tracks\` — Decompose into parallel tracks
\`/dojo commission\` — Generate implementation prompts
\`/dojo retro\` — Run a retrospective

Use \`@project-name\` to target a specific project.`;

export function registerDojoCommands(api: PluginAPI): void {
  api.registerCommand({
    name: "dojo",
    description: "Dojo Genesis: specification-driven development orchestration",
    handler: (ctx) => {
      const args = (ctx.args || "").trim().split(/\s+/).filter(Boolean);
      const subcommand = args[0]?.toLowerCase();

      switch (subcommand) {
        case "init":
          return handleInit(args.slice(1));
        case "switch":
          return handleSwitch(args.slice(1));
        case "status":
          return handleStatus(args.slice(1));
        case "list":
          return handleList(args.slice(1));
        case "archive":
          return handleArchive(args.slice(1));

        case "scout":
        case "spec":
        case "tracks":
        case "commission":
        case "retro":
          return handleSkillInvoke(SKILL_MAP[subcommand], args.slice(1));

        case "help":
        case undefined:
          return { text: HELP_TEXT };
        default:
          return { text: `Unknown command: \`${subcommand}\`. Run \`/dojo help\` for available commands.` };
      }
    },
  });
}
