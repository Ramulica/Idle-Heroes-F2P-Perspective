import hero01 from "./assets/stats/heroes/hero-01.png";
import hero02 from "./assets/stats/heroes/hero-02.png";
import hero03 from "./assets/stats/heroes/hero-03.png";
import hero04 from "./assets/stats/heroes/hero-04.png";
import hero05 from "./assets/stats/heroes/hero-05.png";
import hero06 from "./assets/stats/heroes/hero-06.png";
import hero07 from "./assets/stats/heroes/hero-07.png";
import hero08 from "./assets/stats/heroes/hero-08.png";
import hero09 from "./assets/stats/heroes/hero-09.png";
import hero10 from "./assets/stats/heroes/hero-10.png";
import hero11 from "./assets/stats/heroes/hero-11.png";
import hero12 from "./assets/stats/heroes/hero-12.png";
import hero13 from "./assets/stats/heroes/hero-13.png";
import hero14 from "./assets/stats/heroes/hero-14.png";
import hero15 from "./assets/stats/heroes/hero-15.png";
import hero16 from "./assets/stats/heroes/hero-16.png";
import hero17 from "./assets/stats/heroes/hero-17.png";
import hero18 from "./assets/stats/heroes/hero-18.png";
import hero19 from "./assets/stats/heroes/hero-19.png";
import hero20 from "./assets/stats/heroes/hero-20.png";
import hero21 from "./assets/stats/heroes/hero-21.png";
import hero22 from "./assets/stats/heroes/hero-22.png";
import hero23 from "./assets/stats/heroes/hero-23.png";
import hero24 from "./assets/stats/heroes/hero-24.png";
import hero25 from "./assets/stats/heroes/hero-25.png";
import hero26 from "./assets/stats/heroes/hero-26.png";
import hero27 from "./assets/stats/heroes/hero-27.png";
import hero28 from "./assets/stats/heroes/hero-28.png";
import hero29 from "./assets/stats/heroes/hero-29.png";
import hero30 from "./assets/stats/heroes/hero-30.png";
import hero31 from "./assets/stats/heroes/hero-31.png";
import hero32 from "./assets/stats/heroes/hero-32.png";

export const SLOT_COUNT = 6;
export const GEAR_COUNT = 6;
export const ENABLE_COUNT = 5;
export const IMPRINT_COUNT = 3;

export const SLOT_TITLES = [
  "Front 1",
  "Front 2",
  "Back 3",
  "Back 4",
  "Back 5",
  "Back 6",
];

/** Heroes in the order you sent the icons. Names/stats come later. */
export const STAT_HEROES = [
  { id: "hero-01", name: "Hero 1", icon: hero01 },
  { id: "hero-02", name: "Hero 2", icon: hero02 },
  { id: "hero-03", name: "Hero 3", icon: hero03 },
  { id: "hero-04", name: "Hero 4", icon: hero04 },
  { id: "hero-05", name: "Hero 5", icon: hero05 },
  { id: "hero-06", name: "Hero 6", icon: hero06 },
  { id: "hero-07", name: "Hero 7", icon: hero07 },
  { id: "hero-08", name: "Hero 8", icon: hero08 },
  { id: "hero-09", name: "Hero 9", icon: hero09 },
  { id: "hero-10", name: "Hero 10", icon: hero10 },
  { id: "hero-11", name: "Hero 11", icon: hero11 },
  { id: "hero-12", name: "Hero 12", icon: hero12 },
  { id: "hero-13", name: "Hero 13", icon: hero13 },
  { id: "hero-14", name: "Hero 14", icon: hero14 },
  { id: "hero-15", name: "Hero 15", icon: hero15 },
  { id: "hero-16", name: "Hero 16", icon: hero16 },
  { id: "hero-17", name: "Hero 17", icon: hero17 },
  { id: "hero-18", name: "Hero 18", icon: hero18 },
  { id: "hero-19", name: "Hero 19", icon: hero19 },
  { id: "hero-20", name: "Hero 20", icon: hero20 },
  { id: "hero-21", name: "Hero 21", icon: hero21 },
  { id: "hero-22", name: "Hero 22", icon: hero22 },
  { id: "hero-23", name: "Hero 23", icon: hero23 },
  { id: "hero-24", name: "Hero 24", icon: hero24 },
  { id: "hero-25", name: "Hero 25", icon: hero25 },
  { id: "hero-26", name: "Hero 26", icon: hero26 },
  { id: "hero-27", name: "Hero 27", icon: hero27 },
  { id: "hero-28", name: "Hero 28", icon: hero28 },
  { id: "hero-29", name: "Hero 29", icon: hero29 },
  { id: "hero-30", name: "Hero 30", icon: hero30 },
  { id: "hero-31", name: "Hero 31", icon: hero31 },
  { id: "hero-32", name: "Hero 32", icon: hero32 },
];

