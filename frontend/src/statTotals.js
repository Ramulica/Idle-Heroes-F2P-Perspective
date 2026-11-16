import {
  gearOf,
  gearSlotDef,
  heroOf,
  imprintOf,
  resolveEnableStats,
} from "./statCalculator";
import { computeFactionAura } from "./factionAura";
import { monsterStatLines } from "./monsterCatalog";
import {
  awakeningStatValue,
  imprintUnlocked,
  stageHeroKitSpeed,
  stageImprintSpeed,
  stageOriginSpeed,
} from "./heroProgress";
import {
  CC_IMMUNITY_STAT_SET,
  collectGuildTechForHero,
} from "./guildTech";
import { collectInfusionStats } from "./imprintInfusion";
import {
  cloudSpeedForFaction,
  tenantSpeedFromLevels,
} from "./tenantsCloud";
import { collectSkinStatRows } from "./skins";
import { collectStarspawnStatRows } from "./starspawns";
import { collectSigilStatRows } from "./sigils";
import { collectTrainStatRows } from "./trainStats";
import { gameModeOf, sourceAllowedInGameMode } from "./gameModes";

/** Source rows for the hero breakdown table (id = first column). */
export const STAT_SOURCES = [
  { id: "hero_kit", label: "Hero Kit" },
  { id: "gear", label: "Gear" },
  { id: "arti", label: "Artifact" },
  { id: "soul_stone", label: "Soul Stone" },
  { id: "enables", label: "Enables" },
  { id: "imprints", label: "Imprints" },
  { id: "tree_of_origin", label: "Tree of Origin" },
  { id: "imprint_infusion", label: "Imprint Infusion" },
  { id: "team_aura", label: "Team Aura" },
  { id: "monster", label: "Monster" },
  { id: "train", label: "Train" },
  { id: "tenants", label: "Tenants" },
  { id: "cloud_island", label: "Cloud Island" },
  { id: "skin", label: "Skin" },
  { id: "sigils", label: "Sigils" },
  { id: "awakening", label: "Awakening" },
  { id: "star_spawns", label: "Star Spawns" },
  { id: "guild_tech", label: "Guild Tech" },
];

const GEAR_BODY_SLOTS = new Set(["weapon", "armor", "accessory", "boots"]);

/** Stats ignored in calculator totals / breakdown (tracked elsewhere). */
const IGNORED_STATS = new Set(["HP", "Attack", "Fixed HP", "Fixed Attack"]);

/**
 * Situational / niche stats — shown under “More details”, not in the main
 * summary list or primary breakdown columns.
 */
const DETAIL_STAT_EXACT = new Set([
  "Damage Reduction",
  "Damage Reduction Offset",
  "Damage Reduction by Attack",
]);

export function isDetailStat(stat) {
  const name = String(stat || "").trim();
  if (!name) return false;
  if (DETAIL_STAT_EXACT.has(name)) return true;
  if (/^Damage against\b/i.test(name)) return true;
  if (/^Damage vs\b/i.test(name)) return true;
  if (/^Reduce Damage dealt by\b/i.test(name)) return true;
  return false;
}

/** Split total rows into main vs more-details buckets (order preserved). */
export function partitionStatRows(rows) {
  const main = [];
  const detail = [];
  for (const row of rows || []) {
    if (isDetailStat(row.stat)) detail.push(row);
    else main.push(row);
  }
  return { main, detail };
}

const STAT_SHORT = {
  Speed: "Spd",
  Energy: "Energy",
  Crit: "Crit",
  "Crit Damage": "Crit DMG",
  "Crit Damage Reduction": "Crit DR",
  Block: "Block",
  Armor: "Armor",
  "Armor Break": "Armor Brk",
  Precision: "Prec",
  "Control Precision": "Ctrl Prec",
  "Skill Damage": "Skill DMG",
  "Holy Damage": "Holy",
  "Heal Effect": "Heal",
  "Effect of Being Healed": "Healed",
  "Damage Reduction": "DR",
  "All Damage Dealt": "All DMG",
  "All Damage Reduction": "All DR",
  "Control Immunity": "CI",
  "Control Immunity Offset": "CIO",
  "Damage vs Warrior": "vs War",
  "Damage vs Mage": "vs Mage",
  "Damage vs Ranger": "vs Rang",
  "Damage vs Assassin": "vs Asn",
  "Damage vs Priest": "vs Priest",
  "Damage Reduction Offset": "DR Off",
  "Dodge Offset": "Dodge Off",
  "Crit Damage Offset": "CD Off",
  Maim: "Maim",
  "Reduces DoT received": "DoT Red",
  Dodge: "Dodge",
};

