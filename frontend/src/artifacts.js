/**
 * Artifact catalog for the Stat Calculator.
 * Icons split from the in-game artifact sheet; stats filled in later.
 */

const iconModules = import.meta.glob(
  "./assets/stats/artifacts/arti-*.png",
  { eager: true, import: "default" }
);

function artifactIcon(index) {
  const key = `./assets/stats/artifacts/arti-${String(index).padStart(2, "0")}.png`;
  return iconModules[key];
}

export const ARTIFACT_COUNT = 47;

export const ARTIFACT_OPTIONS = Array.from({ length: ARTIFACT_COUNT }, (_, i) => {
  const n = i + 1;
  return {
    id: `arti-${String(n).padStart(2, "0")}`,
    name: `Artifact ${n}`,
    slot: "artifact",
    icon: artifactIcon(n),
    stats: [],
  };
});

export const ARTIFACT_BY_ID = Object.fromEntries(
  ARTIFACT_OPTIONS.map((row) => [row.id, row])
);

export function artifactOf(id) {
  return ARTIFACT_BY_ID[id] || null;
}
