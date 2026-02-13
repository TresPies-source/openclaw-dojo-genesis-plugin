import type { Track, DojoPhase } from "../state/types.js";

const PHASE_INDICATOR: Record<DojoPhase, string> = {
  initialized: "[ ]",
  scouting: "[~]",
  specifying: "[~]",
  decomposing: "[~]",
  commissioning: "[~]",
  implementing: "[>]",
  retrospective: "[*]",
};

export function formatPhase(phase: DojoPhase): string {
  return `${PHASE_INDICATOR[phase] || "[ ]"} ${phase}`;
}

export function formatDate(iso: string): string {
  return iso.split("T")[0];
}

export function formatTrackTable(tracks: Track[]): string {
  if (tracks.length === 0) return "_No tracks defined._";

  let table = "| Track | Name | Status | Dependencies |\n";
  table += "|-------|------|--------|-------------|\n";
  for (const t of tracks) {
    const deps = t.dependencies.length > 0 ? t.dependencies.join(", ") : "none";
    table += `| ${t.id} | ${t.name} | ${t.status} | ${deps} |\n`;
  }
  return table;
}

export function formatProjectList(
  projects: Array<{ id: string; phase: string; lastAccessedAt: string; archived: boolean }>,
  showArchived: boolean,
  activeId: string | null,
): string {
  const visible = projects.filter(p => showArchived || !p.archived);
  if (visible.length === 0) return "_No projects. Run `/dojo init <name>` to create one._";

  let table = "| Project | Phase | Last Active | Active |\n";
  table += "|---------|-------|-------------|--------|\n";
  for (const p of visible) {
    const active = p.id === activeId ? ">>>" : "";
    table += `| ${p.id} | ${p.phase} | ${formatDate(p.lastAccessedAt)} | ${active} |\n`;
  }
  return table;
}
