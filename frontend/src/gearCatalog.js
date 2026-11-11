import g01w from "./assets/stats/gear/gear-01-weapon.png";
import g01a from "./assets/stats/gear/gear-01-armor.png";
import g01c from "./assets/stats/gear/gear-01-accessory.png";
import g01b from "./assets/stats/gear/gear-01-boots.png";
import {
  SOUL_STONE_BY_ID,
  SOUL_STONE_CATEGORIES,
  SOUL_STONE_OPTIONS,
  formatStoneStat,
  stoneStatTone,
} from "./soulStones";

export {
  SOUL_STONE_BY_ID,
  SOUL_STONE_CATEGORIES,
  SOUL_STONE_OPTIONS,
  formatStoneStat,
  stoneStatTone,
};
import g02w from "./assets/stats/gear/gear-02-weapon.png";
import g02a from "./assets/stats/gear/gear-02-armor.png";
import g02c from "./assets/stats/gear/gear-02-accessory.png";
import g02b from "./assets/stats/gear/gear-02-boots.png";
import g03w from "./assets/stats/gear/gear-03-weapon.png";
import g03a from "./assets/stats/gear/gear-03-armor.png";
import g03c from "./assets/stats/gear/gear-03-accessory.png";
import g03b from "./assets/stats/gear/gear-03-boots.png";
import g04w from "./assets/stats/gear/gear-04-weapon.png";
import g04a from "./assets/stats/gear/gear-04-armor.png";
import g04c from "./assets/stats/gear/gear-04-accessory.png";
import g04b from "./assets/stats/gear/gear-04-boots.png";
import g05w from "./assets/stats/gear/gear-05-weapon.png";
import g05a from "./assets/stats/gear/gear-05-armor.png";
import g05c from "./assets/stats/gear/gear-05-accessory.png";
import g05b from "./assets/stats/gear/gear-05-boots.png";
import g06w from "./assets/stats/gear/gear-06-weapon.png";
import g06a from "./assets/stats/gear/gear-06-armor.png";
import g06c from "./assets/stats/gear/gear-06-accessory.png";
import g06b from "./assets/stats/gear/gear-06-boots.png";
import g07w from "./assets/stats/gear/gear-07-weapon.png";
import g07a from "./assets/stats/gear/gear-07-armor.png";
import g07c from "./assets/stats/gear/gear-07-accessory.png";
import g07b from "./assets/stats/gear/gear-07-boots.png";
import g08w from "./assets/stats/gear/gear-08-weapon.png";
import g08a from "./assets/stats/gear/gear-08-armor.png";
import g08c from "./assets/stats/gear/gear-08-accessory.png";
import g08b from "./assets/stats/gear/gear-08-boots.png";
import g09w from "./assets/stats/gear/gear-09-weapon.png";
import g09a from "./assets/stats/gear/gear-09-armor.png";
import g09c from "./assets/stats/gear/gear-09-accessory.png";
import g09b from "./assets/stats/gear/gear-09-boots.png";
import g10w from "./assets/stats/gear/gear-10-weapon.png";
import g10a from "./assets/stats/gear/gear-10-armor.png";
import g10c from "./assets/stats/gear/gear-10-accessory.png";
import g10b from "./assets/stats/gear/gear-10-boots.png";
import g11w from "./assets/stats/gear/gear-11-weapon.png";
import g11a from "./assets/stats/gear/gear-11-armor.png";
import g11c from "./assets/stats/gear/gear-11-accessory.png";
import g11b from "./assets/stats/gear/gear-11-boots.png";
import g12w from "./assets/stats/gear/gear-12-weapon.png";
import g12a from "./assets/stats/gear/gear-12-armor.png";
import g12c from "./assets/stats/gear/gear-12-accessory.png";
import g12b from "./assets/stats/gear/gear-12-boots.png";
import g13w from "./assets/stats/gear/gear-13-weapon.png";
import g13a from "./assets/stats/gear/gear-13-armor.png";
import g13c from "./assets/stats/gear/gear-13-accessory.png";
import g13b from "./assets/stats/gear/gear-13-boots.png";
import g14w from "./assets/stats/gear/gear-14-weapon.png";
import g14a from "./assets/stats/gear/gear-14-armor.png";
import g14c from "./assets/stats/gear/gear-14-accessory.png";
import g14b from "./assets/stats/gear/gear-14-boots.png";
import g15w from "./assets/stats/gear/gear-15-weapon.png";
import g15a from "./assets/stats/gear/gear-15-armor.png";
import g15c from "./assets/stats/gear/gear-15-accessory.png";
import g15b from "./assets/stats/gear/gear-15-boots.png";
import g16w from "./assets/stats/gear/gear-16-weapon.png";
import g16a from "./assets/stats/gear/gear-16-armor.png";
import g16c from "./assets/stats/gear/gear-16-accessory.png";
import g16b from "./assets/stats/gear/gear-16-boots.png";
import g17w from "./assets/stats/gear/gear-17-weapon.png";
import g17a from "./assets/stats/gear/gear-17-armor.png";
import g17c from "./assets/stats/gear/gear-17-accessory.png";
import g17b from "./assets/stats/gear/gear-17-boots.png";
import g18w from "./assets/stats/gear/gear-18-weapon.png";
import g18a from "./assets/stats/gear/gear-18-armor.png";
import g18c from "./assets/stats/gear/gear-18-accessory.png";
import g18b from "./assets/stats/gear/gear-18-boots.png";
import g19w from "./assets/stats/gear/gear-19-weapon.png";
import g19a from "./assets/stats/gear/gear-19-armor.png";
import g19c from "./assets/stats/gear/gear-19-accessory.png";
import g19b from "./assets/stats/gear/gear-19-boots.png";
import g20w from "./assets/stats/gear/gear-20-weapon.png";
import g20a from "./assets/stats/gear/gear-20-armor.png";
import g20c from "./assets/stats/gear/gear-20-accessory.png";
import g20b from "./assets/stats/gear/gear-20-boots.png";
import g21w from "./assets/stats/gear/gear-21-weapon.png";
import g21a from "./assets/stats/gear/gear-21-armor.png";
import g21c from "./assets/stats/gear/gear-21-accessory.png";
import g21b from "./assets/stats/gear/gear-21-boots.png";

