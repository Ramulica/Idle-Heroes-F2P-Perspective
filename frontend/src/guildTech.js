import classWarrior from "./assets/stats/guildTech/class-warrior.png";
import classMage from "./assets/stats/guildTech/class-mage.png";
import classRanger from "./assets/stats/guildTech/class-ranger.png";
import classAssassin from "./assets/stats/guildTech/class-assassin.png";
import classPriest from "./assets/stats/guildTech/class-priest.png";

export const GUILD_TECH_CLASSES = [
  {
    id: "Warrior",
    name: "Warrior",
    color: "#e8822a",
    colorSoft: "#f3b06a",
    icon: classWarrior,
  },
  {
    id: "Mage",
    name: "Mage",
    color: "#3d8fd9",
    colorSoft: "#7eb6ea",
    icon: classMage,
  },
  {
    id: "Ranger",
    name: "Ranger",
    color: "#3da84a",
    colorSoft: "#7bc984",
    icon: classRanger,
  },
  {
    id: "Assassin",
    name: "Assassin",
    color: "#9b5ed4",
    colorSoft: "#c49aeb",
    icon: classAssassin,
  },
  {
    id: "Priest",
    name: "Priest",
    color: "#d64545",
    colorSoft: "#e88a8a",
    icon: classPriest,
  },
];

export const GUILD_TECH_CLASS_BY_ID = Object.fromEntries(
  GUILD_TECH_CLASSES.map((row) => [row.id, row])
);

const pct = (stat, value) => ({ stat, value, unit: "%" });
const flat = (stat, value) => ({ stat, value, unit: "" });

/** Individual CC immunities folded into Control Immunity for display. */
export const CC_IMMUNITY_STATS = [
  "Seal of Light Immunity",
  "Shape Shift Immunity",
  "Taunt Immunity",
  "Dazzle Immunity",
  "Petrify Immunity",
  "Twin Fear Immunity",
  "Horrify Immunity",
  "Stun Immunity",
  "Freeze Immunity",
  "Silence Immunity",
];

export const CC_IMMUNITY_STAT_SET = new Set(CC_IMMUNITY_STATS);

/**
 * Inner ring nodes 1–8, counter-clockwise from top-left (ring rotated 22.5°
 * so there is no node at exact top — two nodes flank the top).
 * HP / Attack rows are listed for completeness; calculator ignores HP & Attack.
 *
 * Angles: math degrees, 0 = east, CCW positive. Screen y uses −sin.
 */
export const GUILD_TECH_INNER_NODES = [
  {
    id: "inner-1",
    label: "HP",
    short: "HP",
    angle: 112.5,
    statsForClass: () => [pct("HP", 30)],
  },
  {
    id: "inner-2",
    label: "Attack",
    short: "ATK",
    angle: 157.5,
    statsForClass: () => [pct("Attack", 25)],
  },
  {
    id: "inner-3",
    label: "Crit / Block",
    short: "CRIT",
    angle: 202.5,
    statsForClass: (classId) =>
      classId === "Ranger" ? [pct("Block", 20)] : [pct("Crit", 20)],
  },
  {
    id: "inner-4",
    label: "Defensive",
    short: "DEF",
    angle: 247.5,
    statsForClass: (classId) => {
      if (classId === "Warrior") return [pct("Block", 15)];
      if (classId === "Mage" || classId === "Ranger")
        return [pct("Precision", 15)];
      if (classId === "Assassin") return [pct("Armor Break", 15)];
      return [flat("Speed", 60)];
    },
  },
  {
    id: "inner-5",
    label: "Skill Damage",
    short: "SD",
    angle: 292.5,
    statsForClass: () => [pct("Skill Damage", 20)],
  },
  {
    id: "inner-6",
    label: "Speed",
    short: "SPD",
    angle: 337.5,
    statsForClass: (classId) => [
      flat("Speed", classId === "Priest" ? 20 : 80),
    ],
  },
  {
    id: "inner-7",
    label: "ATK / HP",
    short: "A/H",
    angle: 22.5,
    statsForClass: () => [pct("Attack", 20), pct("HP", 20)],
  },
  {
    id: "inner-8",
    label: "HP / SD",
    short: "H/S",
    angle: 67.5,
    statsForClass: () => [pct("HP", 20), pct("Skill Damage", 20)],
  },
];

