import deluxeBoxIcon from "./assets/rng/deluxe-box.png";
import festivalSkinIcon from "./assets/rng/festival-skin-chest.png";
import gold100kIcon from "./assets/rng/gold-100k.png";
import coresIcon from "./assets/rng/cores.png";
import heroChestIcon from "./assets/rng/hero-selection-chest.png";
import limitedCansIcon from "./assets/rng/limited-cans.png";
import normalCansIcon from "./assets/rng/normal-cans.png";
import puppet9Icon from "./assets/rng/puppet-9.png";
import puppet10Icon from "./assets/rng/puppet-10.png";
import resourcesChestIcon from "./assets/rng/resources-chest.png";
import shards5StarIcon from "./assets/rng/shards-5-star.png";
import smallMaterialChestIcon from "./assets/rng/small-material-chest.png";
import orangeTreasureIcon from "./assets/treasure-chest-orange.png";
import pinkTreasureIcon from "./assets/treasure-chest-pink.png";
import artifactsIcon from "./assets/rewards/artifacts.png";
import originArtifactsIcon from "./assets/rewards/origin-artifacts.png";
import originIcon from "./assets/rewards/origin.png";
import grimIcon from "./assets/rewards/grim.png";
import destinyIcon from "./assets/rewards/destiny.png";
import starSoulIcon from "./assets/rewards/star-soul.png";

export const EVENT_MYSTERIOUS_SALE = "mysterious_sale";
export const EVENT_RNG_CELEBRATION = "rng_celebration";

export const DEFAULT_NORMAL_CANS = 16000;
export const DEFAULT_LIMITED_CANS = 36;

export const RNG_REWARD_META = {
  "Hero Chest": {
    short: "Hero",
    label: "Hero Selection Chest",
    color: "#3b82c4",
    icon: heroChestIcon,
  },
  "Festival Skin": {
    short: "Skin",
    label: "Festival skin selection chest",
    color: "#7c3aed",
    icon: festivalSkinIcon,
  },
  "Puppet 9": {
    short: "9*",
    label: "9* puppet",
    color: "#ec4899",
    icon: puppet9Icon,
  },
  "Puppet 10": {
    short: "10*",
    label: "10* puppet",
    color: "#f97316",
    icon: puppet10Icon,
  },
  "Resources Chest": {
    short: "Res",
    label: "Resources chest",
    color: "#d4a017",
    icon: resourcesChestIcon,
  },
  "Orange Treasure": {
    short: "Orange",
    label: "Orange Treasure selection chest",
    color: "#e67e22",
    icon: orangeTreasureIcon,
  },
  "Orange Festival Treasure": {
    short: "Orange Fest",
    label: "Orange Festival Treasure selection chest",
    color: "#c2410c",
    icon: orangeTreasureIcon,
  },
  "Pink Treasure": {
    short: "Pink",
    label: "Pink Treasure selection chest",
    color: "#db2777",
    icon: pinkTreasureIcon,
  },
  "Pink Festival Treasure": {
    short: "Pink Fest",
    label: "Pink Festival Treasure selection chest",
    color: "#9d174d",
    icon: pinkTreasureIcon,
  },
  "Deluxe Box": {
    short: "Deluxe",
    label: "Deluxe box",
    color: "#06b6d4",
    icon: deluxeBoxIcon,
  },
  "Gold 100k": {
    short: "Gold",
    label: "100k Gold",
    color: "#f4c430",
    icon: gold100kIcon,
  },
  Cores: {
    short: "Cores",
    label: "Cores",
    color: "#38bdf8",
    icon: coresIcon,
  },
  "Small Material Chest": {
    short: "Mats",
    label: "Small material chest",
    color: "#b45309",
    icon: smallMaterialChestIcon,
  },
  "5-Star Shards": {
    short: "5*",
    label: "5-Star Shards",
    color: "#eab308",
    icon: shards5StarIcon,
  },
};

