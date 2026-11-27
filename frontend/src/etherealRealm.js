import { AURORA_SHARDS_PER_AURORA } from "./voidBosses";

const MONTHS_PER_YEAR = 12;
const WEEKS_PER_YEAR = 52;

function clampMonths(value) {
  const n = Math.round(Number(value) || 12);
  if (!Number.isFinite(n)) return 12;
  return Math.max(1, Math.min(60, n));
}

export const ETHEREAL_STAGES = 20;
export const ETHEREAL_FREE_BATTLES = 10;
export const ETHEREAL_MAX_BATTLES = 15;
export const ETHEREAL_GEMS_PER_EXTRA = 200;
export const STARSOUL_SHARDS_PER_STARSOUL = 5000;
export const CORE_SHARDS_PER_CHEST = 50;

/** Starsoul mats per fight at stages 10–20 (red & purple). */
const STARSOUL_MATS_FROM_10 = [2, 4, 8, 10, 12, 16, 18, 22, 24, 26, 30];

/** Tableland boss aurora shards from stage 4. */
const TL_BOSS_AURORA_FROM_4 = [
  50, 100, 150, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200,
  2400, 2600, 2800,
];

/** Tableland boss starsoul shards from stage 10. */
const TL_BOSS_STARSOUL_SHARDS_FROM_10 = [
  5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80,
];

/** Expanse boss starsoul shards from stage 10. */
const EX_BOSS_STARSOUL_SHARDS_FROM_10 = [
  10, 20, 30, 40, 50, 60, 80, 100, 120, 140, 160,
];

function emptyRewards() {
  return {
    stellar: 0,
    subs: 0,
    spiritVein: 0,
    auroraShards: 0,
    starsoulMats: 0,
    cot: 0,
    coreShards: 0,
    starsoulShards: 0,
  };
}

function addRewards(a, b, mul = 1) {
  const out = emptyRewards();
  for (const key of Object.keys(out)) {
    out[key] = (Number(a?.[key]) || 0) + (Number(b?.[key]) || 0) * mul;
  }
  return out;
}

function scaleRewards(row, mul) {
  return addRewards(emptyRewards(), row, mul);
}

function fromStage(list, stage, startStage) {
  if (stage < startStage) return 0;
  return list[stage - startStage] ?? 0;
}

/**
 * Red / purple fight rewards that matter are the same on Tableland & Expanse.
 * Potion columns are ignored.
 */
export function redFightRewards(stage) {
  const s = Math.max(1, Math.min(ETHEREAL_STAGES, Number(stage) || 1));
  return {
    ...emptyRewards(),
    stellar: 100 + 20 * (s - 1),
    subs: s >= 4 ? 10 + 10 * (s - 4) : 0,
    spiritVein: s >= 7 ? 10 + 10 * (s - 7) : 0,
    starsoulMats: fromStage(STARSOUL_MATS_FROM_10, s, 10),
  };
}

export function purpleFightRewards(stage) {
  const s = Math.max(1, Math.min(ETHEREAL_STAGES, Number(stage) || 1));
  return {
    ...emptyRewards(),
    stellar: 500 + 100 * (s - 1),
    subs: s >= 4 ? 2 + 2 * (s - 4) : 0,
    auroraShards: s >= 7 ? 2 + (s - 7) : 0,
    starsoulMats: fromStage(STARSOUL_MATS_FROM_10, s, 10),
  };
}

/** Weekly Tableland boss kill / participation (non-potion cols). */
export function tablelandBossKillRewards(stage) {
  const s = Math.max(1, Math.min(ETHEREAL_STAGES, Number(stage) || 1));
  return {
    ...emptyRewards(),
    cot: 5000 + 1000 * (s - 1),
    auroraShards: fromStage(TL_BOSS_AURORA_FROM_4, s, 4),
    starsoulShards: fromStage(TL_BOSS_STARSOUL_SHARDS_FROM_10, s, 10),
  };
}

/** Weekly Expanse boss kill / participation. */
export function expanseBossKillRewards(stage) {
  const s = Math.max(1, Math.min(ETHEREAL_STAGES, Number(stage) || 1));
  let coreShards = 0;
  if (s >= 4) {
    // 4–7:1, 8–11:2, 12–15:3, 16–19:4, 20:5
    coreShards = Math.min(5, 1 + Math.floor((s - 4) / 4));
  }
  return {
    ...emptyRewards(),
    cot: 6000 + 1000 * (s - 1),
    coreShards,
    starsoulShards: fromStage(EX_BOSS_STARSOUL_SHARDS_FROM_10, s, 10),
  };
}

