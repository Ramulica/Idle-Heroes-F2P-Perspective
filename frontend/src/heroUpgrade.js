export const VOID_MAT_VALUE = 1_250_000;
export const ORIGIN_ESSENCE_VALUE = 150_000;
export const DT_VEIN_PER_MAT = 200_000;
export const DT_AURORA_PER_MAT = 5;
export const V_COT = 5_000_000;
export const DT_UNLOCK_STELLAR = 5_000_000;
export const DT_UNLOCK_COT = 14_929_100;

export const V_STELLAR = {
  V1: 138_630,
  V2: 587_910,
  V3: 1_458_390,
  V4: 2_750_070,
};

export const T_COSTS = {
  T1: { essence: 31_020, stellar: 307_350 },
  T2: { essence: 69_820, stellar: 637_350 },
  T3: { essence: 132_620, stellar: 1_127_350 },
  T4: { essence: 219_420, stellar: 1_777_350 },
  T5: { essence: 330_220, stellar: 2_587_350 },
  T120: { essence: 465_020, stellar: 3_557_350 },
};

export const CORE_CHESTS = 8;
export const SUBS_PER_SKILL = 2;

export const T_OPTIONALS = [
  { id: "core", short: "Core", label: "Core · 8 chests", min: "T1", cores: CORE_CHESTS, subs: 0 },
  { id: "subActive", short: "A", label: "Active skill subs · 2", min: "T2", cores: 0, subs: SUBS_PER_SKILL },
  { id: "subP1", short: "P1", label: "Passive 1 subs · 2", min: "T3", cores: 0, subs: SUBS_PER_SKILL },
  { id: "subP2", short: "P2", label: "Passive 2 subs · 2", min: "T4", cores: 0, subs: SUBS_PER_SKILL },
  { id: "subP3", short: "P3", label: "Passive 3 subs · 2", min: "T5", cores: 0, subs: SUBS_PER_SKILL },
];

export const EMPTY_OPTIONALS = {
  core: false,
  subActive: false,
  subP1: false,
  subP2: false,
  subP3: false,
};

export const DT_COSTS = {
  D1: { dtMats: 5, stellar: 420_000, spiritVein: 197_236, cot: 821_540 },
  D2: { dtMats: 7, stellar: 590_000, spiritVein: 277_200, cot: 1_155_000 },
  D3: { dtMats: 9, stellar: 750_000, spiritVein: 356_400, cot: 1_485_000 },
  D4: { dtMats: 11, stellar: 920_000, spiritVein: 435_600, cot: 1_815_000 },
  D5: { dtMats: 13, stellar: 1_100_000, spiritVein: 514_800, cot: 2_145_000 },
  D6: { dtMats: 15, stellar: 1_250_000, spiritVein: 619_300, cot: 2_578_950 },
};

export const STAGES = [
  { id: "E1", group: "E", label: "E1", mark: "E1", rank: 1 },
  { id: "E2", group: "E", label: "E2", mark: "E2", rank: 2 },
  { id: "E3", group: "E", label: "E3", mark: "E3", rank: 3 },
  { id: "E4", group: "E", label: "E4", mark: "E4", rank: 4 },
  { id: "E5", group: "E", label: "E5", mark: "E5", rank: 5 },
  { id: "V1", group: "V", label: "V1", mark: "1", rank: 6 },
  { id: "V2", group: "V", label: "V2", mark: "2", rank: 7 },
  { id: "V3", group: "V", label: "V3", mark: "3", rank: 8 },
  { id: "V4", group: "V", label: "V4", mark: "4", rank: 9 },
  { id: "T1", group: "T", label: "T1 · lv 20 Core", mark: "I", rank: 10 },
  { id: "T2", group: "T", label: "T2 · lv 40 Active", mark: "II", rank: 11 },
  { id: "T3", group: "T", label: "T3 · lv 60 P1", mark: "III", rank: 12 },
  { id: "T4", group: "T", label: "T4 · lv 80 P2", mark: "IV", rank: 13 },
  { id: "T5", group: "T", label: "T5 · lv 100 P3", mark: "V", rank: 14 },
  { id: "T120", group: "T", label: "T max · lv 120", mark: "M", rank: 15 },
  { id: "D1", group: "D", label: "D1 Origin", mark: "1", dt: 1, rank: 16 },
  { id: "D2", group: "D", label: "D2 Surge", mark: "2", dt: 2, rank: 17 },
  { id: "D3", group: "D", label: "D3 Chaos", mark: "3", dt: 3, rank: 18 },
  { id: "D4", group: "D", label: "D4 Core", mark: "4", dt: 4, rank: 19 },
  { id: "D5", group: "D", label: "D5 Polystar", mark: "5", dt: 5, rank: 20 },
  { id: "D6", group: "D", label: "D6 Nirvana", mark: "6", dt: 6, rank: 21 },
];

