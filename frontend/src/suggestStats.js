/**
 * Cap advisor + bounded swap hints for one hero build.
 * Uses Idle Heroes combat caps from community formulas (not a full damage sim).
 */
import { ARTIFACT_OPTIONS, artifactOf } from "./artifacts";
import { normalizeCombatRound } from "./gameModes";
import { imprintUnlocked } from "./heroProgress";
import { SOUL_STONE_OPTIONS } from "./soulStones";
import {
  IMPRINT_OPTIONS,
  enableOf,
  enableOptionsForSlot,
  gearOf,
  imprintOf,
} from "./statCalculator";
import {
  computeHeroStatBreakdown,
  formatStatColumnLabel,
  statKey,
} from "./statTotals";

const ARTIFACT_GEAR_INDEX = 4;
const STONE_GEAR_INDEX = 5;

const ORIGIN_ACTIVE_ENERGY = 50;
const ENERGY_OVERFLOW = 100;

const OFFENSIVE_STATS = new Set([
  "Precision",
  "Crit Damage",
  "Crit",
  "Skill Damage",
  "All Damage Dealt",
  "Holy Damage",
  "Armor Break",
]);

/**
 * Hero roles for Suggest weighting.
 * Default (missing id) = support. Wukong is dd + cc + support.
 */
export const HERO_SUGGEST_PROFILES = {
  // Damage dealers
  "hero-01": { roles: ["dd"], label: "SFX" }, // Sword Flash - Xia
  "hero-03": { roles: ["dd"], label: "Asmodel" },
  "hero-06": { roles: ["dd"], label: "Aspen" },
  "hero-10": { roles: ["dd"], label: "Mockman" },
  "hero-11": { roles: ["dd"], label: "Azrael" },
  "hero-13": { roles: ["dd"], label: "Vulkan" },
  "hero-17": { roles: ["dd"], label: "Natalia", flags: { noCrit: true } },
  "hero-21": { roles: ["dd"], label: "Patricia" },
  "hero-22": { roles: ["dd"], label: "Alikita" },
  "hero-24": { roles: ["dd"], label: "Williams" },
  "hero-26": { roles: ["dd", "cc", "support"], label: "Wukong" },
  "hero-27": { roles: ["dd"], label: "Finn" },
  "hero-31": { roles: ["dd"], label: "Basilisk" },
  "hero-35": { roles: ["dd"], label: "Umbrion" },
  "hero-36": { roles: ["dd"], label: "Erskor" },
  // CC heroes (also support-weighted)
  "hero-04": { roles: ["cc", "support"], label: "Jahra" },
  "hero-08": { roles: ["cc", "support"], label: "Holmes Young" },
  "hero-18": { roles: ["cc", "support"], label: "Betty" },
  "hero-33": { roles: ["cc", "support"], label: "Oscar" },
  "hero-34": { roles: ["cc", "support"], label: "Mareia" },
};

export function heroSuggestProfile(heroId) {
  return (
    HERO_SUGGEST_PROFILES[heroId] || {
      roles: ["support"],
      label: "Support",
      flags: {},
    }
  );
}

export function formatHeroRoles(roles) {
  const order = ["dd", "cc", "support"];
  const labels = { dd: "Damage dealer", cc: "CC", support: "Support" };
  return order
    .filter((id) => (roles || []).includes(id))
    .map((id) => labels[id])
    .join(" · ");
}

