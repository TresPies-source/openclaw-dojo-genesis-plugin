import type { HookHandler } from "../../tests/__mocks__/openclaw-types.js";
import { stateManager } from "../../src/state/manager.js";

const handler: HookHandler = async (event) => {
  if (event.type !== "agent") return;

  const global = await stateManager.getGlobalState();
  if (!global.activeProjectId) return;

  const state = await stateManager.getProjectState(global.activeProjectId);
  if (state?.pendingAction) {
    await stateManager.updateProjectState(global.activeProjectId, {
      pendingAction: null,
    });
  }
};

export default handler;
