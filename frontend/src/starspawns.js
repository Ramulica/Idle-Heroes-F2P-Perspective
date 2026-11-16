import iconWraith from "./assets/stats/starspawns/icons/wraith.png";
import iconHonor from "./assets/stats/starspawns/icons/honor.png";
import iconFervor from "./assets/stats/starspawns/icons/fervor.png";
import iconNature from "./assets/stats/starspawns/icons/nature.png";
import iconTwilight from "./assets/stats/starspawns/icons/twilight.png";
import iconSplendor from "./assets/stats/starspawns/icons/splendor.png";
import iconTranscendence from "./assets/stats/starspawns/icons/transcendence.png";
import iconValor from "./assets/stats/starspawns/icons/valor.png";
import iconWisdom from "./assets/stats/starspawns/icons/wisdom.png";
import iconFreedom from "./assets/stats/starspawns/icons/freedom.png";
import iconColdblood from "./assets/stats/starspawns/icons/coldblood.png";
import iconPrayer from "./assets/stats/starspawns/icons/prayer.png";
import iconCrystal from "./assets/stats/starspawns/icons/crystal.png";
import iconTrial from "./assets/stats/starspawns/icons/trial.png";
import iconJustice from "./assets/stats/starspawns/icons/justice.png";
import iconGrace from "./assets/stats/starspawns/icons/grace.png";
import iconBravery from "./assets/stats/starspawns/icons/bravery.png";
import iconPiety from "./assets/stats/starspawns/icons/piety.png";
import starDestinyIcon from "./assets/stats/starspawns/star-destiny.png";

export const STAR_DESTINY_ICON = starDestinyIcon;

function flat(stat, value) {
  return { stat, value, unit: "" };
}

function pct(stat, value) {
  return { stat, value, unit: "%" };
}

function statKey(stat, unit = "") {
  return `${stat}|${unit || ""}`;
}

/**
 * Bonus targets: hero matches if faction OR heroClass is listed.
 * @typedef {{ factions?: string[], classes?: string[], label: string }} StarspawnBonus
 * @typedef {{ id: string, name: string, icon: string, maxLevel: number, bonus: StarspawnBonus, stats: { stat: string, value: number, unit: string }[] }} StarspawnDef
 */

