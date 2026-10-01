export const MAX_REVEALS = 4;

export const SUM_SCORE = {
  6: 1680,
  7: 84,
  8: 630,
  9: 280,
  10: 42,
  11: 34,
  12: 180,
  13: 120,
  14: 53,
  15: 105,
  16: 53,
  17: 144,
  18: 48,
  19: 202,
  20: 105,
  21: 51,
  22: 420,
  23: 840,
  24: 1008,
};

export const LINES = [
  { id: "r0", name: "top row", short: "Top", cells: [0, 1, 2], place: "row", slot: 0 },
  { id: "r1", name: "middle row", short: "Mid", cells: [3, 4, 5], place: "row", slot: 1 },
  { id: "r2", name: "bottom row", short: "Bot", cells: [6, 7, 8], place: "row", slot: 2 },
  { id: "c0", name: "left column", short: "Left", cells: [0, 3, 6], place: "col", slot: 0 },
  { id: "c1", name: "middle column", short: "Mid", cells: [1, 4, 7], place: "col", slot: 1 },
  { id: "c2", name: "right column", short: "Right", cells: [2, 5, 8], place: "col", slot: 2 },
  { id: "d0", name: "diagonal ↘", short: "↘", cells: [0, 4, 8], place: "diag", slot: 0 },
  { id: "d1", name: "diagonal ↗", short: "↗", cells: [2, 4, 6], place: "diag", slot: 1 },
];

export const TILE_SUITS = [
  "heart",
  "spade",
  "diamond",
  "club",
  "heart",
  "spade",
  "diamond",
  "club",
  "heart",
];

export const EMPTY_BOARD = () => Array(9).fill(null);

export function cellLabel(index) {
  const row = ["top", "middle", "bottom"][Math.floor(index / 3)];
  const col = ["left", "center", "right"][index % 3];
  if (index === 4) return "the center tile";
  return `the ${row} ${col} tile`;
}

export function revealedCount(board) {
  return (board || []).filter((value) => value != null).length;
}

export function remainingNumbers(board) {
  const used = new Set((board || []).filter((value) => value != null).map(Number));
  const leftover = [];
  for (let n = 1; n <= 9; n += 1) {
    if (!used.has(n)) leftover.push(n);
  }
  return leftover;
}

function combinations(values, size) {
  const out = [];
  function rec(start, picked) {
    if (picked.length === size) {
      out.push(picked.slice());
      return;
    }
    for (let i = start; i <= values.length - (size - picked.length); i += 1) {
      picked.push(values[i]);
      rec(i + 1, picked);
      picked.pop();
    }
  }
  rec(0, []);
  return out;
}

function lineStats(board, line, leftover) {
  let knownSum = 0;
  let unknown = 0;
  for (const index of line.cells) {
    if (board[index] == null) unknown += 1;
    else knownSum += Number(board[index]);
  }
  if (unknown === 0) {
    return {
      ev: SUM_SCORE[knownSum] || 0,
      avgSum: knownSum,
      pBest: knownSum === 6 ? 1 : 0,
    };
  }
  const combos = combinations(leftover, unknown);
  let score = 0;
  let sum = 0;
  let best = 0;
  for (const combo of combos) {
    let extra = 0;
    for (const n of combo) extra += n;
    const total = knownSum + extra;
    score += SUM_SCORE[total] || 0;
    sum += total;
    if (total === 6) best += 1;
  }
  const count = combos.length || 1;
  return {
    ev: score / count,
    avgSum: sum / count,
    pBest: best / count,
  };
}

export function analyzeBoard(board) {
  const known = (board || []).map((value) => (value == null ? null : Number(value)));
  const leftover = remainingNumbers(known);
  const empty = [];
  for (let i = 0; i < 9; i += 1) {
    if (known[i] == null) empty.push(i);
  }
  const lines = LINES.map((line) => ({
    ...line,
    ...lineStats(known, line, leftover),
  }));
  const bestLine = lines.reduce((lead, line) => (line.ev > lead.ev ? line : lead));
  return {
    count: leftover.length,
    lines,
    bestLine,
    remaining: leftover,
    empty,
    revealed: revealedCount(known),
  };
}

export function suggestReveal(board) {
  const analysis = analyzeBoard(board);
  if (analysis.revealed >= MAX_REVEALS || !analysis.empty.length) {
    return {
      index: null,
      ev: analysis.bestLine.ev,
      readyToPick: true,
      analysis,
    };
  }

  let best = null;
  for (const cell of analysis.empty) {
    let weighted = 0;
    for (const number of analysis.remaining) {
      const next = knownBoard(board);
      next[cell] = number;
      weighted += analyzeBoard(next).bestLine.ev;
    }
    const ev = weighted / analysis.remaining.length;
    const lineCount = LINES.filter((line) => line.cells.includes(cell)).length;
    if (
      !best ||
      ev > best.ev + 0.01 ||
      (Math.abs(ev - best.ev) <= 0.01 && lineCount > best.lineCount)
    ) {
      best = { index: cell, ev, lineCount };
    }
  }
  return { ...best, readyToPick: false, analysis };
}

function knownBoard(board) {
  return (board || []).map((value) => (value == null ? null : Number(value)));
}

export function explainStep(board, suggestion) {
  const revealed = revealedCount(board);
  const analysis = suggestion?.analysis || analyzeBoard(board);
  const best = analysis.bestLine;

  if (revealed === 0) {
    return "The first scratch is random. Tap the tile the game opened and type that number.";
  }
  if (suggestion?.readyToPick || revealed >= MAX_REVEALS) {
    const chance = Math.round((best.pBest || 0) * 100);
    return `Pick the ${best.name}. It is worth about ${Math.round(best.ev)} cans from the leftover 1–9 layouts${
      chance ? `, with a ${chance}% shot at 1-2-3 (1680)` : ""
    }.`;
  }
  const tile = cellLabel(suggestion.index);
  const onLines = LINES.filter((line) => line.cells.includes(suggestion.index))
    .map((line) => line.name)
    .join(", ");
  return `Uncover ${tile} next. It sits on ${onLines}, so it updates the most line averages. After this scratch the best line would be worth about ${Math.round(
    suggestion.ev
  )} cans.`;
}

export function lineCombinations(board, line) {
  const known = (board || []).map((value) => (value == null ? null : Number(value)));
  const leftover = remainingNumbers(known);
  const slots = line.cells.map((index) => known[index]);
  const unknown = slots.filter((value) => value == null).length;
  const picks = unknown === 0 ? [[]] : combinations(leftover, unknown);
  return picks
    .map((pick) => {
      let next = 0;
      const numbers = slots.map((value) => (value == null ? pick[next++] : value));
      const sum = numbers.reduce((total, value) => total + value, 0);
      return {
        numbers,
        sum,
        cans: SUM_SCORE[sum] || 0,
        known: slots.map((value) => value != null),
      };
    })
    .sort((a, b) => b.cans - a.cans || a.sum - b.sum);
}

export function canPlaceNumber(board, index, number) {
  const n = Number(number);
  if (n < 1 || n > 9) return false;
  return (board || []).every((value, i) => i === index || Number(value) !== n);
}
