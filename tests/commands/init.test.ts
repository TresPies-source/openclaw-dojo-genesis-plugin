import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { initStateManager, stateManager as getManager } from "../../src/state/manager.js";
import { handleInit } from "../../src/commands/init.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";

describe("handleInit", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-init-");
    initStateManager(tmpDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  it("creates a project with correct response", async () => {
    const result = await handleInit(["my-app"]);
    expect(result.text).toContain("**Project created:** `my-app`");
    expect(result.text).toContain("**Phase:** initialized");
    expect(result.text).toContain("**Active:** yes");
  });

  it("creates all required directories", async () => {
    await handleInit(["my-app"]);
    const basePath = `${tmpDir}/dojo-genesis/projects/my-app`;

    const dirs = ["scouts", "specs", "prompts", "retros", "tracks", "artifacts"];
    for (const dir of dirs) {
      const stat = await fs.stat(`${basePath}/${dir}`);
      expect(stat.isDirectory()).toBe(true);
    }
  });

  it("creates PROJECT.md with correct content", async () => {
    await handleInit(["my-app"]);
    const basePath = `${tmpDir}/dojo-genesis/projects/my-app`;

    const content = await fs.readFile(`${basePath}/PROJECT.md`, "utf-8");
    expect(content).toContain("# my-app");
    expect(content).toContain("**Phase:** initialized");
    expect(content).toContain("## Activity Log");
    expect(content).toContain("Project created");
  });

  it("creates PROJECT.md with description when provided", async () => {
    await handleInit(["my-app", "--desc", "A mobile redesign project"]);
    const basePath = `${tmpDir}/dojo-genesis/projects/my-app`;

    const content = await fs.readFile(`${basePath}/PROJECT.md`, "utf-8");
    expect(content).toContain("A mobile redesign project");
  });

  it("creates decisions.md", async () => {
    await handleInit(["my-app"]);
    const basePath = `${tmpDir}/dojo-genesis/projects/my-app`;

    const content = await fs.readFile(`${basePath}/decisions.md`, "utf-8");
    expect(content).toContain("# Decision Log: my-app");
  });

  it("persists project state to state.json", async () => {
    await handleInit(["my-app"]);
    const basePath = `${tmpDir}/dojo-genesis/projects/my-app`;

    const raw = await fs.readFile(`${basePath}/state.json`, "utf-8");
    const state = JSON.parse(raw);
    expect(state.projectId).toBe("my-app");
    expect(state.phase).toBe("initialized");
    expect(state.activityLog).toHaveLength(1);
    expect(state.activityLog[0].action).toBe("command:init");
  });

  it("sets the project as active in global state", async () => {
    await handleInit(["my-app"]);
    const globalRaw = await fs.readFile(`${tmpDir}/dojo-genesis/global-state.json`, "utf-8");
    const global = JSON.parse(globalRaw);
    expect(global.activeProjectId).toBe("my-app");
    expect(global.projects).toHaveLength(1);
    expect(global.projects[0].id).toBe("my-app");
  });

  it("parses --desc flag with multiple words", async () => {
    await handleInit(["my-app", "--desc", "This", "is", "a", "description"]);
    const globalRaw = await fs.readFile(`${tmpDir}/dojo-genesis/global-state.json`, "utf-8");
    const global = JSON.parse(globalRaw);
    expect(global.projects[0].description).toBe("This is a description");
  });

  it("strips quotes from --desc value", async () => {
    await handleInit(["my-app", "--desc", '"Quoted description"']);
    const globalRaw = await fs.readFile(`${tmpDir}/dojo-genesis/global-state.json`, "utf-8");
    const global = JSON.parse(globalRaw);
    expect(global.projects[0].description).toBe("Quoted description");
  });

  describe("error cases", () => {
    it("rejects missing project name", async () => {
      const result = await handleInit([]);
      expect(result.text).toContain("Invalid project name");
      expect(result.text).toContain("required");
    });

    it("rejects undefined project name", async () => {
      const result = await handleInit([undefined as unknown as string]);
      expect(result.text).toContain("Invalid project name");
    });

    it("rejects uppercase names", async () => {
      const result = await handleInit(["MyApp"]);
      expect(result.text).toContain("Invalid project name");
    });

    it("rejects names with special characters", async () => {
      const result = await handleInit(["my_app!"]);
      expect(result.text).toContain("Invalid project name");
    });

    it("rejects path traversal attempts", async () => {
      const result = await handleInit(["../../etc/passwd"]);
      expect(result.text).toContain("Invalid project name");
    });

    it("rejects empty string", async () => {
      const result = await handleInit([""]);
      expect(result.text).toContain("Invalid project name");
    });

    it("rejects names that are too long", async () => {
      const result = await handleInit(["a".repeat(100)]);
      expect(result.text).toContain("Invalid project name");
    });

    it("rejects names with consecutive hyphens", async () => {
      const result = await handleInit(["my--app"]);
      expect(result.text).toContain("consecutive hyphens");
    });

    it("rejects single character names", async () => {
      const result = await handleInit(["a"]);
      expect(result.text).toContain("Invalid project name");
    });

    it("rejects duplicate project name", async () => {
      await handleInit(["my-app"]);
      const result = await handleInit(["my-app"]);
      expect(result.text).toContain("already exists");
      expect(result.text).toContain("/dojo switch my-app");
    });

    it("allows reuse of archived project name", async () => {
      await handleInit(["my-app"]);
      await getManager.archiveProject("my-app");

      const result = await handleInit(["my-app"]);
      expect(result.text).toContain("**Project created:** `my-app`");
    });
  });
});