/** @type {StarspawnDef[]} */
export const STARSPAWNS = [
  {
    id: "wraith",
    name: "Spirit of Wraith",
    icon: iconWraith,
    maxLevel: 140,
    bonus: { factions: ["Shadow"], label: "Shadow Heroes" },
    stats: [flat("Fixed Attack", 23397), pct("Armor Break", 30)],
  },
  {
    id: "honor",
    name: "Spirit of Honor",
    icon: iconHonor,
    maxLevel: 140,
    bonus: { factions: ["Fortress"], label: "Fortress Heroes" },
    stats: [flat("Fixed HP", 1496165), pct("Block", 30)],
  },
  {
    id: "fervor",
    name: "Spirit of Fervor",
    icon: iconFervor,
    maxLevel: 140,
    bonus: { factions: ["Abyss"], label: "Abyss Heroes" },
    stats: [flat("Fixed Attack", 25867), pct("Attack", 9)],
  },
  {
    id: "nature",
    name: "Spirit of Nature",
    icon: iconNature,
    maxLevel: 140,
    bonus: { factions: ["Forest"], label: "Forest Heroes" },
    stats: [flat("Fixed HP", 1423177), pct("HP", 12)],
  },
  {
    id: "twilight",
    name: "Spirit of Twilight",
    icon: iconTwilight,
    maxLevel: 140,
    bonus: { factions: ["Dark"], label: "Dark Heroes" },
    stats: [
      flat("Fixed HP", 693315),
      flat("Fixed Attack", 12282),
      pct("Skill Damage", 60),
    ],
  },
  {
    id: "splendor",
    name: "Spirit of Splendor",
    icon: iconSplendor,
    maxLevel: 140,
    bonus: { factions: ["Light"], label: "Light Heroes" },
    stats: [
      flat("Fixed HP", 766293),
      flat("Fixed Attack", 11664),
      pct("Holy Damage", 18),
    ],
  },
  {
    id: "transcendence",
    name: "Spirit of Transcendence",
    icon: iconTranscendence,
    maxLevel: 140,
    bonus: { factions: ["Transcendence"], label: "Transcendence Heroes" },
    stats: [
      flat("Fixed HP", 729799),
      flat("Fixed Attack", 12898),
      pct("All Damage Dealt", 9),
    ],
  },
  {
    id: "valor",
    name: "Spirit of Valor",
    icon: iconValor,
    maxLevel: 140,
    bonus: { classes: ["Warrior"], label: "Warriors" },
    // Guide shows −Crit Damage; treat as Crit Damage Offset.
    stats: [flat("Fixed HP", 1569151), pct("Crit Damage Offset", 18)],
  },
  {
    id: "wisdom",
    name: "Spirit of Wisdom",
    icon: iconWisdom,
    maxLevel: 140,
    bonus: { classes: ["Mage"], label: "Mages" },
    stats: [
      flat("Fixed Attack", 24633),
      pct("Control Immunity Offset", 12),
    ],
  },
  {
    id: "freedom",
    name: "Spirit of Freedom",
    icon: iconFreedom,
    maxLevel: 140,
    bonus: { classes: ["Ranger"], label: "Rangers" },
    stats: [flat("Fixed Attack", 22163), pct("Dodge Offset", 12)],
  },
  {
    id: "coldblood",
    name: "Spirit of Coldblood",
    icon: iconColdblood,
    maxLevel: 140,
    bonus: { classes: ["Assassin"], label: "Assassins" },
    stats: [flat("Fixed Attack", 27102), pct("Maim", 18)],
  },
  {
    id: "prayer",
    name: "Spirit of Prayer",
    icon: iconPrayer,
    maxLevel: 140,
    bonus: { classes: ["Priest"], label: "Priests" },
    stats: [flat("Fixed HP", 1350189), pct("Heal Effect", 12)],
  },
  // Glorious (img 3 order)
  {
    id: "grace",
    name: "Spirit of Grace",
    icon: iconGrace,
    maxLevel: 180,
    bonus: {
      factions: ["Dark", "Light"],
      label: "Dark / Light Heroes",
    },
    stats: [
      flat("Fixed Attack", 18600),
      flat("Fixed HP", 1835600),
      pct("Holy Damage", 6),
      pct("Control Immunity", 8),
      pct("Effect Part Increase", 30),
    ],
  },
  {
    id: "bravery",
    name: "Spirit of Bravery",
    icon: iconBravery,
    maxLevel: 180,
    bonus: {
      factions: ["Fortress"],
      classes: ["Warrior"],
      label: "Fortress / Warriors",
    },
    stats: [
      flat("Fixed HP", 3321000),
      pct("Block", 18),
      pct("Armor", 30),
      pct("Effect Part Increase", 30),
    ],
  },
  {
    id: "trial",
    name: "Spirit of Trial",
    icon: iconTrial,
    maxLevel: 180,
    bonus: {
      factions: ["Shadow"],
      classes: ["Assassin"],
      label: "Shadow / Assassins",
    },
    stats: [
      flat("Fixed Attack", 43790),
      pct("Armor Break", 18),
      pct("Crit Damage", 12),
      pct("Effect Part Increase", 30),
    ],
  },
  {
    id: "justice",
    name: "Spirit of Justice",
    icon: iconJustice,
    maxLevel: 180,
    bonus: {
      factions: ["Abyss"],
      classes: ["Mage"],
      label: "Abyss / Mages",
    },
    stats: [
      flat("Fixed Attack", 40160),
      pct("Attack", 6),
      pct("Control Immunity Offset", 8),
      pct("Effect Part Increase", 30),
    ],
  },
  {
    id: "crystal",
    name: "Spirit of Crystal",
    icon: iconCrystal,
    maxLevel: 180,
    bonus: {
      factions: ["Transcendence"],
      classes: ["Ranger"],
      label: "Transcendence / Rangers",
    },
    stats: [
      flat("Fixed Attack", 21460),
      flat("Fixed HP", 1504000),
      pct("All Damage Dealt", 6),
      pct("Precision", 18),
      pct("Effect Part Increase", 30),
    ],
  },
  {
    id: "piety",
    name: "Spirit of Piety",
    icon: iconPiety,
    maxLevel: 180,
    bonus: {
      factions: ["Forest"],
      classes: ["Priest"],
      label: "Forest / Priests",
    },
    stats: [
      flat("Fixed HP", 3346000),
      pct("HP", 10),
      pct("Damage Reduction", 8),
      pct("Effect Part Increase", 30),
    ],
  },
];

