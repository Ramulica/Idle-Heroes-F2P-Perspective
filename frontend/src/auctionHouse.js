/**
 * Idle Heroes Auction House accounting:
 * biddings → bag (7d cooldown) → listing (6h cool + 2d auction) → history.
 * 5% sell commission. Pricing learns from sold / failed tries.
 * Copy ranks / % rolls reuse Stat Calculator awakening tables.
 */

import {
  AWAKENING_TIERS,
  awakeningSpeedChoices,
  awakeningSpeedRange,
  awakeningStatCount,
  awakeningStatPool,
  awakeningStatValue,
} from "./heroProgress";
import {
  defaultCatalogPreset,
  defaultHeroSetup,
  estimatedHammerNeed,
  flatPriorityScore,
  flatRankLabel,
  FLIP_STRATEGIES,
  normalizeCatalogPresets,
  normalizeHeroPref,
  normalizeHeroSetups,
  preferredMatchScore,
  setupFitScore,
  strategyOf,
} from "./auctionCatalog";

const FLIP_STRATEGY_IDS = new Set(FLIP_STRATEGIES.map((s) => s.id));
import starGemIcon from "./assets/auction/star-gem.png";
import hammerIcon from "./assets/auction/hammer.png";
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
export const HAMMER_ICON = hammerIcon;
export const STORAGE_KEY = "ih-auction-house";

export const SELL_COMMISSION = 0.05; // 5%
export const BUY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
export const LIST_WARMUP_MS = 6 * 60 * 60 * 1000;
export const LIST_AUCTION_MS = 2 * 24 * 60 * 60 * 1000;
export const STALE_LIST_MS = 36 * 60 * 60 * 1000; // suggest lower after ~1.5d in auction

/** Auction copy ranks: C−…SSS (same ids as awakening — no fake S−/SSS+). */
const AUCTION_RARITY_START = AWAKENING_TIERS.findIndex((r) => r.id === "C-");
const AUCTION_RARITY_END = AWAKENING_TIERS.findIndex((r) => r.id === "SSS");
export const AUCTION_RARITIES = AWAKENING_TIERS.slice(
  Math.max(0, AUCTION_RARITY_START),
  AUCTION_RARITY_END >= 0 ? AUCTION_RARITY_END + 1 : undefined
).map((r) => r.id);

export const AUCTION_RARITY_META = Object.fromEntries(
  AWAKENING_TIERS.filter((r) => AUCTION_RARITIES.includes(r.id)).map((r) => [
    r.id,
    r,
  ])
);

export {
  awakeningSpeedChoices,
  awakeningSpeedRange,
  awakeningStatCount,
  awakeningStatPool,
  awakeningStatValue,
};

export function auctionBonusSlots(rarity) {
  return awakeningStatCount(rarity);
}

export function auctionBonusPool(rarity) {
  return awakeningStatPool(rarity);
}

export function makeBonus(rarity, stat) {
  const name = String(stat || "").trim();
  if (!name) return { stat: "", value: 0, unit: "%" };
  const value = awakeningStatValue(rarity, name);
  return {
    stat: name,
    value: Number.isFinite(value) ? value : 0,
    unit: "%",
  };
}