/** Speed first, then alphabetical by label (stat + unit). */
function compareStatRows(a, b) {
  const aSpeed = a.stat === "Speed";
  const bSpeed = b.stat === "Speed";
  if (aSpeed !== bSpeed) return aSpeed ? -1 : 1;
  const aLabel = `${a.stat}${a.unit === "%" ? "%" : ""}`;
  const bLabel = `${b.stat}${b.unit === "%" ? "%" : ""}`;
  return aLabel.localeCompare(bLabel);
}

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
  if (!row?.stat || IGNORED_STATS.has(row.stat)) return;
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
    .sort(compareStatRows);
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

function collectEnables(slot, gameModeId = null) {
  const map = emptyMap();
  if (!heroOf(slot?.heroId)) return map;
  const infusion = slot?.progress?.infusion ?? 0;
  const modeActive = Boolean(gameModeOf(gameModeId));
  (slot?.enables || []).forEach((id, index) => {
    if (!id) return;
    const rows = resolveEnableStats(id, index, infusion).filter((row) => {
      // Enable 1/4 · A ADR only counts in a selected game mode.
      if (
        id === "en-1a" &&
        row.stat === "All Damage Reduction" &&
        !modeActive
      ) {
        return false;
      }
      return true;
    });
    addRows(map, rows);
  });
  return map;
}

function collectImprints(slot) {
  const map = emptyMap();
  const stageId = slot?.progress?.stageId || "E5";
  const imprintSpeed = stageImprintSpeed(stageId);
  if (imprintSpeed) {
    addRow(map, { stat: "Speed", value: imprintSpeed, unit: "" });
  }
  (slot?.imprints || []).forEach((id, index) => {
    if (!imprintUnlocked(stageId, index)) return;
    const option = imprintOf(id);
    if (!option) return;
    addRow(map, {
      stat: option.name,
      value: option.percent,
      unit: "%",
    });
  });
  return map;
}

function collectHeroKit(slot) {
  const map = emptyMap();
  const hero = heroOf(slot?.heroId);
  if (!hero) return map;
  const speed = Number(hero.speed);
  if (Number.isFinite(speed) && speed !== 0) {
    addRow(map, { stat: "Speed", value: speed, unit: "" });
  }
  const stageSpeed = stageHeroKitSpeed(slot?.progress?.stageId || "E5");
  if (stageSpeed) addRow(map, { stat: "Speed", value: stageSpeed, unit: "" });
  // Non-transcendence kit stats (beyond Speed) land here later.
  if (Array.isArray(hero.kitStats)) addRows(map, hero.kitStats);
  return map;
}

function collectTreeOfOrigin(slot) {
  const map = emptyMap();
  const hero = heroOf(slot?.heroId);
  if (!hero) return map;
  const stageId = slot?.progress?.stageId || "E5";
  const originSpeed = stageOriginSpeed(stageId);
  if (originSpeed) {
    addRow(map, { stat: "Speed", value: originSpeed, unit: "" });
  }
  const optionals = slot?.progress?.optionals || {};
  for (const row of hero.originSubs || []) {
    if (!row?.optionalId || !optionals[row.optionalId]) continue;
    addRow(map, {
      stat: row.stat,
      value: row.value,
      unit: row.unit || "",
    });
  }
  return map;
}

function collectImprintInfusion(slot) {
  const map = emptyMap();
  addRows(map, collectInfusionStats(slot?.progress?.infusionNodes));
  return map;
}

