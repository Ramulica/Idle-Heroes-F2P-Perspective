/**
 * Hero catalog setups + flip strategy plans for Auction House.
 * Multiple setups per hero (e.g. Damage vs Support), ranked % and flats.
 */

import { AWAKENING_STAT_POOL_S } from "./heroProgress";

/** Full pool for catalog ranking (includes Giant Killer, Defier, etc.). */
export const CATALOG_STAT_OPTIONS = [...AWAKENING_STAT_POOL_S];

export const FLAT_PRIORITIES = [
  { id: "attack", label: "Attack" },
  { id: "hp", label: "Health" },
  { id: "speed", label: "Speed" },
];

export const FLAT_PRIORITY_IDS = FLAT_PRIORITIES.map((f) => f.id);

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

function newId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeFlatRank(raw) {
  const seen = new Set();
  const out = [];
  let source = [];
  if (Array.isArray(raw?.flatRank)) source = raw.flatRank;
  else if (Array.isArray(raw?.flatPriority)) source = raw.flatPriority;
  else if (typeof raw?.flatPriority === "string" && raw.flatPriority) {
    source = [raw.flatPriority];
  } else if (Array.isArray(raw)) source = raw;
  else if (typeof raw === "string" && raw) source = [raw];

  for (const item of source) {
    const id = String(item || "").trim();
    if (!FLAT_PRIORITY_IDS.includes(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  for (const id of FLAT_PRIORITY_IDS) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

export function flatRankLabel(rank) {
  const list = normalizeFlatRank(rank);
  return list
    .map((id) => FLAT_PRIORITIES.find((f) => f.id === id)?.label || id)
    .join(" › ");
}

export function normalizePreferredStats(raw) {
  const seen = new Set();
  const preferredStats = [];
  for (const s of Array.isArray(raw) ? raw : []) {
    const name = String(s || "").trim();
    if (!name || seen.has(name) || !CATALOG_STAT_OPTIONS.includes(name)) continue;
    seen.add(name);
    preferredStats.push(name);
  }
  return preferredStats;
}

export function defaultHeroPref(heroId = null) {
  return {
    heroId: heroId || null,
    name: "",
    preferredStats: [],
    flatRank: [...FLAT_PRIORITY_IDS],
    flatPriority: "attack",
    importance: 5,
  };
}

/** Normalize a setup/pref shape (supports legacy flatPriority string). */
export function normalizeHeroPref(raw, heroId) {
  const base = defaultHeroPref(heroId);
  if (!raw || typeof raw !== "object") return base;
  const flatRank = normalizeFlatRank(raw);
  const importance = Math.min(
    10,
    Math.max(1, Math.round(Number(raw.importance) || 5))
  );
  return {
    heroId: heroId || raw.heroId || null,
    name: String(raw.name || "").trim(),
    preferredStats: normalizePreferredStats(raw.preferredStats),
    flatRank,
    flatPriority: flatRank[0] || "attack",
    importance,
  };
}

export function normalizeHeroPrefs(raw, knownHeroIds = []) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const ids = knownHeroIds.length
    ? knownHeroIds
    : Object.keys(raw).filter((k) => raw[k]);
  for (const id of ids) {
    if (raw[id]) out[id] = normalizeHeroPref(raw[id], id);
  }
  return out;
}

export function defaultHeroSetup(partial = {}) {
  const pref = normalizeHeroPref(partial, partial.heroId || null);
  return {
    id:
      typeof partial.id === "string" && partial.id
        ? partial.id
        : newId("setup"),
    heroId: pref.heroId,
    name: pref.name || "Setup",
    preferredStats: pref.preferredStats,
    flatRank: pref.flatRank,
    flatPriority: pref.flatRank[0] || "attack",
    importance: pref.importance,
  };
}

export function normalizeHeroSetup(raw, knownHeroIds = []) {
  if (!raw || typeof raw !== "object") return null;
  const heroId = String(raw.heroId || "").trim();
  if (!heroId) return null;
  if (knownHeroIds.length && !knownHeroIds.includes(heroId)) return null;
  return defaultHeroSetup(raw);
}

export function normalizeHeroSetups(raw, knownHeroIds = [], legacyPrefs = null) {
  const out = [];
  const seen = new Set();
  if (Array.isArray(raw)) {
    for (const row of raw) {
      const setup = normalizeHeroSetup(row, knownHeroIds);
      if (!setup || seen.has(setup.id)) continue;
      seen.add(setup.id);
      out.push(setup);
    }
  }
  if (out.length) return out;

  // Migrate old one-pref-per-hero map.
  const prefs = normalizeHeroPrefs(legacyPrefs, knownHeroIds);
  for (const [heroId, pref] of Object.entries(prefs)) {
    const setup = defaultHeroSetup({
      ...pref,
      heroId,
      name: pref.name || "Setup",
    });
    out.push(setup);
  }
  return out;
}

/** Named reusable template (no hero). */
export function defaultCatalogPreset(partial = {}) {
  const pref = normalizeHeroPref(partial, null);
  return {
    id:
      typeof partial.id === "string" && partial.id
        ? partial.id
        : newId("preset"),
    name: String(partial.name || "").trim() || "Preset",
    preferredStats: pref.preferredStats,
    flatRank: pref.flatRank,
    flatPriority: pref.flatRank[0] || "attack",
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

/** 0..1 — ranked Attack / Health / Speed fit. */
export function flatPriorityScore(copy, pref) {
  const atk = Math.max(0, Number(copy?.attack) || 0);
  const hp = Math.max(0, Number(copy?.hp) || 0);
  const spd = Math.max(0, Number(copy?.speed) || 0);
  const values = {
    attack: Math.min(1.2, atk / 7000),
    hp: Math.min(1.2, hp / 6000),
    speed: Math.min(1.2, spd / 50),
  };
  const ranked = normalizeFlatRank(pref);
  let score = 0;
  let max = 0;
  for (let i = 0; i < ranked.length; i++) {
    const w = Math.max(0.2, 1 - i * 0.28);
    max += w;
    score += (values[ranked[i]] || 0) * w;
  }
  return max > 0 ? Math.max(0, Math.min(1, score / max)) : 0.5;
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

/** Fit of a copy to one setup (for picking Damage vs Support). */
export function setupFitScore(copy, setup) {
  const pref = normalizeHeroPref(setup, setup?.heroId);
  const match = preferredMatchScore(copy, pref);
  const flat = flatPriorityScore(copy, pref);
  const imp = Math.max(1, Math.min(10, pref.importance)) / 10;
  return match * 0.55 + flat * 0.3 + imp * 0.15;
}