/** Right outer: CC immunities, top → bottom. */
export const GUILD_TECH_CC_NODES = [
  {
    id: "cc-1",
    label: "Seal / Shape Shift",
    short: "Seal",
    side: "right",
    order: 0,
    immunities: ["Seal of Light Immunity", "Shape Shift Immunity"],
  },
  {
    id: "cc-2",
    label: "Taunt / Dazzle",
    short: "Taunt",
    side: "right",
    order: 1,
    immunities: ["Taunt Immunity", "Dazzle Immunity"],
  },
  {
    id: "cc-3",
    label: "Petrify / Fear / Horrify",
    short: "Petrify",
    side: "right",
    order: 2,
    immunities: [
      "Petrify Immunity",
      "Twin Fear Immunity",
      "Horrify Immunity",
    ],
  },
  {
    id: "cc-4",
    label: "Stun / Freeze / Silence",
    short: "Stun",
    side: "right",
    order: 3,
    immunities: ["Stun Immunity", "Freeze Immunity", "Silence Immunity"],
  },
];

const CLASS_ORDER = GUILD_TECH_CLASSES.map((row) => row.id);

/** Anti-class targets for a guild-tech class (other classes, top→bottom). */
export function antiClassTargetsFor(classId) {
  return CLASS_ORDER.filter((id) => id !== classId);
}

export function guildTechOuterNodes(classId) {
  const targets = antiClassTargetsFor(classId);
  const left = targets.map((targetId, order) => ({
    id: `anti-${targetId}`,
    label: `vs ${targetId}`,
    short: targetId.slice(0, 3).toUpperCase(),
    side: "left",
    order,
    targetClassId: targetId,
    stats: [pct(`Damage vs ${targetId}`, 30)],
  }));
  return [...left, ...GUILD_TECH_CC_NODES];
}

export function allGuildTechNodeIds(classId) {
  return [
    ...GUILD_TECH_INNER_NODES.map((n) => n.id),
    ...guildTechOuterNodes(classId).map((n) => n.id),
  ];
}

/** Default: every node enabled (maxed). */
export function defaultGuildTechClassState(classId) {
  const enabled = {};
  for (const id of allGuildTechNodeIds(classId)) enabled[id] = true;
  return { enabled };
}

export function defaultGuildTech() {
  const byClass = {};
  for (const row of GUILD_TECH_CLASSES) {
    byClass[row.id] = defaultGuildTechClassState(row.id);
  }
  return byClass;
}

export function normalizeGuildTech(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const byClass = {};
  for (const row of GUILD_TECH_CLASSES) {
    const prev = src[row.id] && typeof src[row.id] === "object" ? src[row.id] : {};
    const enabledSrc =
      prev.enabled && typeof prev.enabled === "object" ? prev.enabled : {};
    const enabled = {};
    for (const id of allGuildTechNodeIds(row.id)) {
      enabled[id] = enabledSrc[id] !== false;
    }
    byClass[row.id] = { enabled };
  }
  return byClass;
}

export function isGuildTechNodeEnabled(guildTech, classId, nodeId) {
  const state = guildTech?.[classId]?.enabled;
  if (!state) return true;
  return state[nodeId] !== false;
}

export function toggleGuildTechNode(guildTech, classId, nodeId) {
  const next = normalizeGuildTech(guildTech);
  const cur = next[classId].enabled[nodeId] !== false;
  next[classId] = {
    enabled: { ...next[classId].enabled, [nodeId]: !cur },
  };
  return next;
}

export function guildTechNodeStats(classId, nodeId) {
  const inner = GUILD_TECH_INNER_NODES.find((n) => n.id === nodeId);
  if (inner) return inner.statsForClass(classId);

  const outer = guildTechOuterNodes(classId).find((n) => n.id === nodeId);
  if (!outer) return [];
  if (outer.immunities) {
    return outer.immunities.map((stat) => pct(stat, 20));
  }
  return outer.stats || [];
}

