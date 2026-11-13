/**
 * Artifact catalog for the Stat Calculator.
 * Icon index matches sheet crop order (arti-01 … arti-47).
 * `sortOrder` is the display / list order from the user.
 */

const iconModules = import.meta.glob(
  "./assets/stats/artifacts/arti-*.png",
  { eager: true, import: "default" }
);

const ARTIFACT_ICONS = Object.keys(iconModules)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((key) => iconModules[key]);

const pct = (stat, value) => ({ stat, value, unit: "%" });
const flat = (stat, value) => ({ stat, value, unit: "" });

/**
 * Sheet index (1-based) → name, sortOrder, stats.
 * Flags (13–16) and Exotic 27–29 sit after numbered order 1–40.
 */
const ARTIFACT_DEFS = {
  1: {
    name: "Antlers Cane",
    sortOrder: 1,
    stats: [pct("Precision", 70), pct("Skill Damage", 60)],
  },
  2: {
    name: "The Kiss of Ghost",
    sortOrder: 3,
    stats: [pct("Armor Break", 100)],
  },
  3: {
    name: "Lucky Candy Bar",
    sortOrder: 5,
    stats: [],
  },
  4: {
    name: "Ruyi Sceptre",
    sortOrder: 7,
    stats: [flat("Speed", 75), pct("Control Precision", 50)],
  },
  5: {
    name: "Punisher of Immortal",
    sortOrder: 9,
    stats: [pct("Crit", 15), pct("Crit Damage", 50)],
  },
  6: {
    name: "Demon Bell",
    sortOrder: 11,
    stats: [flat("Energy", 50)],
  },
  7: {
    name: "Magic Stone Sword",
    sortOrder: 13,
    stats: [pct("Damage Reduction", 30), pct("Control Immunity", 25)],
  },
  8: {
    name: "Augustus Magic Ball",
    sortOrder: 15,
    stats: [flat("Speed", 70), pct("Block", 50)],
  },
  9: {
    name: "Wildfire Torch",
    sortOrder: 17,
    stats: [pct("Precision", 60), pct("Reduces DoT received", 70)],
  },
  10: {
    name: "Golden Crown",
    sortOrder: 19,
    stats: [pct("All Damage Reduction", 25)],
  },
  11: {
    name: "Snow Heart",
    sortOrder: 21,
    stats: [pct("Control Immunity", 25), flat("Energy", 50)],
  },
  12: {
    name: "Melodic String",
    sortOrder: 23,
    stats: [pct("Holy Damage", 25), flat("Energy", 50)],
  },
  13: {
    name: "Shadow Flag",
    sortOrder: 44,
    stats: [],
  },
  14: {
    name: "Fortress Flag",
    sortOrder: 45,
    stats: [],
  },
  15: {
    name: "Abyss Flag",
    sortOrder: 46,
    stats: [],
  },
  16: {
    name: "Forest Flag",
    sortOrder: 47,
    stats: [],
  },
  17: {
    name: "Lingering Melody of Universe",
    sortOrder: 24,
    stats: [flat("Speed", 50), flat("Energy", 100), pct("Holy Damage", 33)],
  },
  18: {
    name: "Fan of Love & Despair",
    sortOrder: 26,
    stats: [pct("All Damage Dealt", 20), pct("Crit Damage Reduction", 67)],
  },
  19: {
    name: "Spiritual Mirror",
    sortOrder: 28,
    stats: [flat("Speed", 100), flat("Energy", 100), pct("Control Immunity", 20)],
  },
  20: {
    name: "Fortune Jade Toad",
    sortOrder: 30,
    stats: [
      pct("Control Immunity", 32),
      pct("All Damage Reduction", 32),
      pct("Block", 50),
    ],
  },
  21: {
    name: "Shark Cannon Shell",
    sortOrder: 31,
    stats: [pct("Crit", 20), pct("Crit Damage", 50), flat("Speed", 75)],
  },
  22: {
    name: "Howling Sea Rocket Shell",
    sortOrder: 32,
    stats: [
      pct("Crit", 20),
      pct("Crit Damage", 60),
      flat("Speed", 100),
      pct("All Damage Dealt", 20),
    ],
  },
  23: {
    name: "Scissors of Conviction",
    sortOrder: 33,
    stats: [pct("Control Immunity", 24)],
  },
  24: {
    name: "Shears of Destiny",
    sortOrder: 34,
    stats: [pct("Control Immunity", 32)],
  },
  25: {
    name: "Illusive Mirror",
    sortOrder: 27,
    stats: [flat("Energy", 50), flat("Speed", 75)],
  },
  26: {
    name: "Auspicious Lucky Cat",
    sortOrder: 29,
    stats: [pct("Control Immunity", 24), pct("All Damage Reduction", 24)],
  },
  27: {
    name: "Exotic Pistol",
    sortOrder: 41,
    stats: [pct("Holy Damage", 24), pct("Control Immunity", 24)],
  },
  28: {
    name: "Exotic Shield",
    sortOrder: 42,
    stats: [pct("Block", 60), pct("Damage Reduction", 24)],
  },
  29: {
    name: "Exotic Grimoire",
    sortOrder: 43,
    stats: [
      pct("Control Immunity", 25),
      flat("Energy", 50),
      flat("Speed", 70),
    ],
  },
  30: {
    name: "Magic Source",
    sortOrder: 12,
    stats: [flat("Energy", 100), flat("Speed", 50)],
  },
  31: {
    name: "Breath of Forest Spirit",
    sortOrder: 2,
    stats: [
      pct("Precision", 90),
      pct("Skill Damage", 300),
      flat("Speed", 50),
    ],
  },
  32: {
    name: "God Eater",
    sortOrder: 10,
    stats: [pct("Crit", 20), pct("Crit Damage", 65)],
  },
  33: {
    name: "Devil's Power",
    sortOrder: 14,
    stats: [pct("Damage Reduction", 40), pct("Control Immunity", 33)],
  },
  34: {
    name: "Augustus Crown",
    sortOrder: 16,
    stats: [flat("Speed", 90), pct("Block", 75), pct("Damage Reduction", 20)],
  },
  35: {
    name: "Soul Seeker's Touch",
    sortOrder: 4,
    stats: [pct("Armor Break", 100), pct("All Damage Dealt", 15)],
  },
  36: {
    name: "Sweet Wonder",
    sortOrder: 6,
    stats: [pct("Control Immunity", 20)],
  },
  37: {
    name: "Flickering Torch",
    sortOrder: 18,
    stats: [pct("Precision", 80), pct("Reduces DoT received", 80)],
  },
  38: {
    name: "Pure Golden Crown",
    sortOrder: 20,
    stats: [pct("All Damage Reduction", 25), pct("Crit Damage Reduction", 20)],
  },
  39: {
    name: "Dragon Ruyi",
    sortOrder: 8,
    stats: [
      flat("Speed", 100),
      pct("Control Precision", 67),
      pct("Damage Reduction", 20),
    ],
  },
  40: {
    name: "Will of Winter",
    sortOrder: 22,
    stats: [
      pct("Control Immunity", 33),
      flat("Energy", 100),
      flat("Speed", 50),
    ],
  },
  41: {
    name: "Peacock Feather Cape",
    sortOrder: 35,
    stats: [flat("Speed", 50), pct("Control Immunity", 27)],
  },
  42: {
    name: "Cloak of Soaring Phoenix",
    sortOrder: 36,
    stats: [
      flat("Speed", 70),
      pct("Control Immunity", 35),
      pct("Dodge", 15),
    ],
  },
  43: {
    name: "Spree Pass",
    sortOrder: 37,
    stats: [
      pct("Damage Reduction Offset", 15),
      pct("Dodge Offset", 12.5),
      flat("Speed", 75),
    ],
  },
  44: {
    name: "Unstrained Voucher",
    sortOrder: 38,
    stats: [
      pct("Damage Reduction Offset", 18),
      pct("Dodge Offset", 15),
      flat("Speed", 100),
      pct("Armor Break", 100),
    ],
  },
  45: {
    name: "Gauntlet of Fearless Valor",
    sortOrder: 39,
    stats: [flat("Speed", 85)],
  },
  46: {
    name: "Claw of the Fallen Demon King",
    sortOrder: 40,
    stats: [flat("Speed", 110)],
  },
  47: {
    name: "Gilded Purple Fan",
    sortOrder: 25,
    stats: [pct("All Damage Dealt", 15), pct("Crit Damage Reduction", 50)],
  },
};

export const ARTIFACT_COUNT = ARTIFACT_ICONS.length;

export const ARTIFACT_OPTIONS = ARTIFACT_ICONS.map((icon, i) => {
  const n = i + 1;
  const def = ARTIFACT_DEFS[n] || {
    name: `Artifact ${n}`,
    sortOrder: 1000 + n,
    stats: [],
  };
  return {
    id: `arti-${String(n).padStart(2, "0")}`,
    name: def.name,
    slot: "artifact",
    icon,
    stats: def.stats,
    sortOrder: def.sortOrder,
  };
}).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

export const ARTIFACT_BY_ID = Object.fromEntries(
  ARTIFACT_OPTIONS.map((row) => [row.id, row])
);

export function artifactOf(id) {
  return ARTIFACT_BY_ID[id] || null;
}
