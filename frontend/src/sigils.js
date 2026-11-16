/**
 * Board-wide sigils tied to a game mode.
 * Blue / yellow / purple / green → 1 stat; red → 2 stats.
 * Only apply when the board’s selected game mode matches the sigil’s mode.
 */

export const SIGIL_RARITIES = [
  { id: "blue", name: "Blue", color: "#3b82f6", border: "#60a5fa", statSlots: 1 },
  { id: "yellow", name: "Yellow", color: "#ca8a04", border: "#eab308", statSlots: 1 },
  {
    id: "purple",
    name: "Purple",
    color: "#7e22ce",
    border: "#a855f7",
    statSlots: 1,
  },
  { id: "green", name: "Green", color: "#15803d", border: "#22c55e", statSlots: 1 },
  { id: "red", name: "Red", color: "#b91c1c", border: "#ef4444", statSlots: 2 },
];

export const SIGIL_RARITY_BY_ID = Object.fromEntries(
  SIGIL_RARITIES.map((row) => [row.id, row])
);

/** Stats players can roll on purple+ (and we allow on blue/yellow too). */
export const SIGIL_STAT_OPTIONS = [
  { stat: "Speed", unit: "" },
  { stat: "Armor Break", unit: "%" },
  { stat: "Precision", unit: "%" },
  { stat: "Crit", unit: "%" },
  { stat: "Crit Damage", unit: "%" },
  { stat: "Crit Damage Reduction", unit: "%" },
  { stat: "Crit Damage Offset", unit: "%" },
  { stat: "Block", unit: "%" },
  { stat: "Armor", unit: "%" },
  { stat: "Skill Damage", unit: "%" },
  { stat: "Holy Damage", unit: "%" },
  { stat: "Damage Reduction", unit: "%" },
  { stat: "All Damage Dealt", unit: "%" },
  { stat: "All Damage Reduction", unit: "%" },
  { stat: "Control Immunity", unit: "%" },
  { stat: "Control Immunity Offset", unit: "%" },
  { stat: "Dodge", unit: "%" },
  { stat: "Dodge Offset", unit: "%" },
  { stat: "Heal Effect", unit: "%" },
  { stat: "Effect of Being Healed", unit: "%" },
  { stat: "Maim", unit: "%" },
];

export function sigilStatOptionOf(stat) {
  if (!stat) return null;
  return SIGIL_STAT_OPTIONS.find((row) => row.stat === stat) || null;
}

export function sigilRarityOf(id) {
  return SIGIL_RARITY_BY_ID[id] || null;
}

export function rarityAllowsStatPick(rarityId) {
  // Blue / yellow still get one value slot; purple+ is when picking which stat matters most.
  // All rarities can pick a named combat stat so every entry is useful.
  return Boolean(sigilRarityOf(rarityId));
}

export function statSlotsForRarity(rarityId) {
  return sigilRarityOf(rarityId)?.statSlots ?? 1;
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `sigil-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyStatSlot() {
  return { stat: "", unit: "%", value: 0 };
}

export function createSigilDraft(partial = {}) {
  const rarity = SIGIL_RARITY_BY_ID[partial.rarity] ? partial.rarity : "purple";
  const slots = statSlotsForRarity(rarity);
  const stats = Array.from({ length: slots }, (_, i) => {
    const src = partial.stats?.[i];
    if (src && typeof src === "object") {
      return normalizeStatSlot(src);
    }
    return emptyStatSlot();
  });
  return {
    id: partial.id || newId(),
    rarity,
    gameModeId: partial.gameModeId || null,
    stats,
  };
}

function normalizeStatSlot(raw) {
  const name = typeof raw?.stat === "string" ? raw.stat.trim() : "";
  // Resolve by stat name so flat Speed (unit "") is never dropped when unit
  // was wrongly stored as "%" from an older picker encode.
  const opt = sigilStatOptionOf(name);
  const n = Number(raw?.value);
  return {
    stat: opt ? opt.stat : "",
    unit: opt ? opt.unit : "%",
    value: Number.isFinite(n) && n > 0 ? Math.min(n, 999) : 0,
  };
}

export function normalizeSigils(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const rarity = SIGIL_RARITY_BY_ID[row.rarity] ? row.rarity : null;
    if (!rarity) continue;
    const slots = statSlotsForRarity(rarity);
    const stats = Array.from({ length: slots }, (_, i) =>
      normalizeStatSlot(row.stats?.[i] || emptyStatSlot())
    );
    out.push({
      id: typeof row.id === "string" && row.id ? row.id : newId(),
      rarity,
      gameModeId:
        typeof row.gameModeId === "string" && row.gameModeId
          ? row.gameModeId
          : null,
      stats,
    });
  }
  // One sigil per game mode — keep the last entry for each mode.
  const byMode = new Map();
  const orphans = [];
  for (const sigil of out) {
    if (!sigil.gameModeId) {
      orphans.push(sigil);
      continue;
    }
    byMode.set(sigil.gameModeId, sigil);
  }
  return [...byMode.values(), ...orphans];
}

export function defaultSigils() {
  return [];
}

export function upsertSigil(list, draft) {
  const entry = createSigilDraft(draft);
  // Replace same id and any other sigil already tied to this game mode.
  const next = normalizeSigils(list).filter(
    (s) =>
      s.id !== entry.id &&
      (!entry.gameModeId || s.gameModeId !== entry.gameModeId)
  );
  next.push(entry);
  return normalizeSigils(next);
}

export function removeSigil(list, id) {
  return normalizeSigils(list).filter((s) => s.id !== id);
}

export function formatSigilStat(row) {
  if (!row?.stat) return "—";
  const n = Number(row.value);
  if (!Number.isFinite(n) || n === 0) return `${row.stat}`;
  const shown = Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
  return row.unit === "%" ? `${row.stat} +${shown}%` : `${row.stat} +${shown}`;
}

/**
 * Collect sigil rows that match the active game mode (board-wide).
 */
export function collectSigilStatRows(sigils, gameModeId) {
  if (!gameModeId) return [];
  const rows = [];
  for (const sigil of normalizeSigils(sigils)) {
    if (sigil.gameModeId !== gameModeId) continue;
    for (const slot of sigil.stats) {
      if (!slot.stat) continue;
      const value = Number(slot.value);
      if (!Number.isFinite(value) || value === 0) continue;
      rows.push({
        stat: slot.stat,
        value,
        unit: slot.unit || "",
      });
    }
  }
  return rows;
}
