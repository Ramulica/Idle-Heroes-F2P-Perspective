import infusionBadge from "./assets/stats/infusion/infusion-badge-clean.png";
import { T_OPTIONALS, EMPTY_OPTIONALS, STAGE_BY_ID } from "./heroUpgrade";
import {
  infusionPointBudget,
  normalizeInfusionNodes,
} from "./imprintInfusion";

/** Hero stage options for Stat Calculator (no temple +levels, no T max). */
export const HERO_STAGE_OPTIONS = [
  { id: "E5", group: "E", label: "E5", mark: "E5" },
  { id: "V1", group: "V", label: "V1", mark: "V1" },
  { id: "V2", group: "V", label: "V2", mark: "V2" },
  { id: "V3", group: "V", label: "V3", mark: "V3" },
  { id: "V4", group: "V", label: "V4", mark: "V4" },
  { id: "T1", group: "T", label: "T1", mark: "T1" },
  { id: "T2", group: "T", label: "T2", mark: "T2" },
  { id: "T3", group: "T", label: "T3", mark: "T3" },
  { id: "T4", group: "T", label: "T4", mark: "T4" },
  { id: "T5", group: "T", label: "T5", mark: "T5" },
  { id: "D1", group: "D", label: "D1", mark: "D1" },
  { id: "D2", group: "D", label: "D2", mark: "D2" },
  { id: "D3", group: "D", label: "D3", mark: "D3" },
  { id: "D4", group: "D", label: "D4", mark: "D4" },
  { id: "D5", group: "D", label: "D5", mark: "D5" },
  { id: "D6", group: "D", label: "D6", mark: "D6" },
];

export const HERO_STAGE_BY_ID = Object.fromEntries(
  HERO_STAGE_OPTIONS.map((row) => [row.id, row])
);

export const HERO_T_OPTIONALS = T_OPTIONALS.filter((row) =>
  ["core", "subActive", "subP1", "subP2", "subP3"].includes(row.id)
);

export const INFUSION_ICON = infusionBadge;
export const INFUSION_MIN = 0;
export const INFUSION_MAX = 60;
export const INFUSION_DEFAULT = 0;

/** Ordered awakening copy ranks (for ±3 speed step window). */
export const AWAKENING_TIERS = [
  { id: "E-", label: "E-", letter: "E", color: "#6ec8ff" },
  { id: "E", label: "E", letter: "E", color: "#4aa8f0" },
  { id: "E+", label: "E+", letter: "E", color: "#2f86e0" },
  { id: "D-", label: "D-", letter: "D", color: "#e0a050" },
  { id: "D", label: "D", letter: "D", color: "#f0c030" },
  { id: "D+", label: "D+", letter: "D", color: "#f0a020" },
  { id: "C-", label: "C-", letter: "C", color: "#c080e0" },
  { id: "C", label: "C", letter: "C", color: "#b060d8" },
  { id: "C+", label: "C+", letter: "C", color: "#a040d0" },
  { id: "B-", label: "B-", letter: "B", color: "#60d060" },
  { id: "B", label: "B", letter: "B", color: "#40c040" },
  { id: "B+", label: "B+", letter: "B", color: "#20a820" },
  { id: "A-", label: "A-", letter: "A", color: "#e05050" },
  { id: "A", label: "A", letter: "A", color: "#d03030" },
  { id: "A+", label: "A+", letter: "A", color: "#c01818" },
  { id: "S", label: "S", letter: "S", color: "#f4c430" },
  { id: "SS", label: "SS", letter: "SS", color: "#f4a020" },
  { id: "SSS", label: "SSS", letter: "SSS", color: "#ff8c00" },
  { id: "X", label: "X", letter: "X", color: "#ff4d6d" },
];

export const AWAKENING_BY_ID = Object.fromEntries(
  AWAKENING_TIERS.map((row) => [row.id, row])
);

/**
 * Base speed intervals from game tables.
 * S / SS / SSS / X are placeholders until exact values are provided.
 */