export const RNG_SHOP = [
  {
    id: "hero-chest",
    reward: "Hero Chest",
    cost: 1000,
    currency: "normal",
    unlockAt: 0,
    limit: 20,
  },
  {
    id: "festival-skin",
    reward: "Festival Skin",
    cost: 2500,
    currency: "normal",
    unlockAt: 0,
    limit: 1,
  },
  {
    id: "puppet-9",
    reward: "Puppet 9",
    cost: 3500,
    currency: "normal",
    unlockAt: 0,
    limit: 4,
  },
  {
    id: "puppet-10",
    reward: "Puppet 10",
    cost: 5600,
    currency: "normal",
    unlockAt: 0,
    limit: 2,
  },
  {
    id: "resources-chest",
    reward: "Resources Chest",
    cost: 18,
    currency: "limited",
    unlockAt: 0,
    limit: 10,
  },
  {
    id: "orange-treasure",
    reward: "Orange Treasure",
    cost: 6500,
    currency: "normal",
    unlockAt: 1000,
    limit: 8,
  },
  {
    id: "orange-festival",
    reward: "Orange Festival Treasure",
    cost: 7500,
    currency: "normal",
    unlockAt: 1250,
    limit: 8,
  },
  {
    id: "pink-treasure",
    reward: "Pink Treasure",
    cost: 9300,
    currency: "normal",
    unlockAt: 2000,
    limit: 4,
  },
  {
    id: "pink-festival",
    reward: "Pink Festival Treasure",
    cost: 10000,
    currency: "normal",
    unlockAt: 2500,
    limit: 4,
  },
  {
    id: "normal-arti",
    reward: "Artifacts",
    cost: 18,
    currency: "limited",
    unlockAt: 3200,
    limit: 4,
  },
  {
    id: "origin-arti",
    reward: "Origin Artifacts",
    cost: 18,
    currency: "limited",
    unlockAt: 6400,
    limit: 4,
  },
  {
    id: "origin-mats",
    reward: "Origin",
    cost: 18,
    currency: "limited",
    unlockAt: 9600,
    limit: 8,
  },
  {
    id: "grim",
    reward: "Grim",
    cost: 18,
    currency: "limited",
    unlockAt: 9600,
    limit: 6,
  },
  {
    id: "deluxe-box",
    reward: "Deluxe Box",
    cost: 400,
    currency: "normal",
    unlockAt: 12800,
    limit: 20,
  },
  {
    id: "dt-mats",
    reward: "DT",
    cost: 18,
    currency: "limited",
    unlockAt: 12800,
    limit: 6,
  },
  {
    id: "star-soul",
    reward: "Star Soul",
    cost: 18,
    currency: "limited",
    unlockAt: 16000,
    limit: 6,
  },
  {
    id: "gold-100k",
    reward: "Gold 100k",
    cost: 100,
    currency: "normal",
    unlockAt: 0,
    limit: 9999,
  },
  {
    id: "cores",
    reward: "Cores",
    cost: 1,
    currency: "limited",
    unlockAt: 0,
    limit: 9999,
    qty: 2,
  },
  {
    id: "small-material-chest",
    reward: "Small Material Chest",
    cost: 125,
    currency: "normal",
    unlockAt: 0,
    limit: 9999,
  },
  {
    id: "shards-5-star",
    reward: "5-Star Shards",
    cost: 90,
    currency: "normal",
    unlockAt: 0,
    limit: 9999,
  },
];

export const RNG_SHOP_BY_ID = Object.fromEntries(
  RNG_SHOP.map((item) => [item.id, item])
);

export function isRngOption(option) {
  return option?.event_type === EVENT_RNG_CELEBRATION;
}

export function defaultRngShop() {
  return {
    normal_cans: DEFAULT_NORMAL_CANS,
    limited_cans: DEFAULT_LIMITED_CANS,
    buys: {},
  };
}

export function normalizeRngShop(raw = {}) {
  const buys = {};
  Object.entries(raw.buys || {}).forEach(([id, value]) => {
    const item = RNG_SHOP_BY_ID[id];
    const amount = Math.max(0, Math.floor(Number(value) || 0));
    if (item && amount) buys[id] = Math.min(item.limit, amount);
  });
  return {
    normal_cans: Math.max(
      0,
      Math.floor(Number(raw.normal_cans ?? DEFAULT_NORMAL_CANS) || 0)
    ),
    limited_cans: Math.max(
      0,
      Math.floor(Number(raw.limited_cans ?? DEFAULT_LIMITED_CANS) || 0)
    ),
    buys,
  };
}

