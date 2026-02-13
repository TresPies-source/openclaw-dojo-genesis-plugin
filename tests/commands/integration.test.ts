import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { initStateManager } from "../../src/state/manager.js";
import { handleInit } from "../../src/commands/init.js";
import { handleStatus } from "../../src/commands/status.js";
import { handleList } from "../../src/commands/list.js";
import { handleSwitch } from "../../src/commands/switch.js";
import { handleArchive } from "../../src/commands/archive.js";
import { handleSkillInvoke } from "../../src/commands/skill-invoke.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";

describe("Command integration", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-integration-");
    initStateManager(tmpDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  it("full deterministic command lifecycle", async () => {
    const initResult = await handleInit(["test-project"]);
    expect(initResult.text).toContain("**Project created:** `test-project`");

    const statusResult = await handleStatus([]);
    expect(statusResult.text).toContain("**Project:** `test-project`");
    expect(statusResult.text).toContain("initialized");

    const listResult = await handleList([]);
    expect(listResult.text).toContain("test-project");
    expect(listResult.text).toContain(">>>");

    const initB = await handleInit(["project-b"]);
    expect(initB.text).toContain("**Project created:** `project-b`");

    const listTwo = await handleList([]);
    expect(listTwo.text).toContain("test-project");
    expect(listTwo.text).toContain("project-b");
    const linesTwo = listTwo.text.split("\n");
    const lineA = linesTwo.find((l) => l.includes("test-project"));
    const lineB = linesTwo.find((l) => l.includes("project-b"));
    expect(lineA).not.toContain(">>>");
    expect(lineB).toContain(">>>");

    const switchResult = await handleSwitch(["test-project"]);
    expect(switchResult.text).toContain("**Switched to:** `test-project`");

    const statusAfterSwitch = await handleStatus([]);
    expect(statusAfterSwitch.text).toContain("**Project:** `test-project`");

    const archiveResult = await handleArchive(["test-project"]);
    expect(archiveResult.text).toContain("**Project archived:** `test-project`");

    const listAfterArchive = await handleList([]);
    expect(listAfterArchive.text).not.toContain("test-project");
    expect(listAfterArchive.text).toContain("project-b");

    const listAll = await handleList(["--all"]);
    expect(listAll.text).toContain("test-project");
    expect(listAll.text).toContain("project-b");
  });

  it("file system state is correct after lifecycle", async () => {
    await handleInit(["test-project"]);
    await handleInit(["project-b"]);

    const basePath = `${tmpDir}/dojo-genesis`;

    const globalRaw = await fs.readFile(`${basePath}/global-state.json`, "utf-8");
    const global = JSON.parse(globalRaw);
    expect(global.projects).toHaveLength(2);
    expect(global.activeProjectId).toBe("project-b");

    for (const name of ["test-project", "project-b"]) {
      const projectDir = `${basePath}/projects/${name}`;
      const stat = await fs.stat(projectDir);
      expect(stat.isDirectory()).toBe(true);

      const stateRaw = await fs.readFile(`${projectDir}/state.json`, "utf-8");
      const state = JSON.parse(stateRaw);
      expect(state.projectId).toBe(name);
      expect(state.phase).toBe("initialized");

      const projectMd = await fs.readFile(`${projectDir}/PROJECT.md`, "utf-8");
      expect(projectMd).toContain(`# ${name}`);

      const dirs = ["scouts", "specs", "prompts", "retros", "tracks", "artifacts"];
      for (const dir of dirs) {
        const dirStat = await fs.stat(`${projectDir}/${dir}`);
        expect(dirStat.isDirectory()).toBe(true);
      }
    }

    await handleSwitch(["test-project"]);
    const globalAfter = JSON.parse(await fs.readFile(`${basePath}/global-state.json`, "utf-8"));
    expect(globalAfter.activeProjectId).toBe("test-project");

    await handleArchive(["test-project"]);
    const globalArchived = JSON.parse(await fs.readFile(`${basePath}/global-state.json`, "utf-8"));
    expect(globalArchived.activeProjectId).toBeNull();
    expect(globalArchived.projects.find((p: { id: string }) => p.id === "test-project").archived).toBe(true);

    const archivedDir = await fs.stat(`${basePath}/projects/test-project`);
    expect(archivedDir.isDirectory()).toBe(true);
  });

  it("@project targeting for status", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);

    const statusA = await handleStatus(["@project-a"]);
    expect(statusA.text).toContain("**Project:** `project-a`");

    const statusDefault = await handleStatus([]);
    expect(statusDefault.text).toContain("**Project:** `project-b`");
  });

  it("@project targeting for skill-invoke", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);

    const result = await handleSkillInvoke("strategic-scout", ["@project-a", "native", "vs", "PWA"]);
    expect(result.text).toContain("**Starting strategic-scout**");
    expect(result.text).toContain("`project-a`");

    const rawA = await fs.readFile(`${tmpDir}/dojo-genesis/projects/project-a/state.json`, "utf-8");
    const stateA = JSON.parse(rawA);
    expect(stateA.pendingAction).not.toBeNull();
    expect(stateA.pendingAction.skill).toBe("strategic-scout");
    expect(stateA.pendingAction.args).toBe("native vs PWA");

    const rawB = await fs.readFile(`${tmpDir}/dojo-genesis/projects/project-b/state.json`, "utf-8");
    const stateB = JSON.parse(rawB);
    expect(stateB.pendingAction).toBeNull();
  });

  it("skill-invoke uses active project when no @project given", async () => {
    await handleInit(["my-app"]);

    const result = await handleSkillInvoke("release-specification", ["mobile-redesign"]);
    expect(result.text).toContain("`my-app`");

    const raw = await fs.readFile(`${tmpDir}/dojo-genesis/projects/my-app/state.json`, "utf-8");
    const state = JSON.parse(raw);
    expect(state.pendingAction.skill).toBe("release-specification");
    expect(state.pendingAction.args).toBe("mobile-redesign");
  });

  it("skill-invoke after switch targets the new active project", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);
    await handleSwitch(["project-a"]);

    const result = await handleSkillInvoke("retrospective", []);
    expect(result.text).toContain("`project-a`");

    const raw = await fs.readFile(`${tmpDir}/dojo-genesis/projects/project-a/state.json`, "utf-8");
    const state = JSON.parse(raw);
    expect(state.pendingAction.skill).toBe("retrospective");
  });

  it("status reflects activity from skill-invoke", async () => {
    await handleInit(["my-app"]);
    await handleSkillInvoke("strategic-scout", ["some", "tension"]);

    const status = await handleStatus([]);
    expect(status.text).toContain("Requested strategic-scout");
  });

  it("multi-project isolation", async () => {
    await handleInit(["alpha"]);
    await handleSkillInvoke("strategic-scout", ["tension-a"]);

    await handleInit(["bravo"]);
    await handleSkillInvoke("release-specification", ["feature-b"]);

    const rawAlpha = await fs.readFile(`${tmpDir}/dojo-genesis/projects/alpha/state.json`, "utf-8");
    const stateAlpha = JSON.parse(rawAlpha);
    expect(stateAlpha.pendingAction.skill).toBe("strategic-scout");
    expect(stateAlpha.pendingAction.args).toBe("tension-a");

    const rawBravo = await fs.readFile(`${tmpDir}/dojo-genesis/projects/bravo/state.json`, "utf-8");
    const stateBravo = JSON.parse(rawBravo);
    expect(stateBravo.pendingAction.skill).toBe("release-specification");
    expect(stateBravo.pendingAction.args).toBe("feature-b");
  });

  it("archiving active project then status returns no-active-project", async () => {
    await handleInit(["my-app"]);
    await handleArchive(["my-app"]);

    const status = await handleStatus([]);
    expect(status.text).toContain("No active project");
  });

  it("switch after archive restores active project", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);
    await handleArchive(["project-b"]);

    const status = await handleStatus([]);
    expect(status.text).toContain("No active project");

    await handleSwitch(["project-a"]);
    const statusAfter = await handleStatus([]);
    expect(statusAfter.text).toContain("**Project:** `project-a`");
  });

  it("all five skill-invoke commands write correct pendingAction", async () => {
    const skills: Array<[string, string[]]> = [
      ["strategic-scout", ["tension"]],
      ["release-specification", ["feature"]],
      ["parallel-tracks", []],
      ["implementation-prompt", []],
      ["retrospective", []],
    ];

    for (const [skill, args] of skills) {
      initStateManager(await createTempDir("dojo-skill-all-"));
      await handleInit(["test-proj"]);

      const result = await handleSkillInvoke(skill, args);
      expect(result.text).toContain(`**Starting ${skill}**`);

      const stateManager = (await import("../../src/state/manager.js")).stateManager;
      const state = await stateManager.getProjectState("test-proj");
      expect(state?.pendingAction?.skill).toBe(skill);
    }
  });
});