export const STAGE_BY_ID = Object.fromEntries(STAGES.map((row) => [row.id, row]));

export const TEMPLE_TABLE = [
  { lvl: 1, bonus: 0, cap: [3, 2, 1, 0, 0, 0], req: [0, 0, 0, 0, 0, 0] },
  { lvl: 2, bonus: 0, cap: [4, 3, 2, 0, 0, 0], req: [3, 0, 0, 0, 0, 0] },
  { lvl: 3, bonus: 1, cap: [5, 4, 3, 0, 0, 0], req: [2, 2, 0, 0, 0, 0] },
  { lvl: 4, bonus: 2, cap: [6, 5, 4, 1, 0, 0], req: [0, 1, 2, 0, 0, 0] },
  { lvl: 5, bonus: 3, cap: [7, 6, 5, 2, 0, 0], req: [2, 1, 1, 1, 0, 0] },
  { lvl: 6, bonus: 4, cap: [8, 7, 6, 3, 0, 0], req: [0, 2, 2, 1, 0, 0] },
  { lvl: 7, bonus: 4, cap: [9, 8, 7, 4, 1, 0], req: [1, 1, 2, 2, 0, 0] },
  { lvl: 8, bonus: 5, cap: [10, 9, 8, 5, 2, 0], req: [0, 0, 2, 2, 1, 0] },
  { lvl: 9, bonus: 5, cap: [11, 10, 9, 6, 3, 0], req: [0, 0, 2, 3, 1, 0] },
  { lvl: 10, bonus: 6, cap: [12, 11, 10, 7, 4, 1], req: [0, 0, 3, 2, 2, 0] },
  { lvl: 11, bonus: 6, cap: [12, 12, 11, 8, 5, 2], req: [0, 0, 2, 2, 2, 1] },
  { lvl: 12, bonus: 7, cap: [12, 12, 12, 9, 6, 3], req: [0, 0, 1, 3, 3, 1] },
  { lvl: 13, bonus: 7, cap: [12, 12, 12, 10, 7, 4], req: [0, 0, 1, 3, 3, 2] },
  { lvl: 14, bonus: 8, cap: [12, 12, 12, 11, 8, 5], req: [0, 0, 0, 4, 3, 3] },
  { lvl: 15, bonus: 8, cap: [12, 12, 12, 12, 9, 6], req: [0, 0, 0, 5, 4, 3] },
  { lvl: 16, bonus: 9, cap: [12, 12, 12, 12, 10, 8], req: [0, 0, 0, 6, 4, 4] },
  { lvl: 17, bonus: 9, cap: [16, 12, 12, 12, 11, 8], req: [0, 0, 0, 8, 6, 4] },
  { lvl: 18, bonus: 9, cap: [16, 16, 12, 12, 12, 8], req: [0, 0, 0, 10, 6, 5] },
  { lvl: 19, bonus: 10, cap: [16, 16, 16, 12, 12, 10], req: [0, 0, 0, 12, 8, 5] },
  { lvl: 20, bonus: 10, cap: [16, 16, 16, 16, 12, 10], req: [0, 0, 0, 12, 8, 6] },
  { lvl: 21, bonus: 10, cap: [16, 16, 16, 16, 14, 12], req: [0, 0, 0, 14, 10, 6] },
  { lvl: 22, bonus: 10, cap: [16, 16, 16, 16, 16, 12], req: [0, 0, 0, 16, 12, 8] },
];

export const DEFAULT_HERO_UPGRADE = {
  have: [],
  want: [],
  haveTempleManual: null,
  wantTempleManual: null,
  otherSources: {
    cot: 0,
    stellar: 0,
    essence: 0,
    cores: 0,
    subs: 0,
    dtMats: 0,
    spiritVein: 0,
  },
};

export function emptyCost() {
  return {
    cot: 0,
    stellar: 0,
    essence: 0,
    cores: 0,
    subs: 0,
    dtMats: 0,
    spiritVein: 0,
  };
}

export function addCosts(left, right) {
  const out = emptyCost();
  Object.keys(out).forEach((key) => {
    out[key] = (Number(left?.[key]) || 0) + (Number(right?.[key]) || 0);
  });
  return out;
}

export function subCosts(left, right) {
  const out = emptyCost();
  Object.keys(out).forEach((key) => {
    out[key] = Math.max(0, (Number(left?.[key]) || 0) - (Number(right?.[key]) || 0));
  });
  return out;
}

export function stageOf(id) {
  return STAGE_BY_ID[id] || STAGE_BY_ID.E5;
}

