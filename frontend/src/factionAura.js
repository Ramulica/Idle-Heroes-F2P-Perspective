import factionShadow from "./assets/stats/factions/faction-shadow.png";
import factionFortress from "./assets/stats/factions/faction-fortress.png";
import factionAbyss from "./assets/stats/factions/faction-abyss.png";
import factionForest from "./assets/stats/factions/faction-forest.png";
import factionDark from "./assets/stats/factions/faction-dark.png";
import factionLight from "./assets/stats/factions/faction-light.png";
import factionTranscendence from "./assets/stats/factions/faction-transcendence.png";
import auraCore from "./assets/stats/factions/aura-core.png";

/** Group-size bonuses (unique sizes only — e.g. two 3s count once). HP/Atk shown muted. */
export const AURA_GROUP_BONUSES = {
  1: { hp: 2, attack: 1.5 },
  2: { hp: 5, attack: 3.5 },
  3: { hp: 8, attack: 5.5 },
  4: { hp: 11, attack: 7.5 },
  5: { hp: 14, attack: 9.5 },
  6: { hp: 18, attack: 12 },
};

/** Per-hero special bonuses by faction (these are what we care about). */
export const FACTION_AURA = {
  Shadow: {
    id: "shadow",
    name: "Shadow",
    icon: factionShadow,
    damageReduction: 2,
    controlImmunity: 0,
  },
  Fortress: {
    id: "fortress",
    name: "Fortress",
    icon: factionFortress,
    damageReduction: 2,
    controlImmunity: 0,
  },
  Abyss: {
    id: "abyss",
    name: "Abyss",
    icon: factionAbyss,
    damageReduction: 2,
    controlImmunity: 0,
  },
  Forest: {
    id: "forest",
    name: "Forest",
    icon: factionForest,
    damageReduction: 2,
    controlImmunity: 0,
  },
  Dark: {
    id: "dark",
    name: "Dark",
    icon: factionDark,
    damageReduction: 0,
    controlImmunity: 4,
  },
  Light: {
    id: "light",
    name: "Light",
    icon: factionLight,
    damageReduction: 0,
    controlImmunity: 4,
  },
  Transcendence: {
    id: "transcendence",
    name: "Transcendence",
    icon: factionTranscendence,
    damageReduction: 1.5,
    controlImmunity: 3,
  },
};

export const AURA_CORE_ICON = auraCore;

export const FACTION_ORDER = [
  "Shadow",
  "Fortress",
  "Abyss",
  "Forest",
  "Dark",
  "Light",
  "Transcendence",
];

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Faction aura from lineup slots.
 * Group HP/Atk: each distinct group size (1–6) applies at most once.
 * Specials: sum per-hero DR / Control Imm from each filled slot’s faction.
 */
export function computeFactionAura(slots, heroOf) {
  const placed = [];
  for (const slot of slots || []) {
    const hero = heroOf?.(slot?.heroId) || null;
    if (!hero) continue;
    placed.push(hero);
  }

  const counts = {};
  for (const hero of placed) {
    const faction = hero.faction || "Unknown";
    counts[faction] = (counts[faction] || 0) + 1;
  }

  const groupSizes = Object.values(counts).filter((n) => n > 0);
  const uniqueSizes = [...new Set(groupSizes)].sort((a, b) => a - b);

  let hp = 0;
  let attack = 0;
  const activeGroups = [];
  for (const size of uniqueSizes) {
    const bonus = AURA_GROUP_BONUSES[size];
    if (!bonus) continue;
    hp += bonus.hp;
    attack += bonus.attack;
    activeGroups.push({ size, ...bonus });
  }

  let damageReduction = 0;
  let controlImmunity = 0;
  const perFaction = [];
  for (const name of FACTION_ORDER) {
    const count = counts[name] || 0;
    if (!count) continue;
    const def = FACTION_AURA[name];
    const dr = round1(def.damageReduction * count);
    const ci = round1(def.controlImmunity * count);
    damageReduction += dr;
    controlImmunity += ci;
    perFaction.push({
      faction: name,
      count,
      icon: def.icon,
      damageReduction: dr,
      controlImmunity: ci,
      perHeroDr: def.damageReduction,
      perHeroCi: def.controlImmunity,
    });
  }

  const slotFactions = (slots || []).map((slot) => {
    const hero = heroOf?.(slot?.heroId) || null;
    if (!hero) return null;
    return FACTION_AURA[hero.faction] || null;
  });

  return {
    heroCount: placed.length,
    fullTeam: placed.length >= 6,
    counts,
    activeGroups,
    perFaction,
    slotFactions,
    totals: {
      hp: round1(hp),
      attack: round1(attack),
      damageReduction: round1(damageReduction),
      controlImmunity: round1(controlImmunity),
    },
  };
}

export function formatAuraPct(value) {
  if (value == null) return "0%";
  const n = Number(value);
  return Number.isInteger(n) ? `${n}%` : `${n}%`;
}
