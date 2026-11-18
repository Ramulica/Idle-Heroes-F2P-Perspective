/**
 * Idle Heroes Auction House accounting:
 * biddings → bag (7d cooldown) → listing (6h cool + 2d auction) → history.
 * 5% sell commission. Pricing learns from sold / failed tries.
 */

import starGemIcon from "./assets/auction/star-gem.png";
import vulcan from "./assets/auction/heroes/vulcan.png";
import logan from "./assets/auction/heroes/logan.png";
import hylas from "./assets/auction/heroes/hylas.png";
import natalie from "./assets/auction/heroes/natalie.png";
import geester from "./assets/auction/heroes/geester.png";
import elena from "./assets/auction/heroes/elena.png";
import fan from "./assets/auction/heroes/fan.png";
import phorcys from "./assets/auction/heroes/phorcys.png";
import carrie from "./assets/auction/heroes/carrie.png";
import drake from "./assets/auction/heroes/drake.png";
import amenRa from "./assets/auction/heroes/amen-ra.png";
import aspen from "./assets/auction/heroes/aspen.png";
import mockman from "./assets/auction/heroes/mockman.png";
import aranea from "./assets/auction/heroes/aranea.png";
import vesa from "./assets/auction/heroes/vesa.png";
import starlight from "./assets/auction/heroes/starlight.png";
import freya from "./assets/auction/heroes/freya.png";
import rogge from "./assets/auction/heroes/rogge.png";
import elyvia from "./assets/auction/heroes/elyvia.png";
import flora from "./assets/auction/heroes/flora.png";
import cthugha from "./assets/auction/heroes/cthugha.png";
import delacium from "./assets/auction/heroes/delacium.png";
import morax from "./assets/auction/heroes/morax.png";
import waldeck from "./assets/auction/heroes/waldeck.png";
import natasha from "./assets/auction/heroes/natasha.png";
import ignis from "./assets/auction/heroes/ignis.png";
import holmesYoung from "./assets/auction/heroes/holmes-young.png";
import penny from "./assets/auction/heroes/penny.png";
import xia from "./assets/auction/heroes/xia.png";
import sherlock from "./assets/auction/heroes/sherlock.png";
import inosuke from "./assets/auction/heroes/inosuke.png";
import valentino from "./assets/auction/heroes/valentino.png";
import onikirimaru from "./assets/auction/heroes/onikirimaru.png";
import eloise from "./assets/auction/heroes/eloise.png";
import tix from "./assets/auction/heroes/tix.png";
import jahra from "./assets/auction/heroes/jahra.png";
import horus from "./assets/auction/heroes/horus.png";
import annabelle from "./assets/auction/heroes/annabelle.png";
import aylamak from "./assets/auction/heroes/aylamak.png";
import betty from "./assets/auction/heroes/betty.png";

export const STAR_GEM_ICON = starGemIcon;
export const STORAGE_KEY = "ih-auction-house";

export const SELL_COMMISSION = 0.05; // 5%
export const BUY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
export const LIST_WARMUP_MS = 6 * 60 * 60 * 1000;
export const LIST_AUCTION_MS = 2 * 24 * 60 * 60 * 1000;
export const STALE_LIST_MS = 36 * 60 * 60 * 1000; // suggest lower after ~1.5d in auction

const TIERS = ["C", "B", "A", "S", "SS", "SSS"];
const SIGNS = ["-", "", "+"];

export const AUCTION_RARITIES = TIERS.flatMap((tier) =>
  SIGNS.map((sign) => `${tier}${sign}`)
);

/** % roll options (same family as Stat Calculator / sigils). */
export const AUCTION_PCT_STATS = [
  "Armor Break",
  "Precision",
  "Crit",
  "Crit Damage",
  "Crit Damage Reduction",
  "Crit Damage Offset",
  "Block",
  "Armor",
  "Skill Damage",
  "Holy Damage",
  "Damage Reduction",
  "All Damage Dealt",
  "All Damage Reduction",
  "Control Immunity",
  "Control Immunity Offset",
  "Dodge",
  "Dodge Offset",
  "Heal Effect",
  "Effect of Being Healed",
  "Maim",
];

