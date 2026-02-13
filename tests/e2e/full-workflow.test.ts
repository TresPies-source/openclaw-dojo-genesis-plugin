import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { initStateManager, stateManager } from "../../src/state/manager.js";
import { handleInit } from "../../src/commands/init.js";
import { handleStatus } from "../../src/commands/status.js";
import { handleList } from "../../src/commands/list.js";
import { handleSwitch } from "../../src/commands/switch.js";
import { handleArchive } from "../../src/commands/archive.js";
import { handleSkillInvoke } from "../../src/commands/skill-invoke.js";
import { registerOrchestrationTools } from "../../src/orchestration/tool-registry.js";
import beforeAgentStartHandler from "../../hooks/before-agent-start/handler.js";
import afterToolCallHandler from "../../hooks/after-tool-call/handler.js";
import agentEndHandler from "../../hooks/agent-end/handler.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";
import type { HookEvent, ToolRegistration } from "../__mocks__/openclaw-types.js";

describe("E2E full workflow", () => {
  let tmpDir: string;
  let tools: Map<string, ToolRegistration>;

  async function executeTool(name: string, params: Record<string, unknown> = {}) {
    const tool = tools.get(name);
    if (!tool) throw new Error(`Tool ${name} not registered`);
    const result = await tool.execute("test-id", params);
    return JSON.parse(result.content[0].text);
  }

  function createAgentStartEvent(): HookEvent {
    return { type: "agent", action: "start", messages: [] };
  }

  function createAfterToolCallEvent(
    toolName: string,
    toolParams: Record<string, unknown> = {},
  ): HookEvent {
    return { type: "agent", messages: [], context: { toolName, toolParams } };
  }

  function createAgentEndEvent(): HookEvent {
    return { type: "agent", messages: [] };
  }

  async function simulateSkillExecution(
    skillCommand: string,
    commandArgs: string[],
    opts: {
      outputDir: string;
      filename: string;
      content: string;
      nextPhase: string;
      skillName: string;
      addTrack?: { id: string; name: string; dependencies?: string[] };
      addDecision?: { topic: string; file: string };
      addSpec?: { version: string; file: string };
    },
  ) {
    const invokeResult = await handleSkillInvoke(opts.skillName, commandArgs);
    expect(invokeResult.text).toContain(`**Starting ${opts.skillName}**`);

    const startEvent = createAgentStartEvent();
    await beforeAgentStartHandler(startEvent);
    expect(startEvent.messages).toHaveLength(1);
    expect(startEvent.messages[0]).toContain(opts.skillName);

    const contextData = await executeTool("dojo_get_context");
    expect(contextData.active).toBe(true);

    await executeTool("dojo_save_artifact", {
      filename: opts.filename,
      content: opts.content,
      outputDir: opts.outputDir,
    });

    const updateParams: Record<string, unknown> = {
      phase: opts.nextPhase,
      lastSkill: opts.skillName,
    };
    if (opts.addTrack) updateParams.addTrack = opts.addTrack;
    if (opts.addDecision) updateParams.addDecision = opts.addDecision;
    if (opts.addSpec) updateParams.addSpec = opts.addSpec;

    await executeTool("dojo_update_state", updateParams);

    const afterEvent = createAfterToolCallEvent("dojo_update_state", {
      phase: opts.nextPhase,
    });
    await afterToolCallHandler(afterEvent);

    const endEvent = createAgentEndEvent();
    await agentEndHandler(endEvent);
  }

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-e2e-");
    initStateManager(tmpDir);
    tools = new Map();
    registerOrchestrationTools({
      registerTool(tool: ToolRegistration) {
        tools.set(tool.name, tool);
      },
    });
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  it("complete 6-phase workflow: init → scout → spec → tracks → commission → retro", async () => {
    const projectName = "my-app";
    const basePath = `${tmpDir}/dojo-genesis/projects/${projectName}`;

    const initResult = await handleInit([projectName, "--desc", "Mobile redesign project"]);
    expect(initResult.text).toContain(`**Project created:** \`${projectName}\``);

    const statusInit = await handleStatus([]);
    expect(statusInit.text).toContain("initialized");

    await simulateSkillExecution("scout", ["native vs PWA"], {
      outputDir: "scouts",
      filename: "2026-02-12_scout_native-vs-pwa.md",
      content: "# Strategic Scout: Native vs PWA\n\n## Analysis\n\nPWA wins for reach, native wins for performance.\n\n## Recommendation\n\nGo with PWA for v1.",
      nextPhase: "scouting",
      skillName: "strategic-scout",
      addDecision: { topic: "PWA over native for v1", file: "scouts/2026-02-12_scout_native-vs-pwa.md" },
    });

    let state = await stateManager.getProjectState(projectName);
    expect(state!.phase).toBe("scouting");
    expect(state!.lastSkill).toBe("strategic-scout");
    expect(state!.pendingAction).toBeNull();
    expect(state!.artifacts).toHaveLength(1);
    expect(state!.decisions).toHaveLength(1);

    await simulateSkillExecution("spec", ["mobile-redesign"], {
      outputDir: "specs",
      filename: "2026-02-12_spec_mobile-redesign-v1.md",
      content: "# Release Specification: Mobile Redesign v1\n\n## Scope\n\nPWA-based mobile redesign.\n\n## Requirements\n\n1. Responsive layout\n2. Offline support\n3. Push notifications",
      nextPhase: "specifying",
      skillName: "release-specification",
      addSpec: { version: "v1.0", file: "specs/2026-02-12_spec_mobile-redesign-v1.md" },
    });

    state = await stateManager.getProjectState(projectName);
    expect(state!.phase).toBe("specifying");
    expect(state!.lastSkill).toBe("release-specification");
    expect(state!.specs).toHaveLength(1);

    await simulateSkillExecution("tracks", [], {
      outputDir: "tracks",
      filename: "2026-02-12_tracks_decomposition.md",
      content: "# Parallel Tracks\n\n## Track A: Layout\nResponsive grid system\n\n## Track B: Offline\nService worker + cache\n\n## Track C: Notifications\nPush notification system (depends on Track B)",
      nextPhase: "decomposing",
      skillName: "parallel-tracks",
      addTrack: { id: "track-a", name: "Layout" },
    });

    await executeTool("dojo_update_state", {
      addTrack: { id: "track-b", name: "Offline Support" },
    });
    await executeTool("dojo_update_state", {
      addTrack: { id: "track-c", name: "Notifications", dependencies: ["track-b"] },
    });

    state = await stateManager.getProjectState(projectName);
    expect(state!.phase).toBe("decomposing");
    expect(state!.tracks).toHaveLength(3);
    expect(state!.tracks[2].dependencies).toEqual(["track-b"]);

    const statusTracks = await handleStatus([]);
    expect(statusTracks.text).toContain("track-a");
    expect(statusTracks.text).toContain("track-b");
    expect(statusTracks.text).toContain("track-c");

    await simulateSkillExecution("commission", [], {
      outputDir: "prompts",
      filename: "2026-02-12_prompt_track-a-layout.md",
      content: "# Implementation Prompt: Track A — Layout\n\n## Context\nBuild responsive grid system for mobile.\n\n## Requirements\n- CSS Grid with breakpoints\n- Mobile-first approach",
      nextPhase: "commissioning",
      skillName: "implementation-prompt",
    });

    state = await stateManager.getProjectState(projectName);
    expect(state!.phase).toBe("commissioning");

    await executeTool("dojo_update_state", { phase: "implementing" });

    await simulateSkillExecution("retro", [], {
      outputDir: "retros",
      filename: "2026-02-12_retro_v1-cycle.md",
      content: "# Retrospective: v1 Cycle\n\n## What went well\n- Clear specification\n- Good track decomposition\n\n## What was hard\n- PWA limitations for push\n\n## Improvements\n- Earlier user testing",
      nextPhase: "retrospective",
      skillName: "retrospective",
    });

    state = await stateManager.getProjectState(projectName);
    expect(state!.phase).toBe("retrospective");
    expect(state!.lastSkill).toBe("retrospective");
    expect(state!.pendingAction).toBeNull();

    const scoutFile = await fs.readFile(
      `${basePath}/scouts/2026-02-12_scout_native-vs-pwa-md`,
      "utf-8",
    );
    expect(scoutFile).toContain("PWA wins for reach");

    const specFile = await fs.readFile(
      `${basePath}/specs/2026-02-12_spec_mobile-redesign-v1-md`,
      "utf-8",
    );
    expect(specFile).toContain("Mobile Redesign v1");

    const trackFile = await fs.readFile(
      `${basePath}/tracks/2026-02-12_tracks_decomposition-md`,
      "utf-8",
    );
    expect(trackFile).toContain("Parallel Tracks");

    const promptFile = await fs.readFile(
      `${basePath}/prompts/2026-02-12_prompt_track-a-layout-md`,
      "utf-8",
    );
    expect(promptFile).toContain("Track A");

    const retroFile = await fs.readFile(
      `${basePath}/retros/2026-02-12_retro_v1-cycle-md`,
      "utf-8",
    );
    expect(retroFile).toContain("What went well");

    const projectMd = await fs.readFile(`${basePath}/PROJECT.md`, "utf-8");
    expect(projectMd).toContain("**Phase:** retrospective");
    expect(projectMd).toContain("Mobile redesign project");

    const decisionsMd = await fs.readFile(`${basePath}/decisions.md`, "utf-8");
    expect(decisionsMd).toContain("Decision Log");

    const stateJson = JSON.parse(await fs.readFile(`${basePath}/state.json`, "utf-8"));
    expect(stateJson.phase).toBe("retrospective");
    expect(stateJson.tracks).toHaveLength(3);
    expect(stateJson.artifacts.length).toBeGreaterThanOrEqual(5);
    expect(stateJson.decisions).toHaveLength(1);
    expect(stateJson.specs).toHaveLength(1);
    expect(stateJson.pendingAction).toBeNull();

    const globalJson = JSON.parse(
      await fs.readFile(`${tmpDir}/dojo-genesis/global-state.json`, "utf-8"),
    );
    expect(globalJson.activeProjectId).toBe(projectName);
    expect(globalJson.projects).toHaveLength(1);
    expect(globalJson.projects[0].phase).toBe("retrospective");
  });

  it("multi-project isolation", async () => {
    const basePathA = `${tmpDir}/dojo-genesis/projects/alpha`;
    const basePathB = `${tmpDir}/dojo-genesis/projects/bravo`;

    await handleInit(["alpha", "--desc", "Project Alpha"]);
    await handleInit(["bravo", "--desc", "Project Bravo"]);

    await handleSwitch(["alpha"]);

    await simulateSkillExecution("scout", ["tension-alpha"], {
      outputDir: "scouts",
      filename: "alpha-scout.md",
      content: "# Alpha scout output",
      nextPhase: "scouting",
      skillName: "strategic-scout",
    });

    await handleSwitch(["bravo"]);

    await simulateSkillExecution("scout", ["tension-bravo"], {
      outputDir: "scouts",
      filename: "bravo-scout.md",
      content: "# Bravo scout output",
      nextPhase: "scouting",
      skillName: "strategic-scout",
    });

    const stateA = await stateManager.getProjectState("alpha");
    const stateB = await stateManager.getProjectState("bravo");

    expect(stateA!.phase).toBe("scouting");
    expect(stateB!.phase).toBe("scouting");
    expect(stateA!.artifacts).toHaveLength(1);
    expect(stateB!.artifacts).toHaveLength(1);
    expect(stateA!.artifacts[0].filename).toBe("alpha-scout-md");
    expect(stateB!.artifacts[0].filename).toBe("bravo-scout-md");

    const alphaScout = await fs.readFile(`${basePathA}/scouts/alpha-scout-md`, "utf-8");
    expect(alphaScout).toBe("# Alpha scout output");

    const bravoScout = await fs.readFile(`${basePathB}/scouts/bravo-scout-md`, "utf-8");
    expect(bravoScout).toBe("# Bravo scout output");

    const alphaFiles = await fs.readdir(`${basePathA}/scouts`);
    expect(alphaFiles).not.toContain("bravo-scout-md");

    const bravoFiles = await fs.readdir(`${basePathB}/scouts`);
    expect(bravoFiles).not.toContain("alpha-scout-md");
  });

  it("dual-mode: skill tools work without a project (standalone)", async () => {
    const contextData = await executeTool("dojo_get_context");
    expect(contextData.active).toBe(false);

    const saveResult = await executeTool("dojo_save_artifact", {
      filename: "output.md",
      content: "content",
      outputDir: "scouts",
    });
    expect(saveResult.error).toBe("No active project");

    const updateResult = await executeTool("dojo_update_state", { phase: "scouting" });
    expect(updateResult.error).toBe("No active project");
  });

  it("pending action is cleared after agent_end even if no tool calls happen", async () => {
    await handleInit(["test-proj"]);
    await handleSkillInvoke("strategic-scout", ["tension"]);

    let state = await stateManager.getProjectState("test-proj");
    expect(state!.pendingAction).not.toBeNull();

    const endEvent = createAgentEndEvent();
    await agentEndHandler(endEvent);

    state = await stateManager.getProjectState("test-proj");
    expect(state!.pendingAction).toBeNull();
  });

  it("before_agent_start is silent when no pending action", async () => {
    await handleInit(["test-proj"]);

    const event = createAgentStartEvent();
    await beforeAgentStartHandler(event);

    expect(event.messages).toHaveLength(0);
  });

  it("context injection includes full project state in before_agent_start", async () => {
    await handleInit(["test-proj"]);
    await stateManager.updateProjectState("test-proj", {
      tracks: [
        { id: "track-a", name: "Auth", status: "in-progress", dependencies: [], promptFile: null },
      ],
      decisions: [{ date: "2026-02-12", topic: "Use JWT", file: "decisions.md" }],
      lastSkill: "release-specification",
    });
    await handleSkillInvoke("parallel-tracks", []);

    const event = createAgentStartEvent();
    await beforeAgentStartHandler(event);

    const ctx = event.messages[0];
    expect(ctx).toContain("Project: test-proj");
    expect(ctx).toContain("Pending skill: parallel-tracks");
    expect(ctx).toContain("track-a (in-progress)");
    expect(ctx).toContain("Use JWT");
    expect(ctx).toContain("Last skill: release-specification");
    expect(ctx).toContain("Decompose the specification");
  });

  it("PROJECT.md is updated on phase transitions", async () => {
    await handleInit(["test-proj"]);
    const basePath = `${tmpDir}/dojo-genesis/projects/test-proj`;

    let projectMd = await fs.readFile(`${basePath}/PROJECT.md`, "utf-8");
    expect(projectMd).toContain("**Phase:** initialized");

    await executeTool("dojo_update_state", { phase: "scouting" });

    const afterEvent = createAfterToolCallEvent("dojo_update_state", { phase: "scouting" });
    await afterToolCallHandler(afterEvent);

    projectMd = await fs.readFile(`${basePath}/PROJECT.md`, "utf-8");
    expect(projectMd).toContain("**Phase:** scouting");
    expect(projectMd).toContain("Phase changed to scouting");
  });

  it("archive removes project from active list but preserves files", async () => {
    await handleInit(["to-archive"]);
    const basePath = `${tmpDir}/dojo-genesis/projects/to-archive`;

    await simulateSkillExecution("scout", ["some tension"], {
      outputDir: "scouts",
      filename: "scout-output.md",
      content: "# Scout output",
      nextPhase: "scouting",
      skillName: "strategic-scout",
    });

    await handleArchive(["to-archive"]);

    const listResult = await handleList([]);
    expect(listResult.text).not.toContain("to-archive");

    const listAll = await handleList(["--all"]);
    expect(listAll.text).toContain("to-archive");

    const scoutFile = await fs.readFile(`${basePath}/scouts/scout-output-md`, "utf-8");
    expect(scoutFile).toBe("# Scout output");

    const stateJson = JSON.parse(await fs.readFile(`${basePath}/state.json`, "utf-8"));
    expect(stateJson.phase).toBe("scouting");
    expect(stateJson.artifacts).toHaveLength(1);
  });

  it("@project targeting works through the full skill cycle", async () => {
    await handleInit(["alpha"]);
    await handleInit(["bravo"]);

    const result = await handleSkillInvoke("strategic-scout", ["@alpha", "tension"]);
    expect(result.text).toContain("`alpha`");

    const stateAlpha = await stateManager.getProjectState("alpha");
    expect(stateAlpha!.pendingAction!.skill).toBe("strategic-scout");

    const stateBravo = await stateManager.getProjectState("bravo");
    expect(stateBravo!.pendingAction).toBeNull();
  });

  it("activity log accumulates across multiple skills", async () => {
    await handleInit(["test-proj"]);

    await handleSkillInvoke("strategic-scout", ["t1"]);
    await executeTool("dojo_update_state", { lastSkill: "strategic-scout" });
    const endEvent1 = createAgentEndEvent();
    await agentEndHandler(endEvent1);

    await handleSkillInvoke("release-specification", ["feature"]);
    await executeTool("dojo_update_state", { lastSkill: "release-specification" });
    const endEvent2 = createAgentEndEvent();
    await agentEndHandler(endEvent2);

    const state = await stateManager.getProjectState("test-proj");
    const skillActions = state!.activityLog.filter((e) => e.action.startsWith("skill:"));
    expect(skillActions).toHaveLength(2);
    expect(skillActions[0].action).toBe("skill:release-specification");
    expect(skillActions[1].action).toBe("skill:strategic-scout");
  });

  it("status shows correct next action suggestion per phase", async () => {
    await handleInit(["test-proj"]);

    const phases: Array<{ phase: string; keyword: string }> = [
      { phase: "initialized", keyword: "/dojo scout" },
      { phase: "scouting", keyword: "/dojo spec" },
      { phase: "specifying", keyword: "/dojo tracks" },
      { phase: "decomposing", keyword: "/dojo commission" },
      { phase: "implementing", keyword: "/dojo retro" },
    ];

    for (const { phase, keyword } of phases) {
      await stateManager.updateProjectState("test-proj", { phase: phase as any });
      const status = await handleStatus([]);
      expect(status.text).toContain(keyword);
    }
  });
});
