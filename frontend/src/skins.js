import skinBtn from "./assets/stats/skins/skin-btn.png";

export const SKIN_ICON = skinBtn;

export const SKIN_SLOT_COUNT = 3;
export const SKIN_LEVEL_MAX = 3;

/** @type {{ id: number, name: string, tone: string }[]} */
export const SKIN_LEVELS = [
  { id: 1, name: "Ace", tone: "purple" },
  { id: 2, name: "Elite", tone: "gold" },
  { id: 3, name: "Mythic", tone: "pink" },
];

/**
 * Base skin stat table (values by level 1 / 2 / 3).
 * Hero exceptions override specific rows (see skinStatValues).
 */
export const SKIN_STATS = [
  { id: "attack", name: "Attack", unit: "%", values: [3, 6, 9] },
  { id: "speed", name: "Speed", unit: "", values: [4, 6, 8] },
  { id: "crit-damage", name: "Crit Damage", unit: "%", values: [5, 10, 15] },
  {
    id: "damage-reduction",
    name: "Damage Reduction",
    unit: "%",
    values: [4, 5, 6],
  },
  { id: "crit", name: "Crit", unit: "%", values: [2, 3, 4] },
  {
    id: "control-immunity",
    name: "Control Immunity",
    unit: "%",
    values: [5, 6, 7],
  },
  { id: "holy-damage", name: "Holy Damage", unit: "%", values: [6, 10, 14] },
];

export const SKIN_STAT_BY_ID = Object.fromEntries(
  SKIN_STATS.map((row) => [row.id, row])
);

/** Heroes whose Control Immunity skin values are 4 / 6 / 8. */
const CI_EXCEPTION_HEROES = new Set(["hero-17", "hero-35", "hero-36"]);
/** Umbrion Speed skin values are 5 / 7 / 9. */
const SPEED_EXCEPTION_HEROES = new Set(["hero-35"]);

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function defaultSkin() {
  return {
    level: 1,
    stats: Array(SKIN_SLOT_COUNT).fill(null),
  };
}

export function normalizeSkin(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const level = clampInt(src.level, 1, SKIN_LEVEL_MAX, 1);
  const statsSrc = Array.isArray(src.stats) ? src.stats : [];
  const stats = Array.from({ length: SKIN_SLOT_COUNT }, (_, i) => {
    const id = statsSrc[i] || null;
    return SKIN_STAT_BY_ID[id] ? id : null;
  });
  return { level, stats };
}

export function skinLevelOf(level) {
  return SKIN_LEVELS.find((row) => row.id === level) || SKIN_LEVELS[0];
}

/** Resolve values for a skin stat, applying hero exceptions. */
export function skinStatValues(statId, heroId) {
  const base = SKIN_STAT_BY_ID[statId];
  if (!base) return null;
  if (statId === "control-immunity" && CI_EXCEPTION_HEROES.has(heroId)) {
    return [4, 6, 8];
  }
  if (statId === "speed" && SPEED_EXCEPTION_HEROES.has(heroId)) {
    return [5, 7, 9];
  }
  return base.values;
}

export function skinStatValue(statId, level, heroId) {
  const values = skinStatValues(statId, heroId);
  if (!values) return null;
  const lv = clampInt(level, 1, SKIN_LEVEL_MAX, 1);
  return values[lv - 1];
}

/** Collect additive skin rows for totals (Attack included even if gear ATK is ignored). */
export function collectSkinStatRows(skin, heroId) {
  const data = normalizeSkin(skin);
  const rows = [];
  for (const id of data.stats) {
    if (!id) continue;
    const def = SKIN_STAT_BY_ID[id];
    if (!def) continue;
    const value = skinStatValue(id, data.level, heroId);
    if (value == null) continue;
    rows.push({ stat: def.name, value, unit: def.unit || "" });
  }
  return rows;
}