export const AUCTION_HEROES = [
  { id: "vulcan", name: "Vulcan", icon: vulcan, faction: "Light" },
  { id: "logan", name: "Sun Walker · Logan", icon: logan, faction: "Light" },
  { id: "hylas", name: "Hylas", icon: hylas, faction: "Light" },
  { id: "natalie", name: "Natalie", icon: natalie, faction: "Light" },
  { id: "geester", name: "Geester", icon: geester, faction: "Light" },
  { id: "elena", name: "Elena", icon: elena, faction: "Light" },
  { id: "fan", name: "Fan", icon: fan, faction: "Light" },
  { id: "phorcys", name: "Phorcys", icon: phorcys, faction: "Dark" },
  { id: "carrie", name: "Carrie", icon: carrie, faction: "Dark" },
  { id: "drake", name: "Drake", icon: drake, faction: "Dark" },
  { id: "amen-ra", name: "Amen-Ra", icon: amenRa, faction: "Dark" },
  { id: "aspen", name: "Aspen", icon: aspen, faction: "Dark" },
  { id: "mockman", name: "Mockman", icon: mockman, faction: "Dark" },
  { id: "aranea", name: "Aranea", icon: aranea, faction: "Dark" },
  { id: "vesa", name: "Fairy Queen · Vesa", icon: vesa, faction: "Forest" },
  { id: "starlight", name: "Starlight", icon: starlight, faction: "Forest" },
  { id: "freya", name: "Freya", icon: freya, faction: "Forest" },
  { id: "rogge", name: "Rogge", icon: rogge, faction: "Forest" },
  { id: "elyvia", name: "Elyvia", icon: elyvia, faction: "Forest" },
  { id: "flora", name: "Flora", icon: flora, faction: "Forest" },
  { id: "cthugha", name: "Cthugha", icon: cthugha, faction: "Abyss" },
  { id: "delacium", name: "Delacium", icon: delacium, faction: "Abyss" },
  { id: "morax", name: "Morax", icon: morax, faction: "Abyss" },
  { id: "waldeck", name: "Waldeck", icon: waldeck, faction: "Abyss" },
  { id: "natasha", name: "Natasha", icon: natasha, faction: "Abyss" },
  { id: "ignis", name: "Ignis", icon: ignis, faction: "Abyss" },
  {
    id: "holmes-young",
    name: "Holmes Young",
    icon: holmesYoung,
    faction: "Fortress",
  },
  { id: "penny", name: "Penny", icon: penny, faction: "Fortress" },
  { id: "xia", name: "Xia", icon: xia, faction: "Fortress" },
  { id: "sherlock", name: "Sherlock", icon: sherlock, faction: "Fortress" },
  { id: "inosuke", name: "Inosuke", icon: inosuke, faction: "Fortress" },
  { id: "valentino", name: "Valentino", icon: valentino, faction: "Fortress" },
  {
    id: "onikirimaru",
    name: "Onikirimaru",
    icon: onikirimaru,
    faction: "Shadow",
  },
  { id: "eloise", name: "Eloise", icon: eloise, faction: "Shadow" },
  { id: "tix", name: "Tix", icon: tix, faction: "Shadow" },
  { id: "jahra", name: "Jahra", icon: jahra, faction: "Shadow" },
  { id: "horus", name: "Horus", icon: horus, faction: "Shadow" },
  { id: "annabelle", name: "Annabelle", icon: annabelle, faction: "Shadow" },
  { id: "aylamak", name: "Aylamak", icon: aylamak, faction: "Forest" },
  { id: "betty", name: "Betty", icon: betty, faction: "Forest" },
];

export const AUCTION_HERO_BY_ID = Object.fromEntries(
  AUCTION_HEROES.map((h) => [h.id, h])
);

