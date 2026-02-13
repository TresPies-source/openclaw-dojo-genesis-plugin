import type { PluginAPI } from "openclaw";
import { registerPluginHooksFromDir } from "openclaw/plugin-sdk";
import { registerDojoCommands } from "./src/commands/router.js";
import { registerOrchestrationTools } from "./src/orchestration/tool-registry.js";
import { initStateManager } from "./src/state/manager.js";
import { homedir } from "os";
import { join } from "path";

export default {
  id: "dojo-genesis-plugin",
  name: "Dojo Genesis",

  configSchema: {
    type: "object" as const,
    properties: {
      projectsDir: {
        type: "string" as const,
        default: "dojo-genesis-plugin",
        description: "State directory name under OpenClaw config",
      },
    },
  },

  register(api: PluginAPI) {
    let stateDir: string;
    try {
      stateDir = api.runtime.state.resolveStateDir({ projectsDir: "dojo-genesis-plugin" });
    } catch {
      stateDir = join(homedir(), ".openclaw", "dojo-genesis-plugin");
    }

    initStateManager(stateDir);
    registerDojoCommands(api);
    registerOrchestrationTools(api);
    registerPluginHooksFromDir(api, "./hooks");

    api.logger.info("Dojo Genesis plugin initialized");
  },
};