/** Base combat targets (before role weighting). */
export const SUGGEST_STAT_RULES = [
  {
    stat: "Precision",
    unit: "%",
    cap: 150,
    softCap: true,
    underTarget: 150,
    priority: 100,
    note: "Damage mult caps at 150% (1 + Prec×0.3). Extra still offsets Block 1:1.",
  },
  {
    stat: "Crit Damage",
    unit: "%",
    cap: 150,
    softCap: false,
    underTarget: 150,
    priority: 95,
    note: "Crit mult caps at 150% Crit Damage (1.5 + 2×CD).",
  },
  {
    stat: "Damage Reduction",
    unit: "%",
    cap: 75,
    softCap: false,
    underTarget: 75,
    priority: 90,
    note: "DR mult is 1 − DR, capped at 75% (faction advantage can add +0.3 vs DR).",
  },
  {
    stat: "All Damage Reduction",
    unit: "%",
    cap: null,
    softCap: false,
    underTarget: 20,
    priority: 70,
    note: "Works like DR and also cuts true damage. No hard cap stated.",
  },
  {
    stat: "Skill Damage",
    unit: "%",
    cap: null,
    underTarget: 100,
    priority: 60,
  },
  {
    stat: "All Damage Dealt",
    unit: "%",
    cap: null,
    underTarget: 12,
    priority: 55,
  },
  {
    stat: "Holy Damage",
    unit: "%",
    cap: null,
    underTarget: 30,
    priority: 50,
  },
  {
    stat: "Crit",
    unit: "%",
    cap: null,
    underTarget: 35,
    priority: 45,
  },
  {
    stat: "Block",
    unit: "%",
    cap: null,
    underTarget: 70,
    priority: 40,
  },
  {
    stat: "Control Immunity",
    unit: "%",
    cap: null,
    underTarget: 35,
    priority: 35,
  },
  {
    stat: "Control Precision",
    unit: "%",
    cap: null,
    underTarget: 15,
    priority: 25,
  },
  {
    stat: "Control Immunity Offset",
    unit: "%",
    cap: null,
    underTarget: 12,
    priority: 30,
    note: "Offsets enemy CI. Priority for CC heroes.",
  },
];

/**
 * Role-tuned rule set for one hero.
 * DD → offensive floors; support → defensive (+ dump unused offense);
 * CC → Control Precision / CIO first, then defense.
 */
export function suggestRulesForHero(heroId) {
  const profile = heroSuggestProfile(heroId);
  const roles = new Set(profile.roles || ["support"]);
  const isDd = roles.has("dd");
  const isCc = roles.has("cc");
  const isSup = roles.has("support") || (!isDd && !isCc);
  const noCrit = Boolean(profile.flags?.noCrit);

  return SUGGEST_STAT_RULES.map((base) => {
    const rule = { ...base };

    if (noCrit && (rule.stat === "Crit" || rule.stat === "Crit Damage")) {
      rule.underTarget = null;
      rule.cap = 0;
      rule.softCap = true;
      rule.priority = 5;
      rule.note =
        "Natalia does not crit — Crit / Crit Damage should stay at 0.";
      return rule;
    }

    if (isDd && !isSup) {
      // Pure DD: offense first, defense secondary, CC stats low.
      if (OFFENSIVE_STATS.has(rule.stat)) {
        rule.priority = Math.max(rule.priority, 70);
      }
      if (
        rule.stat === "Damage Reduction" ||
        rule.stat === "All Damage Reduction" ||
        rule.stat === "Block" ||
        rule.stat === "Control Immunity"
      ) {
        rule.priority = Math.min(rule.priority, 55);
        if (rule.stat === "Block") rule.underTarget = 40;
        if (rule.stat === "Control Immunity") rule.underTarget = 25;
      }
      if (
        rule.stat === "Control Precision" ||
        rule.stat === "Control Immunity Offset"
      ) {
        rule.underTarget = null;
        rule.priority = 10;
      }
    }

    if (isSup && !isDd) {
      // Pure support (incl. CC supports): do not chase offense.
      if (OFFENSIVE_STATS.has(rule.stat)) {
        rule.underTarget = null;
        // Any offensive stack is soft waste to reallocate.
        if (rule.cap == null || rule.cap > 0) {
          rule.cap = 0;
          rule.softCap = true;
        }
        rule.priority = 20;
        rule.note =
          (rule.note ? `${rule.note} ` : "") +
          "Supports generally do not need offensive stats.";
      }
      if (
        rule.stat === "Damage Reduction" ||
        rule.stat === "All Damage Reduction" ||
        rule.stat === "Block" ||
        rule.stat === "Control Immunity"
      ) {
        rule.priority = Math.max(rule.priority, 85);
        if (rule.stat === "All Damage Reduction") rule.underTarget = 20;
        if (rule.stat === "Block") rule.underTarget = 70;
        if (rule.stat === "Control Immunity") rule.underTarget = 50;
      }
    }

    if (isCc) {
      if (rule.stat === "Control Precision") {
        rule.underTarget = 50;
        rule.priority = 100;
        rule.note =
          "CC chance × (1 + Control Precision%). Priority for CC heroes.";
      }
      if (rule.stat === "Control Immunity Offset") {
        rule.underTarget = 15;
        rule.priority = 95;
        rule.note = "Offsets enemy CI — priority for CC heroes.";
      }
      if (
        rule.stat === "Damage Reduction" ||
        rule.stat === "All Damage Reduction" ||
        rule.stat === "Block" ||
        rule.stat === "Control Immunity"
      ) {
        rule.priority = Math.max(rule.priority, 80);
      }
    }

    if (isDd && isSup) {
      // Hybrid (e.g. Wukong): keep offense targets + defensive floors.
      if (OFFENSIVE_STATS.has(rule.stat)) {
        rule.priority = Math.max(rule.priority, 75);
      }
      if (
        rule.stat === "Damage Reduction" ||
        rule.stat === "All Damage Reduction" ||
        rule.stat === "Block" ||
        rule.stat === "Control Immunity"
      ) {
        rule.priority = Math.max(rule.priority, 70);
      }
    }

    return rule;
  });
}

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function totalOf(totalValues, stat, unit = "%") {
  return Number(totalValues?.[statKey(stat, unit)] || 0);
}

