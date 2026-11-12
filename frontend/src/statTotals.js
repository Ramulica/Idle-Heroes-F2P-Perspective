import { gearOf, gearSlotDef, heroOf, imprintOf } from "./statCalculator";
import { computeFactionAura } from "./factionAura";
import { monsterStatLines } from "./monsterCatalog";

/** Source rows for the hero breakdown table (id = first column). */
export const STAT_SOURCES = [
  { id: "gear", label: "Gear" },
  { id: "arti", label: "Artifact" },
  { id: "soul_stone", label: "Soul Stone" },
  { id: "enables", label: "Enables" },
  { id: "imprints", label: "Imprints" },
  { id: "tree_of_origin", label: "Tree of Origin" },
  { id: "team_aura", label: "Team Aura" },
  { id: "monster", label: "Monster" },
  { id: "train", label: "Train" },
  { id: "houses", label: "Houses" },
  { id: "sigils", label: "Sigils" },
  { id: "awakening", label: "Awakening" },
  { id: "star_spawns", label: "Star Spawns" },
  { id: "guild_tech", label: "Guild Tech" },
];

const GEAR_BODY_SLOTS = new Set(["weapon", "armor", "accessory", "boots"]);

/** Preferred column order for the breakdown table. */
const STAT_ORDER = [
  ["HP", "%"],
  ["HP", ""],
  ["Attack", "%"],
  ["Attack", ""],
  ["Speed", ""],
  ["Speed (Runes)", ""],
  ["Crit", "%"],
  ["Crit Damage", "%"],
  ["Crit Damage Reduction", "%"],
  ["Block", "%"],
  ["Armor", "%"],
  ["Armor Break", "%"],
  ["Precision", "%"],
  ["Skill Damage", "%"],
  ["Holy Damage", "%"],
  ["Heal Effect", "%"],
  ["Effect of Being Healed", "%"],
  ["Damage Reduction", "%"],
  ["All Damage Dealt", "%"],
  ["All Damage Reduction", "%"],
  ["Control Immunity", "%"],
];

const STAT_SHORT = {
  HP: "HP",
  Attack: "Atk",
  Speed: "Spd",
  "Speed (Runes)": "Rune Spd",
  Crit: "Crit",
  "Crit Damage": "Crit DMG",
  "Crit Damage Reduction": "Crit DR",
  Block: "Block",
  Armor: "Armor",
  "Armor Break": "Armor Brk",
  Precision: "Prec",
  "Skill Damage": "Skill DMG",
  "Holy Damage": "Holy",
  "Heal Effect": "Heal",
  "Effect of Being Healed": "Healed",
  "Damage Reduction": "DR",
  "All Damage Dealt": "All DMG",
  "All Damage Reduction": "All DR",
  "Control Immunity": "Ctrl Imm",
};

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

export function statKey(stat, unit = "") {
  return `${stat}|${unit || ""}`;
}

export function parseStatKey(key) {
  const i = key.indexOf("|");
  if (i < 0) return { stat: key, unit: "" };
  return { stat: key.slice(0, i), unit: key.slice(i + 1) };
}

export function formatStatCell(value, unit = "") {
  if (value == null || value === 0) return "—";
  const n = round1(value);
  const shown = Number.isInteger(n) ? String(n) : String(n);
  return unit === "%" ? `+${shown}%` : `+${shown}`;
}

export function formatStatColumnLabel(stat, unit = "") {
  const short = STAT_SHORT[stat] || stat;
  return unit === "%" ? `${short}%` : short;
}

function emptyMap() {
  return new Map();
}

function addRow(map, row) {
  if (!row?.stat) return;
  const value = Number(row.value);
  if (!Number.isFinite(value) || value === 0) return;
  const key = statKey(row.stat, row.unit || "");
  map.set(key, round1((map.get(key) || 0) + value));
}

function addRows(map, rows) {
  for (const row of rows || []) addRow(map, row);
}

function mergeMaps(target, source) {
  for (const [key, value] of source) {
    target.set(key, round1((target.get(key) || 0) + value));
  }
  return target;
}

function mapToRows(map) {
  return [...map.entries()]
    .map(([key, value]) => {
      const { stat, unit } = parseStatKey(key);
      return { key, stat, unit, value };
    })
    .sort((a, b) => {
      const ai = STAT_ORDER.findIndex(([s, u]) => s === a.stat && u === a.unit);
      const bi = STAT_ORDER.findIndex(([s, u]) => s === b.stat && u === b.unit);
      const ao = ai < 0 ? 999 : ai;
      const bo = bi < 0 ? 999 : bi;
      if (ao !== bo) return ao - bo;
      if (a.stat !== b.stat) return a.stat.localeCompare(b.stat);
      return (a.unit || "").localeCompare(b.unit || "");
    });
}

