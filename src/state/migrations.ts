import type { GlobalState } from "./types.js";

const CURRENT_VERSION = "1.0.0";

export function checkSchemaVersion(state: GlobalState): GlobalState {
  if (state.version !== CURRENT_VERSION) {
    throw new Error(
      `Unsupported schema version: ${state.version}. Expected ${CURRENT_VERSION}.`,
    );
  }
  return state;
}