function sourceContributions(breakdown, stat, unit = "%") {
  const key = statKey(stat, unit);
  const rows = [];
  for (const source of breakdown?.rows || []) {
    const value = Number(source.values?.[key] || 0);
    if (!value) continue;
    rows.push({
      id: source.id,
      label: source.label,
      value: round1(value),
    });
  }
  rows.sort((a, b) => b.value - a.value);
  return rows;
}

function formatSourceList(contribs, unit = "%", limit = 2) {
  if (!contribs.length) return "no tracked source";
  const suffix = unit === "%" ? "%" : "";
  return contribs
    .slice(0, limit)
    .map((c) => `${c.label} (+${c.value}${suffix})`)
    .join(", ");
}

function wasteMetrics(totalValues, rules) {
  let hard = 0;
  let soft = 0;
  for (const rule of rules || SUGGEST_STAT_RULES) {
    if (rule.cap == null) continue;
    const value = totalOf(totalValues, rule.stat, rule.unit);
    const over = Math.max(0, value - rule.cap);
    if (!over) continue;
    if (rule.softCap) soft += over;
    else hard += over;
  }
  return { hard: round1(hard), soft: round1(soft) };
}

function underMetrics(totalValues, rules) {
  let missing = 0;
  for (const rule of rules || SUGGEST_STAT_RULES) {
    if (rule.underTarget == null) continue;
    const value = totalOf(totalValues, rule.stat, rule.unit);
    const gap = Math.max(0, rule.underTarget - value);
    if (!gap) continue;
    missing += gap * ((rule.priority || 1) / 100);
  }
  return round1(missing);
}

function cloneSlot(slot) {
  return {
    ...slot,
    gear: [...(slot.gear || [])],
    enables: [...(slot.enables || [])],
    imprints: [...(slot.imprints || [])],
    progress: slot.progress ? { ...slot.progress } : slot.progress,
  };
}

function buildCtx(boardCtx) {
  return {
    aura: boardCtx?.aura || null,
    monster: boardCtx?.monster || null,
    cloudIsland: boardCtx?.cloudIsland,
    gameModeId: boardCtx?.gameModeId || null,
    combatRound: normalizeCombatRound(boardCtx?.combatRound),
    guildTech: boardCtx?.guildTech,
    starspawns: boardCtx?.starspawns,
    sigils: boardCtx?.sigils,
    train: boardCtx?.train,
  };
}

function scoreSwap(beforeTotals, afterTotals, rules) {
  const w0 = wasteMetrics(beforeTotals, rules);
  const w1 = wasteMetrics(afterTotals, rules);
  const u0 = underMetrics(beforeTotals, rules);
  const u1 = underMetrics(afterTotals, rules);
  const hardDelta = w0.hard - w1.hard;
  const softDelta = w0.soft - w1.soft;
  const underDelta = u0 - u1;
  // Penalize creating new hard overcap.
  const newHard = Math.max(0, w1.hard - w0.hard);
  return hardDelta * 3 + softDelta * 1.2 + underDelta * 2 - newHard * 4;
}