export const AUCTION_HEROES = [
  { id: "vulcan", icon: vulcan, faction: "Light" },
  { id: "logan", icon: logan, faction: "Light" },
  { id: "hylas", icon: hylas, faction: "Light" },
  { id: "natalie", icon: natalie, faction: "Light" },
  { id: "geester", icon: geester, faction: "Light" },
  { id: "elena", icon: elena, faction: "Light" },
  { id: "fan", icon: fan, faction: "Light" },
  { id: "phorcys", icon: phorcys, faction: "Dark" },
  { id: "carrie", icon: carrie, faction: "Dark" },
  { id: "drake", icon: drake, faction: "Dark" },
  { id: "amen-ra", icon: amenRa, faction: "Dark" },
  { id: "aspen", icon: aspen, faction: "Dark" },
  { id: "mockman", icon: mockman, faction: "Dark" },
  { id: "aranea", icon: aranea, faction: "Dark" },
  { id: "vesa", icon: vesa, faction: "Forest" },
  { id: "starlight", icon: starlight, faction: "Forest" },
  { id: "freya", icon: freya, faction: "Forest" },
  { id: "rogge", icon: rogge, faction: "Forest" },
  { id: "elyvia", icon: elyvia, faction: "Forest" },
  { id: "flora", icon: flora, faction: "Forest" },
  { id: "cthugha", icon: cthugha, faction: "Abyss" },
  { id: "delacium", icon: delacium, faction: "Abyss" },
  { id: "morax", icon: morax, faction: "Abyss" },
  { id: "waldeck", icon: waldeck, faction: "Abyss" },
  { id: "natasha", icon: natasha, faction: "Abyss" },
  { id: "ignis", icon: ignis, faction: "Abyss" },
  { id: "holmes-young", icon: holmesYoung, faction: "Fortress" },
  { id: "penny", icon: penny, faction: "Fortress" },
  { id: "xia", icon: xia, faction: "Fortress" },
  { id: "sherlock", icon: sherlock, faction: "Fortress" },
  { id: "inosuke", icon: inosuke, faction: "Fortress" },
  { id: "valentino", icon: valentino, faction: "Fortress" },
  { id: "onikirimaru", icon: onikirimaru, faction: "Shadow" },
  { id: "eloise", icon: eloise, faction: "Shadow" },
  { id: "tix", icon: tix, faction: "Shadow" },
  { id: "jahra", icon: jahra, faction: "Shadow" },
  { id: "horus", icon: horus, faction: "Shadow" },
  { id: "annabelle", icon: annabelle, faction: "Shadow" },
  { id: "aylamak", icon: aylamak, faction: "Forest" },
  { id: "betty", icon: betty, faction: "Forest" },
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

/** mode: "days" → 6d 23h · "hours" → 167h 12m (total hours) */
export function formatDuration(ms, mode = "days") {
  if (!Number.isFinite(ms)) return "—";
  const abs = Math.abs(ms);
  const sign = ms < 0 ? "-" : "";
  const mins = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000));
  if (mode === "hours") {
    const totalHours = Math.floor(abs / (60 * 60 * 1000));
    if (totalHours > 0) return `${sign}${totalHours}h ${mins}m`;
    return `${sign}${mins}m`;
  }
  const days = Math.floor(abs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((abs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
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
    /** Active flip strategy — see auctionCatalog FLIP_STRATEGIES. */
    strategyId: "safe_bootstrap",
    /** Mature-phase target net margin after 5% commission (fallback / override). */
    minMarginPct: 15,
    /** Cold/building phase — safer flips while learning the market. */
    bootstrapMarginPct: 30,
    /** Switch from bootstrap → mature after this many sold of that hero. */
    bootstrapSales: 8,
    minProfitSg: 50,
    staleDiscountPct: 8,
    autoBumpOnHistoryUplift: true,
  };
}

function normalizeBonus(raw, rarity) {
  const stat = String(raw?.stat || "").trim();
  if (!stat) return { stat: "", value: 0, unit: "%" };
  const table = awakeningStatValue(rarity, stat);
  if (Number.isFinite(table)) {
    return { stat, value: table, unit: "%" };
  }
  const value = Number(raw?.value);
  return {
    stat,
    value: Number.isFinite(value) && value > 0 ? value : 0,
    unit: "%",
  };
}

function normalizeBonuses(raw, rarity, legacyA, legacyB) {
  const need = auctionBonusSlots(rarity);
  const pool = new Set(auctionBonusPool(rarity));
  let source = Array.isArray(raw) ? raw : null;
  if (!source) {
    source = [legacyA, legacyB].filter(Boolean);
  }
  const out = [];
  const seen = new Set();
  for (const row of source) {
    if (out.length >= need) break;
    const bonus = normalizeBonus(row, rarity);
    if (!bonus.stat || seen.has(bonus.stat)) continue;
    if (pool.size && !pool.has(bonus.stat)) continue;
    seen.add(bonus.stat);
    out.push(bonus);
  }
  while (out.length < need) out.push({ stat: "", value: 0, unit: "%" });
  return out;
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
  let rarity = AUCTION_RARITIES.includes(raw.rarity) ? raw.rarity : "A";
  // Drop invented S− / SS− / SSS± leftovers from older builds.
  if (!AUCTION_RARITIES.includes(rarity)) rarity = "A";
  const speedChoices = awakeningSpeedChoices(rarity);
  let speed = Math.max(0, Number(raw.speed) || 0);
  if (speedChoices.length) {
    if (!speedChoices.includes(speed)) {
      speed = speedChoices[0];
    }
  }
  const attack = Math.max(0, Number(raw.attack) || 0);
  const hp = Math.max(0, Number(raw.hp) || 0);
  const bonuses = normalizeBonuses(
    raw.bonuses,
    rarity,
    raw.bonusA,
    raw.bonusB
  );
  return { id: typeof raw.id === "string" && raw.id ? raw.id : newId(),
    stage,
    heroId,
    rarity,
    speed,
    attack,
    hp,
    bonuses,
    bonusA: bonuses[0] || { stat: "", value: 0, unit: "%" },
    bonusB: bonuses[1] || { stat: "", value: 0, unit: "%" },
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
    hammersUsed: Math.max(0, Math.round(Number(raw.hammersUsed) || 0)),
    // history
    soldPrice: Math.max(0, Number(raw.soldPrice) || 0),
    soldAt: typeof raw.soldAt === "string" ? raw.soldAt : null,
    outcome:
      raw.outcome === "sold" ||
      raw.outcome === "discarded" ||
      raw.outcome === "bid_failed"
        ? raw.outcome
        : stage === "history"
          ? "sold"
          : null,
    // bid-fail analysis snapshot (optional)
    failPrice: Math.max(0, Number(raw.failPrice) || 0),
    pushVerdict:
      raw.pushVerdict === "should_push" ||
      raw.pushVerdict === "good_stop" ||
      raw.pushVerdict === "borderline"
        ? raw.pushVerdict
        : null,
    counterfactualMarginPct: (() => {
      if (
        raw.counterfactualMarginPct == null ||
        raw.counterfactualMarginPct === ""
      ) {
        return null;
      }
      const n = Number(raw.counterfactualMarginPct);
      return Number.isFinite(n) ? n : null;
    })(),
    maxBidAtFail: Math.max(0, Number(raw.maxBidAtFail) || 0),
  };
}

export function defaultAuctionState() {
  return {
    settings: defaultSettings(),
    heroSetups: [],
    catalogPresets: [],
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
  settings.bootstrapMarginPct = Math.max(
    0,
    Number(settings.bootstrapMarginPct) || 30
  );
  settings.bootstrapSales = Math.max(
    1,
    Math.round(Number(settings.bootstrapSales) || 8)
  );
  settings.minProfitSg = Math.max(0, Number(settings.minProfitSg) || 0);
  settings.staleDiscountPct = Math.max(
    0,
    Number(settings.staleDiscountPct) || 0
  );
  const knownIds = AUCTION_HEROES.map((h) => h.id);
  if (!FLIP_STRATEGY_IDS.has(settings.strategyId)) {
    settings.strategyId = "safe_bootstrap";
  }
  // Sync visible margin knobs from strategy when user hasn't customized oddly —
  // keep stored values; strategy applies at evaluate time.
  return {
    settings,
    heroSetups: normalizeHeroSetups(raw.heroSetups, knownIds, raw.heroPrefs),
    catalogPresets: normalizeCatalogPresets(raw.catalogPresets),
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

export function emptyBiddingDraft(rarity = "A", heroId = null) {
  const tier = AUCTION_RARITIES.includes(rarity) ? rarity : "A";
  const need = auctionBonusSlots(tier);
  const speedChoices = awakeningSpeedChoices(tier);
  const hero =
    (heroId && auctionHeroOf(heroId) && heroId) || AUCTION_HEROES[0]?.id;
  return {
    heroId: hero,
    rarity: tier,
    speed: speedChoices[0] ?? "",
    attack: "",
    hp: "",
    bonuses: Array.from({ length: need }, () => ({
      stat: "",
      value: 0,
      unit: "%",
    })),
    note: "",
  };
}

/** First catalog-set-up hero id, or null. */
export function firstSetUpHeroId(state) {
  for (const hero of AUCTION_HEROES) {
    if (isHeroSetUp(state, hero.id)) return hero.id;
  }
  return null;
}

export function draftWithRarity(draft, rarity) {
  const next = emptyBiddingDraft(rarity);
  return {
    ...next,
    heroId: draft?.heroId || next.heroId,
    attack: draft?.attack ?? "",
    hp: draft?.hp ?? "",
    note: draft?.note || "",
  };
}

export function setDraftBonus(draft, index, stat) {
  const rarity = draft?.rarity || "A";
  const need = auctionBonusSlots(rarity);
  const bonuses = Array.from({ length: need }, (_, i) => {
    const cur = draft?.bonuses?.[i] || { stat: "", value: 0, unit: "%" };
    if (i !== index) return cur;
    return makeBonus(rarity, stat);
  });
  return { ...draft, bonuses };
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

export function auctionBonusList(copy) {
  if (Array.isArray(copy?.bonuses) && copy.bonuses.length) return copy.bonuses;
  return [copy?.bonusA, copy?.bonusB].filter(Boolean);
}

function bonusList(copy) {
  return auctionBonusList(copy);
}

/**
 * Similarity distance for pricing. Attack and % rolls dominate;
 * HP / Speed / rarity are weaker tie-breakers.
 */
function statDistance(a, b) {
  const atk =
    (Math.abs((a.attack || 0) - (b.attack || 0)) /
      Math.max(1, (a.attack || 0) + (b.attack || 0))) *
    16;
  const hp =
    (Math.abs((a.hp || 0) - (b.hp || 0)) /
      Math.max(1, (a.hp || 0) + (b.hp || 0))) *
    1.2;
  const spd = Math.abs((a.speed || 0) - (b.speed || 0)) / 90;
  const rar = Math.abs(rarityRank(a.rarity) - rarityRank(b.rarity)) * 0.2;

  const aBonuses = bonusList(a).filter((x) => x?.stat);
  const bBonuses = bonusList(b).filter((x) => x?.stat);
  const bByStat = Object.fromEntries(
    bBonuses.map((x) => [x.stat, Number(x.value) || 0])
  );
  const aNames = new Set(aBonuses.map((x) => x.stat));
  const bNames = new Set(bBonuses.map((x) => x.stat));

  let bonusDist = 0;
  for (const name of aNames) if (!bNames.has(name)) bonusDist += 1.35;
  for (const name of bNames) if (!aNames.has(name)) bonusDist += 1.35;
  for (const row of aBonuses) {
    if (bByStat[row.stat] == null) continue;
    bonusDist += Math.abs((Number(row.value) || 0) - bByStat[row.stat]) / 35;
  }
  bonusDist *= 2.8;

  return atk + bonusDist + hp + spd + rar;
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
    if (statDistance(copy, row) > 6.5) continue;
    for (const t of row.tries || []) tries.push(t);
  }
  return tries.sort((a, b) => b.price - a.price);
}

/**
 * Lost auctions — that copy sold/cleared at this buy price (who won is irrelevant).
 * Same-hero clears always count; distance only weights how hard they pull Suggest.
 */
export function lostBidsForHero(copy, history) {
  const list = Array.isArray(history) ? history : [];
  return list
    .filter(
      (h) =>
        h.heroId === copy?.heroId &&
        h.outcome === "bid_failed" &&
        (Number(h.failPrice) || Number(h.buyPrice) || 0) > 0
    )
    .map((h) => {
      const price = Math.max(
        0,
        Number(h.failPrice) || Number(h.buyPrice) || 0
      );
      return { row: h, price, dist: statDistance(copy, h) };
    })
    .sort((a, b) => a.dist - b.dist || b.price - a.price);
}

/**
 * Counterfactual: if you had bought at failPrice, was pushing worth it?
 */
export function bidFailAdvice(copy, failPrice, state, now = Date.now()) {
  const price = Math.max(0, Number(failPrice) || 0);
  const flip = evaluateFlip(copy, state, now);
  const expectSell = flip.suggestList;
  const expectNet =
    expectSell != null ? netFromListPrice(expectSell) : null;
  const marginIfBought =
    expectNet != null && price > 0
      ? ((expectNet - price) / price) * 100
      : null;
  const maxBid = flip.maxBid;
  const target = flip.targetMarginPct;

  let verdict = "borderline";
  let label = "Borderline";
  const reasons = [];

  if (!(price > 0)) {
    return {
      verdict: "borderline",
      label: "Enter fail price",
      maxBid,
      suggestBid: flip.suggestBid,
      expectSell,
      marginIfBought: null,
      targetMarginPct: target,
      reasons: ["Need the price the auction cleared at."],
      flip,
    };
  }

  if (maxBid != null && price <= maxBid) {
    if (marginIfBought == null || marginIfBought >= target - 3) {
      verdict = "should_push";
      label = "Should have pushed";
      reasons.push(
        `Fail ${formatSg(price)} was ≤ Max bid ${formatSg(maxBid)} — still inside plan.`
      );
    } else {
      verdict = "borderline";
      label = "Borderline";
      reasons.push(
        `Under Max bid, but expected margin ~${Math.round(marginIfBought)}% is thin vs ${target}%.`
      );
    }
  } else if (
    maxBid != null &&
    price <= maxBid * 1.1 &&
    marginIfBought != null &&
    marginIfBought >= 0
  ) {
    verdict = "borderline";
    label = "Borderline";
    reasons.push(
      `Slightly over Max bid (${formatSg(maxBid)}) but still ~${Math.round(marginIfBought)}% expected net.`
    );
  } else if (marginIfBought != null && marginIfBought >= target) {
    verdict = "should_push";
    label = "Should have pushed";
    reasons.push(
      `At ${formatSg(price)}, expected sell still clears ~${Math.round(marginIfBought)}% vs ${target}% target.`
    );
  } else {
    verdict = "good_stop";
    label = "Good to stop";
    if (maxBid != null) {
      reasons.push(
        `Fail ${formatSg(price)} above Max bid ${formatSg(maxBid)} — chasing would break the plan.`
      );
    }
    if (marginIfBought != null) {
      reasons.push(
        `Bought at fail price → ~${Math.round(marginIfBought)}% expected net (target ${target}%).`
      );
    }
  }

  if (expectSell != null) {
    reasons.push(
      `Treating fail as buy cost ${formatSg(price)} vs expect sell ${formatSg(expectSell)}.`
    );
  } else {
    reasons.push(
      "No strong sell comps yet — verdict leans on Max bid / catalog until history fills."
    );
  }

  return {
    verdict,
    label,
    maxBid,
    suggestBid: flip.suggestBid,
    expectSell,
    marginIfBought,
    targetMarginPct: target,
    reasons,
    flip,
  };
}

function weightedMean(pairs) {
  let sw = 0;
  let sv = 0;
  for (const p of pairs) {
    const w = Math.max(0, Number(p.weight) || 0);
    const v = Number(p.value);
    if (!Number.isFinite(v) || w <= 0) continue;
    sw += w;
    sv += v * w;
  }
  if (sw <= 0) return null;
  return sv / sw;
}

/** Soft attack baselines by awakening letter — used only as cold-start prior. */
const ATTACK_SOFT_BASE = {
  C: 4200,
  B: 5200,
  A: 6200,
  S: 7200,
  SS: 8200,
  SSS: 9200,
};

function rarityLetter(rarity) {
  const id = String(rarity || "");
  if (id.startsWith("SSS")) return "SSS";
  if (id.startsWith("SS")) return "SS";
  if (id.startsWith("S")) return "S";
  if (id.startsWith("A")) return "A";
  if (id.startsWith("B")) return "B";
  return "C";
}

/**
 * Intrinsic flip desirability of a % roll (market / offense bias).
 * Catalog preferredMatch still overlays on top when setups exist.
 */
const STAT_MARKET_WEIGHT = {
  "Giant Killer": 1.08,
  Defier: 1.08,
  Precision: 1.0,
  "Holy Damage": 1.0,
  "Skill Damage": 0.96,
  "Armor Break": 0.95,
  "Crit Damage": 0.92,
  Crit: 0.86,
  "Control Precision": 0.72,
  "Damage Reduction": 0.68,
  "Control Immunity": 0.64,
  "Control Immunity Offset": 0.66,
  Block: 0.58,
  Armor: 0.55,
  "Holy Armor": 0.7,
  "Faction Rule": 0.72,
  "Divine Block": 0.6,
  "Heal Effect": 0.48,
  "Effect of Being Healed": 0.42,
  "Crit Damage Reduction": 0.5,
  "Reduces Dot Received": 0.45,
};

function statMarketWeight(stat) {
  return STAT_MARKET_WEIGHT[stat] ?? 0.62;
}

/**
 * 0..1 quality prior from Attack + % rolls, catalog prefs, and strategy.
 * Offense / high-value % outweigh defensive junk even before catalog prefs.
 */
export function copyQualityScore(copy, state = null) {
  const letter = rarityLetter(copy?.rarity);
  const base = ATTACK_SOFT_BASE[letter] || 5000;
  const atk = Math.max(0, Number(copy?.attack) || 0);
  const hp = Math.max(0, Number(copy?.hp) || 0);
  const spd = Math.max(0, Number(copy?.speed) || 0);
  // Soft caps for B-tier-ish flats so A- Attack on a B+ pulls ahead of mid B+ Attack.
  const atkScore = Math.max(0, Math.min(1.2, atk / Math.max(1, base)));
  const hpScore = Math.max(0, Math.min(1.1, hp / Math.max(1, base * 0.92)));
  const spdScore = Math.max(0, Math.min(1.15, spd / 55));
  const flatScore = atkScore * 0.72 + hpScore * 0.14 + spdScore * 0.14;

  const bonuses = bonusList(copy).filter((b) => b?.stat);
  const need = Math.max(1, auctionBonusSlots(copy?.rarity));
  const filled = bonuses.filter((b) => (Number(b.value) || 0) > 0);
  const fill = Math.min(1, filled.length / need);
  // Market weight scales the score itself (Holy/Prec >> CI/CDR), not only the average.
  let rollScore = 0;
  let slots = 0;
  for (const b of bonuses) {
    const w = statMarketWeight(b.stat);
    const val = Number(b.value) || 0;
    if (val <= 0) {
      rollScore += 0.12 * w;
      slots += 1;
      continue;
    }
    const table = awakeningStatValue(copy?.rarity, b.stat);
    const fillPct =
      Number.isFinite(table) && table > 0 ? Math.min(1.05, val / table) : 0.85;
    rollScore += fillPct * w;
    slots += 1;
  }
  rollScore = slots > 0 ? rollScore / slots : 0.22;

  const rarBoost = Math.min(1, rarityRank(copy?.rarity) / 20);
  // % rolls decide most of the flip value; Attack is important but secondary.
  let raw = rollScore * 0.52 + flatScore * 0.34 + rarBoost * 0.08 + fill * 0.06;

  // Catalog prefs only blend when this hero is actually set up — otherwise
  // empty prefs compress every copy toward 0.5 and hide real roll quality.
  if (state && isHeroSetUp(state, copy?.heroId)) {
    const pref = bestHeroSetup(state, copy);
    const strat = strategyOf(state.settings);
    const prefW = Math.max(0, Math.min(0.7, Number(strat.prefWeight) || 0.35));
    const match = preferredMatchScore(copy, pref);
    const flat = flatPriorityScore(copy, pref);
    const imp = Math.max(1, Math.min(10, pref.importance)) / 10;
    raw =
      raw * (1 - prefW) + (match * 0.55 + flat * 0.25 + imp * 0.2) * prefW;
  }

  return Math.max(0, Math.min(1, raw / 1.05));
}

/**
 * Value this copy vs other same-hero / same-rarity copies already in bag+listings.
 * Stops “cheap snipes” of better rolls from suggesting below worse copies you overpaid for.
 */
export function bagPeerAnchors(copy, state = null) {
  const pools = [...(state?.bag || []), ...(state?.listings || [])];
  const selfId = copy?.id;
  const heroId = copy?.heroId;
  const rarity = copy?.rarity;
  if (!heroId || !rarity) return null;

  const peers = pools.filter(
    (p) =>
      p &&
      p.heroId === heroId &&
      p.rarity === rarity &&
      (Number(p.buyPrice) || 0) > 0
  );
  if (peers.length < 2) return null;

  const selfQ = Math.max(0.18, copyQualityScore(copy, state));
  const implied = [];
  for (const peer of peers) {
    if (selfId && peer.id === selfId) continue;
    const pq = Math.max(0.18, copyQualityScore(peer, state));
    const pBuy = Number(peer.buyPrice) || 0;
    const value = pBuy * (selfQ / pq);
    implied.push({
      peer,
      peerBuy: pBuy,
      peerQ: pq,
      impliedBuy: value,
      betterThanPeer: selfQ > pq * 1.03,
      worseThanPeer: selfQ < pq * 0.97,
    });
  }
  if (!implied.length) return null;

  const sorted = [...implied].map((x) => x.impliedBuy).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const fromWorse = implied
    .filter((x) => x.betterThanPeer)
    .map((x) => x.impliedBuy);
  // If this copy clearly beats bag peers, never price below what those peers imply.
  const peerBuy = fromWorse.length
    ? Math.max(median, Math.max(...fromWorse))
    : median;

  const beat = implied.filter((x) => x.betterThanPeer);
  const topBeat = beat.sort((a, b) => b.peerBuy - a.peerBuy)[0] || null;

  return {
    peerBuy: Math.round(peerBuy),
    selfQ,
    median: Math.round(median),
    beatCount: beat.length,
    peerCount: implied.length,
    topBeat,
  };
}

export function flipMarketPhase(copy, state) {
  const settings = { ...defaultSettings(), ...(state?.settings || {}) };
  const hist = Array.isArray(state?.history) ? state.history : [];
  let n = 0;
  for (const h of hist) {
    if (h.heroId !== copy?.heroId) continue;
    if (h.outcome === "sold") n += 1;
    else if (
      h.outcome === "bid_failed" &&
      (Number(h.failPrice) || Number(h.buyPrice) || 0) > 0
    ) {
      // Clear = market paid that price for that copy — counts as market data.
      n += 1;
    }
  }
  const gate = Math.max(1, Number(settings.bootstrapSales) || 8);
  if (n < Math.max(3, Math.ceil(gate * 0.4))) return "cold";
  if (n < gate) return "building";
  return "mature";
}

export function targetMarginPctFor(copy, state) {
  const settings = { ...defaultSettings(), ...(state?.settings || {}) };
  const strat = strategyOf(settings);
  const phase = flipMarketPhase(copy, state);
  if (phase === "cold" || phase === "building") {
    return Math.max(
      0,
      Number(strat.marginCold) ||
        Number(settings.bootstrapMarginPct) ||
        30
    );
  }
  return Math.max(
    0,
    Number(strat.marginMature) || Number(settings.minMarginPct) || 15
  );
}

export function heroSetupsOf(state, heroId = null) {
  const list = Array.isArray(state?.heroSetups) ? state.heroSetups : [];
  if (!heroId) return list;
  return list.filter((s) => s.heroId === heroId);
}

/** Best catalog setup for a hero/copy (Damage vs Support stay separate). */
export function bestHeroSetup(state, copyOrHeroId) {
  const heroId =
    typeof copyOrHeroId === "string"
      ? copyOrHeroId
      : copyOrHeroId?.heroId || null;
  const setups = heroSetupsOf(state, heroId);
  if (!setups.length) return normalizeHeroPref(null, heroId);
  if (setups.length === 1 || typeof copyOrHeroId === "string") {
    return normalizeHeroPref(
      [...setups].sort((a, b) => b.importance - a.importance)[0],
      heroId
    );
  }
  let best = setups[0];
  let bestScore = -1;
  for (const setup of setups) {
    const score = setupFitScore(copyOrHeroId, setup);
    if (score > bestScore) {
      bestScore = score;
      best = setup;
    }
  }
  return normalizeHeroPref(best, heroId);
}

export function heroPrefOf(state, heroId) {
  return bestHeroSetup(state, heroId);
}

/** True once the user saved at least one catalog setup for this hero. */
export function isHeroSetUp(state, heroId) {
  return heroSetupsOf(state, heroId).length > 0;
}

export function partitionAuctionHeroes(state) {
  const setUp = [];
  const notSetUp = [];
  for (const hero of AUCTION_HEROES) {
    if (isHeroSetUp(state, hero.id)) setUp.push(hero);
    else notSetUp.push(hero);
  }
  return { setUp, notSetUp };
}

export function hasAuctionProgress(state) {
  if (!state || typeof state !== "object") return false;
  if (Array.isArray(state.heroSetups) && state.heroSetups.length) return true;
  if (state.heroPrefs && Object.keys(state.heroPrefs).length) return true;
  if (Array.isArray(state.catalogPresets) && state.catalogPresets.length) {
    return true;
  }
  for (const key of ["biddings", "bag", "listings", "history"]) {
    if (Array.isArray(state[key]) && state[key].length) return true;
  }
  return false;
}

export function upsertHeroSetup(state, partial) {
  const setup = defaultHeroSetup(partial);
  if (!setup.heroId) return state;
  const list = [...(state.heroSetups || [])];
  const idx = list.findIndex((s) => s.id === setup.id);
  if (idx >= 0) list[idx] = setup;
  else list.push(setup);
  return { ...state, heroSetups: list };
}

export function deleteHeroSetup(state, setupId) {
  return {
    ...state,
    heroSetups: (state.heroSetups || []).filter((s) => s.id !== setupId),
  };
}

export function saveCatalogPreset(state, partial) {
  const list = [...(state.catalogPresets || [])];
  let preset = defaultCatalogPreset(partial);
  const byId = list.findIndex((p) => p.id === preset.id);
  if (byId >= 0) {
    list[byId] = preset;
  } else {
    const byName = list.findIndex(
      (p) => p.name.toLowerCase() === preset.name.toLowerCase()
    );
    if (byName >= 0) {
      preset = { ...preset, id: list[byName].id };
      list[byName] = preset;
    } else {
      list.push(preset);
    }
  }
  return { state: { ...state, catalogPresets: list }, preset };
}

export function deleteCatalogPreset(state, presetId) {
  return {
    ...state,
    catalogPresets: (state.catalogPresets || []).filter(
      (p) => p.id !== presetId
    ),
  };
}

function sellDifficultyFrom(related, fails) {
  const sold = related.length;
  const failN = fails.length;
  const holds = related
    .map(({ row }) => {
      if (!row.boughtAt || !row.soldAt) return null;
      return new Date(row.soldAt) - new Date(row.boughtAt);
    })
    .filter((x) => Number.isFinite(x) && x > 0);
  const avgHold =
    holds.length > 0
      ? holds.reduce((s, x) => s + x, 0) / holds.length
      : null;
  const failRatio = failN / Math.max(1, sold + failN);
  if (failRatio >= 0.45 || (avgHold != null && avgHold > 12 * 24 * 3600 * 1000)) {
    return "hard";
  }
  if (failRatio <= 0.15 && (avgHold == null || avgHold < 9 * 24 * 3600 * 1000)) {
    return "easy";
  }
  return "normal";
}

/**
 * Full flip advice: max bid, suggest bid/list, grade, difficulty.
 * Attack + % similarity drive comps; failed tries cap sell; bootstrap
 * margin protects early history building.
 */
export function evaluateFlip(copy, state, now = Date.now()) {
  const settings = { ...defaultSettings(), ...(state?.settings || {}) };
  const strat = strategyOf(settings);
  const pref = bestHeroSetup(state, copy);
  const phase = flipMarketPhase(copy, state);
  const targetMarginPct = targetMarginPctFor(copy, state);
  const quality = copyQualityScore(copy, state);
  const prefMatch = preferredMatchScore(copy, pref);
  const flatFit = flatPriorityScore(copy, pref);
  const hammerNeed = estimatedHammerNeed(copy, pref);
  const importance = pref.importance;

  const relatedAll = relatedHistory(copy, state?.history);
  const related = relatedAll.filter((r) => r.dist <= 9).slice(0, 14);
  const close = related.filter((r) => r.dist <= 3.8);
  const samples = close.length || related.length;

  const fails = failedTriesForHero(
    copy,
    state?.bag,
    state?.listings,
    state?.history
  );
  const lostBids = lostBidsForHero(copy, state?.history);
  const difficulty = sellDifficultyFrom(related, fails);
  const twinLost = lostBids.filter((x) => x.dist <= 2.2);
  const closeLost = lostBids.filter((x) => x.dist <= 3.8);
  // Market events: your solds + any clear (someone bought that copy at that price).
  const marketSamples = samples + lostBids.length;

  let expectedSell = null;
  if (related.length) {
    const pool = (close.length >= 2 ? close : related).map(({ row, dist }) => ({
      value: row.soldPrice,
      weight: 1 / (1 + dist * dist),
    }));
    const mean = weightedMean(pool);
    if (mean != null) expectedSell = Math.round(mean);
  }

  // Bid-failed clear = that copy sold at failPrice. Feeds list + Max/Suggest.
  if (lostBids.length) {
    const pool = (
      twinLost.length
        ? twinLost
        : closeLost.length
          ? closeLost
          : lostBids.slice(0, 8)
    ).map(({ price, dist }) => ({
      value: price,
      // Same flats/% weigh hardest; distant same-hero clears still anchor the market.
      weight:
        (1 / (1 + dist * dist)) *
        (dist <= 2.2 ? 2.6 : dist <= 3.8 ? 1.4 : 0.55),
    }));
    const meanBuy = weightedMean(pool);
    if (meanBuy != null && meanBuy > 0) {
      const impliedList = Math.ceil(
        (meanBuy * (1 + targetMarginPct / 100)) / (1 - SELL_COMMISSION)
      );
      if (expectedSell == null) {
        // Only clears: list so a rebuy at ~clear still hits strategy margin after 5%.
        expectedSell = impliedList;
      } else if (twinLost.length) {
        expectedSell = Math.round(expectedSell * 0.3 + impliedList * 0.7);
      } else if (closeLost.length) {
        expectedSell = Math.round(expectedSell * 0.5 + impliedList * 0.5);
      } else {
        expectedSell = Math.round(expectedSell * 0.7 + impliedList * 0.3);
      }
    }
  }

  if (fails.length && expectedSell != null) {
    const cap = Math.floor(fails[0].price * 0.94);
    if (cap > 0) expectedSell = Math.min(expectedSell, cap);
  } else if (fails.length && expectedSell == null && fails[0].price > 0) {
    // Only know what did NOT sell — treat as soft ceiling, not a market.
    expectedSell = Math.floor(fails[0].price * 0.9);
  }

  // Already owned: never suggest below margin floor on your buy.
  const buy = Math.max(0, Number(copy?.buyPrice) || 0);
  const floor =
    buy > 0
      ? minListPrice(buy, {
          ...settings,
          pricingMode: "margin",
          minMarginPct: targetMarginPct,
        })
      : 0;

  if (buy > 0 && settings.autoBumpOnHistoryUplift !== false && related.length) {
    const uplifts = related
      .map(({ row }) =>
        row.buyPrice > 0 && row.soldPrice > 0
          ? row.soldPrice / row.buyPrice
          : null
      )
      .filter((x) => Number.isFinite(x) && x > 0);
    if (uplifts.length) {
      const avg = uplifts.reduce((s, x) => s + x, 0) / uplifts.length;
      const historyTarget = Math.ceil(buy * avg);
      if (expectedSell == null) expectedSell = historyTarget;
      else expectedSell = Math.round((expectedSell + historyTarget) / 2);
      if (avg >= 1.45) expectedSell = Math.max(expectedSell, historyTarget);
    }
  }

  // Bag peers: price by quality vs what you already paid for same hero/rarity.
  // Cheap snipes of better Attack/% must not suggest under worse expensive copies.
  const peerAnchor = bagPeerAnchors(copy, state);
  let peerList = null;
  if (peerAnchor?.peerBuy > 0) {
    peerList = minListPrice(peerAnchor.peerBuy, {
      ...settings,
      pricingMode: "margin",
      minMarginPct: targetMarginPct,
    });
    if (expectedSell == null) expectedSell = peerList;
    else expectedSell = Math.max(expectedSell, peerList);
  }

  let suggestList = expectedSell;
  if (buy > 0) {
    suggestList = Math.max(floor, suggestList || floor);
  }

  if (copy?.stage === "listing" && copy.listedAt && suggestList != null) {
    const listed = new Date(copy.listedAt).getTime();
    const auctionStart = listed + LIST_WARMUP_MS;
    if (now >= auctionStart + STALE_LIST_MS) {
      const disc = Math.max(0, Number(settings.staleDiscountPct) || 0) / 100;
      suggestList = Math.max(floor, Math.floor(suggestList * (1 - disc)));
    }
  }

  const confidence = Math.min(
    1,
    ((samples + Math.min(6, lostBids.length) * 0.85) / 8) *
      (close.length || closeLost.length || twinLost.length
        ? 1
        : lostBids.length
          ? 0.72
          : 0.55) *
      (phase === "cold" ? 0.75 : 1)
  );

  let maxBid = null;
  let suggestBid = null;
  if (suggestList != null && suggestList > 0) {
    const net = netFromListPrice(suggestList);
    maxBid = Math.floor(net / (1 + targetMarginPct / 100));
    const phaseCut = phase === "cold" ? 0.8 : phase === "building" ? 0.88 : 0.94;
    const hardCut = difficulty === "hard" ? 0.9 : difficulty === "easy" ? 1.02 : 1;
    const qCut = 0.88 + quality * 0.14;
    const stratCut = Math.max(0.7, Math.min(1, Number(strat.bidHaircut) || 0.85));
    const prefCut = 0.9 + prefMatch * 0.12;
    const hammerCut =
      hammerNeed <= 0.4
        ? 1
        : hammerNeed > strat.hammerTolerance * 6
          ? 0.72
          : 1 - Math.min(0.22, hammerNeed * 0.06);
    suggestBid = Math.max(
      0,
      Math.floor(
        maxBid *
          phaseCut *
          hardCut *
          qCut *
          stratCut *
          prefCut *
          hammerCut *
          (0.82 + 0.18 * confidence)
      )
    );
    // Clears = market paid this for those (or nearby) stats — anchor bids to them.
    if (lostBids.length) {
      const hotPool = (
        twinLost.length ? twinLost : closeLost.length ? closeLost : lostBids
      ).slice(0, 5);
      const hot = hotPool.reduce((s, x) => s + x.price, 0) / hotPool.length;
      if (Number.isFinite(hot) && hot > 0) {
        const floorMul = twinLost.length
          ? 0.97
          : closeLost.length
            ? 0.93
            : 0.85; // distant same-hero clear still floors Suggest
        const floorBid = Math.floor(hot * floorMul);
        if (suggestBid < floorBid) {
          suggestBid = Math.min(maxBid, Math.max(suggestBid, floorBid));
        }
        // Only clears, no solds: Max should at least respect the last clear.
        if (samples === 0 && twinLost.length) {
          maxBid = Math.max(maxBid, Math.floor(hot));
          suggestBid = Math.min(maxBid, Math.max(suggestBid, floorBid));
        } else if (samples === 0 && lostBids.length) {
          maxBid = Math.max(maxBid, Math.floor(hot * 0.98));
          suggestBid = Math.min(maxBid, Math.max(suggestBid, floorBid));
        }
      }
    }
    if (maxBid > 0) suggestBid = Math.min(suggestBid, maxBid);
  }

  const bidForEdge = buy > 0 ? buy : suggestBid;
  let expectedNet = suggestList != null ? netFromListPrice(suggestList) : null;
  let expectedMarginPct = null;
  if (expectedNet != null && bidForEdge > 0) {
    expectedMarginPct = ((expectedNet - bidForEdge) / bidForEdge) * 100;
  }

  const reasons = [];
  reasons.push(`Strategy · ${strat.name}`);
  if (phase === "cold") {
    reasons.push(
      `Cold market — ${targetMarginPct}% ${strat.name} margin`
    );
  } else if (phase === "building") {
    reasons.push(`Building history — ${targetMarginPct}% margin`);
  } else {
    reasons.push(`Mature market — ${targetMarginPct}% margin`);
  }
  reasons.push(
    `Catalog · ${pref.name || "setup"} · Imp ${importance}/10 · pref ${Math.round(prefMatch * 100)}% · flats ${flatRankLabel(pref.flatRank)}`
  );
  if (marketSamples === 0) {
    reasons.push("No solds or clears yet — grade leans on catalog + Attack/%");
  } else {
    reasons.push(
      `${samples} sold · ${lostBids.length} clear${
        lostBids.length === 1 ? "" : "s"
      } · ${close.length} close sold · sell looks ${difficulty}`
    );
  }
  if (fails.length) {
    reasons.push(`Failed list ceiling near ${formatSg(fails[0].price)} SG`);
  }
  if (lostBids.length) {
    const top = lostBids[0];
    const pushN = lostBids.filter(
      (x) => x.row.pushVerdict === "should_push"
    ).length;
    reasons.push(
      `Market cleared near ${formatSg(top.price)} SG for ${
        top.dist <= 2.2 ? "near-identical" : top.dist <= 3.8 ? "similar" : "this hero"
      } stats${pushN ? ` · ${pushN} “should have pushed”` : ""}`
    );
  }
  if (hammerNeed >= 1) {
    reasons.push(
      `Hammer pressure ~${hammerNeed.toFixed(1)} (scarce — ${strat.name} tolerance ${(strat.hammerTolerance * 100).toFixed(0)}%)`
    );
  }
  if (quality >= 0.78) reasons.push("Strong Attack / % / catalog fit");
  else if (quality <= 0.42) reasons.push("Weak Attack / % / catalog fit");
  if (peerAnchor?.beatCount) {
    const beat = peerAnchor.topBeat;
    reasons.push(
      `Bag peer · better than ${peerAnchor.beatCount} same ${copy?.rarity || "tier"} copy${
        peerAnchor.beatCount === 1 ? "" : "ies"
      }${
        beat
          ? ` (e.g. bought ${formatSg(beat.peerBuy)} @ Q${beat.peerQ.toFixed(2)})`
          : ""
      } → quality-anchored list ${formatSg(peerList)}`
    );
  } else if (peerAnchor?.peerCount) {
    reasons.push(
      `Bag peer · ${peerAnchor.peerCount} same-rarity comps → quality-anchored ${formatSg(peerList)}`
    );
  }

  // Grade
  let grade = "skip";
  let label = "Skip";
  let tone = "muted";
  const belowImportance = importance < (strat.importanceMin || 1);
  const hammerBlocked = hammerNeed > strat.hammerTolerance * 8;
  const qualityOk = quality >= (strat.qualityFloor || 0.4);

  if (belowImportance && strat.id !== "volume_grinder") {
    grade = "skip";
    label = "Low priority hero";
    tone = "muted";
    reasons.push(
      `Importance ${importance} below ${strat.name} floor (${strat.importanceMin})`
    );
  } else if (hammerBlocked && importance < 8) {
    grade = "skip";
    label = "Needs too many hammers";
    tone = "muted";
  } else if (marketSamples === 0) {
    if (quality >= 0.8 && qualityOk && !belowImportance) {
      grade = "ok";
      label = "Speculative";
      tone = "warn";
    } else {
      grade = "skip";
      label = "No data";
      tone = "muted";
    }
  } else if (
    expectedMarginPct != null &&
    expectedMarginPct >= targetMarginPct + 8 &&
    confidence >= 0.45 &&
    difficulty !== "hard" &&
    qualityOk &&
    prefMatch >= 0.35
  ) {
    grade = "strong";
    label = samples === 0 ? "Strong (from clears)" : "Strong buy";
    tone = "good";
  } else if (
    expectedMarginPct != null &&
    expectedMarginPct >= targetMarginPct &&
    confidence >= 0.3 &&
    qualityOk
  ) {
    grade = "buy";
    label = samples === 0 ? "Buy (from clears)" : "Buy";
    tone = "good";
  } else if (
    expectedMarginPct != null &&
    expectedMarginPct >= targetMarginPct - 6
  ) {
    grade = "ok";
    label = samples === 0 ? "Thin (from clears)" : "Thin";
    tone = "warn";
  } else if (samples === 0 && lostBids.length > 0 && suggestBid != null) {
    // Have clear price(s) even if margin looks tight — still not "No data".
    grade = "ok";
    label = "Priced from clears";
    tone = "warn";
  } else {
    grade = "skip";
    label = "Skip";
    tone = "muted";
  }

  if (difficulty === "hard" && grade === "strong") {
    grade = "buy";
    label = "Buy (hard sell)";
  }
  if (prefMatch >= 0.85 && importance >= 8 && grade === "buy") {
    grade = "strong";
    label = "Strong buy (meta)";
  }

  return {
    phase,
    strategyId: strat.id,
    strategyName: strat.name,
    targetMarginPct,
    quality,
    prefMatch,
    flatFit,
    importance,
    hammerNeed,
    confidence,
    difficulty,
    grade,
    label,
    tone,
    samples,
    marketSamples,
    lostBidCount: lostBids.length,
    closeSamples: close.length,
    expectedSell: suggestList,
    maxBid,
    suggestBid,
    suggestList,
    floor,
    peerList,
    peerAnchor,
    expectedNet,
    expectedMarginPct,
    reasons,
    related: related.slice(0, 5).map((r) => r.row),
    failedTries: fails.slice(0, 5),
    lostBids: lostBids.slice(0, 5).map((x) => ({
      price: x.price,
      dist: x.dist,
      pushVerdict: x.row.pushVerdict,
      at: x.row.soldAt || x.row.boughtAt,
    })),
  };
}

/**
 * Recommended list price from floor + history uplift − failed-try ceiling.
 */
export function suggestListPrice(copy, state, now = Date.now()) {
  const flip = evaluateFlip(copy, state, now);
  const floor = flip.floor || minListPrice(copy.buyPrice, state?.settings);
  const suggested = Math.max(floor, flip.suggestList || floor);
  return {
    floor,
    suggested,
    related: flip.related,
    failedTries: flip.failedTries,
    flip,
  };
}

/** Active strategy plan (+ shared history bootstrap notes). */
export function flipBootstrapPlan(settings) {
  const s = { ...defaultSettings(), ...(settings || {}) };
  const strat = strategyOf(s);
  return [
    ...strat.plan,
    `History phases still apply: cold → building (until ${s.bootstrapSales} sold/hero) → mature. Log Sold, Bid failed, and failed lists every time.`,
    "Bid failed: enter the clear price — calculator treats it as a buy-cost counterfactual (should you have pushed?) and feeds lost-bid comps into Max/Suggest.",
    "Catalog: set each hero’s preferred % order, flat priority (Attack/HP/Speed), and importance 1–10 — strategies read those.",
    "Hammers are scarce: prefer copies that already match prefs. Only Meta Sniper leans on hammers for importance 8+ near-misses.",
  ];
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
        remainingMs: ready - now,
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

export function auctionSummary(state, now = Date.now()) {
  const history = state.history || [];
  const sold = history.filter((h) => h.outcome === "sold");
  const spent = sold.reduce((s, h) => s + (h.buyPrice || 0), 0);
  const gross = sold.reduce((s, h) => s + (h.soldPrice || 0), 0);
  const net = sold.reduce((s, h) => s + netFromListPrice(h.soldPrice), 0);
  const profit = net - spent;
  const bag = state.bag || [];
  const listings = state.listings || [];
  const bagValue = bag.reduce((s, h) => s + (h.buyPrice || 0), 0);
  const listedBuyCost = listings.reduce((s, h) => s + (h.buyPrice || 0), 0);
  const listedValue = listings.reduce((s, h) => s + (h.listPrice || 0), 0);
  const inventoryCost = bagValue + listedBuyCost;
  const inventory = [...bag, ...listings];
  const expectSuggest = inventory.reduce((sum, copy) => {
    const tip = suggestListPrice(copy, state, now);
    return sum + (Number(tip.suggested) || 0);
  }, 0);
  const expectSuggestNet = netFromListPrice(expectSuggest);
  const expectProfit = expectSuggestNet - inventoryCost;
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
  const hammerSum = (rows) =>
    (rows || []).reduce(
      (s, h) => s + (Math.max(0, Number(h.hammersUsed) || 0)),
      0
    );
  const hammersActual = hammerSum(sold);
  const hammersOpen = hammerSum(bag) + hammerSum(listings);
  const hammersUsed = hammersActual + hammersOpen + hammerSum(history.filter((h) => h.outcome !== "sold"));

  return {
    soldCount: sold.length,
    biddingCount: (state.biddings || []).length,
    bagCount: bag.length,
    listingCount: listings.length,
    spent,
    gross,
    net,
    profit,
    bagValue,
    listedBuyCost,
    listedValue,
    inventoryCost,
    expectSuggest,
    expectSuggestNet,
    expectProfit,
    hammersUsed,
    hammersActual,
    hammersOpen,
    avgHoldMs: avgHold,
    avgUplift:
      sold.length && spent > 0
        ? ((gross / spent - 1) * 100)
        : null,
  };
}

export function copyToDraft(copy) {
  const rarity = AUCTION_RARITIES.includes(copy?.rarity) ? copy.rarity : "A";
  const need = auctionBonusSlots(rarity);
  const existing = auctionBonusList(copy);
  const speedChoices = awakeningSpeedChoices(rarity);
  const speed = Number(copy?.speed);
  return {
    heroId: auctionHeroOf(copy?.heroId) ? copy.heroId : AUCTION_HEROES[0].id,
    rarity,
    speed: speedChoices.includes(speed) ? speed : speedChoices[0] ?? "",
    attack: copy?.attack ?? "",
    hp: copy?.hp ?? "",
    bonuses: Array.from({ length: need }, (_, i) => {
      const cur = existing[i];
      if (cur?.stat) return makeBonus(rarity, cur.stat);
      return { stat: "", value: 0, unit: "%" };
    }),
    note: typeof copy?.note === "string" ? copy.note : "",
    boughtAt: typeof copy?.boughtAt === "string" ? copy.boughtAt : null,
    hammersUsed: Math.max(0, Math.round(Number(copy?.hammersUsed) || 0)),
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

export function updateBidding(state, id, draft) {
  return updateCopyFields(state, "biddings", id, draft, "bidding");
}

export function updateBagCopy(state, id, draft) {
  return updateCopyFields(state, "bag", id, draft, "bag");
}

export function updateListingCopy(state, id, draft) {
  return updateCopyFields(state, "listings", id, draft, "listing");
}

function updateCopyFields(state, key, id, draft, stage) {
  const list = state[key] || [];
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return state;
  const prev = list[idx];
  const next = normalizeCopy(
    {
      ...prev,
      ...draft,
      id: prev.id,
      createdAt: prev.createdAt,
      buyPrice: prev.buyPrice,
      boughtAt:
        draft?.boughtAt !== undefined ? draft.boughtAt : prev.boughtAt,
      listPrice: prev.listPrice,
      listedAt: prev.listedAt,
      tries: prev.tries,
      hammersUsed:
        draft?.hammersUsed != null ? draft.hammersUsed : prev.hammersUsed,
      soldPrice: prev.soldPrice,
      soldAt: prev.soldAt,
      outcome: prev.outcome,
    },
    stage
  );
  if (!next) return state;
  const out = [...list];
  out[idx] = next;
  return { ...state, [key]: out };
}

export function setHammersUsed(state, id, value) {
  const n = Math.max(0, Math.round(Number(value) || 0));
  const bagIdx = (state.bag || []).findIndex((c) => c.id === id);
  if (bagIdx >= 0) {
    const prev = state.bag[bagIdx];
    const next = normalizeCopy({ ...prev, hammersUsed: n }, "bag");
    if (!next) return state;
    const bag = [...state.bag];
    bag[bagIdx] = next;
    return { ...state, bag };
  }
  const listIdx = (state.listings || []).findIndex((c) => c.id === id);
  if (listIdx < 0) return state;
  const prev = state.listings[listIdx];
  const next = normalizeCopy({ ...prev, hammersUsed: n }, "listing");
  if (!next) return state;
  const listings = [...state.listings];
  listings[listIdx] = next;
  return { ...state, listings };
}

export function setBoughtAt(state, id, boughtAtIso) {
  const idx = (state.bag || []).findIndex((c) => c.id === id);
  if (idx < 0) return state;
  const prev = state.bag[idx];
  const next = normalizeCopy(
    {
      ...prev,
      boughtAt: boughtAtIso || nowIso(),
    },
    "bag"
  );
  if (!next) return state;
  const bag = [...state.bag];
  bag[idx] = next;
  return { ...state, bag };
}

/** Undo accidental buy — bag → My Biddings. */
export function returnBagToBidding(state, id) {
  const row = (state.bag || []).find((c) => c.id === id);
  if (!row) return state;
  const back = normalizeCopy(
    {
      ...row,
      buyPrice: 0,
      boughtAt: null,
    },
    "bidding"
  );
  if (!back) return state;
  return {
    ...state,
    bag: state.bag.filter((c) => c.id !== id),
    biddings: [back, ...(state.biddings || [])],
  };
}

/** Undo accidental list — listings → bag (no failed try). */
export function returnListingToBag(state, id) {
  const row = (state.listings || []).find((c) => c.id === id);
  if (!row) return state;
  const back = normalizeCopy(
    {
      ...row,
      listPrice: 0,
      listedAt: null,
    },
    "bag"
  );
  if (!back) return state;
  return {
    ...state,
    listings: state.listings.filter((c) => c.id !== id),
    bag: [back, ...(state.bag || [])],
  };
}

export function dismissBidding(state, id) {
  return {
    ...state,
    biddings: (state.biddings || []).filter((c) => c.id !== id),
  };
}

/**
 * Log a lost auction: clear price becomes the counterfactual buy cost.
 * Feeds Max/Suggest and “should have pushed” learning.
 */
export function failBidding(state, id, failPrice, failedAtIso) {
  const row = (state.biddings || []).find((c) => c.id === id);
  if (!row) return state;
  const price = Math.max(0, Number(failPrice) || 0);
  if (!(price > 0)) return state;
  const when = failedAtIso || nowIso();
  const advice = bidFailAdvice(row, price, state);
  const logged = normalizeCopy(
    {
      ...row,
      buyPrice: price,
      failPrice: price,
      boughtAt: when,
      soldAt: when,
      soldPrice: 0,
      outcome: "bid_failed",
      pushVerdict: advice.verdict,
      counterfactualMarginPct: advice.marginIfBought,
      maxBidAtFail: advice.maxBid || 0,
      stage: "history",
    },
    "history"
  );
  if (!logged) return state;
  return {
    ...state,
    biddings: state.biddings.filter((c) => c.id !== id),
    history: [logged, ...(state.history || [])],
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
  return copy?.rarity || "Copy";
}

export function formatBonuses(copy) {
  const parts = [];
  for (const b of bonusList(copy)) {
    if (b?.stat && b.value) parts.push(`${b.stat} +${b.value}%`);
  }
  return parts.join(" · ") || "No % bonuses";
}

export function formatFlats(copy) {
  return `Spd ${formatSg(copy?.speed || 0)} · Atk ${formatSg(copy?.attack || 0)} · HP ${formatSg(copy?.hp || 0)}`;
}