export const AWAKENING_SPEED = {
  "E-": { min: 1, max: 1 },
  E: { min: 2, max: 3 },
  "E+": { min: 4, max: 5 },
  "D-": { min: 6, max: 7 },
  D: { min: 8, max: 9 },
  "D+": { min: 10, max: 11 },
  "C-": { min: 12, max: 15 },
  C: { min: 16, max: 20 },
  "C+": { min: 21, max: 26 },
  "B-": { min: 27, max: 34 },
  B: { min: 35, max: 43 },
  "B+": { min: 44, max: 53 },
  "A-": { min: 54, max: 62 },
  A: { min: 63, max: 71 },
  "A+": { min: 72, max: 80 },
  S: { min: 81, max: 89 },
  SS: { min: 90, max: 99 },
  SSS: { min: 100, max: 110 },
  X: { min: 111, max: 120 },
};

const SPEED_STEP_SLACK = 3;

export const AWAKENING_STAT_POOL_DC = [
  "Armor",
  "Skill Damage",
  "Precision",
  "Block",
  "Armor Break",
  "Holy Damage",
  "Heal Effect",
  "Effect of Being Healed",
];

export const AWAKENING_STAT_POOL_B = [
  "Crit",
  "Crit Damage",
  "Control Immunity",
  "Damage Reduction",
  "Control Immunity Offset",
  "Control Precision",
  "Crit Damage Reduction",
  "Reduces DoT received",
  ...AWAKENING_STAT_POOL_DC,
];

/**
 * Percent values by awakening copy tier for rollable stats.
 * Special A+/S rolls without listed values stay blank until provided.
 */
