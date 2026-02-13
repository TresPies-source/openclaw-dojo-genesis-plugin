import { readJsonFile, writeJsonFile, ensureDir } from "../utils/file-ops.js";
import type { GlobalState, ProjectState, ProjectMetadata } from "./types.js";
import { checkSchemaVersion } from "./migrations.js";

const SCHEMA_VERSION = "1.0.0";
const MAX_ACTIVITY_LOG = 50;

export class DojoStateManager {
  private basePath: string;
  private globalCache: GlobalState | null = null;
  private projectCache: Map<string, ProjectState> = new Map();

  constructor(configDir: string) {
    this.basePath = `${configDir}/dojo-genesis-plugin`;
  }

  getBasePath(): string {
    return this.basePath;
  }

  async getGlobalState(): Promise<GlobalState> {
    if (!this.globalCache) {
      await ensureDir(this.basePath);
      const loaded = await readJsonFile<GlobalState>(
        `${this.basePath}/global-state.json`,
        {
          version: SCHEMA_VERSION,
          activeProjectId: null,
          projects: [],
          lastUpdated: new Date().toISOString(),
        },
      );
      this.globalCache = checkSchemaVersion(loaded);
    }
    return this.globalCache;
  }

  async setActiveProject(projectId: string | null): Promise<void> {
    const state = await this.getGlobalState();
    state.activeProjectId = projectId;
    state.lastUpdated = new Date().toISOString();
    if (projectId) {
      const meta = state.projects.find((p) => p.id === projectId);
      if (meta) meta.lastAccessedAt = state.lastUpdated;
    }
    await this.saveGlobalState(state);
  }

  async addProject(meta: ProjectMetadata): Promise<void> {
    const state = await this.getGlobalState();
    state.projects.push(meta);
    state.activeProjectId = meta.id;
    state.lastUpdated = new Date().toISOString();
    await this.saveGlobalState(state);
  }

  async getProjectState(projectId?: string): Promise<ProjectState | null> {
    const global = await this.getGlobalState();
    const id = projectId || global.activeProjectId;
    if (!id) return null;

    if (!this.projectCache.has(id)) {
      const state = await readJsonFile<ProjectState | null>(
        `${this.basePath}/projects/${id}/state.json`,
        null,
      );
      if (state) this.projectCache.set(id, state);
      return state;
    }
    return this.projectCache.get(id) || null;
  }

  async updateProjectState(projectId: string, update: Partial<ProjectState>): Promise<void> {
    const current = await this.getProjectState(projectId);
    if (!current) throw new Error(`Project not found: ${projectId}`);

    const updated: ProjectState = {
      ...current,
      ...update,
      lastUpdated: new Date().toISOString(),
    };
    await writeJsonFile(`${this.basePath}/projects/${projectId}/state.json`, updated);
    this.projectCache.set(projectId, updated);

    const global = await this.getGlobalState();
    const meta = global.projects.find((p) => p.id === projectId);
    if (meta) {
      meta.phase = updated.phase;
      meta.lastAccessedAt = updated.lastUpdated;
      await this.saveGlobalState(global);
    }
  }

  async archiveProject(projectId: string): Promise<boolean> {
    const state = await this.getGlobalState();
    const meta = state.projects.find((p) => p.id === projectId);
    if (!meta) return false;
    if (meta.archived) return false;

    meta.archived = true;
    meta.lastAccessedAt = new Date().toISOString();

    if (state.activeProjectId === projectId) {
      state.activeProjectId = null;
    }

    state.lastUpdated = new Date().toISOString();
    await this.saveGlobalState(state);
    return true;
  }

  async addActivity(projectId: string, action: string, summary: string): Promise<void> {
    const state = await this.getProjectState(projectId);
    if (!state) return;

    state.activityLog = [
      { timestamp: new Date().toISOString(), action, summary },
      ...state.activityLog.slice(0, MAX_ACTIVITY_LOG - 1),
    ];
    await this.updateProjectState(projectId, { activityLog: state.activityLog });
  }

  private async saveGlobalState(state: GlobalState): Promise<void> {
    await writeJsonFile(`${this.basePath}/global-state.json`, state);
    this.globalCache = state;
  }
}

export let stateManager: DojoStateManager;

export function initStateManager(configDir: string): DojoStateManager {
  stateManager = new DojoStateManager(configDir);
  return stateManager;
}