function describeDiff(beforeTotals, afterTotals, rules) {
  const parts = [];
  const keys = new Set([
    ...Object.keys(beforeTotals || {}),
    ...Object.keys(afterTotals || {}),
  ]);
  const interesting = (rules || SUGGEST_STAT_RULES)
    .map((r) => statKey(r.stat, r.unit))
    .concat([statKey("Energy", "")]);
  for (const key of interesting) {
    if (!keys.has(key) && !(beforeTotals?.[key] || afterTotals?.[key])) continue;
    const a = Number(beforeTotals?.[key] || 0);
    const b = Number(afterTotals?.[key] || 0);
    const d = round1(b - a);
    if (!d) continue;
    const { stat, unit } = (() => {
      const i = key.indexOf("|");
      return { stat: key.slice(0, i), unit: key.slice(i + 1) };
    })();
    const label = formatStatColumnLabel(stat, unit);
    parts.push(`${d > 0 ? "+" : ""}${d} ${label}`);
  }
  return parts.slice(0, 4).join(", ");
}

function gatherCandidates(slot) {
  const out = [];
  const stageId = slot?.progress?.stageId || "E5";
  const infusion = slot?.progress?.infusion ?? 0;
  const usedImprints = new Set((slot.imprints || []).filter(Boolean));

  // Imprint replacements / fills
  (slot.imprints || []).forEach((id, index) => {
    if (!imprintUnlocked(stageId, index)) return;
    for (const opt of IMPRINT_OPTIONS) {
      if (opt.id === id) continue;
      if (usedImprints.has(opt.id) && opt.id !== id) continue;
      const current = imprintOf(id);
      out.push({
        kind: "imprint",
        label: current
          ? `Swap imprint ${current.name} → ${opt.name}`
          : `Equip imprint ${opt.name}`,
        detail: `Imprint slot ${index + 1}`,
        apply(next) {
          const imprints = [...(next.imprints || [])];
          imprints[index] = opt.id;
          next.imprints = imprints;
        },
        touches: [current?.name, opt.name].filter(Boolean),
      });
    }
  });

  // Artifact swaps (only options with stats)
  const artiId = slot.gear?.[ARTIFACT_GEAR_INDEX] || null;
  for (const arti of ARTIFACT_OPTIONS) {
    if (!arti.stats?.length) continue;
    if (arti.id === artiId) continue;
    const current = artifactOf(artiId);
    out.push({
      kind: "artifact",
      label: current
        ? `Swap artifact ${current.name} → ${arti.name}`
        : `Equip artifact ${arti.name}`,
      detail: arti.stats
        .map((s) => `${s.stat} ${s.unit === "%" ? `+${s.value}%` : `+${s.value}`}`)
        .join(", "),
      apply(next) {
        const gear = [...(next.gear || [])];
        gear[ARTIFACT_GEAR_INDEX] = arti.id;
        next.gear = gear;
      },
      touches: [
        ...(current?.stats || []).map((s) => s.stat),
        ...arti.stats.map((s) => s.stat),
      ],
    });
  }

  // Soul stone swaps — prefer stones that change Precision / Crit DMG / DR-related rolls
  const stoneId = slot.gear?.[STONE_GEAR_INDEX] || null;
  const priorityStoneStats = new Set([
    "Precision",
    "Crit Damage",
    "Crit",
    "Skill Damage",
    "Holy Damage",
    "Block",
    "Armor Break",
    "Control Precision",
    "Control Immunity Offset",
  ]);
  let stoneCount = 0;
  for (const stone of SOUL_STONE_OPTIONS) {
    if (stone.id === stoneId) continue;
    const stats = stone.stats || [];
    if (!stats.some((s) => priorityStoneStats.has(s.stat))) continue;
    if (stoneCount >= 24) break;
    stoneCount += 1;
    const current = gearOf(stoneId);
    out.push({
      kind: "stone",
      label: current
        ? `Swap soul stone → ${stone.label || stone.name}`
        : `Equip soul stone ${stone.label || stone.name}`,
      detail: stats
        .map((s) =>
          s.unit === "%" ? `${s.stat} +${s.value}%` : `${s.stat} +${s.value}`
        )
        .join(", "),
      apply(next) {
        const gear = [...(next.gear || [])];
        gear[STONE_GEAR_INDEX] = stone.id;
        next.gear = gear;
      },
      touches: stats.map((s) => s.stat),
    });
  }

  // Enable 1 & 4 (wired stats: All DR / Precision / Speed)
  for (const enableIndex of [0, 3]) {
    const currentId = slot.enables?.[enableIndex] || null;
    const options = enableOptionsForSlot(enableIndex, infusion);
    for (const opt of options) {
      if (opt.id === currentId) continue;
      if (!opt.stats?.length) continue;
      const current = enableOf(currentId);
      out.push({
        kind: "enable",
        label: current
          ? `Swap ${current.label} → ${opt.label}`
          : `Equip ${opt.label}`,
        detail: `Enable slot ${enableIndex === 0 ? 1 : 4}`,
        apply(next) {
          const enables = [...(next.enables || [])];
          enables[enableIndex] = opt.id;
          next.enables = enables;
        },
        touches: [
          ...(current ? [] : []),
          ...opt.stats.map((s) => s.stat),
        ],
      });
    }
  }

  return out;
}

