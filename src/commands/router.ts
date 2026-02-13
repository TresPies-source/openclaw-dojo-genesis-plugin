import type { PluginAPI } from "../../tests/__mocks__/openclaw-types.js";
import { handleInit } from "./init.js";
import { handleSwitch } from "./switch.js";
import { handleStatus } from "./status.js";
import { handleList } from "./list.js";
import { handleArchive } from "./archive.js";
import { handleSkillInvoke } from "./skill-invoke.js";
import { SKILL_CATALOG, listSkills } from "../skills/catalog.js";

// Keep shorthand aliases for the core pipeline
const PIPELINE_SHORTCUTS: Record<string, string> = {
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

**Core Pipeline:**
\`/dojo scout <tension>\` — Strategic scout
\`/dojo spec <feature>\` — Release specification
\`/dojo tracks\` — Parallel track decomposition
\`/dojo commission\` — Implementation prompts
\`/dojo retro\` — Retrospective

**Skill Catalog (40 skills):**
\`/dojo run <skill-name> [args]\` — Run any skill
\`/dojo skills [category]\` — Browse available skills

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
          return handleSkillInvoke(PIPELINE_SHORTCUTS[subcommand], args.slice(1));

        case "run": {
          const skillName = args[1];
          if (!skillName || !SKILL_CATALOG[skillName]) {
            return {
              text: `Unknown skill: \`${skillName || "(none)"}\`. Run \`/dojo skills\` for available skills.`,
            };
          }
          return handleSkillInvoke(skillName, args.slice(2));
        }

        case "skills": {
          const category = args[1];
          return { text: listSkills(category) };
        }

        case "help":
        case undefined:
          return { text: HELP_TEXT };
        default:
          return { text: `Unknown command: \`${subcommand}\`. Run \`/dojo help\` for available commands.` };
      }
    },
  });
}