export function clampTemple(value) {
  const lvl = Math.round(Number(value) || 1);
  return Math.min(22, Math.max(1, lvl));
}

export function templeRow(level) {
  return TEMPLE_TABLE[clampTemple(level) - 1];
}

export function dtLevelOf(stageId) {
  return Number(stageOf(stageId).dt) || 0;
}

export function dtCounts(heroes) {
  const counts = [0, 0, 0, 0, 0, 0];
  (heroes || []).forEach((hero) => {
    const dt = dtLevelOf(hero.stage);
    if (dt >= 1 && dt <= 6) counts[dt - 1] += 1;
  });
  return counts;
}

export function meetsTempleReq(counts, req) {
  return req.every((need, index) => (counts[index] || 0) >= need);
}

export function autoTempleLevel(heroes) {
  const counts = dtCounts(heroes);
  let best = 1;
  TEMPLE_TABLE.forEach((row) => {
    if (meetsTempleReq(counts, row.req)) best = row.lvl;
  });
  return best;
}

export function resolvedTempleLevel(heroes, templeManual) {
  if (templeManual == null || templeManual === "") {
    return autoTempleLevel(heroes);
  }
  return clampTemple(templeManual);
}

export function templeCapFor(level, dtLevel) {
  if (dtLevel < 1 || dtLevel > 6) return Infinity;
  return templeRow(level).cap[dtLevel - 1] || 0;
}

export function canPlaceStage(heroes, heroId, stageId, templeLevel) {
  const dt = dtLevelOf(stageId);
  if (!dt) return true;
  const cap = templeCapFor(templeLevel, dt);
  if (cap <= 0) return false;
  const used = (heroes || []).filter(
    (hero) => hero.id !== heroId && dtLevelOf(hero.stage) === dt
  ).length;
  return used + 1 <= cap;
}

export function displayedDt(stageId, templeLevel) {
  const dt = dtLevelOf(stageId);
  if (!dt) return 0;
  return dt + templeRow(templeLevel).bonus;
}

export function isDtStage(stageId) {
  return stageOf(stageId).group === "D";
}

export function isTStage(stageId) {
  return stageOf(stageId).group === "T";
}

export function optionalsRequired(stageId) {
  return isDtStage(stageId);
}

export function optionalUnlocked(stageId, optionalId) {
  const row = T_OPTIONALS.find((item) => item.id === optionalId);
  if (!row) return false;
  return stageOf(stageId).rank >= stageOf(row.min).rank;
}

export function visibleOptionals(stageId) {
  return T_OPTIONALS.filter((item) => optionalUnlocked(stageId, item.id));
}

export function resolvedOptionals(hero) {
  const stageId = hero?.stage;
  if (optionalsRequired(stageId)) {
    return {
      core: true,
      subActive: true,
      subP1: true,
      subP2: true,
      subP3: true,
    };
  }
  const out = { ...EMPTY_OPTIONALS };
  visibleOptionals(stageId).forEach((item) => {
    out[item.id] = Boolean(hero?.[item.id]);
  });
  return out;
}

export function optionalSummary(hero) {
  const owned = resolvedOptionals(hero);
  return visibleOptionals(hero?.stage)
    .filter((item) => owned[item.id])
    .map((item) => item.short);
}

export function costToStage(stageId, optionals = EMPTY_OPTIONALS) {
  const stage = stageOf(stageId);
  const cost = emptyCost();
  if (stage.rank >= stageOf("V1").rank) cost.cot += V_COT;
  if (stage.rank >= stageOf("V1").rank) cost.stellar += V_STELLAR.V1;
  if (stage.rank >= stageOf("V2").rank) cost.stellar += V_STELLAR.V2;
  if (stage.rank >= stageOf("V3").rank) cost.stellar += V_STELLAR.V3;
  if (stage.rank >= stageOf("V4").rank) cost.stellar += V_STELLAR.V4;

  let tRow = null;
  if (stage.rank >= stageOf("T120").rank) tRow = T_COSTS.T120;
  else if (stage.rank >= stageOf("T5").rank) tRow = T_COSTS.T5;
  else if (stage.rank >= stageOf("T4").rank) tRow = T_COSTS.T4;
  else if (stage.rank >= stageOf("T3").rank) tRow = T_COSTS.T3;
  else if (stage.rank >= stageOf("T2").rank) tRow = T_COSTS.T2;
  else if (stage.rank >= stageOf("T1").rank) tRow = T_COSTS.T1;
  if (tRow) {
    cost.essence += tRow.essence;
    cost.stellar += tRow.stellar;
  }

  const owned = resolvedOptionals({ stage: stageId, ...optionals });
  T_OPTIONALS.forEach((item) => {
    if (!optionalUnlocked(stageId, item.id) || !owned[item.id]) return;
    cost.cores += item.cores;
    cost.subs += item.subs;
  });

  if (stage.rank >= stageOf("D1").rank) {
    cost.stellar += DT_UNLOCK_STELLAR;
    cost.cot += DT_UNLOCK_COT;
    ["D1", "D2", "D3", "D4", "D5", "D6"].forEach((id) => {
      if (stage.rank >= stageOf(id).rank) {
        const row = DT_COSTS[id];
        cost.dtMats += row.dtMats;
        cost.stellar += row.stellar;
        cost.spiritVein += row.spiritVein;
        cost.cot += row.cot;
      }
    });
  }
  return cost;
}

