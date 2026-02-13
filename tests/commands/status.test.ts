import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initStateManager, stateManager as getManager } from "../../src/state/manager.js";
import { handleInit } from "../../src/commands/init.js";
import { handleStatus } from "../../src/commands/status.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";
import type { Track } from "../../src/state/types.js";

describe("handleStatus", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-status-");
    initStateManager(tmpDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  it("shows status for the active project", async () => {
    await handleInit(["my-app"]);
    const result = await handleStatus([]);

    expect(result.text).toContain("**Project:** `my-app`");
    expect(result.text).toContain("**Phase:** [ ] initialized");
    expect(result.text).toContain("**Last updated:**");
  });

  it("shows recent activity", async () => {
    await handleInit(["my-app"]);
    const result = await handleStatus([]);

    expect(result.text).toContain("**Recent activity:**");
    expect(result.text).toContain("Project created");
  });

  it("shows next action suggestion for initialized phase", async () => {
    await handleInit(["my-app"]);
    const result = await handleStatus([]);

    expect(result.text).toContain("**Suggested next:**");
    expect(result.text).toContain("/dojo scout");
  });

  it("shows next action suggestion for each phase", async () => {
    await handleInit(["my-app"]);

    const phases = [
      { phase: "scouting", expected: "/dojo spec" },
      { phase: "specifying", expected: "/dojo tracks" },
      { phase: "decomposing", expected: "/dojo commission" },
      { phase: "commissioning", expected: "Hand off prompts" },
      { phase: "implementing", expected: "/dojo retro" },
      { phase: "retrospective", expected: "/dojo init" },
    ] as const;

    for (const { phase, expected } of phases) {
      await getManager.updateProjectState("my-app", { phase });
      const result = await handleStatus([]);
      expect(result.text).toContain(expected);
    }
  });

  it("supports @project targeting", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);

    const result = await handleStatus(["@project-a"]);
    expect(result.text).toContain("**Project:** `project-a`");
  });

  it("shows tracks when present", async () => {
    await handleInit(["my-app"]);

    const tracks: Track[] = [
      { id: "track-a", name: "Auth System", status: "in-progress", dependencies: [], promptFile: null },
      { id: "track-b", name: "Dashboard", status: "pending", dependencies: ["track-a"], promptFile: null },
    ];
    await getManager.updateProjectState("my-app", { tracks });

    const result = await handleStatus([]);
    expect(result.text).toContain("**Tracks:**");
    expect(result.text).toContain("track-a");
    expect(result.text).toContain("Auth System");
    expect(result.text).toContain("in-progress");
    expect(result.text).toContain("track-b");
    expect(result.text).toContain("Dashboard");
    expect(result.text).toContain("track-a");
  });

  it("does not show tracks section when no tracks exist", async () => {
    await handleInit(["my-app"]);
    const result = await handleStatus([]);
    expect(result.text).not.toContain("**Tracks:**");
  });

  it("shows at most 5 recent activity entries", async () => {
    await handleInit(["my-app"]);

    for (let i = 0; i < 10; i++) {
      await getManager.addActivity("my-app", `action:${i}`, `Activity ${i}`);
    }

    const result = await handleStatus([]);
    const activityMatches = result.text.match(/Activity \d/g) || [];
    expect(activityMatches.length).toBeLessThanOrEqual(5);
  });

  describe("error cases", () => {
    it("returns error when no active project", async () => {
      const result = await handleStatus([]);
      expect(result.text).toContain("No active project");
      expect(result.text).toContain("/dojo init");
    });

    it("returns error when @project does not exist", async () => {
      const result = await handleStatus(["@nonexistent"]);
      expect(result.text).toContain("No active project");
    });
  });
});