export const GEAR_SLOTS = [
  { id: "weapon", name: "Weapon", locked: false },
  { id: "armor", name: "Armor", locked: false },
  { id: "accessory", name: "Accessory", locked: false },
  { id: "boots", name: "Boots", locked: false },
  { id: "artifact", name: "Artifact", locked: true },
  { id: "stone", name: "Soul Stone", locked: false },
];

export const GEAR_SLOT_IDS = GEAR_SLOTS.map((row) => row.id);

/** Stages: class & 1* share first-stat value; 1–3* add the shared second stat. */
const FIRST_INDEX = { class: 0, reso1: 0, reso2: 1, reso3: 2 };
const SECOND_INDEX = { reso1: 0, reso2: 1, reso3: 2 };

const SECOND_STATS = {
  weapon: { stat: "All Damage Dealt", values: [6, 7, 8], unit: "%" },
  armor: { stat: "All Damage Reduction", values: [6, 7, 8], unit: "%" },
  accessory: null,
  boots: { stat: "Speed", values: [10, 15, 20], unit: "" },
};

function pct(stat, value) {
  return value == null ? null : { stat, value, unit: "%" };
}

function flat(stat, value) {
  return value == null ? null : { stat, value, unit: "" };
}

function firstStat(slot, defs, stage) {
  const def = defs[slot];
  if (!def) return null;
  const idx = FIRST_INDEX[stage];
  if (idx == null) return null;
  const value = def.values[idx];
  if (value == null) return null;
  return def.unit === "" ? flat(def.stat, value) : pct(def.stat, value);
}

function secondStat(slot, stage) {
  const idx = SECOND_INDEX[stage];
  if (idx == null) return null;
  const def = SECOND_STATS[slot];
  if (!def) return null;
  const value = def.values[idx];
  return def.unit === "" ? flat(def.stat, value) : pct(def.stat, value);
}

function buildStats(slot, classDefs, stage) {
  const stats = [];
  const first = classDefs ? firstStat(slot, classDefs, stage) : null;
  const second = secondStat(slot, stage);
  if (first) stats.push(first);
  if (second) stats.push(second);
  return stats;
}

const STAT_SHORT = {
  "All Damage Dealt": "All DMG",
  "All Damage Reduction": "All DR",
  "Damage Reduction": "DR",
  "Crit Damage": "Crit DMG",
  "Skill Damage": "Skill DMG",
  "Armor Break": "Armor Brk",
  "Control Immunity": "Ctrl Imm",
  Precision: "Prec",
};

