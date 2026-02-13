import { Type } from "@sinclair/typebox";
import { stateManager } from "../state/manager.js";
import { validateOutputDir, sanitizeFilename } from "../utils/validation.js";
import { writeTextFile, ensureDir } from "../utils/file-ops.js";
import type { DojoPhase } from "../state/types.js";

interface ToolResult {
  content: Array<{ type: string; text: string }>;
}

interface ToolRegistration {
  name: string;
  description: string;
  parameters: unknown;
  execute: (id: string, params: Record<string, unknown>) => Promise<ToolResult>;
}

interface ToolRegistrar {
  registerTool(tool: ToolRegistration): void;
}

function jsonResult(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

export function registerOrchestrationTools(api: ToolRegistrar): void {
  api.registerTool({
    name: "dojo_get_context",
    description:
      "Get the active Dojo Genesis project context including phase, tracks, decisions, and recent activity. Call this at the start of any skill execution to check if a project is active.",
    parameters: Type.Object({
      projectId: Type.Optional(
        Type.String({ description: "Target a specific project instead of the active one" }),
      ),
    }),
    async execute(_id, params) {
      const state = await stateManager.getProjectState(params.projectId as string | undefined);
      if (!state) {
        return jsonResult({ active: false, message: "No active project" });
      }

      return jsonResult({
        active: true,
        projectId: state.projectId,
        phase: state.phase,
        tracks: state.tracks,
        decisions: state.decisions.map((d) => ({ date: d.date, topic: d.topic })),
        specs: state.specs,
        currentTrack: state.currentTrack,
        lastSkill: state.lastSkill,
        recentActivity: state.activityLog.slice(0, 10),
      });
    },
  });

  api.registerTool({
    name: "dojo_save_artifact",
    description:
      "Save a skill output as a markdown file in the active project directory. Use this after completing a skill to persist the results.",
    parameters: Type.Object({
      filename: Type.String({
        description: "Output filename (e.g., '2026-02-12_scout_build-native.md')",
      }),
      content: Type.String({ description: "Full markdown content to save" }),
      outputDir: Type.String({
        description: "Subdirectory: scouts, specs, prompts, retros, tracks, or artifacts",
      }),
      projectId: Type.Optional(Type.String({ description: "Target specific project" })),
    }),
    async execute(_id, params) {
      const outputDir = params.outputDir as string;
      if (!validateOutputDir(outputDir)) {
        return jsonResult({ error: `Invalid output directory: ${outputDir}` });
      }

      const global = await stateManager.getGlobalState();
      const id = (params.projectId as string | undefined) || global.activeProjectId;
      if (!id) {
        return jsonResult({ error: "No active project" });
      }

      const safeName = sanitizeFilename(params.filename as string);
      const basePath = stateManager.getBasePath();
      const dir = `${basePath}/projects/${id}/${outputDir}`;
      const filePath = `${dir}/${safeName}`;

      await ensureDir(dir);
      await writeTextFile(filePath, params.content as string);

      const state = await stateManager.getProjectState(id);
      if (state) {
        state.artifacts.push({
          category: outputDir,
          filename: safeName,
          createdAt: new Date().toISOString(),
          skill: state.lastSkill || "unknown",
        });
        await stateManager.updateProjectState(id, { artifacts: state.artifacts });
        await stateManager.addActivity(
          id,
          `artifact:${outputDir}`,
          `Saved ${safeName} to ${outputDir}/`,
        );
      }

      return jsonResult({ saved: true, path: `${outputDir}/${safeName}` });
    },
  });

  api.registerTool({
    name: "dojo_update_state",
    description:
      "Update the active project's phase, track status, or other state. Use this after completing a skill to advance the project workflow.",
    parameters: Type.Object({
      phase: Type.Optional(
        Type.String({
          description:
            "New project phase (initialized, scouting, specifying, decomposing, commissioning, implementing, retrospective)",
        }),
      ),
      lastSkill: Type.Optional(
        Type.String({ description: "Name of the skill that just ran" }),
      ),
      currentTrack: Type.Optional(
        Type.String({ description: "Set the current active track" }),
      ),
      addTrack: Type.Optional(
        Type.Object({
          id: Type.String(),
          name: Type.String(),
          dependencies: Type.Optional(Type.Array(Type.String())),
        }),
      ),
      addDecision: Type.Optional(
        Type.Object({
          topic: Type.String(),
          file: Type.String(),
        }),
      ),
      addSpec: Type.Optional(
        Type.Object({
          version: Type.String(),
          file: Type.String(),
        }),
      ),
      projectId: Type.Optional(Type.String({ description: "Target specific project" })),
    }),
    async execute(_id, params) {
      const global = await stateManager.getGlobalState();
      const id = (params.projectId as string | undefined) || global.activeProjectId;
      if (!id) {
        return jsonResult({ error: "No active project" });
      }

      const state = await stateManager.getProjectState(id);
      if (!state) {
        return jsonResult({ error: `Project not found: ${id}` });
      }

      const updates: Record<string, unknown> = {};

      if (params.phase) updates.phase = params.phase as DojoPhase;
      if (params.lastSkill) updates.lastSkill = params.lastSkill;
      if (params.currentTrack) updates.currentTrack = params.currentTrack;

      if (params.addTrack) {
        const track = params.addTrack as { id: string; name: string; dependencies?: string[] };
        state.tracks.push({
          id: track.id,
          name: track.name,
          status: "pending",
          dependencies: track.dependencies || [],
          promptFile: null,
        });
        updates.tracks = state.tracks;
      }

      if (params.addDecision) {
        const decision = params.addDecision as { topic: string; file: string };
        state.decisions.push({
          date: new Date().toISOString().split("T")[0],
          topic: decision.topic,
          file: decision.file,
        });
        updates.decisions = state.decisions;
      }

      if (params.addSpec) {
        const spec = params.addSpec as { version: string; file: string };
        state.specs.push({
          version: spec.version,
          file: spec.file,
        });
        updates.specs = state.specs;
      }

      await stateManager.updateProjectState(id, updates);

      if (params.lastSkill) {
        await stateManager.addActivity(
          id,
          `skill:${params.lastSkill}`,
          `${params.lastSkill} completed`,
        );
      }

      return jsonResult({ updated: true, phase: (params.phase as string) || state.phase });
    },
  });
}