export const AWAKENING_STAT_VALUES = {
  "D-": {
    Armor: 15,
    "Skill Damage": 50,
    Precision: 10,
    Block: 10,
    "Armor Break": 10,
    "Holy Damage": 8,
    "Heal Effect": 5,
    "Effect of Being Healed": 5,
  },
  D: {
    Armor: 18,
    "Skill Damage": 55,
    Precision: 12.5,
    Block: 12.5,
    "Armor Break": 15,
    "Holy Damage": 10,
    "Heal Effect": 6,
    "Effect of Being Healed": 6,
  },
  "D+": {
    Armor: 20,
    "Skill Damage": 60,
    Precision: 15,
    Block: 15,
    "Armor Break": 20,
    "Holy Damage": 12,
    "Heal Effect": 7,
    "Effect of Being Healed": 7,
  },
  "C-": {
    Armor: 23,
    "Skill Damage": 70,
    Precision: 17.5,
    Block: 17.5,
    "Armor Break": 23,
    "Holy Damage": 14,
    "Heal Effect": 8,
    "Effect of Being Healed": 8,
  },
  C: {
    Armor: 26,
    "Skill Damage": 80,
    Precision: 20,
    Block: 20,
    "Armor Break": 26,
    "Holy Damage": 16,
    "Heal Effect": 9,
    "Effect of Being Healed": 9,
  },
  "C+": {
    Armor: 30,
    "Skill Damage": 90,
    Precision: 21.5,
    Block: 21.5,
    "Armor Break": 30,
    "Holy Damage": 18,
    "Heal Effect": 10,
    "Effect of Being Healed": 10,
  },
  "B-": {
    Armor: 35,
    "Skill Damage": 100,
    Precision: 23,
    Block: 23,
    "Armor Break": 33,
    "Holy Damage": 20,
    "Heal Effect": 11,
    "Effect of Being Healed": 11,
    Crit: 15,
    "Crit Damage": 22.5,
    "Control Immunity": 10,
    "Damage Reduction": 10,
    "Control Immunity Offset": 6,
    "Control Precision": 20,
    "Crit Damage Reduction": 5,
    "Reduces DoT received": 8,
  },
  B: {
    Armor: 40,
    "Skill Damage": 120,
    Precision: 25,
    Block: 25,
    "Armor Break": 36,
    "Holy Damage": 22,
    "Heal Effect": 12,
    "Effect of Being Healed": 12,
    Crit: 16,
    "Crit Damage": 24,
    "Control Immunity": 12,
    "Damage Reduction": 12,
    "Control Immunity Offset": 8,
    "Control Precision": 22,
    "Crit Damage Reduction": 6,
    "Reduces DoT received": 10,
  },
  "B+": {
    Armor: 45,
    "Skill Damage": 140,
    Precision: 26,
    Block: 26,
    "Armor Break": 40,
    "Holy Damage": 24,
    "Heal Effect": 13,
    "Effect of Being Healed": 13,
    Crit: 17,
    "Crit Damage": 25,
    "Control Immunity": 14,
    "Damage Reduction": 14,
    "Control Immunity Offset": 9,
    "Control Precision": 24,
    "Crit Damage Reduction": 8,
    "Reduces DoT received": 12,
  },
  "A-": {
    Armor: 50,
    "Skill Damage": 160,
    Precision: 27.5,
    Block: 27.5,
    "Armor Break": 43,
    "Holy Damage": 26,
    "Heal Effect": 15,
    "Effect of Being Healed": 15,
    Crit: 18,
    "Crit Damage": 26,
    "Control Immunity": 16,
    "Damage Reduction": 16,
    "Control Immunity Offset": 10,
    "Control Precision": 26,
    "Crit Damage Reduction": 10,
    "Reduces DoT received": 15,
  },
  A: {
    Armor: 55,
    "Skill Damage": 180,
    Precision: 29,
    Block: 29,
    "Armor Break": 46,
    "Holy Damage": 28,
    "Heal Effect": 18,
    "Effect of Being Healed": 18,
    Crit: 19,
    "Crit Damage": 27.5,
    "Control Immunity": 18,
    "Damage Reduction": 18,
    "Control Immunity Offset": 12,
    "Control Precision": 28,
    "Crit Damage Reduction": 12,
    "Reduces DoT received": 18,
  },
  "A+": {
    Armor: 60,
    "Skill Damage": 200,
    Precision: 30,
    Block: 30,
    "Armor Break": 50,
    "Holy Damage": 30,
    "Heal Effect": 20,
    "Effect of Being Healed": 20,
    Crit: 20,
    "Crit Damage": 30,
    "Control Immunity": 20,
    "Damage Reduction": 20,
    "Control Immunity Offset": 15,
    "Control Precision": 30,
    "Crit Damage Reduction": 15,
    "Reduces DoT received": 20,
  },
  S: {
    Armor: 63,
    "Skill Damage": 220,
    Precision: 31,
    Block: 31,
    "Armor Break": 55,
    "Holy Damage": 33,
    "Heal Effect": 22,
    "Effect of Being Healed": 22,
    Crit: 21.5,
    "Crit Damage": 32.5,
    "Control Immunity": 22,
    "Damage Reduction": 22,
    "Control Immunity Offset": 18,
    "Control Precision": 32,
    "Crit Damage Reduction": 16,
    "Reduces DoT received": 23,
  },
  SS: {
    Armor: 67,
    "Skill Damage": 240,
    Precision: 32,
    Block: 32,
    "Armor Break": 58,
    "Holy Damage": 36,
    "Heal Effect": 25,
    "Effect of Being Healed": 25,
    Crit: 23,
    "Crit Damage": 37.5,
    "Control Immunity": 24,
    "Damage Reduction": 24,
    "Control Immunity Offset": 20,
    "Control Precision": 34,
    "Crit Damage Reduction": 18,
    "Reduces DoT received": 26,
  },
  SSS: {
    Armor: 70,
    "Skill Damage": 250,
    Precision: 32.5,
    Block: 32.5,
    "Armor Break": 60,
    "Holy Damage": 40,
    "Heal Effect": 28,
    "Effect of Being Healed": 28,
    Crit: 25,
    "Crit Damage": 40,
    "Control Immunity": 25,
    "Damage Reduction": 25,
    "Control Immunity Offset": 23,
    "Control Precision": 35,
    "Crit Damage Reduction": 20,
    "Reduces DoT received": 30,
  },
};