function formatStat(row, compact = false) {
  if (!row) return "";
  const name = compact ? STAT_SHORT[row.stat] || row.stat : row.stat;
  if (row.unit === "%") return `${name} +${row.value}%`;
  return `${name} +${row.value}`;
}

export function formatGearStats(stats, compact = false) {
  if (!stats?.length) return "No stats";
  return stats.map((row) => formatStat(row, compact)).join(" · ");
}

const NORMAL_STATS = {
  weapon: [pct("Crit Damage", 5)],
  armor: [pct("Damage Reduction", 2)],
  accessory: [pct("Skill Damage", 5)],
  boots: [pct("Block", 4)],
};

const CLASS_FIRST = {
  Assassin: {
    weapon: { stat: "Crit", values: [5, 6, 7], unit: "%" },
    armor: { stat: "Armor Break", values: [10, 12, 14], unit: "%" },
    accessory: { stat: "Crit Damage", values: [5, 6, 7], unit: "%" },
    boots: { stat: "Speed", values: [20, 30, 40], unit: "" },
  },
  Priest: {
    weapon: null,
    armor: { stat: "Damage Reduction", values: [5, 6, 7], unit: "%" },
    accessory: null,
    boots: { stat: "Speed", values: [20, 30, 40], unit: "" },
  },
  Ranger: {
    weapon: { stat: "Crit", values: [5, 6, 7], unit: "%" },
    armor: { stat: "Block", values: [5, 6, 7], unit: "%" },
    accessory: { stat: "Damage Reduction", values: [5, 6, 7], unit: "%" },
    boots: { stat: "Speed", values: [20, 30, 40], unit: "" },
  },
  Mage: {
    weapon: { stat: "Crit", values: [5, 6, 7], unit: "%" },
    armor: { stat: "Precision", values: [10, 12, 14], unit: "%" },
    accessory: { stat: "Skill Damage", values: [10, 12, 14], unit: "%" },
    boots: { stat: "Speed", values: [20, 30, 40], unit: "" },
  },
  Warrior: {
    weapon: { stat: "Block", values: [10, 12, 14], unit: "%" },
    armor: { stat: "Damage Reduction", values: [5, 6, 7], unit: "%" },
    accessory: { stat: "Control Immunity", values: [5, 6, 7], unit: "%" },
    boots: { stat: "Speed", values: [20, 30, 40], unit: "" },
  },
};

const STAGE_LABEL = {
  normal: "Normal",
  class: "Class",
  reso1: "Resonance 1★",
  reso2: "Resonance 2★",
  reso3: "Resonance 3★",
};

function makeSet({ id, heroClass, stage, label, icons }) {
  const classDefs = heroClass ? CLASS_FIRST[heroClass] : null;
  const slots = ["weapon", "armor", "accessory", "boots"];
  return slots.map((slot) => {
    const stats =
      stage === "normal"
        ? NORMAL_STATS[slot]
        : buildStats(slot, classDefs, stage);
    return {
      id: `${id}-${slot}`,
      setId: id,
      slot,
      heroClass: heroClass || null,
      stage,
      name: `${label} ${slot[0].toUpperCase()}${slot.slice(1)}`,
      label,
      icon: icons[slot],
      stats: stats.filter(Boolean),
    };
  });
}