function relevantCandidate(candidate, over, under) {
  const focus = new Set([
    ...over.map((r) => r.stat),
    ...under.map((r) => r.stat),
  ]);
  if (!focus.size) return true;
  if (!candidate.touches?.length) return true;
  return candidate.touches.some((stat) => focus.has(stat));
}

function findBestSwaps(slot, boardCtx, breakdown, over, under, rules) {
  const beforeTotals = breakdown.totalValues || {};
  const ctx = buildCtx(boardCtx);
  const slotIndex = boardCtx?.slotIndex ?? 0;
  let candidates = gatherCandidates(slot).filter((c) =>
    relevantCandidate(c, over, under)
  );

  // Bound search: prefer imprint/enable first, then arti, then stones.
  const kindRank = { imprint: 0, enable: 1, artifact: 2, stone: 3 };
  candidates.sort(
    (a, b) => (kindRank[a.kind] ?? 9) - (kindRank[b.kind] ?? 9)
  );
  candidates = candidates.slice(0, 80);

  const scored = [];
  for (const cand of candidates) {
    const nextSlot = cloneSlot(slot);
    cand.apply(nextSlot);
    const after = computeHeroStatBreakdown(nextSlot, slotIndex, ctx);
    const score = scoreSwap(beforeTotals, after.totalValues || {}, rules);
    if (score <= 0.15) continue;
    scored.push({
      kind: cand.kind,
      label: cand.label,
      detail: cand.detail,
      score: round1(score),
      diff: describeDiff(beforeTotals, after.totalValues || {}, rules),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  // Dedupe similar labels
  const seen = new Set();
  const top = [];
  for (const row of scored) {
    if (seen.has(row.label)) continue;
    seen.add(row.label);
    top.push(row);
    if (top.length >= 5) break;
  }
  return top;
}

function buildEnergyNotes(totalValues, combatRound) {
  const energy = totalOf(totalValues, "Energy", "");
  const round = normalizeCombatRound(combatRound);
  const notes = [];
  if (energy < ORIGIN_ACTIVE_ENERGY) {
    notes.push({
      id: "energy-low",
      text:
        round === "round1"
          ? `Energy ${energy} (<${ORIGIN_ACTIVE_ENERGY}): Round 1 uses T3 / basic-attack branch, not active (T2).`
          : `Energy ${energy} (<${ORIGIN_ACTIVE_ENERGY}): will not open with an active on Round 1.`,
    });
  } else if (energy < ENERGY_OVERFLOW) {
    notes.push({
      id: "energy-active",
      text: `Energy ${energy}: opens with active on Round 1, but no overflow Skill Damage (needs ${ENERGY_OVERFLOW}+).`,
    });
  } else {
    const overflow = round1(energy - ENERGY_OVERFLOW);
    notes.push({
      id: "energy-overflow",
      text: `Energy ${energy}: ~${overflow}% Skill Damage overflow on the first active (1:1 over ${ENERGY_OVERFLOW}).`,
    });
  }
  if (round === "start") {
    notes.push({
      id: "round-start",
      text: "Combat round is Game start — T2/T3 origin combat stats are not applied yet.",
    });
  }
  return notes;
}

/**
 * Analyze one hero breakdown and propose bounded equipment swaps.
 * @returns {{ over: object[], under: object[], swaps: object[], notes: object[], profile: object }}
 */
export function analyzeHeroSuggestions(breakdown, slot, boardCtx = {}) {
  if (!breakdown?.hero || !slot?.heroId) {
    return { over: [], under: [], swaps: [], notes: [], profile: null };
  }

  const profile = heroSuggestProfile(slot.heroId);
  const rules = suggestRulesForHero(slot.heroId);
  const rulePriority = Object.fromEntries(
    rules.map((r) => [statKey(r.stat, r.unit), r.priority || 0])
  );
  const totalValues = breakdown.totalValues || {};
  const over = [];
  const under = [];

  for (const rule of rules) {
    const value = totalOf(totalValues, rule.stat, rule.unit);
    const contribs = sourceContributions(breakdown, rule.stat, rule.unit);
    const label = formatStatColumnLabel(rule.stat, rule.unit);

    if (rule.cap != null && value > rule.cap) {
      const wasted = round1(value - rule.cap);
      // Skip tiny role-waste noise (e.g. 0.1% leftover).
      if (wasted < 0.5) continue;
      over.push({
        stat: rule.stat,
        unit: rule.unit,
        label,
        value: round1(value),
        cap: rule.cap,
        wasted,
        soft: Boolean(rule.softCap),
        sources: contribs,
        sourceText: formatSourceList(contribs, rule.unit),
        note: rule.note || null,
        summary: `${label} ${round1(value)}% (cap ${rule.cap}) · +${wasted} ${
          rule.softCap ? "soft waste" : "wasted"
        } · mainly ${formatSourceList(contribs, rule.unit)}`,
      });
    }

    if (rule.underTarget != null && value < rule.underTarget) {
      const missing = round1(rule.underTarget - value);
      const isSoftFloor = rule.cap == null;
      if (isSoftFloor && value === 0 && missing < 40 && rule.priority < 50) {
        continue;
      }
      under.push({
        stat: rule.stat,
        unit: rule.unit,
        label,
        value: round1(value),
        target: rule.underTarget,
        missing,
        sources: contribs,
        sourceText: formatSourceList(contribs, rule.unit),
        note: rule.note || null,
        summary: `${label} ${round1(value)}% / ${rule.underTarget} · missing ${missing}`,
      });
    }
  }

  over.sort((a, b) => b.wasted - a.wasted || b.value - a.value);
  under.sort((a, b) => {
    const pa = rulePriority[statKey(a.stat, a.unit)] || 0;
    const pb = rulePriority[statKey(b.stat, b.unit)] || 0;
    return pb - pa || b.missing - a.missing;
  });

  const notes = buildEnergyNotes(totalValues, boardCtx.combatRound);
  notes.unshift({
    id: "role",
    text: `Role: ${formatHeroRoles(profile.roles)}${
      profile.flags?.noCrit ? " · no Crit / Crit Damage" : ""
    }.`,
  });
  const swaps = findBestSwaps(slot, boardCtx, breakdown, over, under, rules);

  return { over, under, swaps, notes, profile };
}

/** Board context helper for the Suggest modal. */
export function suggestBoardContext(board, boardStats, slotIndex) {
  return {
    slotIndex,
    aura: boardStats?.aura || null,
    monster: board?.monster || null,
    cloudIsland: board?.cloudIsland,
    gameModeId: board?.gameModeId || null,
    combatRound: board?.combatRound,
    guildTech: board?.guildTech,
    starspawns: board?.starspawns,
    sigils: board?.sigils,
    train: board?.train,
  };
}