export const STARSPAWN_BY_ID = Object.fromEntries(
  STARSPAWNS.map((row) => [row.id, row])
);

export function starspawnOf(id) {
  return STARSPAWN_BY_ID[id] || null;
}

export function defaultStarspawnEntry(def) {
  const values = {};
  const destiny = {};
  for (const row of def.stats) {
    const key = statKey(row.stat, row.unit);
    values[key] = row.value;
    destiny[key] = 100;
  }
  return { enabled: true, values, destiny };
}

export function defaultStarspawns() {
  const out = {};
  for (const def of STARSPAWNS) {
    out[def.id] = defaultStarspawnEntry(def);
  }
  return out;
}

function clampBase(def, key, raw) {
  const max = def.stats.find((s) => statKey(s.stat, s.unit) === key)?.value;
  const n = Number(raw);
  if (!Number.isFinite(n)) return max ?? 0;
  if (max == null) return Math.max(0, n);
  return Math.min(Math.max(0, n), max);
}

function clampDestiny(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 100;
  return n;
}

export function normalizeStarspawns(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};
  for (const def of STARSPAWNS) {
    const base = defaultStarspawnEntry(def);
    const cur = src[def.id];
    if (!cur || typeof cur !== "object") {
      out[def.id] = base;
      continue;
    }
    const values = { ...base.values };
    const destiny = { ...base.destiny };
    for (const key of Object.keys(values)) {
      if (cur.values && cur.values[key] != null) {
        values[key] = clampBase(def, key, cur.values[key]);
      }
      if (cur.destiny && cur.destiny[key] != null) {
        destiny[key] = clampDestiny(cur.destiny[key]);
      }
    }
    out[def.id] = {
      enabled: cur.enabled !== false,
      values,
      destiny,
    };
  }
  return out;
}

export function formatStarspawnStatValue(value, unit = "") {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (unit === "%") {
    const shown = Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
    return `+${shown}%`;
  }
  return `+${Math.round(n).toLocaleString("en-US")}`;
}

export function starspawnEffectiveValue(base, destinyPct) {
  const b = Number(base) || 0;
  const d = Number(destinyPct);
  const mult = Number.isFinite(d) ? d / 100 : 1;
  return Math.round(b * mult * 10) / 10;
}

export function heroMatchesStarspawnBonus(hero, bonus) {
  if (!hero || !bonus) return false;
  const factions = bonus.factions || [];
  const classes = bonus.classes || [];
  if (factions.length && factions.includes(hero.faction)) return true;
  if (classes.length && classes.includes(hero.heroClass)) return true;
  return false;
}

/**
 * Collect effective starspawn rows for one hero (enabled only).
 * Matching bonus heroes get +50% (1.5×) on the spirit's stats.
 */
export function collectStarspawnStatRows(slot, starspawns, heroOf) {
  const hero = heroOf?.(slot?.heroId);
  if (!hero) return [];
  const state = normalizeStarspawns(starspawns);
  const rows = [];
  for (const def of STARSPAWNS) {
    const entry = state[def.id];
    if (!entry?.enabled) continue;
    const bonusMult = heroMatchesStarspawnBonus(hero, def.bonus) ? 1.5 : 1;
    for (const stat of def.stats) {
      const key = statKey(stat.stat, stat.unit);
      const base = entry.values[key] ?? stat.value;
      const destiny = entry.destiny[key] ?? 100;
      const effective = starspawnEffectiveValue(base, destiny) * bonusMult;
      if (!effective) continue;
      rows.push({
        stat: stat.stat,
        value: Math.round(effective * 10) / 10,
        unit: stat.unit || "",
        sourceId: def.id,
      });
    }
  }
  return rows;
}

export function patchStarspawn(starspawns, id, patch) {
  const next = normalizeStarspawns(starspawns);
  const def = starspawnOf(id);
  if (!def) return next;
  const cur = next[id];
  const values = { ...cur.values };
  const destiny = { ...cur.destiny };
  if (patch.values) {
    for (const [key, val] of Object.entries(patch.values)) {
      if (!(key in values)) continue;
      values[key] = clampBase(def, key, val);
    }
  }
  if (patch.destiny) {
    for (const [key, val] of Object.entries(patch.destiny)) {
      if (!(key in destiny)) continue;
      destiny[key] = clampDestiny(val);
    }
  }
  next[id] = {
    enabled: patch.enabled != null ? Boolean(patch.enabled) : cur.enabled,
    values,
    destiny,
  };
  return next;
}
