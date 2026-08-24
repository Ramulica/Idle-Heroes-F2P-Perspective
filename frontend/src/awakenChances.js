export const AWAKEN_TIERS = [
  {
    id: "E-",
    label: "E-",
    chance: 4.3,
    score: "1–199",
    csg: "1",
    color: "#2b8fd9",
  },
  {
    id: "E",
    label: "E",
    chance: 19.8,
    score: "200–399",
    csg: "2–3",
    color: "#4aa3ff",
  },
  {
    id: "E+",
    label: "E+",
    chance: 28.8,
    score: "400–599",
    csg: "4–5",
    color: "#2f7de0",
  },
  {
    id: "D-",
    label: "D-",
    chance: 20,
    score: "600–799",
    csg: "6–7",
    color: "#c9a017",
  },
  {
    id: "D",
    label: "D",
    chance: 9.2,
    score: "800–999",
    csg: "8–9",
    color: "#d4a017",
  },
  {
    id: "D+",
    label: "D+",
    chance: 4.8,
    score: "1000–1199",
    csg: "10–11",
    color: "#c4921a",
  },
  {
    id: "C-",
    label: "C-",
    chance: 4.4,
    score: "1200–1599",
    csg: "12–15",
    color: "#c084fc",
  },
  {
    id: "C",
    label: "C",
    chance: 4.3,
    score: "1600–2099",
    csg: "16–20",
    color: "#a855f7",
  },
  {
    id: "C+",
    label: "C+",
    chance: 2.13,
    score: "2100–2699",
    csg: "21–26",
    color: "#7c3aed",
  },
  {
    id: "B-",
    label: "B-",
    chance: 1.62,
    score: "2700–3499",
    csg: "27–34",
    color: "#4ade80",
  },
  {
    id: "B",
    label: "B",
    chance: 0.55,
    score: "3500–4399",
    csg: "35–43",
    color: "#22c55e",
  },
  {
    id: "B+",
    label: "B+",
    chance: 0.0745,
    score: "4400–5399",
    csg: "44–53",
    color: "#16a34a",
  },
  {
    id: "A-",
    label: "A-",
    chance: 0.015,
    score: "5400–6299",
    csg: "54–62",
    color: "#ef4444",
    group: "A-better",
  },
  {
    id: "A",
    label: "A",
    chance: 0.0065,
    score: "6300–7199",
    csg: "63–71",
    color: "#dc2626",
    group: "A-better",
  },
  {
    id: "A+",
    label: "A+",
    chance: 0.0025,
    score: "7200–8099",
    csg: "72–80",
    color: "#b91c1c",
    group: "A-better",
  },
  {
    id: "S",
    label: "S ~ SSS",
    chance: 0.0015,
    score: "8100–9900",
    csg: "81–99",
    color: "#f4c430",
    group: "A-better",
  },
];

export const A_BETTER_GROUP_ID = "A-better";

export const A_BETTER_TIERS = AWAKEN_TIERS.filter(
  (row) => row.group === A_BETTER_GROUP_ID
);

export const A_BETTER_CHANCE = A_BETTER_TIERS.reduce(
  (sum, row) => sum + row.chance,
  0
);

export const AWAKEN_DISPLAY_TIERS = [
  ...AWAKEN_TIERS.filter((row) => row.group !== A_BETTER_GROUP_ID),
  {
    id: A_BETTER_GROUP_ID,
    label: "A- and better",
    chance: A_BETTER_CHANCE,
    color: "#e23b3b",
    grouped: true,
  },
];

export function expectedAwakens(amount, chance) {
  return Math.max(0, Number(amount) || 0) * ((Number(chance) || 0) / 100);
}

export function formatChance(percent) {
  const value = Number(percent) || 0;
  if (Number.isInteger(value)) return `${value}%`;
  return `${String(value)}%`;
}

export function formatExpected(value) {
  const amount = Number(value) || 0;
  if (amount === 0) return "0";
  if (amount >= 100) {
    return Math.round(amount).toLocaleString();
  }
  if (amount >= 10) {
    return amount.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  if (amount >= 1) {
    return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}
