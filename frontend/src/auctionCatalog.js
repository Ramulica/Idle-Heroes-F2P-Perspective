/**
 * Hero catalog prefs + flip strategy plans for Auction House.
 * Preferred % order (drag-ranked), flat priority, importance 1–10.
 */

import { AWAKENING_STAT_POOL_S } from "./heroProgress";

/** Full pool for catalog ranking (includes Giant Killer, Defier, etc.). */
export const CATALOG_STAT_OPTIONS = [...AWAKENING_STAT_POOL_S];

export const FLAT_PRIORITIES = [
  { id: "attack", label: "Attack" },
  { id: "hp", label: "Health" },
  { id: "speed", label: "Speed" },
];

/**
 * Three flip strategies — margins, catalog weight, hammer tolerance differ.
 */
export const FLIP_STRATEGIES = [
  {
    id: "safe_bootstrap",
    name: "Safe Bootstrap",
    tagline: "Protect SG while you learn each hero’s market.",
    plan: [
      "Only bid heroes you marked importance 6+ in the catalog.",
      "Demand preferred % hits near the top of your ranked list — skip junk rolls.",
      "Target high net margin (cold ~32%, mature ~18%). Never chase past Max bid.",
      "Treat hammers as almost off-limits: if the copy needs heavy rerolls to match prefs, Skip.",
      "Log every Sold and failed X — this strategy is built to fill clean history.",
    ],
    marginCold: 32,
    marginMature: 18,
    bidHaircut: 0.78,
    prefWeight: 0.4,
    importanceMin: 6,
    hammerTolerance: 0.18,
    qualityFloor: 0.55,
  },
  {
    id: "volume_grinder",
    name: "Volume Grinder",
    tagline: "More flips, thinner edges, still respect Max bid.",
    plan: [
      "Work importance 4+ heroes — wider funnel than Safe Bootstrap.",
      "Preferred % still help, but a decent Attack/flat fit can carry a Buy.",
      "Lower margins (cold ~24%, mature ~12%) so you clear inventory faster.",
      "1–2 hammers OK only if importance is high and rolls are close to prefs.",
      "Use failed tries aggressively as ceilings; don’t stubborn-list dead copies.",
    ],
    marginCold: 24,
    marginMature: 12,
    bidHaircut: 0.9,
    prefWeight: 0.28,
    importanceMin: 4,
    hammerTolerance: 0.38,
    qualityFloor: 0.42,
  },
  {
    id: "meta_sniper",
    name: "Meta Sniper",
    tagline: "Pay for catalog-perfect copies on top heroes.",
    plan: [
      "Focus importance 7–10 heroes only — skip the rest unless comps scream Buy.",
      "Preferred % order is king: Giant Killer / Defier / top ranks must land.",
      "Flat priority (Attack/HP/Speed) must match what you set on that hero.",
      "Margins mid (cold ~28%, mature ~14%); bid closer to Max when prefs nail it.",
      "Hammers are scarce but allowed on sniper targets — budget them for near-miss rolls on importance 8+.",
    ],
    marginCold: 28,
    marginMature: 14,
    bidHaircut: 0.86,
    prefWeight: 0.58,
    importanceMin: 7,
    hammerTolerance: 0.55,
    qualityFloor: 0.5,
  },
];

export const FLIP_STRATEGY_BY_ID = Object.fromEntries(
  FLIP_STRATEGIES.map((s) => [s.id, s])
);

export function defaultHeroPref(heroId = null) {
  return {
    heroId: heroId || null,
    preferredStats: [],
    flatPriority: "attack",
    importance: 5,
  };
}

export function normalizeHeroPref(raw, heroId) {
  const base = defaultHeroPref(heroId);
  if (!raw || typeof raw !== "object") return base;
  const flat = FLAT_PRIORITIES.some((f) => f.id === raw.flatPriority)
    ? raw.flatPriority
    : "attack";
  const importance = Math.min(
    10,
    Math.max(1, Math.round(Number(raw.importance) || 5))
  );
  const seen = new Set();
  const preferredStats = [];
  for (const s of Array.isArray(raw.preferredStats) ? raw.preferredStats : []) {
    const name = String(s || "").trim();
    if (!name || seen.has(name) || !CATALOG_STAT_OPTIONS.includes(name)) continue;
    seen.add(name);
    preferredStats.push(name);
  }
  return {
    heroId: heroId || raw.heroId || null,
    preferredStats,
    flatPriority: flat,
    importance,
  };
}

