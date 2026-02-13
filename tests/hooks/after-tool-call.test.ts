import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { initStateManager, stateManager } from "../../src/state/manager.js";
import { handleInit } from "../../src/commands/init.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";
import type { HookEvent } from "../__mocks__/openclaw-types.js";
import handler from "../../hooks/after-tool-call/handler.js";

describe("after-tool-call hook", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-hook-atc-");
    initStateManager(tmpDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  function createEvent(overrides: Partial<HookEvent> = {}): HookEvent {
    return {
      type: "agent",
      messages: [],
      ...overrides,
    };
  }

  it("updates PROJECT.md on phase change via dojo_update_state", async () => {
    await handleInit(["test-project"]);

    const event = createEvent({
      context: {
        toolName: "dojo_update_state",
        toolParams: { phase: "scouting" },
      },
    });
    await handler(event);

    const basePath = stateManager.getBasePath();
    const content = await fs.readFile(`${basePath}/projects/test-project/PROJECT.md`, "utf-8");
    expect(content).toContain("**Phase:** scouting");
    expect(content).toContain("Phase changed to scouting");
  });

  it("no-op for non-monitored tools", async () => {
    await handleInit(["test-project"]);

    const basePath = stateManager.getBasePath();
    const before = await fs.readFile(`${basePath}/projects/test-project/PROJECT.md`, "utf-8");

    const event = createEvent({
      context: {
        toolName: "some_other_tool",
        toolParams: { phase: "scouting" },
      },
    });
    await handler(event);

    const after = await fs.readFile(`${basePath}/projects/test-project/PROJECT.md`, "utf-8");
    expect(after).toBe(before);
  });

  it("no-op when event type is not agent", async () => {
    await handleInit(["test-project"]);

    const basePath = stateManager.getBasePath();
    const before = await fs.readFile(`${basePath}/projects/test-project/PROJECT.md`, "utf-8");

    const event = createEvent({
      type: "other",
      context: {
        toolName: "dojo_update_state",
        toolParams: { phase: "scouting" },
      },
    });
    await handler(event);

    const after = await fs.readFile(`${basePath}/projects/test-project/PROJECT.md`, "utf-8");
    expect(after).toBe(before);
  });

  it("no-op when no phase param in dojo_update_state", async () => {
    await handleInit(["test-project"]);

    const basePath = stateManager.getBasePath();
    const before = await fs.readFile(`${basePath}/projects/test-project/PROJECT.md`, "utf-8");

    const event = createEvent({
      context: {
        toolName: "dojo_update_state",
        toolParams: { lastSkill: "strategic-scout" },
      },
    });
    await handler(event);

    const after = await fs.readFile(`${basePath}/projects/test-project/PROJECT.md`, "utf-8");
    expect(after).toBe(before);
  });

  it("no-op when no context provided", async () => {
    await handleInit(["test-project"]);

    const basePath = stateManager.getBasePath();
    const before = await fs.readFile(`${basePath}/projects/test-project/PROJECT.md`, "utf-8");

    const event = createEvent();
    await handler(event);

    const after = await fs.readFile(`${basePath}/projects/test-project/PROJECT.md`, "utf-8");
    expect(after).toBe(before);
  });

  it("no-op for monitored tools other than dojo_update_state", async () => {
    await handleInit(["test-project"]);

    const basePath = stateManager.getBasePath();
    const before = await fs.readFile(`${basePath}/projects/test-project/PROJECT.md`, "utf-8");

    const event = createEvent({
      context: {
        toolName: "dojo_get_context",
      },
    });
    await handler(event);

    const after = await fs.readFile(`${basePath}/projects/test-project/PROJECT.md`, "utf-8");
    expect(after).toBe(before);
  });

  it("handles missing PROJECT.md gracefully", async () => {
    await handleInit(["test-project"]);

    const basePath = stateManager.getBasePath();
    await fs.unlink(`${basePath}/projects/test-project/PROJECT.md`);

    const event = createEvent({
      context: {
        toolName: "dojo_update_state",
        toolParams: { phase: "scouting" },
      },
    });

    await expect(handler(event)).resolves.toBeUndefined();
  });

  it("handles no active project gracefully", async () => {
    const event = createEvent({
      context: {
        toolName: "dojo_update_state",
        toolParams: { phase: "scouting" },
      },
    });

    await expect(handler(event)).resolves.toBeUndefined();
  });
});
