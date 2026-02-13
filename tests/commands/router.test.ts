import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { initStateManager } from "../../src/state/manager.js";
import { registerDojoCommands } from "../../src/commands/router.js";
import { createMockPluginAPI } from "../__mocks__/openclaw-types.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";

describe("registerDojoCommands", () => {
  let tmpDir: string;
  let api: ReturnType<typeof createMockPluginAPI>;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-router-");
    initStateManager(tmpDir);
    api = createMockPluginAPI(tmpDir);
    registerDojoCommands(api);
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  function invoke(argsStr: string): ReturnType<ReturnType<typeof createMockPluginAPI>["_commands"]["get"]>["handler"] extends (ctx: infer _) => infer R ? R : never {
    const cmd = api._commands.get("dojo");
    if (!cmd) throw new Error("dojo command not registered");
    return cmd.handler({ args: argsStr });
  }

  it("registers the dojo command", () => {
    expect(api._commands.has("dojo")).toBe(true);
    const cmd = api._commands.get("dojo")!;
    expect(cmd.name).toBe("dojo");
    expect(cmd.description).toBeTruthy();
  });

  describe("help", () => {
    it("returns help text for no args", async () => {
      const result = await invoke("");
      expect(result.text).toContain("Dojo Genesis");
      expect(result.text).toContain("/dojo init");
      expect(result.text).toContain("/dojo scout");
    });

    it("returns help text for 'help' subcommand", async () => {
      const result = await invoke("help");
      expect(result.text).toContain("Dojo Genesis");
    });
  });

  describe("unknown command", () => {
    it("returns error for unknown subcommand", async () => {
      const result = await invoke("foobar");
      expect(result.text).toContain("Unknown command");
      expect(result.text).toContain("foobar");
      expect(result.text).toContain("/dojo help");
    });
  });

  describe("deterministic commands dispatch", () => {
    it("dispatches init", async () => {
      const result = await invoke("init my-app");
      expect(result.text).toContain("**Project created:** `my-app`");
    });

    it("dispatches switch", async () => {
      await invoke("init my-app");
      await invoke("init other-app");
      const result = await invoke("switch my-app");
      expect(result.text).toContain("**Switched to:** `my-app`");
    });

    it("dispatches status", async () => {
      await invoke("init my-app");
      const result = await invoke("status");
      expect(result.text).toContain("**Project:** `my-app`");
      expect(result.text).toContain("initialized");
    });

    it("dispatches list", async () => {
      await invoke("init my-app");
      const result = await invoke("list");
      expect(result.text).toContain("my-app");
    });

    it("dispatches archive", async () => {
      await invoke("init my-app");
      const result = await invoke("archive my-app");
      expect(result.text).toContain("**Project archived:** `my-app`");
    });
  });

  describe("skill-invoking commands dispatch", () => {
    it("dispatches scout to strategic-scout skill", async () => {
      await invoke("init my-app");
      const result = await invoke("scout native vs PWA");
      expect(result.text).toContain("**Starting strategic-scout**");
      expect(result.text).toContain("`my-app`");
    });

    it("dispatches spec to release-specification skill", async () => {
      await invoke("init my-app");
      const result = await invoke("spec mobile-redesign");
      expect(result.text).toContain("**Starting release-specification**");
    });

    it("dispatches tracks to parallel-tracks skill", async () => {
      await invoke("init my-app");
      const result = await invoke("tracks");
      expect(result.text).toContain("**Starting parallel-tracks**");
    });

    it("dispatches commission to implementation-prompt skill", async () => {
      await invoke("init my-app");
      const result = await invoke("commission");
      expect(result.text).toContain("**Starting implementation-prompt**");
    });

    it("dispatches retro to retrospective skill", async () => {
      await invoke("init my-app");
      const result = await invoke("retro");
      expect(result.text).toContain("**Starting retrospective**");
    });

    it("writes pendingAction for skill commands", async () => {
      await invoke("init my-app");
      await invoke("scout some tension");

      const raw = await fs.readFile(`${tmpDir}/dojo-genesis-plugin/projects/my-app/state.json`, "utf-8");
      const state = JSON.parse(raw);
      expect(state.pendingAction).not.toBeNull();
      expect(state.pendingAction.skill).toBe("strategic-scout");
      expect(state.pendingAction.args).toBe("some tension");
    });
  });

  describe("args passing", () => {
    it("passes remaining args to init", async () => {
      const result = await invoke("init my-app --desc A description");
      expect(result.text).toContain("**Project created:** `my-app`");

      const globalRaw = await fs.readFile(`${tmpDir}/dojo-genesis-plugin/global-state.json`, "utf-8");
      const global = JSON.parse(globalRaw);
      expect(global.projects[0].description).toBe("A description");
    });

    it("handles extra whitespace in args", async () => {
      const result = await invoke("  init   my-app  ");
      expect(result.text).toContain("**Project created:** `my-app`");
    });

    it("is case-insensitive for subcommands", async () => {
      const result = await invoke("INIT my-app");
      expect(result.text).toContain("**Project created:** `my-app`");
    });
  });
});