export function auctionHeroOf(id) {
  return AUCTION_HERO_BY_ID[id] || null;
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `ah-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function toDatetimeLocalValue(isoOrDate = new Date()) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return toDatetimeLocalValue(new Date());
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value) {
  if (!value) return nowIso();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? nowIso() : d.toISOString();
}

export function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms)) return "—";
  const abs = Math.abs(ms);
  const sign = ms < 0 ? "-" : "";
  const days = Math.floor(abs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((abs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const mins = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000));
  if (days > 0) return `${sign}${days}d ${hours}h`;
  if (hours > 0) return `${sign}${hours}h ${mins}m`;
  return `${sign}${mins}m`;
}

export function formatSg(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return Math.round(v).toLocaleString("en-US");
}

export function netFromListPrice(listPrice) {
  const p = Math.max(0, Number(listPrice) || 0);
  return p * (1 - SELL_COMMISSION);
}

export function listPriceForNet(desiredNet) {
  const n = Math.max(0, Number(desiredNet) || 0);
  return n / (1 - SELL_COMMISSION);
}

export function defaultSettings() {
  return {
    pricingMode: "margin", // margin | profit
    minMarginPct: 15,
    minProfitSg: 50,
    staleDiscountPct: 8,
    autoBumpOnHistoryUplift: true,
  };
}

function normalizeBonus(raw) {
  const stat = AUCTION_PCT_STATS.includes(raw?.stat) ? raw.stat : "";
  const value = Number(raw?.value);
  return {
    stat,
    value: Number.isFinite(value) && value > 0 ? value : 0,
    unit: "%",
  };
}

function normalizeTries(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => ({
      price: Math.max(0, Number(t?.price) || 0),
      at: typeof t?.at === "string" ? t.at : nowIso(),
    }))
    .filter((t) => t.price > 0);
}

export function normalizeCopy(raw, stage) {
  if (!raw || typeof raw !== "object") return null;
  const heroId = auctionHeroOf(raw.heroId) ? raw.heroId : null;
  if (!heroId) return null;
  const rarity = AUCTION_RARITIES.includes(raw.rarity) ? raw.rarity : "A";
  const speed = Math.max(0, Number(raw.speed) || 0);
  const attack = Math.max(0, Number(raw.attack) || 0);
  const hp = Math.max(0, Number(raw.hp) || 0);
  const bonusA = normalizeBonus(raw.bonusA || raw.bonuses?.[0]);
  const bonusB = normalizeBonus(raw.bonusB || raw.bonuses?.[1]);
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newId(),
    stage,
    heroId,
    rarity,
    speed,
    attack,
    hp,
    bonusA,
    bonusB,
    note: typeof raw.note === "string" ? raw.note : "",
    // bidding
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : nowIso(),
    // bag / buy
    buyPrice: Math.max(0, Number(raw.buyPrice) || 0),
    boughtAt: typeof raw.boughtAt === "string" ? raw.boughtAt : null,
    // listing
    listPrice: Math.max(0, Number(raw.listPrice) || 0),
    listedAt: typeof raw.listedAt === "string" ? raw.listedAt : null,
    tries: normalizeTries(raw.tries),
    // history
    soldPrice: Math.max(0, Number(raw.soldPrice) || 0),
    soldAt: typeof raw.soldAt === "string" ? raw.soldAt : null,
    outcome:
      raw.outcome === "sold" || raw.outcome === "discarded"
        ? raw.outcome
        : stage === "history"
          ? "sold"
          : null,
  };
}

export function defaultAuctionState() {
  return {
    settings: defaultSettings(),
    biddings: [],
    bag: [],
    listings: [],
    history: [],
  };
}

export function normalizeAuctionState(raw) {
  const base = defaultAuctionState();
  if (!raw || typeof raw !== "object") return base;
  const settings = { ...defaultSettings(), ...(raw.settings || {}) };
  settings.pricingMode =
    settings.pricingMode === "profit" ? "profit" : "margin";
  settings.minMarginPct = Math.max(0, Number(settings.minMarginPct) || 0);
  settings.minProfitSg = Math.max(0, Number(settings.minProfitSg) || 0);
  settings.staleDiscountPct = Math.max(
    0,
    Number(settings.staleDiscountPct) || 0
  );
  return {
    settings,
    biddings: (Array.isArray(raw.biddings) ? raw.biddings : [])
      .map((c) => normalizeCopy(c, "bidding"))
      .filter(Boolean),
    bag: (Array.isArray(raw.bag) ? raw.bag : [])
      .map((c) => normalizeCopy(c, "bag"))
      .filter(Boolean),
    listings: (Array.isArray(raw.listings) ? raw.listings : [])
      .map((c) => normalizeCopy(c, "listing"))
      .filter(Boolean),
    history: (Array.isArray(raw.history) ? raw.history : [])
      .map((c) => normalizeCopy(c, "history"))
      .filter(Boolean),
  };
}

export function readAuctionState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAuctionState();
    return normalizeAuctionState(JSON.parse(raw));
  } catch {
    return defaultAuctionState();
  }
}

export function writeAuctionState(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizeAuctionState(state))
    );
  } catch {
    /* ignore quota */
  }
}

export function emptyBiddingDraft() {
  return {
    heroId: AUCTION_HEROES[0].id,
    rarity: "A",
    speed: "",
    attack: "",
    hp: "",
    bonusA: { stat: "Crit Damage", value: "" },
    bonusB: { stat: "Precision", value: "" },
    note: "",
  };
}

/** Floor list price that meets min profit or margin after 5% commission. */
export function minListPrice(buyPrice, settings) {
  const buy = Math.max(0, Number(buyPrice) || 0);
  const s = { ...defaultSettings(), ...(settings || {}) };
  let desiredNet;
  if (s.pricingMode === "profit") {
    desiredNet = buy + Math.max(0, Number(s.minProfitSg) || 0);
  } else {
    const margin = Math.max(0, Number(s.minMarginPct) || 0) / 100;
    desiredNet = buy * (1 + margin);
  }
  return Math.ceil(listPriceForNet(desiredNet));
}

function rarityRank(rarity) {
  return Math.max(0, AUCTION_RARITIES.indexOf(rarity));
}

function bonusKey(b) {
  return `${b?.stat || ""}:${Number(b?.value) || 0}`;
}

function copyFingerprint(copy) {
  return [
    copy.heroId,
    copy.rarity,
    bonusKey(copy.bonusA),
    bonusKey(copy.bonusB),
  ].join("|");
}

function statDistance(a, b) {
  const spd = Math.abs((a.speed || 0) - (b.speed || 0)) / 50;
  const atk =
    Math.abs((a.attack || 0) - (b.attack || 0)) /
    Math.max(1, (a.attack || 0) + (b.attack || 0)) * 4;
  const hp =
    Math.abs((a.hp || 0) - (b.hp || 0)) /
    Math.max(1, (a.hp || 0) + (b.hp || 0)) * 4;
  const rar = Math.abs(rarityRank(a.rarity) - rarityRank(b.rarity)) * 0.35;
  const sameBonus =
    (a.bonusA?.stat === b.bonusA?.stat ? 0 : 1) +
    (a.bonusB?.stat === b.bonusB?.stat ? 0 : 1) +
    (a.bonusA?.stat === b.bonusB?.stat || a.bonusB?.stat === b.bonusA?.stat
      ? -0.4
      : 0);
  return spd + atk + hp + rar + sameBonus;
}

export function relatedHistory(copy, history) {
  const list = Array.isArray(history) ? history : [];
  return list
    .filter((h) => h.heroId === copy.heroId && h.outcome === "sold")
    .map((h) => ({ row: h, dist: statDistance(copy, h) }))
    .sort((a, b) => a.dist - b.dist);
}

export function failedTriesForHero(copy, bag, listings, history) {
  const pools = [...(bag || []), ...(listings || []), ...(history || [])];
  const tries = [];
  for (const row of pools) {
    if (row.heroId !== copy.heroId) continue;
    if (statDistance(copy, row) > 2.2) continue;
    for (const t of row.tries || []) tries.push(t);
  }
  return tries.sort((a, b) => b.price - a.price);
}

/**
 * Recommended list price from floor + history uplift − failed-try ceiling.
 */
export function suggestListPrice(copy, state, now = Date.now()) {
  const settings = state?.settings || defaultSettings();
  const floor = minListPrice(copy.buyPrice, settings);
  let suggested = floor;

  const related = relatedHistory(copy, state?.history).slice(0, 8);
  if (related.length && settings.autoBumpOnHistoryUplift !== false) {
    const uplifts = related
      .map(({ row }) => {
        if (!row.buyPrice || !row.soldPrice) return null;
        return row.soldPrice / row.buyPrice;
      })
      .filter((x) => Number.isFinite(x) && x > 0);
    if (uplifts.length) {
      const avg =
        uplifts.reduce((s, x) => s + x, 0) / Math.max(1, uplifts.length);
      const historyTarget = Math.ceil(copy.buyPrice * avg);
      // If past sales beat floor a lot, lean toward that market.
      suggested = Math.max(suggested, Math.round((floor + historyTarget) / 2));
      if (avg >= 1.45) suggested = Math.max(suggested, historyTarget);
    }
  }

  const fails = failedTriesForHero(
    copy,
    state?.bag,
    state?.listings,
    state?.history
  );
  if (fails.length) {
    const topFail = fails[0].price;
    if (topFail > floor) {
      suggested = Math.min(suggested, Math.max(floor, Math.floor(topFail * 0.94)));
    }
  }

  // Stale listing discount
  if (copy.stage === "listing" && copy.listedAt) {
    const listed = new Date(copy.listedAt).getTime();
    const auctionStart = listed + LIST_WARMUP_MS;
    if (now >= auctionStart + STALE_LIST_MS) {
      const disc = Math.max(0, Number(settings.staleDiscountPct) || 0) / 100;
      suggested = Math.max(floor, Math.floor(suggested * (1 - disc)));
    }
  }

  return {
    floor,
    suggested: Math.max(floor, suggested),
    related: related.slice(0, 5).map((r) => r.row),
    failedTries: fails.slice(0, 5),
  };
}

export function bagReadyAt(copy) {
  if (!copy?.boughtAt) return null;
  return new Date(copy.boughtAt).getTime() + BUY_COOLDOWN_MS;
}

export function listingPhases(copy, now = Date.now()) {
  if (!copy?.listedAt) {
    return { phase: "none", auctionEndsAt: null, warmupEndsAt: null };
  }
  const listed = new Date(copy.listedAt).getTime();
  const warmupEndsAt = listed + LIST_WARMUP_MS;
  const auctionEndsAt = listed + LIST_WARMUP_MS + LIST_AUCTION_MS;
  let phase = "warmup";
  if (now >= auctionEndsAt) phase = "ended";
  else if (now >= warmupEndsAt) phase = "auction";
  return { phase, warmupEndsAt, auctionEndsAt };
}

export function copyAlerts(copy, state, now = Date.now()) {
  const alerts = [];
  if (copy.stage === "bag") {
    const ready = bagReadyAt(copy);
    if (ready != null && now >= ready) {
      const tip = suggestListPrice(copy, state, now);
      alerts.push({
        type: "ready",
        tone: "good",
        text: `Ready to list · suggest ${formatSg(tip.suggested)} SG (min ${formatSg(tip.floor)})`,
      });
    } else if (ready != null) {
      alerts.push({
        type: "cooldown",
        tone: "muted",
        text: `Sell unlocks in ${formatDuration(ready - now)}`,
      });
    }
  }
  if (copy.stage === "listing") {
    const { phase, warmupEndsAt, auctionEndsAt } = listingPhases(copy, now);
    if (phase === "warmup") {
      alerts.push({
        type: "warmup",
        tone: "muted",
        text: `Listing warmup · bidding in ${formatDuration(warmupEndsAt - now)}`,
      });
    } else if (phase === "auction") {
      const left = auctionEndsAt - now;
      alerts.push({
        type: "auction",
        tone: left < 6 * 60 * 60 * 1000 ? "warn" : "good",
        text: `On auction · ${formatDuration(left)} left @ ${formatSg(copy.listPrice)} SG`,
      });
      const tip = suggestListPrice(copy, state, now);
      if (tip.suggested < copy.listPrice) {
        alerts.push({
          type: "lower",
          tone: "warn",
          text: `Sitting long — consider ${formatSg(tip.suggested)} SG`,
        });
      }
    } else if (phase === "ended") {
      alerts.push({
        type: "ended",
        tone: "warn",
        text: "Auction window ended — mark sold or X (failed try)",
      });
    }
  }
  return alerts;
}

export function boardAlerts(state, now = Date.now()) {
  const out = [];
  for (const copy of state.bag || []) {
    for (const a of copyAlerts(copy, state, now)) {
      if (a.type === "ready") out.push({ copy, ...a });
    }
  }
  for (const copy of state.listings || []) {
    for (const a of copyAlerts(copy, state, now)) {
      if (a.type === "lower" || a.type === "ended") out.push({ copy, ...a });
    }
  }
  return out;
}

export function auctionSummary(state) {
  const history = state.history || [];
  const sold = history.filter((h) => h.outcome === "sold");
  const spent = sold.reduce((s, h) => s + (h.buyPrice || 0), 0);
  const gross = sold.reduce((s, h) => s + (h.soldPrice || 0), 0);
  const net = sold.reduce((s, h) => s + netFromListPrice(h.soldPrice), 0);
  const profit = net - spent;
  const bagValue = (state.bag || []).reduce((s, h) => s + (h.buyPrice || 0), 0);
  const listedValue = (state.listings || []).reduce(
    (s, h) => s + (h.listPrice || 0),
    0
  );
  const holdMs = sold
    .map((h) => {
      if (!h.boughtAt || !h.soldAt) return null;
      return new Date(h.soldAt) - new Date(h.boughtAt);
    })
    .filter((x) => Number.isFinite(x) && x > 0);
  const avgHold =
    holdMs.length > 0
      ? holdMs.reduce((s, x) => s + x, 0) / holdMs.length
      : null;
  return {
    soldCount: sold.length,
    biddingCount: (state.biddings || []).length,
    bagCount: (state.bag || []).length,
    listingCount: (state.listings || []).length,
    spent,
    gross,
    net,
    profit,
    bagValue,
    listedValue,
    avgHoldMs: avgHold,
    avgUplift:
      sold.length && spent > 0
        ? ((gross / spent - 1) * 100)
        : null,
  };
}

export function addBidding(state, draft) {
  const copy = normalizeCopy(
    {
      ...draft,
      id: newId(),
      createdAt: nowIso(),
      buyPrice: 0,
    },
    "bidding"
  );
  if (!copy) return state;
  return {
    ...state,
    biddings: [copy, ...(state.biddings || [])],
  };
}

export function dismissBidding(state, id) {
  return {
    ...state,
    biddings: (state.biddings || []).filter((c) => c.id !== id),
  };
}

export function buyBidding(state, id, buyPrice, boughtAtIso) {
  const row = (state.biddings || []).find((c) => c.id === id);
  if (!row) return state;
  const bought = normalizeCopy(
    {
      ...row,
      buyPrice,
      boughtAt: boughtAtIso || nowIso(),
      stage: "bag",
    },
    "bag"
  );
  return {
    ...state,
    biddings: state.biddings.filter((c) => c.id !== id),
    bag: [bought, ...(state.bag || [])],
  };
}

export function listFromBag(state, id, listPrice, listedAtIso) {
  const row = (state.bag || []).find((c) => c.id === id);
  if (!row) return state;
  const ready = bagReadyAt(row);
  const when = listedAtIso ? new Date(listedAtIso).getTime() : Date.now();
  if (ready != null && when < ready) {
    // still allow override if user forces a past/future date that clears it
  }
  const listed = normalizeCopy(
    {
      ...row,
      listPrice,
      listedAt: listedAtIso || nowIso(),
      stage: "listing",
    },
    "listing"
  );
  return {
    ...state,
    bag: state.bag.filter((c) => c.id !== id),
    listings: [listed, ...(state.listings || [])],
  };
}

export function failListing(state, id) {
  const row = (state.listings || []).find((c) => c.id === id);
  if (!row) return state;
  const tries = [
    ...(row.tries || []),
    { price: row.listPrice, at: nowIso() },
  ];
  const back = normalizeCopy(
    {
      ...row,
      tries,
      listPrice: 0,
      listedAt: null,
      stage: "bag",
    },
    "bag"
  );
  return {
    ...state,
    listings: state.listings.filter((c) => c.id !== id),
    bag: [back, ...(state.bag || [])],
  };
}

export function sellListing(state, id, soldPrice, soldAtIso) {
  const row = (state.listings || []).find((c) => c.id === id);
  if (!row) return state;
  const sold = normalizeCopy(
    {
      ...row,
      soldPrice,
      soldAt: soldAtIso || nowIso(),
      outcome: "sold",
      stage: "history",
    },
    "history"
  );
  return {
    ...state,
    listings: state.listings.filter((c) => c.id !== id),
    history: [sold, ...(state.history || [])],
  };
}

export function discardBag(state, id) {
  const row = (state.bag || []).find((c) => c.id === id);
  if (!row) return state;
  const dead = normalizeCopy(
    {
      ...row,
      outcome: "discarded",
      soldAt: nowIso(),
      soldPrice: 0,
      stage: "history",
    },
    "history"
  );
  return {
    ...state,
    bag: state.bag.filter((c) => c.id !== id),
    history: [dead, ...(state.history || [])],
  };
}

export function patchSettings(state, partial) {
  return {
    ...state,
    settings: { ...defaultSettings(), ...state.settings, ...partial },
  };
}

export function copyTitle(copy) {
  const hero = auctionHeroOf(copy?.heroId);
  return `${hero?.name || "Hero"} · ${copy?.rarity || "?"}`;
}

export function formatBonuses(copy) {
  const parts = [];
  for (const b of [copy?.bonusA, copy?.bonusB]) {
    if (b?.stat && b.value) parts.push(`${b.stat} +${b.value}%`);
  }
  return parts.join(" · ") || "No % bonuses";
}

export function formatFlats(copy) {
  return `Spd ${formatSg(copy?.speed || 0)} · Atk ${formatSg(copy?.attack || 0)} · HP ${formatSg(copy?.hp || 0)}`;
}
