import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DojoStateManager } from "../../src/state/manager.js";
import { writeJsonFile } from "../../src/utils/file-ops.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";
import type { ProjectMetadata, ProjectState } from "../../src/state/types.js";

describe("DojoStateManager", () => {
  let tmpDir: string;
  let manager: DojoStateManager;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-manager-");
    manager = new DojoStateManager(tmpDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  function makeProjectMeta(id: string, overrides?: Partial<ProjectMetadata>): ProjectMetadata {
    const now = new Date().toISOString();
    return {
      id,
      name: id,
      description: "",
      phase: "initialized",
      createdAt: now,
      lastAccessedAt: now,
      archived: false,
      ...overrides,
    };
  }

  function makeProjectState(id: string, overrides?: Partial<ProjectState>): ProjectState {
    const now = new Date().toISOString();
    return {
      projectId: id,
      phase: "initialized",
      tracks: [],
      decisions: [],
      specs: [],
      artifacts: [],
      currentTrack: null,
      lastSkill: "",
      pendingAction: null,
      activityLog: [],
      lastUpdated: now,
      ...overrides,
    };
  }

  describe("getGlobalState", () => {
    it("returns default state on first access", async () => {
      const state = await manager.getGlobalState();
      expect(state.version).toBe("1.0.0");
      expect(state.activeProjectId).toBeNull();
      expect(state.projects).toEqual([]);
      expect(state.lastUpdated).toBeTruthy();
    });

    it("returns cached state on second access", async () => {
      const first = await manager.getGlobalState();
      const second = await manager.getGlobalState();
      expect(first).toBe(second);
    });
  });

  describe("addProject", () => {
    it("adds project to global state and sets it as active", async () => {
      const meta = makeProjectMeta("my-app");
      await manager.addProject(meta);

      const state = await manager.getGlobalState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0].id).toBe("my-app");
      expect(state.activeProjectId).toBe("my-app");
    });

    it("adds multiple projects", async () => {
      await manager.addProject(makeProjectMeta("project-a"));
      await manager.addProject(makeProjectMeta("project-b"));

      const state = await manager.getGlobalState();
      expect(state.projects).toHaveLength(2);
      expect(state.activeProjectId).toBe("project-b");
    });
  });

  describe("setActiveProject", () => {
    it("sets active project and updates lastAccessedAt", async () => {
      const meta = makeProjectMeta("my-app");
      await manager.addProject(meta);

      const beforeSwitch = meta.lastAccessedAt;
      await new Promise((r) => setTimeout(r, 10));
      await manager.setActiveProject("my-app");

      const state = await manager.getGlobalState();
      expect(state.activeProjectId).toBe("my-app");
      expect(state.projects[0].lastAccessedAt).not.toBe(beforeSwitch);
    });

    it("sets active project to null", async () => {
      await manager.addProject(makeProjectMeta("my-app"));
      await manager.setActiveProject(null);

      const state = await manager.getGlobalState();
      expect(state.activeProjectId).toBeNull();
    });
  });

  describe("getProjectState", () => {
    it("returns null when no active project", async () => {
      const state = await manager.getProjectState();
      expect(state).toBeNull();
    });

    it("returns null when project state file does not exist", async () => {
      await manager.addProject(makeProjectMeta("my-app"));
      const state = await manager.getProjectState("my-app");
      expect(state).toBeNull();
    });

    it("reads project state from disk", async () => {
      const projectState = makeProjectState("my-app");
      await writeJsonFile(
        `${manager.getBasePath()}/projects/my-app/state.json`,
        projectState,
      );
      await manager.addProject(makeProjectMeta("my-app"));

      const state = await manager.getProjectState("my-app");
      expect(state).not.toBeNull();
      expect(state!.projectId).toBe("my-app");
      expect(state!.phase).toBe("initialized");
    });

    it("uses active project when no projectId specified", async () => {
      const projectState = makeProjectState("my-app");
      await writeJsonFile(
        `${manager.getBasePath()}/projects/my-app/state.json`,
        projectState,
      );
      await manager.addProject(makeProjectMeta("my-app"));

      const state = await manager.getProjectState();
      expect(state).not.toBeNull();
      expect(state!.projectId).toBe("my-app");
    });

    it("returns cached state on second read", async () => {
      const projectState = makeProjectState("my-app");
      await writeJsonFile(
        `${manager.getBasePath()}/projects/my-app/state.json`,
        projectState,
      );
      await manager.addProject(makeProjectMeta("my-app"));

      const first = await manager.getProjectState("my-app");
      const second = await manager.getProjectState("my-app");
      expect(first).toBe(second);
    });
  });

  describe("updateProjectState", () => {
    it("updates project state and cache", async () => {
      const projectState = makeProjectState("my-app");
      await writeJsonFile(
        `${manager.getBasePath()}/projects/my-app/state.json`,
        projectState,
      );
      await manager.addProject(makeProjectMeta("my-app"));

      await manager.updateProjectState("my-app", { phase: "scouting" });

      const state = await manager.getProjectState("my-app");
      expect(state!.phase).toBe("scouting");
    });

    it("syncs phase to global metadata", async () => {
      const projectState = makeProjectState("my-app");
      await writeJsonFile(
        `${manager.getBasePath()}/projects/my-app/state.json`,
        projectState,
      );
      await manager.addProject(makeProjectMeta("my-app"));

      await manager.updateProjectState("my-app", { phase: "specifying" });

      const global = await manager.getGlobalState();
      expect(global.projects[0].phase).toBe("specifying");
    });

    it("throws when project not found", async () => {
      await expect(
        manager.updateProjectState("nonexistent", { phase: "scouting" }),
      ).rejects.toThrow("Project not found: nonexistent");
    });

    it("preserves existing fields when updating partial state", async () => {
      const projectState = makeProjectState("my-app", {
        tracks: [
          { id: "track-a", name: "Track A", status: "pending", dependencies: [], promptFile: null },
        ],
      });
      await writeJsonFile(
        `${manager.getBasePath()}/projects/my-app/state.json`,
        projectState,
      );
      await manager.addProject(makeProjectMeta("my-app"));

      await manager.updateProjectState("my-app", { phase: "scouting" });

      const state = await manager.getProjectState("my-app");
      expect(state!.tracks).toHaveLength(1);
      expect(state!.tracks[0].id).toBe("track-a");
    });
  });

  describe("addActivity", () => {
    it("adds activity entry to the log", async () => {
      const projectState = makeProjectState("my-app");
      await writeJsonFile(
        `${manager.getBasePath()}/projects/my-app/state.json`,
        projectState,
      );
      await manager.addProject(makeProjectMeta("my-app"));

      await manager.addActivity("my-app", "command:init", "Project created");

      const state = await manager.getProjectState("my-app");
      expect(state!.activityLog).toHaveLength(1);
      expect(state!.activityLog[0].action).toBe("command:init");
      expect(state!.activityLog[0].summary).toBe("Project created");
    });

    it("prepends new entries (most recent first)", async () => {
      const projectState = makeProjectState("my-app");
      await writeJsonFile(
        `${manager.getBasePath()}/projects/my-app/state.json`,
        projectState,
      );
      await manager.addProject(makeProjectMeta("my-app"));

      await manager.addActivity("my-app", "command:init", "First");
      await manager.addActivity("my-app", "command:scout", "Second");

      const state = await manager.getProjectState("my-app");
      expect(state!.activityLog[0].summary).toBe("Second");
      expect(state!.activityLog[1].summary).toBe("First");
    });

    it("caps activity log at 50 entries", async () => {
      const entries = Array.from({ length: 55 }, (_, i) => ({
        timestamp: new Date().toISOString(),
        action: `action-${i}`,
        summary: `Entry ${i}`,
      }));
      const projectState = makeProjectState("my-app", { activityLog: entries });
      await writeJsonFile(
        `${manager.getBasePath()}/projects/my-app/state.json`,
        projectState,
      );
      await manager.addProject(makeProjectMeta("my-app"));

      await manager.addActivity("my-app", "new-action", "New entry");

      const state = await manager.getProjectState("my-app");
      expect(state!.activityLog).toHaveLength(50);
      expect(state!.activityLog[0].summary).toBe("New entry");
    });

    it("no-ops when project not found", async () => {
      await expect(
        manager.addActivity("nonexistent", "test", "test"),
      ).resolves.toBeUndefined();
    });
  });

  describe("persistence", () => {
    it("persists global state across manager instances", async () => {
      await manager.addProject(makeProjectMeta("my-app"));

      const manager2 = new DojoStateManager(tmpDir);
      const state = await manager2.getGlobalState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0].id).toBe("my-app");
      expect(state.activeProjectId).toBe("my-app");
    });

    it("persists project state across manager instances", async () => {
      const projectState = makeProjectState("my-app");
      await writeJsonFile(
        `${manager.getBasePath()}/projects/my-app/state.json`,
        projectState,
      );
      await manager.addProject(makeProjectMeta("my-app"));
      await manager.updateProjectState("my-app", { phase: "scouting" });

      const manager2 = new DojoStateManager(tmpDir);
      const state = await manager2.getProjectState("my-app");
      expect(state!.phase).toBe("scouting");
    });
  });
});
