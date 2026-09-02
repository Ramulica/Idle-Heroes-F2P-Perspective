export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;
export const EVENT_WEEKS_PER_YEAR = 17;
export const RNG_EVENTS_PER_YEAR = 2;

export function rngEventsForPeriod(eventWeeks) {
  const weeks = Math.max(1, Number(eventWeeks) || 1);
  return Math.max(0, Math.round((RNG_EVENTS_PER_YEAR * weeks) / EVENT_WEEKS_PER_YEAR));
}
export const WEEKS_PER_MONTH = WEEKS_PER_YEAR / MONTHS_PER_YEAR;
export const BASE_WEEKLY_AWAKENS = 3;
export const DEFAULT_CSG_PER_AWAKEN = 50;
export const B_STONE_CSG = 600;
export const B_STONE_WEEKS = 10;
export const AWAKEN_CYCLE_WEEKS = 5;
export const CHEST_AWAKENS = 10;
export const LABYRINTH_AWAKENS = 18;
export const LABYRINTH_CSG_COST = 1000;
export const FACTORY_AWAKENS = 10;
export const MAX_VOID_CYCLE = 600;
export const PAGES_ARENA_WEEKLY = 3;
export const PAGES_GEMS_MONTHLY = 10;
export const PAGES_FACTORY_YEARLY = 50;
export const PAGES_FACTORY_EVENTS_PER_YEAR = 5;
export const PAGES_FACTORY_PER_EVENT = 10;
export const PAGES_OTHER_YEARLY_DEFAULT = 40;
export const PAGES_PER_EVENT = 100;
export const PAGES_EVENT_AWAKENS = 30;
export const MONSTER_TICKETS_YEARLY_DEFAULT = 50;
export const MONSTER_TICKETS_PER_EVENT = 100;
export const TREASURE_ARENA_WEEKLY = 3;
export const TREASURE_OTHER_YEARLY_DEFAULT = 300;
export const TREASURE_COUPONS_PER_COMPLETION = 150;
export const TREASURE_CHESTS = [
  { at: 10, color: "purple", label: "Purple Treasure selection chest" },
  { at: 30, color: "green", label: "Green Treasure selection chest" },
  { at: 60, color: "red", label: "Red Treasure selection chest" },
  { at: 100, color: "orange", label: "Orange Treasure selection chest" },
  { at: 150, color: "pink", label: "Pink Treasure selection chest" },
];
export const AWAKEN_EVENT_POINTS_PER = 6;
export const AWAKEN_EVENT_MILESTONES = [
  { points: 100, type: "Artifacts", amount: 1 },
  { points: 150, type: "Origin", amount: 0.5 },
  { points: 300, type: "Origin", amount: 1 },
  { points: 600, type: "DT", amount: 1 },
];

export const PERIOD_PRESETS = [
  { months: 1, label: "1 month" },
  { months: 3, label: "3 months" },
  { months: 6, label: "6 months" },
  { months: 12, label: "1 year" },
  { months: 24, label: "2 years" },
  { months: 36, label: "3 years" },
  { months: 48, label: "4 years" },
  { months: 60, label: "5 years" },
];

export const VOID_MILESTONES = [
  { level: 45, csg: 50 },
  { level: 50, csg: 50 },
  { level: 55, csg: 50 },
  { level: 60, csg: 50 },
  { level: 65, csg: 100 },
  { level: 70, csg: 100 },
  { level: 75, csg: 100 },
  { level: 80, csg: 100 },
];

export const RANK_BRACKETS = [
  { id: "1", label: "Top 1", awakens: 10 },
  { id: "2", label: "Top 2", awakens: 9 },
  { id: "3", label: "Top 3", awakens: 8 },
  { id: "4-5", label: "Top 4-5", awakens: 7 },
  { id: "6-10", label: "Top 6-10", awakens: 6 },
  { id: "10-20", label: "Top 10-20", awakens: 5 },
  { id: "20-50", label: "Top 20-50", awakens: 4 },
  { id: "50-100", label: "Top 50-100", awakens: 3 },
  { id: "100-200", label: "Top 100-200", awakens: 2 },
  { id: "200-500", label: "Top 200-500", awakens: 1 },
];

