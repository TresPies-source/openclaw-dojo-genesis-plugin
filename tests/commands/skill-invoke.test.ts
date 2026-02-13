import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { initStateManager } from "../../src/state/manager.js";
import { handleInit } from "../../src/commands/init.js";
import { handleSkillInvoke } from "../../src/commands/skill-invoke.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";

describe("handleSkillInvoke", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-skill-invoke-");
    initStateManager(tmpDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  it("writes pendingAction with correct skill and args", async () => {
    await handleInit(["my-app"]);

    await handleSkillInvoke("strategic-scout", ["native", "vs", "PWA"]);

    const raw = await fs.readFile(`${tmpDir}/dojo-genesis-plugin/projects/my-app/state.json`, "utf-8");
    const state = JSON.parse(raw);
    expect(state.pendingAction).not.toBeNull();
    expect(state.pendingAction.skill).toBe("strategic-scout");
    expect(state.pendingAction.args).toBe("native vs PWA");
    expect(state.pendingAction.requestedAt).toBeTruthy();
  });

  it("returns confirmation text with skill name and project", async () => {
    await handleInit(["my-app"]);

    const result = await handleSkillInvoke("strategic-scout", ["some", "tension"]);
    expect(result.text).toContain("**Starting strategic-scout**");
    expect(result.text).toContain("`my-app`");
    expect(result.text).toContain("initialized");
  });

  it("adds activity log entry", async () => {
    await handleInit(["my-app"]);

    await handleSkillInvoke("release-specification", ["mobile-redesign"]);

    const raw = await fs.readFile(`${tmpDir}/dojo-genesis-plugin/projects/my-app/state.json`, "utf-8");
    const state = JSON.parse(raw);
    const entry = state.activityLog.find(
      (e: { action: string }) => e.action === "command:release-specification",
    );
    expect(entry).toBeTruthy();
    expect(entry.summary).toBe("Requested release-specification");
  });

  it("targets a specific project with @project syntax", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);

    await handleSkillInvoke("parallel-tracks", ["@project-a"]);

    const rawA = await fs.readFile(`${tmpDir}/dojo-genesis-plugin/projects/project-a/state.json`, "utf-8");
    const stateA = JSON.parse(rawA);
    expect(stateA.pendingAction).not.toBeNull();
    expect(stateA.pendingAction.skill).toBe("parallel-tracks");

    const rawB = await fs.readFile(`${tmpDir}/dojo-genesis-plugin/projects/project-b/state.json`, "utf-8");
    const stateB = JSON.parse(rawB);
    expect(stateB.pendingAction).toBeNull();
  });

  it("strips @project from args when targeting", async () => {
    await handleInit(["project-a"]);

    await handleSkillInvoke("strategic-scout", ["@project-a", "some", "tension"]);

    const raw = await fs.readFile(`${tmpDir}/dojo-genesis-plugin/projects/project-a/state.json`, "utf-8");
    const state = JSON.parse(raw);
    expect(state.pendingAction.args).toBe("some tension");
  });

  it("handles empty args", async () => {
    await handleInit(["my-app"]);

    const result = await handleSkillInvoke("parallel-tracks", []);
    expect(result.text).toContain("**Starting parallel-tracks**");

    const raw = await fs.readFile(`${tmpDir}/dojo-genesis-plugin/projects/my-app/state.json`, "utf-8");
    const state = JSON.parse(raw);
    expect(state.pendingAction.args).toBe("");
  });

  describe("error cases", () => {
    it("returns error when no active project", async () => {
      const result = await handleSkillInvoke("strategic-scout", ["some", "tension"]);
      expect(result.text).toContain("No active project");
      expect(result.text).toContain("/dojo init");
    });

    it("returns error when targeted project does not exist", async () => {
      await handleInit(["my-app"]);

      const result = await handleSkillInvoke("strategic-scout", ["@nonexistent", "tension"]);
      expect(result.text).toContain("not found");
      expect(result.text).toContain("nonexistent");
    });
  });
});
