import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initStateManager } from "../../src/state/manager.js";
import { handleInit } from "../../src/commands/init.js";
import { handleArchive } from "../../src/commands/archive.js";
import { handleList } from "../../src/commands/list.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";

describe("handleList", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-list-");
    initStateManager(tmpDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  it("shows empty message when no projects exist", async () => {
    const result = await handleList([]);
    expect(result.text).toContain("No projects");
    expect(result.text).toContain("/dojo init");
  });

  it("lists a single project", async () => {
    await handleInit(["my-app"]);
    const result = await handleList([]);

    expect(result.text).toContain("my-app");
    expect(result.text).toContain("initialized");
    expect(result.text).toContain(">>>");
  });

  it("lists multiple projects", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);
    const result = await handleList([]);

    expect(result.text).toContain("project-a");
    expect(result.text).toContain("project-b");
  });

  it("shows active indicator on the correct project", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);
    const result = await handleList([]);

    const lines = result.text.split("\n");
    const lineA = lines.find((l) => l.includes("project-a"));
    const lineB = lines.find((l) => l.includes("project-b"));

    expect(lineA).not.toContain(">>>");
    expect(lineB).toContain(">>>");
  });

  it("hides archived projects by default", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);
    await handleArchive(["project-a"]);

    const result = await handleList([]);
    expect(result.text).not.toContain("project-a");
    expect(result.text).toContain("project-b");
  });

  it("shows archived projects with --all flag", async () => {
    await handleInit(["project-a"]);
    await handleInit(["project-b"]);
    await handleArchive(["project-a"]);

    const result = await handleList(["--all"]);
    expect(result.text).toContain("project-a");
    expect(result.text).toContain("project-b");
  });

  it("shows empty message when all projects are archived and --all not used", async () => {
    await handleInit(["my-app"]);
    await handleArchive(["my-app"]);

    const result = await handleList([]);
    expect(result.text).toContain("No projects");
  });

  it("renders as a markdown table", async () => {
    await handleInit(["my-app"]);
    const result = await handleList([]);

    expect(result.text).toContain("| Project |");
    expect(result.text).toContain("| Phase |");
    expect(result.text).toContain("| Last Active |");
    expect(result.text).toContain("|---------|");
  });
});