export function awakeningStatValue(tierId, statName) {
  const value = AWAKENING_STAT_VALUES[tierId]?.[statName];
  return Number.isFinite(value) ? value : null;
}

export const AWAKENING_STAT_POOL_A = [
  "Holy Armor",
  "Faction Rule",
  "Giant Killer",
  "Defier",
  "Divine Block",
  ...AWAKENING_STAT_POOL_B,
];

export const AWAKENING_STAT_POOL_S = [
  "Holy Armor",
  "Faction Rule",
  "Giant Killer",
  "Defier",
  "Divine Block",
  "Crit",
  "Crit Damage",
  "Control Immunity",
  "Damage Reduction",
  "Control Immunity Offset",
  "Control Precision",
  "Crit Damage Reduction",
  "Reduces DoT received",
  "Armor",
  "Skill Damage",
  "Precision",
  "Block",
  "Armor Break",
  "Holy Damage",
  "Heal Effect",
  "Effect of Being Healed",
  "Stun Immunity",
  "Freeze Immunity",
  "Silence Immunity",
  "Petrify Immunity",
  "Twine Immunity",
  "Fear Immunity",
  "Taunt Immunity",
  "Dazzle Immunity",
  "Seal of Light Immunity",
  "Immune to Shapeshifting",
  "Ship Crusher",
  "Hunter's Focus",
  "Burn Immunity",
  "Bleed Immunity",
  "Poison Immunity",
  "Desperate Momentum",
  "Body Protection",
  "Pure Flow",
];

export const AWAKENING_STAT_POOL_X = [...AWAKENING_STAT_POOL_S];

export function awakeningLetter(tierId) {
  return AWAKENING_BY_ID[tierId]?.letter || null;
}

export function awakeningStatCount(tierId) {
  const letter = awakeningLetter(tierId);
  if (!letter) return 0;
  if (letter === "E") return 0;
  if (letter === "D" || letter === "C") return 1;
  if (letter === "B") return 2;
  if (letter === "A") return 3;
  if (letter === "S" || letter === "SS" || letter === "SSS") return 4;
  if (letter === "X") return 5;
  return 0;
}

export function awakeningStatPool(tierId) {
  const letter = awakeningLetter(tierId);
  if (letter === "D" || letter === "C") return AWAKENING_STAT_POOL_DC;
  if (letter === "B") return AWAKENING_STAT_POOL_B;
  if (letter === "A") return AWAKENING_STAT_POOL_A;
  if (letter === "S" || letter === "SS" || letter === "SSS") {
    return AWAKENING_STAT_POOL_S;
  }
  if (letter === "X") return AWAKENING_STAT_POOL_X;
  return [];
}

export function awakeningSpeedRange(tierId) {
  const index = AWAKENING_TIERS.findIndex((row) => row.id === tierId);
  if (index < 0) return { min: 1, max: 1 };
  const from = Math.max(0, index - SPEED_STEP_SLACK);
  const to = Math.min(AWAKENING_TIERS.length - 1, index + SPEED_STEP_SLACK);
  let min = Infinity;
  let max = -Infinity;
  for (let i = from; i <= to; i += 1) {
    const id = AWAKENING_TIERS[i].id;
    const span = AWAKENING_SPEED[id];
    if (!span) continue;
    min = Math.min(min, span.min);
    max = Math.max(max, span.max);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 1, max: 1 };
  return { min, max };
}

export function awakeningSpeedChoices(tierId) {
  const { min, max } = awakeningSpeedRange(tierId);
  const out = [];
  for (let n = min; n <= max; n += 1) out.push(n);
  return out;
}

export function defaultHeroProgress() {
  return {
    stageId: "E5",
    optionals: { ...EMPTY_OPTIONALS },
    infusion: INFUSION_DEFAULT,
    infusionNodes: [],
    awakening: null,
  };
}