/** Stats this hero gets from board guild tech for their class. */
export function collectGuildTechForHero(slot, guildTech, heroOf) {
  const hero = heroOf?.(slot?.heroId);
  if (!hero?.heroClass) return [];
  const classId = hero.heroClass;
  if (!GUILD_TECH_CLASS_BY_ID[classId]) return [];
  const rows = [];
  for (const id of allGuildTechNodeIds(classId)) {
    if (!isGuildTechNodeEnabled(guildTech, classId, id)) continue;
    rows.push(...guildTechNodeStats(classId, id));
  }
  return rows;
}

const IGNORED_GUILD_SUMMARY = new Set(["HP", "Attack"]);

/** Merged enabled stats for one class (for the guild-tech modal summary). */
export function summarizeGuildTechClass(guildTech, classId) {
  if (!GUILD_TECH_CLASS_BY_ID[classId]) {
    return { rows: [], immunities: [], ciFromImmunities: 0 };
  }
  const merged = new Map();
  const immunities = [];
  for (const id of allGuildTechNodeIds(classId)) {
    if (!isGuildTechNodeEnabled(guildTech, classId, id)) continue;
    for (const row of guildTechNodeStats(classId, id)) {
      if (IGNORED_GUILD_SUMMARY.has(row.stat)) continue;
      if (CC_IMMUNITY_STAT_SET.has(row.stat) && (row.unit || "%") === "%") {
        immunities.push({
          stat: row.stat,
          value: Number(row.value) || 0,
          unit: "%",
        });
        continue;
      }
      const key = `${row.stat}|${row.unit || ""}`;
      const prev = merged.get(key) || {
        stat: row.stat,
        unit: row.unit || "",
        value: 0,
      };
      prev.value += Number(row.value) || 0;
      merged.set(key, prev);
    }
  }
  const ciFromImmunities =
    immunities.length > 0
      ? Math.min(...immunities.map((row) => row.value))
      : 0;
  if (ciFromImmunities) {
    const key = "Control Immunity|%";
    const prev = merged.get(key) || {
      stat: "Control Immunity",
      unit: "%",
      value: 0,
    };
    prev.value += ciFromImmunities;
    prev.ciFromImmunities = ciFromImmunities;
    merged.set(key, prev);
  }
  const rows = [...merged.values()]
    .map((row) => ({
      ...row,
      value: Math.round(row.value * 10) / 10,
    }))
    .sort((a, b) => {
      if (a.stat === "Speed" && b.stat !== "Speed") return -1;
      if (b.stat === "Speed" && a.stat !== "Speed") return 1;
      return a.stat.localeCompare(b.stat);
    });
  return {
    rows,
    immunities: immunities.sort((a, b) => a.stat.localeCompare(b.stat)),
    ciFromImmunities,
  };
}

/**
 * Fold individual CC immunities into Control Immunity for display lists.
 * Returns { rows, immunities, ciFromImmunities }.
 */
export function foldControlImmunityDisplay(statRows) {
  const immunities = [];
  const kept = [];
  let ci = 0;
  let ciUnit = "%";

  for (const row of statRows || []) {
    if (CC_IMMUNITY_STAT_SET.has(row.stat) && row.unit === "%") {
      immunities.push({ ...row });
      continue;
    }
    if (row.stat === "Control Immunity" && row.unit === "%") {
      ci += Number(row.value) || 0;
      continue;
    }
    kept.push(row);
  }

  const ciFromImmunities =
    immunities.length > 0
      ? Math.min(...immunities.map((row) => Number(row.value) || 0))
      : 0;

  const totalCi = Math.round((ci + ciFromImmunities) * 10) / 10;
  if (totalCi) {
    kept.push({
      key: "Control Immunity|%",
      stat: "Control Immunity",
      unit: ciUnit,
      value: totalCi,
      ciFromImmunities,
      immunities: immunities.sort((a, b) => a.stat.localeCompare(b.stat)),
    });
  } else if (immunities.length) {
    kept.push({
      key: "Control Immunity|%",
      stat: "Control Immunity",
      unit: "%",
      value: 0,
      ciFromImmunities: 0,
      immunities: immunities.sort((a, b) => a.stat.localeCompare(b.stat)),
    });
  }

  return {
    rows: kept,
    immunities,
    ciFromImmunities,
  };
}
