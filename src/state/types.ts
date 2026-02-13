export type DojoPhase =
  | "initialized"
  | "scouting"
  | "specifying"
  | "decomposing"
  | "commissioning"
  | "implementing"
  | "retrospective";

export interface GlobalState {
  version: string;
  activeProjectId: string | null;
  projects: ProjectMetadata[];
  lastUpdated: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  phase: DojoPhase;
  createdAt: string;
  lastAccessedAt: string;
  archived: boolean;
}

export interface PendingAction {
  skill: string;
  args: string;
  requestedAt: string;
}

export interface ProjectState {
  projectId: string;
  phase: DojoPhase;
  tracks: Track[];
  decisions: DecisionRef[];
  specs: SpecRef[];
  artifacts: ArtifactRef[];
  currentTrack: string | null;
  lastSkill: string;
  pendingAction: PendingAction | null;
  activityLog: ActivityEntry[];
  lastUpdated: string;
}

export interface Track {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  dependencies: string[];
  promptFile: string | null;
}

export interface DecisionRef {
  date: string;
  topic: string;
  file: string;
}

export interface SpecRef {
  version: string;
  file: string;
}

export interface ArtifactRef {
  category: string;
  filename: string;
  createdAt: string;
  skill: string;
}

export interface ActivityEntry {
  timestamp: string;
  action: string;
  summary: string;
}