const SETS = [
  {
    id: "normal",
    heroClass: null,
    stage: "normal",
    label: "Normal Gear",
    icons: { weapon: g01w, armor: g01a, accessory: g01c, boots: g01b },
  },
  {
    id: "assassin-class",
    heroClass: "Assassin",
    stage: "class",
    label: "Assassin Class",
    icons: { weapon: g02w, armor: g02a, accessory: g02c, boots: g02b },
  },
  {
    id: "assassin-1",
    heroClass: "Assassin",
    stage: "reso1",
    label: "Assassin 1★",
    icons: { weapon: g03w, armor: g03a, accessory: g03c, boots: g03b },
  },
  {
    id: "assassin-2",
    heroClass: "Assassin",
    stage: "reso2",
    label: "Assassin 2★",
    icons: { weapon: g04w, armor: g04a, accessory: g04c, boots: g04b },
  },
  {
    id: "assassin-3",
    heroClass: "Assassin",
    stage: "reso3",
    label: "Assassin 3★",
    icons: { weapon: g05w, armor: g05a, accessory: g05c, boots: g05b },
  },
  {
    id: "priest-class",
    heroClass: "Priest",
    stage: "class",
    label: "Priest Class",
    icons: { weapon: g06w, armor: g06a, accessory: g06c, boots: g06b },
  },
  {
    id: "priest-1",
    heroClass: "Priest",
    stage: "reso1",
    label: "Priest 1★",
    icons: { weapon: g07w, armor: g07a, accessory: g07c, boots: g07b },
  },
  {
    id: "priest-2",
    heroClass: "Priest",
    stage: "reso2",
    label: "Priest 2★",
    icons: { weapon: g08w, armor: g08a, accessory: g08c, boots: g08b },
  },
  {
    id: "priest-3",
    heroClass: "Priest",
    stage: "reso3",
    label: "Priest 3★",
    icons: { weapon: g09w, armor: g09a, accessory: g09c, boots: g09b },
  },
  {
    id: "ranger-class",
    heroClass: "Ranger",
    stage: "class",
    label: "Ranger Class",
    icons: { weapon: g10w, armor: g10a, accessory: g10c, boots: g10b },
  },
  {
    id: "ranger-1",
    heroClass: "Ranger",
    stage: "reso1",
    label: "Ranger 1★",
    icons: { weapon: g11w, armor: g11a, accessory: g11c, boots: g11b },
  },
  {
    id: "ranger-2",
    heroClass: "Ranger",
    stage: "reso2",
    label: "Ranger 2★",
    icons: { weapon: g12w, armor: g12a, accessory: g12c, boots: g12b },
  },
  {
    id: "ranger-3",
    heroClass: "Ranger",
    stage: "reso3",
    label: "Ranger 3★",
    icons: { weapon: g13w, armor: g13a, accessory: g13c, boots: g13b },
  },
  {
    id: "mage-class",
    heroClass: "Mage",
    stage: "class",
    label: "Mage Class",
    icons: { weapon: g14w, armor: g14a, accessory: g14c, boots: g14b },
  },
  {
    id: "mage-1",
    heroClass: "Mage",
    stage: "reso1",
    label: "Mage 1★",
    icons: { weapon: g15w, armor: g15a, accessory: g15c, boots: g15b },
  },
  {
    id: "mage-2",
    heroClass: "Mage",
    stage: "reso2",
    label: "Mage 2★",
    icons: { weapon: g16w, armor: g16a, accessory: g16c, boots: g16b },
  },
  {
    id: "mage-3",
    heroClass: "Mage",
    stage: "reso3",
    label: "Mage 3★",
    icons: { weapon: g17w, armor: g17a, accessory: g17c, boots: g17b },
  },
  {
    id: "warrior-class",
    heroClass: "Warrior",
    stage: "class",
    label: "Warrior Class",
    icons: { weapon: g18w, armor: g18a, accessory: g18c, boots: g18b },
  },
  {
    id: "warrior-1",
    heroClass: "Warrior",
    stage: "reso1",
    label: "Warrior 1★",
    icons: { weapon: g19w, armor: g19a, accessory: g19c, boots: g19b },
  },
  {
    id: "warrior-2",
    heroClass: "Warrior",
    stage: "reso2",
    label: "Warrior 2★",
    icons: { weapon: g20w, armor: g20a, accessory: g20c, boots: g20b },
  },
  {
    id: "warrior-3",
    heroClass: "Warrior",
    stage: "reso3",
    label: "Warrior 3★",
    icons: { weapon: g21w, armor: g21a, accessory: g21c, boots: g21b },
  },
];

export const GEAR_OPTIONS = [
  ...SETS.flatMap(makeSet),
  ...SOUL_STONE_OPTIONS,
];

export const GEAR_BY_ID = Object.fromEntries(
  GEAR_OPTIONS.map((row) => [row.id, row])
);

export function gearOf(id) {
  return GEAR_BY_ID[id] || null;
}

export function gearSlotDef(index) {
  return GEAR_SLOTS[index] || null;
}

/** Normal gear for everyone + class / resonance gear for this hero’s class. */
export function gearOptionsForSlot(slotIndex, heroClass) {
  const slot = GEAR_SLOTS[slotIndex];
  if (!slot || slot.locked) return [];
  if (slot.id === "stone") return SOUL_STONE_OPTIONS;
  return GEAR_OPTIONS.filter((row) => {
    if (row.slot !== slot.id) return false;
    if (!row.heroClass) return true;
    return Boolean(heroClass) && row.heroClass === heroClass;
  });
}

export function gearStageLabel(stage) {
  return STAGE_LABEL[stage] || stage;
}