export const DEFAULT_STATE = {
  months: 12,
  accountLevel: 80,
  voidLevel: 80,
  rankId: "10-20",
  mysteriousChest: false,
  skyLabyrinth: false,
  factoryMode: "off",
  freeAwakensOn: false,
  freeAwakens: 3,
  deluxeOn: false,
  deluxeAwakens: 0,
  csgPerAwaken: DEFAULT_CSG_PER_AWAKEN,
  bStone: false,
  otherYearly: 0,
  p2wYearly: 0,
  pagesArenaStore: true,
  pagesGemsMonthly: false,
  pagesFactory: true,
  pagesOtherOn: true,
  pagesOtherYearly: PAGES_OTHER_YEARLY_DEFAULT,
  includePagesAwakens: false,
  monsterTicketsOn: true,
  monsterTicketsYearly: MONSTER_TICKETS_YEARLY_DEFAULT,
  includeMonsterTicketAwakens: false,
  treasureArenaStore: true,
  treasureOtherOn: true,
  treasureOtherYearly: TREASURE_OTHER_YEARLY_DEFAULT,
  includeAwakenEvent: true,
  eventPlanId: null,
  heroUpgrade: {
    have: [],
    want: [],
    templeManual: null,
    includeOptionals: true,
  },
};

export function clampMonths(value) {
  const months = Number(value) || 1;
  return Math.min(60, Math.max(1, Math.round(months)));
}

export function periodLabel(months) {
  const value = clampMonths(months);
  if (value === 1) return "1 month";
  if (value % 12 === 0) {
    const years = value / 12;
    return years === 1 ? "1 year" : `${years} years`;
  }
  return `${value} months`;
}

export function cycleVoidCsg(voidLevel) {
  const level = Number(voidLevel) || 0;
  return VOID_MILESTONES.filter((row) => level >= row.level).reduce(
    (sum, row) => sum + row.csg,
    0
  );
}

export function rankLevelMod(accountLevel) {
  const level = Number(accountLevel) || 0;
  if (level < 140) return -1;
  if (level > 180) return 1;
  return 0;
}

export function rankAwakens(rankId, accountLevel) {
  const base = RANK_BRACKETS.find((row) => row.id === rankId)?.awakens || 0;
  return Math.max(0, base + rankLevelMod(accountLevel));
}

export function calculatePages(state = {}) {
  const arenaWeekly = state.pagesArenaStore ? PAGES_ARENA_WEEKLY : 0;
  const arenaYearly = arenaWeekly * WEEKS_PER_YEAR;
  const arenaCycle = arenaWeekly * AWAKEN_CYCLE_WEEKS;

  const gemsMonthly = state.pagesGemsMonthly ? PAGES_GEMS_MONTHLY : 0;
  const gemsYearly = gemsMonthly * MONTHS_PER_YEAR;
  const gemsCycle = state.pagesGemsMonthly
    ? PAGES_GEMS_MONTHLY * (AWAKEN_CYCLE_WEEKS / WEEKS_PER_MONTH)
    : 0;

  const factoryYearly = state.pagesFactory ? PAGES_FACTORY_YEARLY : 0;
  const factoryPerEvent = state.pagesFactory ? PAGES_FACTORY_PER_EVENT : 0;
  const factoryEventsPerYear = state.pagesFactory ? PAGES_FACTORY_EVENTS_PER_YEAR : 0;
  const factoryCycle = factoryYearly * (AWAKEN_CYCLE_WEEKS / WEEKS_PER_YEAR);

  const otherYearly = state.pagesOtherOn
    ? Math.max(0, Number(state.pagesOtherYearly) || 0)
    : 0;
  const otherCycle = otherYearly * (AWAKEN_CYCLE_WEEKS / WEEKS_PER_YEAR);

  const pagesYearly = arenaYearly + gemsYearly + factoryYearly + otherYearly;
  const pagesCycle = arenaCycle + gemsCycle + factoryCycle + otherCycle;
  const eventsYearly = Math.floor(pagesYearly / PAGES_PER_EVENT);
  const leftoverPages = pagesYearly - eventsYearly * PAGES_PER_EVENT;
  const boxesYearly = eventsYearly;
  const awakensYearly = eventsYearly * PAGES_EVENT_AWAKENS;
  const awakensCycle = awakensYearly * (AWAKEN_CYCLE_WEEKS / WEEKS_PER_YEAR);

  const months = clampMonths(state.months);
  const years = months / MONTHS_PER_YEAR;
  const pagesPeriod = pagesYearly * years;
  const eventsPeriod = Math.floor(pagesPeriod / PAGES_PER_EVENT);
  const leftoverPeriod = pagesPeriod - eventsPeriod * PAGES_PER_EVENT;
  const boxesPeriod = eventsPeriod;
  const awakensPeriod = eventsPeriod * PAGES_EVENT_AWAKENS;

  return {
    arenaWeekly,
    arenaYearly,
    arenaCycle,
    gemsMonthly,
    gemsYearly,
    gemsCycle,
    factoryYearly,
    factoryPerEvent,
    factoryEventsPerYear,
    otherYearly,
    otherCycle,
    pagesYearly,
    pagesCycle,
    eventsYearly,
    leftoverPages,
    boxesYearly,
    awakensYearly,
    awakensCycle,
    months,
    years,
    pagesPeriod,
    eventsPeriod,
    leftoverPeriod,
    boxesPeriod,
    awakensPeriod,
  };
}

