import fenlierIcon from "./assets/stats/monsters/fenlier.png";
import sphinxIcon from "./assets/stats/monsters/sphinx.png";
import dyneIcon from "./assets/stats/monsters/dyne.png";
import foxIcon from "./assets/stats/monsters/fox.png";
import nidhoggIcon from "./assets/stats/monsters/nidhogg.png";
import jormungandIcon from "./assets/stats/monsters/jormungand.png";
import stoneGolemIcon from "./assets/stats/monsters/stone-golem.png";
import apparitionIcon from "./assets/stats/monsters/apparition.png";
import nemeanIcon from "./assets/stats/monsters/nemean.png";
import phoenixIcon from "./assets/stats/monsters/phoenix.png";
import runeHpIcon from "./assets/stats/monsters/rune-hp.png";
import runeAtkIcon from "./assets/stats/monsters/rune-atk.png";
import runeSpdIcon from "./assets/stats/monsters/rune-spd.png";

export const MONSTER_LEVELS = [180, 210, 240, 270, 300, 330];
export const MONSTER_PASSIVE_LEVELS = [30, 40, 50, 60, 70, 80];
export const MONSTER_RUNE_LEVELS = [60, 80, 100, 120, 140, 160];

export const MONSTER_DEFAULT_LEVEL = 180;
export const MONSTER_DEFAULT_PASSIVE = 30;
export const MONSTER_DEFAULT_RUNE = 60;
export const MONSTER_BASE_SPEED = 40;
export const MONSTER_RUNE_SPEED = 180;

export const MONSTER_RUNES = [
  { id: "hp", name: "HP Rune", icon: runeHpIcon },
  { id: "atk", name: "Attack Rune", icon: runeAtkIcon },
  { id: "spd", name: "Speed Rune", icon: runeSpdIcon },
];

/** Only these four can raise animal / passive / rune levels past the defaults. */
export const UPGRADEABLE_MONSTER_IDS = new Set([
  "phoenix",
  "fox",
  "nemean",
  "apparition",
]);

export const MONSTER_OPTIONS = [
  {
    id: "fenlier",
    name: "Fenlier",
    icon: fenlierIcon,
    upgradeable: false,
    stats: [
      { stat: "Armor Break", value: 20, unit: "%" },
      { stat: "Precision", value: 10, unit: "%" },
      { stat: "Speed", value: MONSTER_BASE_SPEED, unit: "" },
    ],
  },
  {
    id: "sphinx",
    name: "Sphinx",
    icon: sphinxIcon,
    upgradeable: false,
    stats: [
      { stat: "Holy Damage", value: 20, unit: "%" },
      { stat: "Precision", value: 10, unit: "%" },
      { stat: "Speed", value: MONSTER_BASE_SPEED, unit: "" },
    ],
  },
  {
    id: "dyne",
    name: "Dyne",
    icon: dyneIcon,
    upgradeable: false,
    stats: [
      { stat: "Armor", value: 20, unit: "%" },
      { stat: "Block", value: 15, unit: "%" },
      { stat: "Speed", value: MONSTER_BASE_SPEED, unit: "" },
    ],
  },
  {
    id: "fox",
    name: "Fox",
    icon: foxIcon,
    upgradeable: true,
    stats: [
      { stat: "Skill Damage", value: 20, unit: "%" },
      { stat: "Precision", value: 10, unit: "%" },
      { stat: "Speed", value: MONSTER_BASE_SPEED, unit: "" },
    ],
  },
  {
    id: "nidhogg",
    name: "Nidhogg",
    icon: nidhoggIcon,
    upgradeable: false,
    stats: [
      { stat: "Crit Damage", value: 20, unit: "%" },
      { stat: "Crit", value: 10, unit: "%" },
      { stat: "Speed", value: MONSTER_BASE_SPEED, unit: "" },
    ],
  },
  {
    id: "jormungand",
    name: "Jormungand",
    icon: jormungandIcon,
    upgradeable: false,
    stats: [
      { stat: "Skill Damage", value: 20, unit: "%" },
      { stat: "Block", value: 15, unit: "%" },
      { stat: "Speed", value: MONSTER_BASE_SPEED, unit: "" },
    ],
  },
  {
    id: "stone-golem",
    name: "Stone Golem",
    icon: stoneGolemIcon,
    upgradeable: false,
    stats: [
      { stat: "Armor", value: 20, unit: "%" },
      { stat: "Precision", value: 10, unit: "%" },
      { stat: "Speed", value: MONSTER_BASE_SPEED, unit: "" },
    ],
  },
  {
    id: "apparition",
    name: "Apparition",
    icon: apparitionIcon,
    upgradeable: true,
    stats: [
      { stat: "Holy Damage", value: 20, unit: "%" },
      { stat: "Precision", value: 10, unit: "%" },
      { stat: "Speed", value: MONSTER_BASE_SPEED, unit: "" },
    ],
  },
  {
    id: "nemean",
    name: "Nemean",
    icon: nemeanIcon,
    upgradeable: true,
    stats: [
      { stat: "Holy Damage", value: 20, unit: "%" },
      { stat: "Crit Damage Reduction", value: 15, unit: "%" },
      { stat: "Speed", value: MONSTER_BASE_SPEED, unit: "" },
    ],
  },
  {
    id: "phoenix",
    name: "Phoenix",
    icon: phoenixIcon,
    upgradeable: true,
    stats: [
      { stat: "Holy Damage", value: 20, unit: "%" },
      { stat: "Crit Damage", value: 20, unit: "%" },
      { stat: "Speed", value: MONSTER_BASE_SPEED, unit: "" },
    ],
  },
];

