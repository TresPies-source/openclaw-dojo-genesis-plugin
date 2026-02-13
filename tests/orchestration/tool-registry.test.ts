import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { initStateManager, stateManager } from "../../src/state/manager.js";
import { handleInit } from "../../src/commands/init.js";
import { registerOrchestrationTools } from "../../src/orchestration/tool-registry.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";
import type { ToolRegistration } from "../__mocks__/openclaw-types.js";

describe("registerOrchestrationTools", () => {
  let tmpDir: string;
  let tools: Map<string, ToolRegistration>;

  function getTool(name: string): ToolRegistration {
    const tool = tools.get(name);
    if (!tool) throw new Error(`Tool ${name} not registered`);
    return tool;
  }

  async function executeTool(name: string, params: Record<string, unknown> = {}) {
    const tool = getTool(name);
    const result = await tool.execute("test-id", params);
    return JSON.parse(result.content[0].text);
  }

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-tools-");
    initStateManager(tmpDir);
    tools = new Map();
    registerOrchestrationTools({
      registerTool(tool: ToolRegistration) {
        tools.set(tool.name, tool);
      },
    });
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  it("registers all 3 tools", () => {
    expect(tools.has("dojo_get_context")).toBe(true);
    expect(tools.has("dojo_save_artifact")).toBe(true);
    expect(tools.has("dojo_update_state")).toBe(true);
    expect(tools.size).toBe(3);
  });

  describe("dojo_get_context", () => {
    it("returns active: false when no project", async () => {
      const data = await executeTool("dojo_get_context");
      expect(data.active).toBe(false);
      expect(data.message).toBe("No active project");
    });

    it("returns full context for active project", async () => {
      await handleInit(["my-app"]);

      const data = await executeTool("dojo_get_context");
      expect(data.active).toBe(true);
      expect(data.projectId).toBe("my-app");
      expect(data.phase).toBe("initialized");
      expect(data.tracks).toEqual([]);
      expect(data.decisions).toEqual([]);
      expect(data.specs).toEqual([]);
      expect(data.currentTrack).toBeNull();
      expect(data.lastSkill).toBe("");
      expect(data.recentActivity).toHaveLength(1);
    });

    it("targets a specific project by projectId", async () => {
      await handleInit(["project-a"]);
      await handleInit(["project-b"]);

      const data = await executeTool("dojo_get_context", { projectId: "project-a" });
      expect(data.active).toBe(true);
      expect(data.projectId).toBe("project-a");
    });

    it("returns active: false for nonexistent projectId", async () => {
      await handleInit(["my-app"]);

      const data = await executeTool("dojo_get_context", { projectId: "nonexistent" });
      expect(data.active).toBe(false);
    });

    it("includes tracks, decisions, and specs after updates", async () => {
      await handleInit(["my-app"]);

      await stateManager.updateProjectState("my-app", {
        tracks: [
          { id: "track-a", name: "Auth", status: "pending", dependencies: [], promptFile: null },
        ],
        decisions: [{ date: "2026-02-12", topic: "Use JWT", file: "decisions.md" }],
        specs: [{ version: "v1", file: "specs/v1.md" }],
      });

      const data = await executeTool("dojo_get_context");
      expect(data.tracks).toHaveLength(1);
      expect(data.tracks[0].id).toBe("track-a");
      expect(data.decisions).toHaveLength(1);
      expect(data.decisions[0].topic).toBe("Use JWT");
      expect(data.specs).toHaveLength(1);
    });

    it("limits recentActivity to 10 entries", async () => {
      await handleInit(["my-app"]);

      for (let i = 0; i < 15; i++) {
        await stateManager.addActivity("my-app", `action-${i}`, `Entry ${i}`);
      }

      const data = await executeTool("dojo_get_context");
      expect(data.recentActivity.length).toBeLessThanOrEqual(10);
    });
  });

  describe("dojo_save_artifact", () => {
    it("saves a file to the correct directory", async () => {
      await handleInit(["my-app"]);

      const data = await executeTool("dojo_save_artifact", {
        filename: "2026-02-12_scout_native.md",
        content: "# Scout Output\n\nSome content",
        outputDir: "scouts",
      });

      expect(data.saved).toBe(true);
      expect(data.path).toBe("scouts/2026-02-12_scout_native-md");

      const basePath = `${tmpDir}/dojo-genesis/projects/my-app/scouts`;
      const content = await fs.readFile(`${basePath}/2026-02-12_scout_native-md`, "utf-8");
      expect(content).toBe("# Scout Output\n\nSome content");
    });

    it("sanitizes the filename", async () => {
      await handleInit(["my-app"]);

      const data = await executeTool("dojo_save_artifact", {
        filename: "../../etc/PASSWD.md",
        content: "test",
        outputDir: "scouts",
      });

      expect(data.saved).toBe(true);
      expect(data.path).not.toContain("..");
      expect(data.path).not.toContain("PASSWD");
    });

    it("records artifact in project state", async () => {
      await handleInit(["my-app"]);

      await executeTool("dojo_save_artifact", {
        filename: "my-scout.md",
        content: "content",
        outputDir: "scouts",
      });

      const state = await stateManager.getProjectState("my-app");
      expect(state!.artifacts).toHaveLength(1);
      expect(state!.artifacts[0].category).toBe("scouts");
      expect(state!.artifacts[0].filename).toBe("my-scout-md");
      expect(state!.artifacts[0].skill).toBe("unknown");
    });

    it("records artifact with lastSkill when set", async () => {
      await handleInit(["my-app"]);
      await stateManager.updateProjectState("my-app", { lastSkill: "strategic-scout" });

      await executeTool("dojo_save_artifact", {
        filename: "output.md",
        content: "content",
        outputDir: "scouts",
      });

      const state = await stateManager.getProjectState("my-app");
      expect(state!.artifacts[0].skill).toBe("strategic-scout");
    });

    it("adds activity log entry", async () => {
      await handleInit(["my-app"]);

      await executeTool("dojo_save_artifact", {
        filename: "output.md",
        content: "content",
        outputDir: "specs",
      });

      const state = await stateManager.getProjectState("my-app");
      const entry = state!.activityLog.find((e) => e.action === "artifact:specs");
      expect(entry).toBeTruthy();
      expect(entry!.summary).toContain("output-md");
      expect(entry!.summary).toContain("specs/");
    });

    it("rejects invalid outputDir", async () => {
      await handleInit(["my-app"]);

      const data = await executeTool("dojo_save_artifact", {
        filename: "output.md",
        content: "content",
        outputDir: "invalid-dir",
      });

      expect(data.error).toContain("Invalid output directory");
      expect(data.error).toContain("invalid-dir");
    });

    it("rejects when no active project", async () => {
      const data = await executeTool("dojo_save_artifact", {
        filename: "output.md",
        content: "content",
        outputDir: "scouts",
      });

      expect(data.error).toBe("No active project");
    });

    it("targets a specific project by projectId", async () => {
      await handleInit(["project-a"]);
      await handleInit(["project-b"]);

      await executeTool("dojo_save_artifact", {
        filename: "output.md",
        content: "targeted content",
        outputDir: "scouts",
        projectId: "project-a",
      });

      const basePath = `${tmpDir}/dojo-genesis/projects/project-a/scouts`;
      const content = await fs.readFile(`${basePath}/output-md`, "utf-8");
      expect(content).toBe("targeted content");
    });

    it("accepts all valid outputDir values", async () => {
      await handleInit(["my-app"]);

      const validDirs = ["scouts", "specs", "prompts", "retros", "tracks", "artifacts"];
      for (const dir of validDirs) {
        const data = await executeTool("dojo_save_artifact", {
          filename: `test-${dir}.md`,
          content: `content for ${dir}`,
          outputDir: dir,
        });
        expect(data.saved).toBe(true);
      }
    });
  });

  describe("dojo_update_state", () => {
    it("updates phase", async () => {
      await handleInit(["my-app"]);

      const data = await executeTool("dojo_update_state", { phase: "scouting" });
      expect(data.updated).toBe(true);
      expect(data.phase).toBe("scouting");

      const state = await stateManager.getProjectState("my-app");
      expect(state!.phase).toBe("scouting");
    });

    it("updates lastSkill", async () => {
      await handleInit(["my-app"]);

      await executeTool("dojo_update_state", { lastSkill: "strategic-scout" });

      const state = await stateManager.getProjectState("my-app");
      expect(state!.lastSkill).toBe("strategic-scout");
    });

    it("adds activity log entry when lastSkill is set", async () => {
      await handleInit(["my-app"]);

      await executeTool("dojo_update_state", { lastSkill: "strategic-scout" });

      const state = await stateManager.getProjectState("my-app");
      const entry = state!.activityLog.find((e) => e.action === "skill:strategic-scout");
      expect(entry).toBeTruthy();
      expect(entry!.summary).toBe("strategic-scout completed");
    });

    it("updates currentTrack", async () => {
      await handleInit(["my-app"]);

      await executeTool("dojo_update_state", { currentTrack: "track-a" });

      const state = await stateManager.getProjectState("my-app");
      expect(state!.currentTrack).toBe("track-a");
    });

    it("adds a track", async () => {
      await handleInit(["my-app"]);

      await executeTool("dojo_update_state", {
        addTrack: { id: "track-a", name: "Authentication" },
      });

      const state = await stateManager.getProjectState("my-app");
      expect(state!.tracks).toHaveLength(1);
      expect(state!.tracks[0].id).toBe("track-a");
      expect(state!.tracks[0].name).toBe("Authentication");
      expect(state!.tracks[0].status).toBe("pending");
      expect(state!.tracks[0].dependencies).toEqual([]);
      expect(state!.tracks[0].promptFile).toBeNull();
    });

    it("adds a track with dependencies", async () => {
      await handleInit(["my-app"]);

      await executeTool("dojo_update_state", {
        addTrack: { id: "track-b", name: "Dashboard", dependencies: ["track-a"] },
      });

      const state = await stateManager.getProjectState("my-app");
      expect(state!.tracks[0].dependencies).toEqual(["track-a"]);
    });

    it("adds a decision", async () => {
      await handleInit(["my-app"]);

      await executeTool("dojo_update_state", {
        addDecision: { topic: "Use JWT for auth", file: "decisions.md" },
      });

      const state = await stateManager.getProjectState("my-app");
      expect(state!.decisions).toHaveLength(1);
      expect(state!.decisions[0].topic).toBe("Use JWT for auth");
      expect(state!.decisions[0].file).toBe("decisions.md");
      expect(state!.decisions[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("adds a spec", async () => {
      await handleInit(["my-app"]);

      await executeTool("dojo_update_state", {
        addSpec: { version: "v1.0", file: "specs/v1.md" },
      });

      const state = await stateManager.getProjectState("my-app");
      expect(state!.specs).toHaveLength(1);
      expect(state!.specs[0].version).toBe("v1.0");
      expect(state!.specs[0].file).toBe("specs/v1.md");
    });

    it("updates multiple fields at once", async () => {
      await handleInit(["my-app"]);

      await executeTool("dojo_update_state", {
        phase: "decomposing",
        lastSkill: "parallel-tracks",
        currentTrack: "track-a",
        addTrack: { id: "track-a", name: "Foundation" },
      });

      const state = await stateManager.getProjectState("my-app");
      expect(state!.phase).toBe("decomposing");
      expect(state!.lastSkill).toBe("parallel-tracks");
      expect(state!.currentTrack).toBe("track-a");
      expect(state!.tracks).toHaveLength(1);
    });

    it("returns current phase when no phase param given", async () => {
      await handleInit(["my-app"]);

      const data = await executeTool("dojo_update_state", { lastSkill: "some-skill" });
      expect(data.phase).toBe("initialized");
    });

    it("rejects when no active project", async () => {
      const data = await executeTool("dojo_update_state", { phase: "scouting" });
      expect(data.error).toBe("No active project");
    });

    it("rejects when project not found", async () => {
      await handleInit(["my-app"]);

      const data = await executeTool("dojo_update_state", {
        phase: "scouting",
        projectId: "nonexistent",
      });
      expect(data.error).toContain("Project not found");
      expect(data.error).toContain("nonexistent");
    });

    it("targets a specific project by projectId", async () => {
      await handleInit(["project-a"]);
      await handleInit(["project-b"]);

      await executeTool("dojo_update_state", {
        phase: "scouting",
        projectId: "project-a",
      });

      const stateA = await stateManager.getProjectState("project-a");
      expect(stateA!.phase).toBe("scouting");

      const stateB = await stateManager.getProjectState("project-b");
      expect(stateB!.phase).toBe("initialized");
    });

    it("updates global metadata phase on phase change", async () => {
      await handleInit(["my-app"]);

      await executeTool("dojo_update_state", { phase: "specifying" });

      const global = await stateManager.getGlobalState();
      const meta = global.projects.find((p) => p.id === "my-app");
      expect(meta!.phase).toBe("specifying");
    });
  });
});
