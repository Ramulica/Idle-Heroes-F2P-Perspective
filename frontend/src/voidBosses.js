export const VOID_BOSS_COUNT = 9;
export const VOID_BOSS_STAGES = 10;
export const VOID_BOSS_LOCKED = -1;
export const AURORA_SHARDS_PER_AURORA = 5000;

export function emptyVoidBossRewards() {
  return {
    spiritVein: 0,
    stellar: 0,
    auroraShards: 0,
    cot: 0,
  };
}

/** Diagonal tier: boss 1 stage 1 = 1, boss 2 stage 1 = 2, boss 1 stage 2 = 2, … */
export function voidBossTier(boss, stage) {
  return Number(boss) + Number(stage) - 1;
}

function roundToK(value) {
  return Math.round(value / 1000) * 1000;
}

export function voidBossStageReward(boss, stage) {
  const tier = voidBossTier(boss, stage);
  if (tier < 1) return emptyVoidBossRewards();
  const step = tier - 1;
  return {
    spiritVein: 44_000 + 8_000 * step,
    stellar: roundToK((550_000 + 100_000 * step) / 3),
    auroraShards: 5_500 + 1_000 * step,
    cot: roundToK((275_000 + 50_000 * step) / 3),
  };
}

export function addVoidBossRewards(left, right) {
  const out = emptyVoidBossRewards();
  Object.keys(out).forEach((key) => {
    out[key] = (Number(left?.[key]) || 0) + (Number(right?.[key]) || 0);
  });
  return out;
}

export function clampVoidBossStage(value) {
  const stage = Math.round(Number(value));
  if (!Number.isFinite(stage)) return 0;
  if (stage < 0) return VOID_BOSS_LOCKED;
  return Math.min(VOID_BOSS_STAGES, Math.max(0, stage));
}

export function isVoidBossUnlocked(stage) {
  return clampVoidBossStage(stage) >= 0;
}

export function normalizeVoidBossStages(raw) {
  const src = Array.isArray(raw) ? raw : [];
  return Array.from({ length: VOID_BOSS_COUNT }, (_, index) =>
    clampVoidBossStage(src[index])
  );
}

/** Sum of stage clears 1..cleared for one boss. */
export function voidBossClearedRewards(boss, clearedStage) {
  const cleared = clampVoidBossStage(clearedStage);
  if (cleared < 1) return emptyVoidBossRewards();
  let total = emptyVoidBossRewards();
  for (let stage = 1; stage <= cleared; stage += 1) {
    total = addVoidBossRewards(total, voidBossStageReward(boss, stage));
  }
  return total;
}

export function voidBossFullRewards(boss) {
  return voidBossClearedRewards(boss, VOID_BOSS_STAGES);
}

export function voidBossStageLabel(boss, stage) {
  const value = clampVoidBossStage(stage);
  if (value === VOID_BOSS_LOCKED) return "Not unlocked";
  if (value === 0) return "Not cleared";
  return `${boss}-${value}`;
}

export function voidBossProgressTotals(stages) {
  const values = normalizeVoidBossStages(stages);
  let got = emptyVoidBossRewards();
  let full = emptyVoidBossRewards();
  let unlockedCount = 0;
  const perBoss = values.map((stage, index) => {
    const boss = index + 1;
    const unlocked = isVoidBossUnlocked(stage);
    const bossGot = unlocked
      ? voidBossClearedRewards(boss, stage)
      : emptyVoidBossRewards();
    const bossFull = unlocked
      ? voidBossFullRewards(boss)
      : emptyVoidBossRewards();
    if (unlocked) unlockedCount += 1;
    got = addVoidBossRewards(got, bossGot);
    full = addVoidBossRewards(full, bossFull);
    return { boss, stage, unlocked, got: bossGot, full: bossFull };
  });
  return { perBoss, got, full, unlockedCount };
}

export function auroraFromShards(shards) {
  return (Number(shards) || 0) / AURORA_SHARDS_PER_AURORA;
}