export function costForHero(hero) {
  return costToStage(hero?.stage, resolvedOptionals(hero));
}

export function rosterCost(heroes) {
  return (heroes || []).reduce(
    (total, hero) => addCosts(total, costForHero(hero)),
    emptyCost()
  );
}

export function eventMatsFromCost(cost) {
  const cot = Number(cost?.cot) || 0;
  const stellar = Number(cost?.stellar) || 0;
  const essence = Number(cost?.essence) || 0;
  const cores = Number(cost?.cores) || 0;
  const subs = Number(cost?.subs) || 0;
  const dtMats = Number(cost?.dtMats) || 0;
  const spiritVein = Number(cost?.spiritVein) || 0;
  return {
    voidForCot: cot / VOID_MAT_VALUE,
    voidForStellar: stellar / VOID_MAT_VALUE,
    voidTotal: cot / VOID_MAT_VALUE + stellar / VOID_MAT_VALUE,
    originForEssence: essence / ORIGIN_ESSENCE_VALUE,
    originForCores: cores,
    originForSubs: subs,
    originTotal: essence / ORIGIN_ESSENCE_VALUE + cores + subs,
    dtForAurora: dtMats / DT_AURORA_PER_MAT,
    dtForVein: spiritVein / DT_VEIN_PER_MAT,
    dtTotal: dtMats / DT_AURORA_PER_MAT + spiritVein / DT_VEIN_PER_MAT,
  };
}

export function newHero(stage = "E5", extra = {}) {
  const id =
    extra.id ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `hero-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  return normalizeHero({
    ...EMPTY_OPTIONALS,
    ...extra,
    id,
    stage: STAGE_BY_ID[stage] ? stage : extra.stage || "E5",
  });
}

export function normalizeHero(hero) {
  if (!hero || !STAGE_BY_ID[hero.stage]) return null;
  const optionals = { ...EMPTY_OPTIONALS };
  T_OPTIONALS.forEach((item) => {
    optionals[item.id] = Boolean(hero[item.id]);
  });
  if (optionalsRequired(hero.stage)) {
    T_OPTIONALS.forEach((item) => {
      optionals[item.id] = true;
    });
  }
  return {
    id: String(
      hero.id || `hero-${Date.now()}-${Math.random().toString(16).slice(2)}`
    ),
    stage: hero.stage,
    ...optionals,
  };
}

function normalizeHeroes(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeHero).filter(Boolean);
}

function readTempleManual(value, fallback = null) {
  if (value == null || value === "") return fallback;
  return clampTemple(value);
}

export function normalizeHeroUpgrade(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const legacy =
    src.templeManual == null || src.templeManual === ""
      ? null
      : clampTemple(src.templeManual);
  return {
    have: normalizeHeroes(src.have),
    want: normalizeHeroes(src.want),
    haveTempleManual: readTempleManual(src.haveTempleManual, legacy),
    wantTempleManual: readTempleManual(src.wantTempleManual, legacy),
    otherSources: normalizeOtherSources(src.otherSources),
  };
}

export function normalizeOtherSources(raw) {
  const out = emptyCost();
  Object.keys(out).forEach((key) => {
    const amount = Number(raw?.[key]);
    out[key] = Number.isFinite(amount) && amount > 0 ? amount : 0;
  });
  return out;
}

export function parseResourceInput(text) {
  let value = String(text ?? "")
    .trim()
    .replace(/,/g, "")
    .replace(/_/g, "")
    .replace(/\s/g, "");
  if (!value) return 0;
  const kilo = /k$/i.test(value);
  if (kilo) value = value.slice(0, -1);
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return kilo ? amount * 1000 : amount;
}

export function formatCap(value) {
  return value ? String(value) : "—";
}

export function dtCapLabel(level) {
  const row = templeRow(level);
  return row.cap
    .map((value, index) => `D${index + 1} ${formatCap(value)}`)
    .join(" · ");
}