export function normalizeHeroPrefs(raw, knownHeroIds = []) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  const ids = knownHeroIds.length
    ? knownHeroIds
    : Object.keys(raw).filter((k) => raw[k]);
  for (const id of ids) {
    if (raw[id]) out[id] = normalizeHeroPref(raw[id], id);
  }
  return out;
}

function newPresetId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Named reusable catalog setup (stats + flat + importance). */
export function defaultCatalogPreset(partial = {}) {
  const pref = normalizeHeroPref(partial, null);
  return {
    id: typeof partial.id === "string" && partial.id ? partial.id : newPresetId(),
    name: String(partial.name || "").trim() || "Preset",
    preferredStats: pref.preferredStats,
    flatPriority: pref.flatPriority,
    importance: pref.importance,
  };
}

export function normalizeCatalogPreset(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = String(raw.name || "").trim();
  if (!name) return null;
  return defaultCatalogPreset(raw);
}

export function normalizeCatalogPresets(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const row of raw) {
    const preset = normalizeCatalogPreset(row);
    if (!preset || seen.has(preset.id)) continue;
    seen.add(preset.id);
    out.push(preset);
  }
  return out;
}

export function catalogPresetToPref(preset, heroId) {
  return normalizeHeroPref(preset, heroId);
}

export function strategyOf(settings) {
  const id = settings?.strategyId || "safe_bootstrap";
  return FLIP_STRATEGY_BY_ID[id] || FLIP_STRATEGIES[0];
}

function copyBonusStats(copy) {
  if (Array.isArray(copy?.bonuses) && copy.bonuses.length) {
    return copy.bonuses.map((b) => b?.stat).filter(Boolean);
  }
  return [copy?.bonusA?.stat, copy?.bonusB?.stat].filter(Boolean);
}

/** 0..1 — how well copy % rolls match catalog preferred order. */
export function preferredMatchScore(copy, pref) {
  const ranked = pref?.preferredStats || [];
  if (!ranked.length) return 0.5;
  const have = new Set(copyBonusStats(copy));
  const top = ranked.slice(0, 8);
  let score = 0;
  let max = 0;
  for (let i = 0; i < top.length; i++) {
    const w = Math.max(0.25, 1 - i * 0.1);
    max += w;
    if (have.has(top[i])) score += w;
  }
  return max > 0 ? score / max : 0.5;
}

/** 0..1 — flat priority fit (Attack / Health / Speed). */
export function flatPriorityScore(copy, pref) {
  const atk = Math.max(0, Number(copy?.attack) || 0);
  const hp = Math.max(0, Number(copy?.hp) || 0);
  const spd = Math.max(0, Number(copy?.speed) || 0);
  const nAtk = Math.min(1.2, atk / 7000);
  const nHp = Math.min(1.2, hp / 6000);
  const nSpd = Math.min(1.2, spd / 50);
  const pri = pref?.flatPriority || "attack";
  if (pri === "hp")
    return Math.max(0, Math.min(1, nHp * 0.7 + nAtk * 0.2 + nSpd * 0.1));
  if (pri === "speed")
    return Math.max(0, Math.min(1, nSpd * 0.7 + nAtk * 0.2 + nHp * 0.1));
  return Math.max(0, Math.min(1, nAtk * 0.7 + nHp * 0.15 + nSpd * 0.15));
}

/**
 * How many hammers this copy likely still wants vs preferred rolls.
 * Hammers are scarce — strategies gate on this.
 */
export function estimatedHammerNeed(copy, pref) {
  const ranked = pref?.preferredStats || [];
  if (!ranked.length) return Math.max(0, Number(copy?.hammersUsed) || 0) * 0.35;
  const have = new Set(copyBonusStats(copy));
  const needSlots = Math.max(1, have.size || Math.min(3, ranked.length));
  const top = ranked.slice(0, needSlots);
  let misses = 0;
  for (const s of top) if (!have.has(s)) misses += 1;
  const already = Math.max(0, Number(copy?.hammersUsed) || 0);
  return misses + already * 0.35;
}
