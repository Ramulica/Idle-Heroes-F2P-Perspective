/**
 * Artifact catalog for the Stat Calculator.
 * Icons split from the in-game artifact sheet; stats filled in later.
 */

const iconModules = import.meta.glob(
  "./assets/stats/artifacts/arti-*.png",
  { eager: true, import: "default" }
);

const ARTIFACT_ICONS = Object.keys(iconModules)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((key) => iconModules[key]);

export const ARTIFACT_COUNT = ARTIFACT_ICONS.length;

export const ARTIFACT_OPTIONS = ARTIFACT_ICONS.map((icon, i) => {
  const n = i + 1;
  return {
    id: `arti-${String(n).padStart(2, "0")}`,
    name: `Artifact ${n}`,
    slot: "artifact",
    icon,
    stats: [],
  };
});

export const ARTIFACT_BY_ID = Object.fromEntries(
  ARTIFACT_OPTIONS.map((row) => [row.id, row])
);

export function artifactOf(id) {
  return ARTIFACT_BY_ID[id] || null;
}
