import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { initStateManager } from "../../src/state/manager.js";
import { handleInit } from "../../src/commands/init.js";
import { handleArchive } from "../../src/commands/archive.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";

describe("handleArchive", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-archive-");
    initStateManager(tmpDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  it("archives an existing project", async () => {
    await handleInit(["my-app"]);
    const result = await handleArchive(["my-app"]);

    expect(result.text).toContain("**Project archived:** `my-app`");
    expect(result.text).toContain("--all");
  });

  it("sets archived flag in global state", async () => {
    await handleInit(["my-app"]);
    await handleArchive(["my-app"]);

    const globalRaw = await fs.readFile(`${tmpDir}/dojo-genesis/global-state.json`, "utf-8");
    const global = JSON.parse(globalRaw);
    expect(global.projects[0].archived).toBe(true);
  });

  it("clears activeProjectId when archiving the active project", async () => {
    await handleInit(["my-app"]);
    await handleArchive(["my-app"]);

    const globalRaw = await fs.readFile(`${tmpDir}/dojo-genesis/global-state.json`, "utf-8");
    const global = JSON.parse(globalRaw);
    expect(global.activeProjectId).toBeNull();
  });

  it("does not clear activeProjectId when archiving a non-active project", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);
    await handleArchive(["project-a"]);

    const globalRaw = await fs.readFile(`${tmpDir}/dojo-genesis/global-state.json`, "utf-8");
    const global = JSON.parse(globalRaw);
    expect(global.activeProjectId).toBe("project-b");
  });

  it("preserves project files on disk after archiving", async () => {
    await handleInit(["my-app"]);
    const basePath = `${tmpDir}/dojo-genesis/projects/my-app`;
    await handleArchive(["my-app"]);

    const stat = await fs.stat(basePath);
    expect(stat.isDirectory()).toBe(true);
    const projectMd = await fs.readFile(`${basePath}/PROJECT.md`, "utf-8");
    expect(projectMd).toContain("# my-app");
  });

  describe("error cases", () => {
    it("rejects missing project name", async () => {
      const result = await handleArchive([]);
      expect(result.text).toContain("Project name is required");
    });

    it("rejects nonexistent project", async () => {
      const result = await handleArchive(["nonexistent"]);
      expect(result.text).toContain("not found");
    });

    it("rejects already-archived project", async () => {
      await handleInit(["my-app"]);
      await handleArchive(["my-app"]);
      const result = await handleArchive(["my-app"]);
      expect(result.text).toContain("already archived");
    });
  });
});