export function calculateTreasureCoupons(state = {}) {
  const arenaWeekly = state.treasureArenaStore ? TREASURE_ARENA_WEEKLY : 0;
  const arenaYearly = arenaWeekly * WEEKS_PER_YEAR;
  const otherYearly = state.treasureOtherOn
    ? Math.max(0, Number(state.treasureOtherYearly) || 0)
    : 0;
  const yearly = arenaYearly + otherYearly;
  const months = clampMonths(state.months);
  const years = months / MONTHS_PER_YEAR;
  const completionsYearly = Math.floor(yearly / TREASURE_COUPONS_PER_COMPLETION);
  const leftoverYearly = yearly - completionsYearly * TREASURE_COUPONS_PER_COMPLETION;
  const period = yearly * years;
  const completionsPeriod = Math.floor(period / TREASURE_COUPONS_PER_COMPLETION);
  const leftoverPeriod = period - completionsPeriod * TREASURE_COUPONS_PER_COMPLETION;
  return {
    arenaWeekly,
    arenaYearly,
    otherYearly,
    yearly,
    period,
    completionsYearly,
    leftoverYearly,
    completionsPeriod,
    leftoverPeriod,
    chestsYearly: completionsYearly,
    chestsPeriod: completionsPeriod,
  };
}

export function calculateMonsterTickets(state = {}) {
  const yearly = state.monsterTicketsOn
    ? Math.max(0, Number(state.monsterTicketsYearly) || 0)
    : 0;
  const months = clampMonths(state.months);
  const years = months / MONTHS_PER_YEAR;
  const eventsYearly = Math.floor(yearly / MONSTER_TICKETS_PER_EVENT);
  const leftoverYearly = yearly - eventsYearly * MONSTER_TICKETS_PER_EVENT;
  const boxesYearly = eventsYearly;
  const awakensYearly = eventsYearly * PAGES_EVENT_AWAKENS;
  const awakensCycle = awakensYearly * (AWAKEN_CYCLE_WEEKS / WEEKS_PER_YEAR);
  const period = yearly * years;
  const eventsPeriod = Math.floor(period / MONSTER_TICKETS_PER_EVENT);
  const leftoverPeriod = period - eventsPeriod * MONSTER_TICKETS_PER_EVENT;
  const boxesPeriod = eventsPeriod;
  const awakensPeriod = eventsPeriod * PAGES_EVENT_AWAKENS;
  return {
    yearly,
    period,
    eventsYearly,
    leftoverYearly,
    boxesYearly,
    awakensYearly,
    awakensCycle,
    eventsPeriod,
    leftoverPeriod,
    boxesPeriod,
    awakensPeriod,
  };
}