export const MONSTER_BY_ID = Object.fromEntries(
  MONSTER_OPTIONS.map((row) => [row.id, row])
);

export function monsterOf(id) {
  return MONSTER_BY_ID[id] || null;
}

export function isUpgradeableMonster(id) {
  return UPGRADEABLE_MONSTER_IDS.has(id);
}

export function defaultMonsterSetup(id = null) {
  return {
    id: id && MONSTER_BY_ID[id] ? id : null,
    level: MONSTER_DEFAULT_LEVEL,
    passives: Array(4).fill(MONSTER_DEFAULT_PASSIVE),
    runes: Array(3).fill(MONSTER_DEFAULT_RUNE),
  };
}

function clampChoice(value, choices, fallback) {
  const n = Number(value);
  return choices.includes(n) ? n : fallback;
}

/**
 * Normalize persisted monster board field.
 * Accepts legacy `monsterId` string boards via cloneBoard.
 */
export function normalizeMonster(raw, legacyMonsterId = null) {
  if (!raw || typeof raw !== "object") {
    const id = legacyMonsterId && MONSTER_BY_ID[legacyMonsterId] ? legacyMonsterId : null;
    return id ? defaultMonsterSetup(id) : null;
  }
  const id = MONSTER_BY_ID[raw.id] ? raw.id : null;
  if (!id) return null;

  const upgradeable = isUpgradeableMonster(id);
  if (!upgradeable) {
    return defaultMonsterSetup(id);
  }

  return {
    id,
    level: clampChoice(raw.level, MONSTER_LEVELS, MONSTER_DEFAULT_LEVEL),
    passives: Array.from({ length: 4 }, (_, i) =>
      clampChoice(raw.passives?.[i], MONSTER_PASSIVE_LEVELS, MONSTER_DEFAULT_PASSIVE)
    ),
    runes: Array.from({ length: 3 }, (_, i) =>
      clampChoice(raw.runes?.[i], MONSTER_RUNE_LEVELS, MONSTER_DEFAULT_RUNE)
    ),
  };
}

/**
 * Monster stats for the calculator.
 * Rune speed is folded into Speed (base + runes), not listed separately.
 */
export function monsterStatLines(monster) {
  if (!monster?.id) return [];
  const def = monsterOf(monster.id);
  if (!def) return [];
  return def.stats.map((row) => {
    if (row.stat !== "Speed") return { ...row };
    return {
      ...row,
      value: Number(row.value) + MONSTER_RUNE_SPEED,
    };
  });
}

export function formatMonsterStat(row) {
  if (!row) return "";
  const suffix = row.unit === "%" ? "%" : "";
  return `+${row.value}${suffix} ${row.stat}`;
}