function collectGear(slot) {
  const map = emptyMap();
  for (let i = 0; i < (slot?.gear?.length || 0); i++) {
    const def = gearSlotDef(i);
    if (!def || !GEAR_BODY_SLOTS.has(def.id)) continue;
    const option = gearOf(slot.gear[i]);
    if (option?.stats) addRows(map, option.stats);
  }
  return map;
}

function collectArtifact(slot) {
  const map = emptyMap();
  for (let i = 0; i < (slot?.gear?.length || 0); i++) {
    const def = gearSlotDef(i);
    if (def?.id !== "artifact") continue;
    const option = gearOf(slot.gear[i]);
    if (option?.stats) addRows(map, option.stats);
  }
  return map;
}

function collectSoulStone(slot) {
  const map = emptyMap();
  for (let i = 0; i < (slot?.gear?.length || 0); i++) {
    const def = gearSlotDef(i);
    if (def?.id !== "stone") continue;
    const option = gearOf(slot.gear[i]);
    if (option?.stats) addRows(map, option.stats);
  }
  return map;
}

function collectImprints(slot) {
  const map = emptyMap();
  for (const id of slot?.imprints || []) {
    const option = imprintOf(id);
    if (!option) continue;
    addRow(map, {
      stat: option.name,
      value: option.percent,
      unit: "%",
    });
  }
  return map;
}

function collectTeamAura(aura, slotIndex) {
  const map = emptyMap();
  if (!aura) return map;
  if (aura.totals?.hp) addRow(map, { stat: "HP", value: aura.totals.hp, unit: "%" });
  if (aura.totals?.attack) {
    addRow(map, { stat: "Attack", value: aura.totals.attack, unit: "%" });
  }
  const faction = aura.slotFactions?.[slotIndex];
  if (faction) {
    if (faction.damageReduction) {
      addRow(map, {
        stat: "Damage Reduction",
        value: faction.damageReduction,
        unit: "%",
      });
    }
    if (faction.controlImmunity) {
      addRow(map, {
        stat: "Control Immunity",
        value: faction.controlImmunity,
        unit: "%",
      });
    }
  }
  return map;
}

function collectMonster(monster) {
  const map = emptyMap();
  addRows(map, monsterStatLines(monster));
  return map;
}

function emptySourceMap() {
  return emptyMap();
}

/**
 * Per-hero source maps + totals for one board slot.
 */
export function computeHeroStatBreakdown(slot, slotIndex, { aura, monster }) {
  const bySource = {
    gear: collectGear(slot),
    arti: collectArtifact(slot),
    soul_stone: collectSoulStone(slot),
    enables: emptySourceMap(),
    imprints: collectImprints(slot),
    tree_of_origin: emptySourceMap(),
    team_aura: heroOf(slot?.heroId) ? collectTeamAura(aura, slotIndex) : emptySourceMap(),
    monster: heroOf(slot?.heroId) ? collectMonster(monster) : emptySourceMap(),
    train: emptySourceMap(),
    houses: emptySourceMap(),
    sigils: emptySourceMap(),
    awakening: emptySourceMap(),
    star_spawns: emptySourceMap(),
    guild_tech: emptySourceMap(),
  };

  const totals = emptyMap();
  for (const source of STAT_SOURCES) {
    mergeMaps(totals, bySource[source.id] || emptyMap());
  }

  const columns = mapToRows(totals).map(({ key, stat, unit }) => ({
    key,
    stat,
    unit,
    label: formatStatColumnLabel(stat, unit),
  }));

  const rows = STAT_SOURCES.map((source) => {
    const map = bySource[source.id] || emptyMap();
    const values = {};
    for (const col of columns) {
      values[col.key] = map.get(col.key) || 0;
    }
    return {
      id: source.id,
      label: source.label,
      values,
      rows: mapToRows(map),
    };
  });

  const totalValues = {};
  for (const col of columns) {
    totalValues[col.key] = totals.get(col.key) || 0;
  }

  return {
    hero: heroOf(slot?.heroId),
    columns,
    rows,
    totals: mapToRows(totals),
    totalValues,
  };
}

/**
 * Full board: per-slot breakdowns + team-wide summed totals (one pass of shared sources).
 */
export function computeBoardStatTotals(board) {
  const aura = computeFactionAura(board?.slots, heroOf);
  const monster = board?.monster || null;
  const slots = (board?.slots || []).map((slot, index) =>
    computeHeroStatBreakdown(slot, index, { aura, monster })
  );

  const teamTotals = emptyMap();
  for (const heroBreakdown of slots) {
    if (!heroBreakdown.hero) continue;
    for (const row of heroBreakdown.totals) {
      teamTotals.set(
        row.key,
        round1((teamTotals.get(row.key) || 0) + row.value)
      );
    }
  }

  return {
    aura,
    slots,
    teamTotals: mapToRows(teamTotals),
  };
}