export const STAT_HERO_BY_ID = Object.fromEntries(
  STAT_HEROES.map((hero) => [hero.id, hero])
);

/** Placeholder gear picks until real gear icons/stats are added. */
export const GEAR_OPTIONS = [
  { id: "gear-1", label: "Gear A" },
  { id: "gear-2", label: "Gear B" },
  { id: "gear-3", label: "Gear C" },
  { id: "gear-4", label: "Gear D" },
  { id: "gear-5", label: "Gear E" },
  { id: "gear-6", label: "Gear F" },
];

/** Each enable circle picks 1 of these 3 (stats later). */
export const ENABLE_OPTIONS = [
  { id: "enable-a", label: "Enable A", mark: "A" },
  { id: "enable-b", label: "Enable B", mark: "B" },
  { id: "enable-c", label: "Enable C", mark: "C" },
];

/** Imprints: choose 3 of these 10 (stats later). */
export const IMPRINT_OPTIONS = [
  { id: "imp-1", label: "Stat 1", mark: "1" },
  { id: "imp-2", label: "Stat 2", mark: "2" },
  { id: "imp-3", label: "Stat 3", mark: "3" },
  { id: "imp-4", label: "Stat 4", mark: "4" },
  { id: "imp-5", label: "Stat 5", mark: "5" },
  { id: "imp-6", label: "Stat 6", mark: "6" },
  { id: "imp-7", label: "Stat 7", mark: "7" },
  { id: "imp-8", label: "Stat 8", mark: "8" },
  { id: "imp-9", label: "Stat 9", mark: "9" },
  { id: "imp-10", label: "Stat 10", mark: "10" },
];

/** Monster icons/stats come next — keep the slot ready. */
export const MONSTER_OPTIONS = [];

export const STORAGE_KEY = "ih-stat-calculator";

export function emptySlot() {
  return {
    heroId: null,
    gear: Array(GEAR_COUNT).fill(null),
    enables: Array(ENABLE_COUNT).fill(null),
    imprints: Array(IMPRINT_COUNT).fill(null),
  };
}

export function emptyBoard() {
  return {
    monsterId: null,
    slots: Array.from({ length: SLOT_COUNT }, emptySlot),
  };
}

export function newLineupId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `lineup-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function cloneBoard(board) {
  const src = board && typeof board === "object" ? board : emptyBoard();
  return {
    monsterId: src.monsterId || null,
    slots: Array.from({ length: SLOT_COUNT }, (_, index) => {
      const slot = src.slots?.[index] || emptySlot();
      return {
        heroId: STAT_HERO_BY_ID[slot.heroId] ? slot.heroId : null,
        gear: Array.from(
          { length: GEAR_COUNT },
          (_, i) => slot.gear?.[i] || null
        ),
        enables: Array.from(
          { length: ENABLE_COUNT },
          (_, i) => slot.enables?.[i] || null
        ),
        imprints: Array.from(
          { length: IMPRINT_COUNT },
          (_, i) => slot.imprints?.[i] || null
        ),
      };
    }),
  };
}

export function normalizeStatCalculator(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const board = cloneBoard(src.board);
  const lineups = Array.isArray(src.lineups)
    ? src.lineups
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const name = String(row.name || "").trim();
          if (!name) return null;
          return {
            id: String(row.id || newLineupId()),
            name,
            board: cloneBoard(row.board),
          };
        })
        .filter(Boolean)
    : [];
  return {
    board,
    lineups,
    activeLineupId:
      lineups.some((row) => row.id === src.activeLineupId)
        ? src.activeLineupId
        : null,
  };
}

export function defaultStatCalculator() {
  return normalizeStatCalculator({});
}

export function readStatCalculator() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeStatCalculator(raw ? JSON.parse(raw) : {});
  } catch {
    return defaultStatCalculator();
  }
}

export function writeStatCalculator(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeStatCalculator(state)));
  } catch {
    /* ignore */
  }
}

export function heroOf(heroId) {
  return STAT_HERO_BY_ID[heroId] || null;
}

export function optionById(list, id) {
  return list.find((row) => row.id === id) || null;
}

export function slotTitle(index) {
  return SLOT_TITLES[index] || `Slot ${index + 1}`;
}

export function patchSlot(board, slotIndex, partial) {
  const next = cloneBoard(board);
  next.slots[slotIndex] = {
    ...next.slots[slotIndex],
    ...partial,
  };
  return next;
}

export function clearSlot(board, slotIndex) {
  return patchSlot(board, slotIndex, emptySlot());
}

export function setSlotListValue(board, slotIndex, key, listIndex, value) {
  const next = cloneBoard(board);
  const list = [...next.slots[slotIndex][key]];
  list[listIndex] = value;
  next.slots[slotIndex] = {
    ...next.slots[slotIndex],
    [key]: list,
  };
  return next;
}