export function calculateSg(state) {
  const months = clampMonths(state.months);
  const years = months / MONTHS_PER_YEAR;
  const weeks = months * WEEKS_PER_MONTH;
  const cycles5 = weeks / AWAKEN_CYCLE_WEEKS;
  const cycles10 = weeks / B_STONE_WEEKS;

  const voidPerCycle = cycleVoidCsg(state.voidLevel);
  const voidPeriod = voidPerCycle * cycles5;

  const rankMod = rankLevelMod(state.accountLevel);
  const ranking = rankAwakens(state.rankId, state.accountLevel);
  const weekly = ranking + BASE_WEEKLY_AWAKENS;
  const free = state.freeAwakensOn
    ? Math.min(5, Math.max(2, Number(state.freeAwakens) || 2))
    : 0;
  const deluxeYearly = state.deluxeOn
    ? Math.max(0, Number(state.deluxeAwakens) || 0)
    : 0;
  const deluxePeriod = deluxeYearly * years;
  const chest = state.mysteriousChest ? CHEST_AWAKENS : 0;
  const labyrinth = state.skyLabyrinth ? LABYRINTH_AWAKENS : 0;
  const factoryEvery = state.factoryMode === "every" ? FACTORY_AWAKENS : 0;
  const factoryOther = state.factoryMode === "other" ? FACTORY_AWAKENS : 0;
  const pages = calculatePages(state);
  const monsterTickets = calculateMonsterTickets(state);
  const treasureCoupons = calculateTreasureCoupons(state);
  const pagesAwakensCycle = state.includePagesAwakens ? pages.awakensCycle : 0;
  const ticketAwakensCycle = state.includeMonsterTicketAwakens
    ? monsterTickets.awakensCycle
    : 0;
  const awakensPerCycle =
    weekly * AWAKEN_CYCLE_WEEKS +
    chest +
    labyrinth +
    free +
    factoryEvery +
    pagesAwakensCycle +
    ticketAwakensCycle;
  const csgPerAwaken = Math.max(0, Number(state.csgPerAwaken) || 0);
  const labyrinthCsgCost = state.skyLabyrinth ? LABYRINTH_CSG_COST : 0;
  const awakenCsgPerCycle =
    awakensPerCycle * csgPerAwaken +
    (factoryOther * csgPerAwaken) / 2 -
    labyrinthCsgCost;
  const awakenPeriod =
    (awakensPerCycle * csgPerAwaken - labyrinthCsgCost) * cycles5 +
    factoryOther * csgPerAwaken * cycles10 +
    deluxePeriod * csgPerAwaken;
  const awakensYearly =
    awakensPerCycle * (WEEKS_PER_YEAR / AWAKEN_CYCLE_WEEKS) +
    factoryOther * (WEEKS_PER_YEAR / B_STONE_WEEKS) +
    deluxeYearly;
  const awakensPeriodCount =
    awakensPerCycle * cycles5 + factoryOther * cycles10 + deluxePeriod;
  const awakenEvent = planAwakenEvents(Math.floor(awakensPerCycle), 1);
  const awakenEventOn = state.includeAwakenEvent !== false;
  const awakenEventPeriod = awakenEventOn
    ? planAwakenEvents(Math.floor(awakensPeriodCount), Math.floor(weeks / AWAKEN_CYCLE_WEEKS))
    : emptyAwakenEventPlan();
  const awakenEventYearly = awakenEventOn
    ? planAwakenEvents(
        Math.floor(awakensYearly),
        Math.floor(WEEKS_PER_YEAR / AWAKEN_CYCLE_WEEKS)
      )
    : emptyAwakenEventPlan();

  const bStonePerCycle = state.bStone ? B_STONE_CSG : 0;
  const bStonePeriod = bStonePerCycle * cycles10;

  const otherYearly = Math.max(0, Number(state.otherYearly) || 0);
  const p2wYearly = Math.max(0, Number(state.p2wYearly) || 0);
  const otherPeriod = otherYearly * years;
  const p2wPeriod = p2wYearly * years;

  const total =
    voidPeriod + awakenPeriod + bStonePeriod + otherPeriod + p2wPeriod;

  return {
    months,
    years,
    weeks,
    cycles5,
    cycles10,
    voidPerCycle,
    voidPeriod,
    ranking,
    rankMod,
    weekly,
    chest,
    labyrinth,
    labyrinthCsgCost,
    factoryEvery,
    factoryOther,
    free,
    deluxe: deluxeYearly,
    deluxeYearly,
    deluxePeriod,
    pages,
    monsterTickets,
    treasureCoupons,
    pagesAwakensCycle,
    ticketAwakensCycle,
    awakensPerCycle,
    csgPerAwaken,
    awakenCsgPerCycle,
    awakenPeriod,
    awakensYearly,
    awakensPeriodCount,
    awakenEvent,
    awakenEventPeriod,
    awakenEventYearly,
    bStonePerCycle,
    bStonePeriod,
    otherYearly,
    otherPeriod,
    p2wYearly,
    p2wPeriod,
    total,
  };
}

export function scaleRewardCounts(counts, times) {
  const out = {};
  const factor = Number(times) || 0;
  Object.entries(counts || {}).forEach(([type, value]) => {
    const amount = Number(value) || 0;
    if (amount) out[type] = amount * factor;
  });
  return out;
}

