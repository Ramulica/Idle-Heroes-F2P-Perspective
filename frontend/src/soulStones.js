import stoneIcon from "./assets/stats/gear/soul-stone-6.png";

/** Stats we treat as basic (muted) even when they come from a yellow roll. */
export const BASIC_STONE_STATS = new Set(["HP", "Attack"]);

function pct(stat, value, tone) {
  return { stat, value, unit: "%", tone };
}

function flat(stat, value, tone) {
  return { stat, value, unit: "", tone };
}

function combo(category, slug, fixed, roll, rollLabel) {
  const stats = [...fixed, ...roll];
  const label = rollLabel ? `${category} · ${rollLabel}` : category;
  return {
    id: `stone-6-${slug}`,
    slot: "stone",
    category,
    label,
    name: `Soul Stone 6 · ${label}`,
    icon: stoneIcon,
    stage: "stone6",
    heroClass: null,
    fixed,
    roll,
    stats,
  };
}

/** Soul Stone 6 only: each category’s fixed (grey) stats × one yellow option. */
const CATEGORIES = [
  {
    id: "speed",
    name: "Speed",
    fixed: [flat("Speed", 130, "fixed")],
    rolls: [
      { slug: "hp", label: "HP%", stats: [pct("HP", 41, "roll")] },
      { slug: "atk", label: "Attack%", stats: [pct("Attack", 32, "roll")] },
      { slug: "crit", label: "Crit", stats: [pct("Crit", 27.5, "roll")] },
      {
        slug: "heal",
        label: "Heal Effect",
        stats: [pct("Heal Effect", 38, "roll")],
      },
      {
        slug: "prec",
        label: "Precision",
        stats: [pct("Precision", 27.5, "roll")],
      },
    ],
  },
  {
    id: "attack",
    name: "Attack",
    fixed: [flat("Attack", 2150, "fixed"), pct("Attack", 30, "fixed")],
    rolls: [
      {
        slug: "prec",
        label: "Precision",
        stats: [pct("Precision", 28.5, "roll")],
      },
      {
        slug: "abr",
        label: "Armor Break",
        stats: [pct("Armor Break", 59, "roll")],
      },
      {
        slug: "holy",
        label: "Holy Damage",
        stats: [pct("Holy Damage", 45, "roll")],
      },
      {
        slug: "skill",
        label: "Skill Damage",
        stats: [pct("Skill Damage", 140, "roll")],
      },
    ],
  },
  {
    id: "crit",
    name: "Crit",
    fixed: [pct("Crit", 27.5, "fixed")],
    rolls: [
      {
        slug: "cdmg-atk",
        label: "Crit DMG · Attack%",
        stats: [
          pct("Crit Damage", 59.5, "roll"),
          pct("Attack", 16, "roll"),
        ],
      },
      {
        slug: "prec",
        label: "Precision",
        stats: [pct("Precision", 27.5, "roll")],
      },
      {
        slug: "abr",
        label: "Armor Break",
        stats: [pct("Armor Break", 59, "roll")],
      },
    ],
  },
  {
    id: "single",
    name: "Single Stat",
    fixed: [],
    rolls: [
      {
        slug: "hp",
        label: "HP",
        stats: [flat("HP", 34000, "fixed"), pct("HP", 55, "fixed")],
      },
      {
        slug: "atk",
        label: "Attack",
        stats: [flat("Attack", 5500, "fixed"), pct("Attack", 43, "fixed")],
      },
    ],
  },
  {
    id: "hp",
    name: "HP",
    fixed: [pct("HP", 42, "fixed")],
    rolls: [
      { slug: "crit", label: "Crit", stats: [pct("Crit", 27.5, "roll")] },
      { slug: "atk", label: "Attack%", stats: [pct("Attack", 32, "roll")] },
      {
        slug: "eobh",
        label: "EoBH",
        stats: [pct("Effect of Being Healed", 38, "roll")],
      },
      {
        slug: "prec",
        label: "Precision",
        stats: [pct("Precision", 42, "roll")],
      },
    ],
  },
  {
    id: "block",
    name: "Block",
    fixed: [pct("Block", 32.5, "fixed")],
    rolls: [
      { slug: "hp", label: "HP%", stats: [pct("HP", 44, "roll")] },
      { slug: "atk", label: "Attack%", stats: [pct("Attack", 34, "roll")] },
    ],
  },
  {
    id: "skill",
    name: "Skill Damage",
    fixed: [pct("Skill Damage", 140, "fixed")],
    rolls: [
      {
        slug: "holy",
        label: "Holy Damage",
        stats: [pct("Holy Damage", 45, "roll")],
      },
      {
        slug: "prec",
        label: "Precision",
        stats: [pct("Precision", 26, "roll")],
      },
    ],
  },
  {
    id: "hybrid",
    name: "Hybrid",
    fixed: [flat("Attack", 2150, "fixed"), pct("HP", 34, "fixed")],
    rolls: [
      {
        slug: "holy",
        label: "Holy Damage",
        stats: [pct("Holy Damage", 45, "roll")],
      },
      {
        slug: "heal",
        label: "Heal Effect",
        stats: [pct("Heal Effect", 34, "roll")],
      },
    ],
  },
];

export const SOUL_STONE_OPTIONS = CATEGORIES.flatMap((cat) =>
  cat.rolls.map((roll) =>
    combo(
      cat.name,
      `${cat.id}-${roll.slug}`,
      cat.fixed,
      roll.stats,
      roll.label
    )
  )
);

export const SOUL_STONE_BY_ID = Object.fromEntries(
  SOUL_STONE_OPTIONS.map((row) => [row.id, row])
);

export const SOUL_STONE_CATEGORIES = CATEGORIES.map((cat) => ({
  id: cat.id,
  name: cat.name,
  options: SOUL_STONE_OPTIONS.filter((row) => row.category === cat.name),
}));

const STAT_SHORT = {
  "Armor Break": "Armor Brk",
  "Holy Damage": "Holy DMG",
  "Skill Damage": "Skill DMG",
  "Crit Damage": "Crit DMG",
  "Heal Effect": "Heal Eff",
  "Effect of Being Healed": "EoBH",
  Precision: "Prec",
};

export function isBasicStoneStat(stat) {
  return BASIC_STONE_STATS.has(stat);
}

export function stoneStatTone(row) {
  if (!row) return "fixed";
  if (isBasicStoneStat(row.stat)) return "fixed";
  return row.tone === "roll" ? "roll" : "fixed";
}

export function formatStoneStat(row, compact = false) {
  if (!row) return "";
  const name = compact ? STAT_SHORT[row.stat] || row.stat : row.stat;
  if (row.unit === "%") return `${name} +${row.value}%`;
  if (row.value >= 1000) {
    const k = row.value / 1000;
    const text = Number.isInteger(k) ? `${k}k` : `${k}k`;
    return `${name} +${text}`;
  }
  return `${name} +${row.value}`;
}