export function defaultAwakening(tierId = "E-") {
  const tier = AWAKENING_BY_ID[tierId] ? tierId : "E-";
  const speedChoices = awakeningSpeedChoices(tier);
  const count = awakeningStatCount(tier);
  return {
    tierId: tier,
    speed: speedChoices[0] || 1,
    stats: Array(count).fill(null),
  };
}

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function normalizeHeroProgress(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const stageId = HERO_STAGE_BY_ID[src.stageId] ? src.stageId : "E5";
  const rawOptionals = { ...EMPTY_OPTIONALS };
  HERO_T_OPTIONALS.forEach((item) => {
    rawOptionals[item.id] = Boolean(src.optionals?.[item.id] ?? src[item.id]);
  });
  const optionals = resolvedStageOptionals(stageId, rawOptionals);

  let awakening = null;
  if (src.awakening && typeof src.awakening === "object") {
    const tierId = AWAKENING_BY_ID[src.awakening.tierId]
      ? src.awakening.tierId
      : null;
    if (tierId) {
      const speedChoices = awakeningSpeedChoices(tierId);
      const count = awakeningStatCount(tierId);
      const pool = new Set(awakeningStatPool(tierId));
      const speed = speedChoices.includes(Number(src.awakening.speed))
        ? Number(src.awakening.speed)
        : speedChoices[0] || 1;
      const stats = Array.from({ length: count }, (_, i) => {
        const id = src.awakening.stats?.[i] || null;
        return pool.has(id) ? id : null;
      });
      awakening = { tierId, speed, stats };
    }
  }

  const infusion = clampInt(
    src.infusion,
    INFUSION_MIN,
    INFUSION_MAX,
    INFUSION_DEFAULT
  );
  const infusionNodes = normalizeInfusionNodes(
    src.infusionNodes,
    infusionPointBudget(infusion)
  );

  return {
    stageId,
    optionals,
    infusion,
    infusionNodes,
    awakening,
  };
}

/** Imprint slot 0→V1, 1→V2, 2→V3; all stay unlocked from there up. */
export const IMPRINT_UNLOCK_STAGES = ["V1", "V2", "V3"];

export function stageRank(stageId) {
  return STAGE_BY_ID[stageId]?.rank ?? 0;
}

export function imprintUnlocked(stageId, imprintIndex) {
  const need = IMPRINT_UNLOCK_STAGES[imprintIndex];
  if (!need) return false;
  const have = stageRank(stageId);
  const needRank = STAGE_BY_ID[need]?.rank ?? 0;
  return have >= needRank;
}

export function stageAllowsOptionals(stageId) {
  const stage = HERO_STAGE_BY_ID[stageId];
  return Boolean(stage && (stage.group === "T" || stage.group === "D"));
}

export function optionalsForStage(stageId) {
  if (!stageAllowsOptionals(stageId)) return [];
  if (stageId.startsWith("D")) return HERO_T_OPTIONALS;
  const order = ["T1", "T2", "T3", "T4", "T5"];
  const idx = order.indexOf(stageId);
  if (idx < 0) return [];
  return HERO_T_OPTIONALS.filter((item) => {
    const minIdx = order.indexOf(item.min);
    return minIdx >= 0 && minIdx <= idx;
  });
}

/** D1–D6 always own core + all skill subs. */
export function stageLocksOptionals(stageId) {
  return Boolean(stageId && String(stageId).startsWith("D"));
}

export function resolvedStageOptionals(stageId, previous = EMPTY_OPTIONALS) {
  if (!stageAllowsOptionals(stageId)) return { ...EMPTY_OPTIONALS };
  if (stageLocksOptionals(stageId)) {
    const out = { ...EMPTY_OPTIONALS };
    HERO_T_OPTIONALS.forEach((item) => {
      out[item.id] = true;
    });
    return out;
  }
  const allowed = new Set(optionalsForStage(stageId).map((item) => item.id));
  const out = { ...EMPTY_OPTIONALS };
  HERO_T_OPTIONALS.forEach((item) => {
    out[item.id] = allowed.has(item.id) ? Boolean(previous?.[item.id]) : false;
  });
  return out;
}
