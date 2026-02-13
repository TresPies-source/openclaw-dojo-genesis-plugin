import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { initStateManager } from "../../src/state/manager.js";
import { handleInit } from "../../src/commands/init.js";
import { handleSwitch } from "../../src/commands/switch.js";
import { handleArchive } from "../../src/commands/archive.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";

describe("handleSwitch", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-switch-");
    initStateManager(tmpDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  it("switches to an existing project", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);

    const result = await handleSwitch(["project-a"]);
    expect(result.text).toContain("**Switched to:** `project-a`");
    expect(result.text).toContain("**Phase:** initialized");
  });

  it("updates activeProjectId in global state", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);

    await handleSwitch(["project-a"]);

    const globalRaw = await fs.readFile(`${tmpDir}/dojo-genesis-plugin/global-state.json`, "utf-8");
    const global = JSON.parse(globalRaw);
    expect(global.activeProjectId).toBe("project-a");
  });

  it("updates lastAccessedAt on the target project", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);

    const beforeRaw = await fs.readFile(`${tmpDir}/dojo-genesis-plugin/global-state.json`, "utf-8");
    const beforeGlobal = JSON.parse(beforeRaw);
    const beforeAccess = beforeGlobal.projects.find((p: { id: string }) => p.id === "project-a").lastAccessedAt;

    await new Promise((r) => setTimeout(r, 10));
    await handleSwitch(["project-a"]);

    const afterRaw = await fs.readFile(`${tmpDir}/dojo-genesis-plugin/global-state.json`, "utf-8");
    const afterGlobal = JSON.parse(afterRaw);
    const afterAccess = afterGlobal.projects.find((p: { id: string }) => p.id === "project-a").lastAccessedAt;

    expect(afterAccess >= beforeAccess).toBe(true);
  });

  describe("error cases", () => {
    it("rejects missing project name", async () => {
      const result = await handleSwitch([]);
      expect(result.text).toContain("Project name is required");
    });

    it("rejects nonexistent project", async () => {
      const result = await handleSwitch(["nonexistent"]);
      expect(result.text).toContain("not found");
    });

    it("rejects archived project", async () => {
      await handleInit(["my-app"]);
      await handleArchive(["my-app"]);

      const result = await handleSwitch(["my-app"]);
      expect(result.text).toContain("archived");
    });
  });
});
