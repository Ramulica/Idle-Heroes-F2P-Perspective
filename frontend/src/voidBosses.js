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

export function emptyVoidBossEntry() {
  return { cleared: 0, soon: 0 };
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

export function subVoidBossRewards(left, right) {
  const out = emptyVoidBossRewards();
  Object.keys(out).forEach((key) => {
    out[key] = Math.max(
      0,
      (Number(left?.[key]) || 0) - (Number(right?.[key]) || 0)
    );
  });
  return out;
}

export function clampVoidBossCleared(value) {
  const stage = Math.round(Number(value));
  if (!Number.isFinite(stage)) return 0;
  if (stage < 0) return VOID_BOSS_LOCKED;
  return Math.min(VOID_BOSS_STAGES, Math.max(0, stage));
}

export function clampVoidBossSoon(value) {
  const stage = Math.round(Number(value) || 0);
  return Math.min(VOID_BOSS_STAGES, Math.max(0, stage));
}

export function isVoidBossUnlocked(entry) {
  return clampVoidBossCleared(entry?.cleared) >= 0;
}

export function normalizeVoidBossEntry(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    let cleared = clampVoidBossCleared(raw.cleared);
    let soon = clampVoidBossSoon(raw.soon);
    if (cleared === VOID_BOSS_LOCKED) {
      return { cleared: VOID_BOSS_LOCKED, soon: 0 };
    }
    if (soon < cleared) soon = cleared;
    return { cleared, soon };
  }
  // Legacy: plain stage number (-1 locked, 0 none, 1–10 cleared)
  const cleared = clampVoidBossCleared(raw);
  if (cleared === VOID_BOSS_LOCKED) {
    return { cleared: VOID_BOSS_LOCKED, soon: 0 };
  }
  return { cleared, soon: cleared };
}

export function normalizeVoidBossStages(raw) {
  const src = Array.isArray(raw) ? raw : [];
  return Array.from({ length: VOID_BOSS_COUNT }, (_, index) =>
    normalizeVoidBossEntry(src[index])
  );
}

/** Sum of stage clears from..to inclusive. */
export function voidBossRangeRewards(boss, fromStage, toStage) {
  const from = Math.max(1, Number(fromStage) || 0);
  const to = Math.min(VOID_BOSS_STAGES, Number(toStage) || 0);
  let total = emptyVoidBossRewards();
  for (let stage = from; stage <= to; stage += 1) {
    total = addVoidBossRewards(total, voidBossStageReward(boss, stage));
  }
  return total;
}

export function voidBossClearedRewards(boss, clearedStage) {
  const cleared = clampVoidBossCleared(clearedStage);
  if (cleared < 1) return emptyVoidBossRewards();
  return voidBossRangeRewards(boss, 1, cleared);
}

export function voidBossFullRewards(boss) {
  return voidBossRangeRewards(boss, 1, VOID_BOSS_STAGES);
}

export function voidBossSoonRewards(boss, entry) {
  const normalized = normalizeVoidBossEntry(entry);
  if (!isVoidBossUnlocked(normalized)) return emptyVoidBossRewards();
  const cleared = Math.max(0, normalized.cleared);
  if (normalized.soon <= cleared) return emptyVoidBossRewards();
  return voidBossRangeRewards(boss, cleared + 1, normalized.soon);
}

export function voidBossStageLabel(boss, entry) {
  const value = normalizeVoidBossEntry(entry);
  if (value.cleared === VOID_BOSS_LOCKED) return "Not unlocked";
  if (value.cleared <= 0 && value.soon <= 0) return "Not cleared";
  const bits = [];
  if (value.cleared > 0) bits.push(`${boss}-${value.cleared}`);
  if (value.soon > value.cleared) {
    bits.push(`Soon ${boss}-${value.soon}`);
  } else if (value.cleared <= 0 && value.soon > 0) {
    bits.push(`Soon ${boss}-${value.soon}`);
  }
  return bits.join(" · ");
}

/**
 * Tap once → Soon (planned). Tap again → Cleared.
 * Keep the picker open so the second tap works.
 */
export function toggleVoidBossStage(entry, stage) {
  const current = normalizeVoidBossEntry(entry);
  const target = clampVoidBossSoon(stage);
  if (target < 1) return emptyVoidBossEntry();

  if (current.cleared === VOID_BOSS_LOCKED) {
    return { cleared: 0, soon: target };
  }

  if (current.soon === target && current.cleared < target) {
    return { cleared: target, soon: target };
  }

  if (current.cleared === target) {
    return { cleared: target, soon: target };
  }

  const cleared = Math.min(current.cleared, target);
  return { cleared: Math.max(0, cleared), soon: target };
}

export function voidBossProgressTotals(stages) {
  const values = normalizeVoidBossStages(stages);
  let got = emptyVoidBossRewards();
  let soon = emptyVoidBossRewards();
  let full = emptyVoidBossRewards();
  let unlockedCount = 0;
  const perBoss = values.map((entry, index) => {
    const boss = index + 1;
    const unlocked = isVoidBossUnlocked(entry);
    const bossGot = unlocked
      ? voidBossClearedRewards(boss, entry.cleared)
      : emptyVoidBossRewards();
    const bossSoon = unlocked
      ? voidBossSoonRewards(boss, entry)
      : emptyVoidBossRewards();
    const bossFull = unlocked
      ? voidBossFullRewards(boss)
      : emptyVoidBossRewards();
    const bossLeft = unlocked
      ? subVoidBossRewards(
          bossFull,
          addVoidBossRewards(bossGot, bossSoon)
        )
      : emptyVoidBossRewards();
    if (unlocked) unlockedCount += 1;
    got = addVoidBossRewards(got, bossGot);
    soon = addVoidBossRewards(soon, bossSoon);
    full = addVoidBossRewards(full, bossFull);
    return {
      boss,
      entry,
      unlocked,
      got: bossGot,
      soon: bossSoon,
      left: bossLeft,
      full: bossFull,
    };
  });
  const left = subVoidBossRewards(full, addVoidBossRewards(got, soon));
  return { perBoss, got, soon, left, full, unlockedCount };
}

export function auroraFromShards(shards) {
  return (Number(shards) || 0) / AURORA_SHARDS_PER_AURORA;
}

/** Map void-boss loot into Upgrade Hero cost units (lowers Still need). */
export function voidBossRewardsAsOwned(rewards) {
  return {
    cot: Number(rewards?.cot) || 0,
    stellar: Number(rewards?.stellar) || 0,
    essence: 0,
    cores: 0,
    subs: 0,
    dtMats: auroraFromShards(rewards?.auroraShards),
    spiritVein: Number(rewards?.spiritVein) || 0,
  };
}

export function voidBossOwnedFromStages(stages) {
  const totals = voidBossProgressTotals(stages);
  return voidBossRewardsAsOwned(addVoidBossRewards(totals.got, totals.soon));
}