export function rngSpend(buys = {}) {
  let normal = 0;
  let limited = 0;
  Object.entries(buys).forEach(([id, count]) => {
    const item = RNG_SHOP_BY_ID[id];
    const amount = Math.max(0, Number(count) || 0);
    if (!item || !amount) return;
    if (item.currency === "limited") limited += item.cost * amount;
    else normal += item.cost * amount;
  });
  return { normal, limited };
}

export function rngItemQty(item) {
  return Math.max(1, Math.floor(Number(item?.qty) || 1));
}

export function rngRewards(buys = {}) {
  const counts = {};
  Object.entries(buys).forEach(([id, count]) => {
    const item = RNG_SHOP_BY_ID[id];
    const amount = Math.max(0, Number(count) || 0);
    if (!item || !amount) return;
    counts[item.reward] = (counts[item.reward] || 0) + amount * rngItemQty(item);
  });
  return counts;
}

export function rngSummary(raw) {
  const shop = clampRngBuys(raw);
  const spent = rngSpend(shop.buys);
  return {
    ...shop,
    spentNormal: spent.normal,
    spentLimited: spent.limited,
    leftNormal: shop.normal_cans - spent.normal,
    leftLimited: shop.limited_cans - spent.limited,
    rewards: rngRewards(shop.buys),
  };
}

export function canBuyRngItem(item, shop) {
  const summary = rngSummary(shop);
  const owned = Number(summary.buys[item.id] || 0);
  if (owned >= item.limit) return false;
  if (item.currency === "limited") {
    if (summary.spentNormal < item.unlockAt) return false;
    return summary.leftLimited >= item.cost;
  }
  if (summary.leftNormal < item.cost) return false;
  return summary.spentNormal + item.cost >= item.unlockAt;
}

export function maxRngCount(item, shop) {
  const summary = rngSummary(shop);
  const owned = Number(summary.buys[item.id] || 0);
  const spentWithout =
    item.currency === "limited"
      ? summary.spentLimited - item.cost * owned
      : summary.spentNormal - item.cost * owned;
  const budget =
    item.currency === "limited" ? summary.limited_cans : summary.normal_cans;
  const leftover = budget - spentWithout;
  const byCost = item.cost > 0 ? Math.floor(leftover / item.cost) : item.limit;
  const affordable = Math.max(0, Math.min(item.limit, byCost));
  if (item.currency === "limited") {
    const unlocked = summary.spentNormal >= item.unlockAt;
    return unlocked ? affordable : owned;
  }
  const spentAfter = (n) => spentWithout + item.cost * n;
  if (spentAfter(affordable) < item.unlockAt) return owned;
  return Math.max(owned, affordable);
}

export function clampRngBuys(shop) {
  const source = normalizeRngShop(shop);
  const next = { ...source, buys: {} };
  let spentNormal = 0;
  let spentLimited = 0;
  RNG_SHOP.forEach((item) => {
    const wanted = Number(source.buys[item.id] || 0);
    if (!wanted) return;
    const leftover =
      item.currency === "limited"
        ? source.limited_cans - spentLimited
        : source.normal_cans - spentNormal;
    const byCost = item.cost > 0 ? Math.floor(leftover / item.cost) : wanted;
    const owned = Math.max(0, Math.min(item.limit, wanted, byCost));
    if (!owned) return;
    if (item.currency === "limited") {
      if (spentNormal < item.unlockAt) return;
      next.buys[item.id] = owned;
      spentLimited += item.cost * owned;
      return;
    }
    const spentAfter = spentNormal + item.cost * owned;
    if (spentAfter < item.unlockAt) return;
    next.buys[item.id] = owned;
    spentNormal = spentAfter;
  });
  return next;
}

export function setRngBuyCount(shop, itemId, count) {
  const item = RNG_SHOP_BY_ID[itemId];
  const next = normalizeRngShop(shop);
  if (!item) return next;
  const wanted = Math.max(0, Math.min(item.limit, Math.floor(Number(count) || 0)));
  if (wanted) next.buys[itemId] = wanted;
  else delete next.buys[itemId];
  return clampRngBuys(next);
}

export const CAN_ICONS = {
  normal: normalCansIcon,
  limited: limitedCansIcon,
};

export const CAN_LABELS = {
  normal: "Normal cans",
  limited: "Limited cans",
};
