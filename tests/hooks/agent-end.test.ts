import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initStateManager, stateManager } from "../../src/state/manager.js";
import { handleInit } from "../../src/commands/init.js";
import { handleSkillInvoke } from "../../src/commands/skill-invoke.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";
import type { HookEvent } from "../__mocks__/openclaw-types.js";
import handler from "../../hooks/agent-end/handler.js";

describe("agent-end hook", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-hook-ae-");
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

  it("clears pendingAction after agent turn", async () => {
    await handleInit(["test-project"]);
    await handleSkillInvoke("strategic-scout", ["native vs PWA"]);

    const stateBefore = await stateManager.getProjectState("test-project");
    expect(stateBefore?.pendingAction).not.toBeNull();
    expect(stateBefore?.pendingAction?.skill).toBe("strategic-scout");

    const event = createEvent();
    await handler(event);

    const stateAfter = await stateManager.getProjectState("test-project");
    expect(stateAfter?.pendingAction).toBeNull();
  });

  it("no-op when no pendingAction", async () => {
    await handleInit(["test-project"]);

    const stateBefore = await stateManager.getProjectState("test-project");
    expect(stateBefore?.pendingAction).toBeNull();

    const event = createEvent();
    await handler(event);

    const stateAfter = await stateManager.getProjectState("test-project");
    expect(stateAfter?.pendingAction).toBeNull();
  });

  it("no-op when no active project", async () => {
    const event = createEvent();
    await expect(handler(event)).resolves.toBeUndefined();
  });

  it("no-op when event type is not agent", async () => {
    await handleInit(["test-project"]);
    await handleSkillInvoke("strategic-scout", ["tension"]);

    const event = createEvent({ type: "other" });
    await handler(event);

    const state = await stateManager.getProjectState("test-project");
    expect(state?.pendingAction).not.toBeNull();
  });

  it("only clears pendingAction for active project", async () => {
    await handleInit(["project-a"]);
    await handleSkillInvoke("strategic-scout", ["tension a"]);

    await handleInit(["project-b"]);
    await handleSkillInvoke("release-specification", ["feature b"]);

    const event = createEvent();
    await handler(event);

    const stateB = await stateManager.getProjectState("project-b");
    expect(stateB?.pendingAction).toBeNull();

    const stateA = await stateManager.getProjectState("project-a");
    expect(stateA?.pendingAction).not.toBeNull();
    expect(stateA?.pendingAction?.skill).toBe("strategic-scout");
  });
});
