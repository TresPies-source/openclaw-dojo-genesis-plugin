import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initStateManager, stateManager } from "../../src/state/manager.js";
import { handleInit } from "../../src/commands/init.js";
import { handleSkillInvoke } from "../../src/commands/skill-invoke.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";
import type { HookEvent } from "../__mocks__/openclaw-types.js";
import handler from "../../hooks/before-agent-start/handler.js";

describe("before-agent-start hook", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-hook-bas-");
    initStateManager(tmpDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  function createEvent(overrides: Partial<HookEvent> = {}): HookEvent {
    return {
      type: "agent",
      action: "start",
      messages: [],
      ...overrides,
    };
  }

  it("injects context when pendingAction exists", async () => {
    await handleInit(["test-project"]);
    await handleSkillInvoke("strategic-scout", ["native vs PWA"]);

    const event = createEvent();
    await handler(event);

    expect(event.messages).toHaveLength(1);
    const ctx = event.messages[0];
    expect(ctx).toContain("[DOJO GENESIS PROJECT CONTEXT]");
    expect(ctx).toContain("Project: test-project");
    expect(ctx).toContain("Phase: initialized");
    expect(ctx).toContain("Pending skill: strategic-scout");
    expect(ctx).toContain("User request: native vs PWA");
    expect(ctx).toContain("INSTRUCTIONS: Run the strategic-scout skill");
    expect(ctx).toContain("dojo_get_context");
    expect(ctx).toContain("dojo_save_artifact");
    expect(ctx).toContain("dojo_update_state");
    expect(ctx).toContain("[/DOJO GENESIS PROJECT CONTEXT]");
  });

  it("no-op when no active project", async () => {
    const event = createEvent();
    await handler(event);

    expect(event.messages).toHaveLength(0);
  });

  it("no-op when no pendingAction", async () => {
    await handleInit(["test-project"]);

    const event = createEvent();
    await handler(event);

    expect(event.messages).toHaveLength(0);
  });

  it("no-op when event type is not agent", async () => {
    await handleInit(["test-project"]);
    await handleSkillInvoke("strategic-scout", ["tension"]);

    const event = createEvent({ type: "other" });
    await handler(event);

    expect(event.messages).toHaveLength(0);
  });

  it("no-op when event action is not start", async () => {
    await handleInit(["test-project"]);
    await handleSkillInvoke("strategic-scout", ["tension"]);

    const event = createEvent({ action: "end" });
    await handler(event);

    expect(event.messages).toHaveLength(0);
  });

  it("includes track info when tracks exist", async () => {
    await handleInit(["test-project"]);
    await stateManager.updateProjectState("test-project", {
      tracks: [
        { id: "track-a", name: "Auth", status: "in-progress", dependencies: [], promptFile: null },
        { id: "track-b", name: "UI", status: "pending", dependencies: ["track-a"], promptFile: null },
      ],
    });
    await handleSkillInvoke("implementation-prompt", []);

    const event = createEvent();
    await handler(event);

    expect(event.messages).toHaveLength(1);
    expect(event.messages[0]).toContain("track-a (in-progress)");
    expect(event.messages[0]).toContain("track-b (pending)");
  });

  it("includes decision info when decisions exist", async () => {
    await handleInit(["test-project"]);
    await stateManager.updateProjectState("test-project", {
      decisions: [
        { date: "2026-02-12", topic: "Use React Native", file: "decisions.md" },
      ],
    });
    await handleSkillInvoke("release-specification", ["mobile app"]);

    const event = createEvent();
    await handler(event);

    expect(event.messages).toHaveLength(1);
    expect(event.messages[0]).toContain("Use React Native");
  });

  it("uses fallback instruction for unknown skill", async () => {
    await handleInit(["test-project"]);
    await stateManager.updateProjectState("test-project", {
      pendingAction: {
        skill: "unknown-skill",
        args: "test",
        requestedAt: new Date().toISOString(),
      },
    });

    const event = createEvent();
    await handler(event);

    expect(event.messages).toHaveLength(1);
    expect(event.messages[0]).toContain("Run the unknown-skill skill.");
  });

  it("includes correct instructions for each known skill", async () => {
    const skills = [
      { name: "strategic-scout", keyword: "Explore the tension" },
      { name: "release-specification", keyword: "production-ready specification" },
      { name: "parallel-tracks", keyword: "Decompose the specification" },
      { name: "implementation-prompt", keyword: "implementation prompts" },
      { name: "retrospective", keyword: "Reflect on what went well" },
    ];

    for (const { name, keyword } of skills) {
      await handleInit([`proj-${name}`]);
      await stateManager.updateProjectState(`proj-${name}`, {
        pendingAction: {
          skill: name,
          args: "test",
          requestedAt: new Date().toISOString(),
        },
      });

      const event = createEvent();
      await handler(event);

      expect(event.messages).toHaveLength(1);
      expect(event.messages[0]).toContain(keyword);
    }
  });

  it("shows lastSkill in context when set", async () => {
    await handleInit(["test-project"]);
    await stateManager.updateProjectState("test-project", {
      lastSkill: "strategic-scout",
    });
    await handleSkillInvoke("release-specification", ["feature"]);

    const event = createEvent();
    await handler(event);

    expect(event.messages).toHaveLength(1);
    expect(event.messages[0]).toContain("Last skill: strategic-scout");
  });
});