export function mergeRewardCounts(...lists) {
  const out = {};
  lists.forEach((counts) => {
    Object.entries(counts || {}).forEach(([type, value]) => {
      const amount = Number(value) || 0;
      if (amount) out[type] = (out[type] || 0) + amount;
    });
  });
  return out;
}

export function awakenEventRewards(awakensPerCycle) {
  return planAwakenEvents(Math.floor(Number(awakensPerCycle) || 0), 1);
}

export function emptyAwakenEventPlan() {
  return {
    events: 0,
    n600: 0,
    n300: 0,
    n150: 0,
    n100: 0,
    counts: {},
    leftoverAwakens: 0,
    allAt300: false,
    points: 0,
  };
}

export function awakenEventPlanLabel(plan = {}) {
  const parts = [];
  if (plan.n600) parts.push(`${plan.n600} × 600`);
  if (plan.n300) parts.push(`${plan.n300} × 300`);
  if (plan.n150) parts.push(`${plan.n150} × 150`);
  if (plan.n100) parts.push(`${plan.n100} × 100`);
  return parts.join(" · ") || "No completion";
}

export function rewardsForAwakenTier(tier) {
  const counts = {};
  AWAKEN_EVENT_MILESTONES.forEach((row) => {
    if (tier >= row.points) {
      counts[row.type] = (counts[row.type] || 0) + row.amount;
    }
  });
  return counts;
}

export function planAwakenEvents(totalAwakens, eventCount) {
  const awakens = Math.max(0, Math.floor(Number(totalAwakens) || 0));
  const events = Math.max(0, Math.floor(Number(eventCount) || 0));
  const cost100 = 100 / AWAKEN_EVENT_POINTS_PER;
  const cost150 = 150 / AWAKEN_EVENT_POINTS_PER;
  const cost300 = 300 / AWAKEN_EVENT_POINTS_PER;
  const empty = {
    ...emptyAwakenEventPlan(),
    events,
    leftoverAwakens: awakens,
    points: awakens * AWAKEN_EVENT_POINTS_PER,
  };
  if (!events) return empty;

  let remaining = awakens;
  let n300 = Math.min(events, Math.floor(remaining / cost300));
  remaining -= n300 * cost300;
  let unused = events - n300;
  let n600 = 0;
  const allAt300 = n300 === events && events > 0;
  if (allAt300) {
    n600 = Math.min(n300, Math.floor(remaining / cost300));
    n300 -= n600;
    remaining -= n600 * cost300;
  }
  let n150 = 0;
  let n100 = 0;
  if (unused > 0) {
    n150 = Math.min(unused, Math.floor(remaining / cost150));
    remaining -= n150 * cost150;
    unused -= n150;
    n100 = Math.min(unused, Math.floor(remaining / cost100));
    remaining -= n100 * cost100;
  }

  const counts = mergeRewardCounts(
    scaleRewardCounts(rewardsForAwakenTier(600), n600),
    scaleRewardCounts(rewardsForAwakenTier(300), n300),
    scaleRewardCounts(rewardsForAwakenTier(150), n150),
    scaleRewardCounts(rewardsForAwakenTier(100), n100)
  );
  return {
    events,
    n600,
    n300,
    n150,
    n100,
    counts,
    leftoverAwakens: remaining,
    allAt300,
    points: awakens * AWAKEN_EVENT_POINTS_PER,
  };
}

export function scaleEventPlan(plan, months) {
  if (!plan) {
    return { runs: 0, counts: {}, csgCost: 0 };
  }
  const periodWeeks = Math.max(1, Number(plan.period_weeks) || 1);
  const eventWeeks = EVENT_WEEKS_PER_YEAR * (clampMonths(months) / MONTHS_PER_YEAR);
  const runs = eventWeeks / periodWeeks;
  return {
    runs,
    counts: scaleRewardCounts(plan.reward_counts, runs),
    csgCost: Math.max(0, Number(plan.total_sg_cost) || 0) * runs,
  };
}

export function yearlyCsg(state = {}) {
  return calculateSg({ ...DEFAULT_STATE, ...state, months: 12 }).total;
}

export function csgForEventWeeks(state, eventWeeks) {
  return (
    (yearlyCsg(state) * (Number(eventWeeks) || 0)) / EVENT_WEEKS_PER_YEAR
  );
}