function collectTeamAura(aura, slotIndex) {
  const map = emptyMap();
  if (!aura) return map;
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

function collectTenants(slot) {
  const map = emptyMap();
  if (!heroOf(slot?.heroId)) return map;
  const speed = tenantSpeedFromLevels(slot?.tenants);
  if (speed) addRow(map, { stat: "Speed", value: speed, unit: "" });
  return map;
}

function collectCloudIsland(slot, cloudIsland) {
  const map = emptyMap();
  const hero = heroOf(slot?.heroId);
  if (!hero) return map;
  const speed = cloudSpeedForFaction(cloudIsland, hero.faction);
  if (speed) addRow(map, { stat: "Speed", value: speed, unit: "" });
  return map;
}

function collectSkin(slot) {
  const map = emptyMap();
  const heroId = slot?.heroId;
  if (!heroOf(heroId)) return map;
  for (const row of collectSkinStatRows(slot?.skin, heroId)) {
    // Skin Attack/HP are intentional; gear ATK%/HP% stay ignored.
    if (row.stat === "Attack" || row.stat === "HP") {
      const value = Number(row.value);
      if (!Number.isFinite(value) || value === 0) continue;
      const key = statKey(row.stat, row.unit || "");
      map.set(key, round1((map.get(key) || 0) + value));
      continue;
    }
    addRow(map, row);
  }
  return map;
}

function collectStarspawns(slot, starspawns) {
  const map = emptyMap();
  for (const row of collectStarspawnStatRows(slot, starspawns, heroOf)) {
    // Starspawn Attack%/HP% and Fixed Attack/HP are intentional.
    if (row.stat === "Attack" || row.stat === "HP") {
      const value = Number(row.value);
      if (!Number.isFinite(value) || value === 0) continue;
      const key = statKey(row.stat, row.unit || "");
      map.set(key, round1((map.get(key) || 0) + value));
      continue;
    }
    addRow(map, row);
  }
  return map;
}

function collectSigils(sigils, gameModeId) {
  const map = emptyMap();
  for (const row of collectSigilStatRows(sigils, gameModeId)) {
    addRow(map, row);
  }
  return map;
}

function collectTrain(slot, train, gameModeId) {
  const map = emptyMap();
  const hero = heroOf(slot?.heroId);
  if (!hero) return map;
  for (const row of collectTrainStatRows(train, hero, gameModeId)) {
    addRow(map, row);
  }
  return map;
}

function collectAwakening(slot) {
  const map = emptyMap();
  const awakening = slot?.progress?.awakening;
  if (!awakening?.tierId || !heroOf(slot?.heroId)) return map;
  const speed = Number(awakening.speed);
  if (Number.isFinite(speed) && speed !== 0) {
    addRow(map, { stat: "Speed", value: speed, unit: "" });
  }
  for (const name of awakening.stats || []) {
    if (!name) continue;
    const value = awakeningStatValue(awakening.tierId, name);
    if (value == null) continue;
    addRow(map, { stat: name, value, unit: "%" });
  }
  return map;
}

function collectGuildTech(slot, guildTech) {
  const map = emptyMap();
  const immunities = [];
  const rows = collectGuildTechForHero(slot, guildTech, heroOf);
  for (const row of rows) {
    if (CC_IMMUNITY_STAT_SET.has(row.stat) && (row.unit || "%") === "%") {
      immunities.push({
        key: `${row.stat}|%`,
        stat: row.stat,
        unit: "%",
        value: Number(row.value) || 0,
      });
      continue;
    }
    addRow(map, row);
  }
  const ciFromImmunities =
    immunities.length > 0
      ? Math.min(...immunities.map((row) => row.value))
      : 0;
  if (ciFromImmunities) {
    addRow(map, {
      stat: "Control Immunity",
      value: ciFromImmunities,
      unit: "%",
    });
  }
  return { map, immunities, ciFromImmunities };
}

function emptySourceMap() {
  return emptyMap();
}

/**
 * Per-hero source maps + totals for one board slot.
 */
export function computeHeroStatBreakdown(
  slot,
  slotIndex,
  { aura, monster, cloudIsland, gameModeId, guildTech, starspawns, sigils, train }
) {
  const guild = collectGuildTech(slot, guildTech);
  const bySource = {
    hero_kit: collectHeroKit(slot),
    gear: collectGear(slot),
    arti: collectArtifact(slot),
    soul_stone: collectSoulStone(slot),
    enables: collectEnables(slot, gameModeId),
    imprints: collectImprints(slot),
    tree_of_origin: collectTreeOfOrigin(slot),
    imprint_infusion: collectImprintInfusion(slot),
    team_aura: heroOf(slot?.heroId) ? collectTeamAura(aura, slotIndex) : emptySourceMap(),
    monster: heroOf(slot?.heroId) ? collectMonster(monster) : emptySourceMap(),
    train: collectTrain(slot, train, gameModeId),
    tenants: collectTenants(slot),
    cloud_island: collectCloudIsland(slot, cloudIsland),
    skin: collectSkin(slot),
    sigils: collectSigils(sigils, gameModeId),
    awakening: collectAwakening(slot),
    star_spawns: collectStarspawns(slot, starspawns),
    guild_tech: guild.map,
  };

  for (const source of STAT_SOURCES) {
    if (!sourceAllowedInGameMode(source.id, gameModeId)) {
      bySource[source.id] = emptySourceMap();
    }
  }

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

  const totalsRows = mapToRows(totals).map((row) => {
    if (row.stat === "Control Immunity" && row.unit === "%") {
      return {
        ...row,
        ciFromImmunities: guild.ciFromImmunities || 0,
        immunities: guild.immunities || [],
      };
    }
    return row;
  });

  return {
    hero: heroOf(slot?.heroId),
    columns,
    rows,
    totals: totalsRows,
    totalValues,
    ccImmunities: guild.immunities || [],
    ciFromImmunities: guild.ciFromImmunities || 0,
  };
}

/** Full board: per-slot hero breakdowns (no team aggregate). */
export function computeBoardStatTotals(board) {
  const aura = computeFactionAura(board?.slots, heroOf);
  const monster = board?.monster || null;
  const cloudIsland = board?.cloudIsland;
  const gameModeId = board?.gameModeId || null;
  const guildTech = board?.guildTech;
  const starspawns = board?.starspawns;
  const sigils = board?.sigils;
  const train = board?.train;
  const slots = (board?.slots || []).map((slot, index) =>
    computeHeroStatBreakdown(slot, index, {
      aura,
      monster,
      cloudIsland,
      gameModeId,
      guildTech,
      starspawns,
      sigils,
      train,
    })
  );

  return {
    aura,
    slots,
  };
}