export function defaultEtherealDay(index = 0) {
  // User’s preferred week: day1 red free, day2 boss free, other days red free.
  if (index === 1) return { red: 0, purple: ETHEREAL_FREE_BATTLES };
  return { red: ETHEREAL_FREE_BATTLES, purple: 0 };
}

export function defaultEtherealRealm() {
  return {
    stage: 20,
    killTableland: true,
    killExpanse: true,
    days: Array.from({ length: 7 }, (_, i) => defaultEtherealDay(i)),
  };
}

function clampBattles(n) {
  const v = Math.round(Number(n) || 0);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(ETHEREAL_MAX_BATTLES, v);
}

export function normalizeEtherealDay(raw) {
  const red = clampBattles(raw?.red);
  const purple = clampBattles(raw?.purple);
  const total = red + purple;
  if (total <= ETHEREAL_MAX_BATTLES) return { red, purple };
  // Prefer keeping the larger of the two when overflowing.
  if (red >= purple) {
    return { red: Math.min(red, ETHEREAL_MAX_BATTLES), purple: 0 };
  }
  return { red: 0, purple: Math.min(purple, ETHEREAL_MAX_BATTLES) };
}

export function normalizeEtherealRealm(raw) {
  const base = defaultEtherealRealm();
  const incoming = raw && typeof raw === "object" ? raw : {};
  const stage = Math.max(
    1,
    Math.min(ETHEREAL_STAGES, Math.round(Number(incoming.stage) || base.stage))
  );
  const daysIn = Array.isArray(incoming.days) ? incoming.days : [];
  const days = Array.from({ length: 7 }, (_, i) =>
    normalizeEtherealDay(daysIn[i] ?? base.days[i])
  );
  return {
    stage,
    killTableland: incoming.killTableland !== false,
    killExpanse: incoming.killExpanse !== false,
    days,
  };
}

export function dayGemCost(day) {
  const total =
    clampBattles(day?.red) + clampBattles(day?.purple);
  const paid = Math.max(0, total - ETHEREAL_FREE_BATTLES);
  return paid * ETHEREAL_GEMS_PER_EXTRA;
}

export function weekFightTotals(plan) {
  const p = normalizeEtherealRealm(plan);
  let red = 0;
  let purple = 0;
  let gems = 0;
  for (const day of p.days) {
    red += day.red;
    purple += day.purple;
    gems += dayGemCost(day);
  }
  return { red, purple, gems, stage: p.stage };
}

function withDerived(rewards) {
  const starsoulShards = Number(rewards.starsoulShards) || 0;
  const coreShards = Number(rewards.coreShards) || 0;
  return {
    ...rewards,
    starsouls: starsoulShards / STARSOUL_SHARDS_PER_STARSOUL,
    coreChests: coreShards / CORE_SHARDS_PER_CHEST,
    aurora: (Number(rewards.auroraShards) || 0) / AURORA_SHARDS_PER_AURORA,
  };
}

/**
 * Weekly + period totals for Ethereal Realm at the chosen stage.
 * months comes from the shared calculator period (default 12 = 1 year).
 */
export function calculateEtherealRealm(plan, months = 12) {
  const p = normalizeEtherealRealm(plan);
  const m = clampMonths(months);
  const weeks = (m / MONTHS_PER_YEAR) * WEEKS_PER_YEAR;
  const fights = weekFightTotals(p);

  let weekly = emptyRewards();
  weekly = addRewards(weekly, redFightRewards(p.stage), fights.red);
  weekly = addRewards(weekly, purpleFightRewards(p.stage), fights.purple);
  if (p.killTableland) {
    weekly = addRewards(weekly, tablelandBossKillRewards(p.stage), 1);
  }
  if (p.killExpanse) {
    weekly = addRewards(weekly, expanseBossKillRewards(p.stage), 1);
  }

  const period = scaleRewards(weekly, weeks);
  const yearly = scaleRewards(weekly, WEEKS_PER_YEAR);

  const unlockWarn =
    fights.purple > 0 && fights.red < ETHEREAL_FREE_BATTLES
      ? `Boss attacks usually need ~${ETHEREAL_FREE_BATTLES} red fights first each week.`
      : null;

  return {
    plan: p,
    months: m,
    weeks,
    fights,
    gemsWeekly: fights.gems,
    gemsPeriod: fights.gems * weeks,
    gemsYearly: fights.gems * WEEKS_PER_YEAR,
    weekly: withDerived(weekly),
    period: withDerived(period),
    yearly: withDerived(yearly),
    unlockWarn,
    perFight: {
      red: withDerived(redFightRewards(p.stage)),
      purple: withDerived(purpleFightRewards(p.stage)),
      tablelandKill: withDerived(tablelandBossKillRewards(p.stage)),
      expanseKill: withDerived(expanseBossKillRewards(p.stage)),
    },
  };
}
