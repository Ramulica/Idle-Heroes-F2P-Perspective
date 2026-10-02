export const MAX_REVEALS = 4;
export const DEFAULT_FAIRY_CHANCE = 20;

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

const LOW = new Set([1, 2, 3]);
const HIGH = new Set([7, 8, 9]);

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

export function clampFairyChance(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_FAIRY_CHANCE;
  return Math.min(100, Math.max(0, n));
}

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

function countIn(numbers, group) {
  return numbers.reduce((total, n) => total + (group.has(Number(n)) ? 1 : 0), 0);
}

function knownBoard(board) {
  return (board || []).map((value) => (value == null ? null : Number(value)));
}

export function fairyTarget(numbers) {
  const vals = (numbers || []).map(Number);
  const sum = vals.reduce((total, n) => total + n, 0);
  if (countIn(vals, LOW) >= 2 && sum !== 6) {
    return { kind: "low", cans: SUM_SCORE[6], sum: 6, label: "1-2-3" };
  }
  if (countIn(vals, HIGH) >= 2 && sum !== 24) {
    return { kind: "high", cans: SUM_SCORE[24], sum: 24, label: "7-8-9" };
  }
  return null;
}

function missingOfTrio(knownNums) {
  const target = fairyTarget(knownNums);
  if (!target) return null;
  const have = new Set(knownNums.map(Number));
  const trio = target.kind === "low" ? [1, 2, 3] : [7, 8, 9];
  const missing = trio.find((n) => !have.has(n));
  return missing == null ? null : { ...target, missing };
}

export function nextScratchFairy(board, cellIndex, leftover) {
  const known = knownBoard(board);
  const pool = leftover || remainingNumbers(known);
  const hits = [];
  for (const line of LINES) {
    const knownNums = [];
    let unknown = 0;
    let onCell = false;
    for (const index of line.cells) {
      if (index === cellIndex) onCell = true;
      if (known[index] == null) unknown += 1;
      else knownNums.push(Number(known[index]));
    }
    if (!unknown) continue;
    const info = missingOfTrio(knownNums);
    if (!info || !pool.includes(info.missing)) continue;
    hits.push({ ...info, onCell, lineId: line.id, name: line.name });
  }
  if (!hits.length) return null;
  const prefer = hits.filter((hit) => hit.onCell);
  const choices = prefer.length ? prefer : hits;
  return choices.reduce((lead, hit) => (hit.cans > lead.cans ? hit : lead));
}

function comboValue(numbers, fairyP, lineFairy) {
  const sum = numbers.reduce((total, n) => total + Number(n), 0);
  const natural = SUM_SCORE[sum] || 0;
  const fairy = fairyP > 0 && lineFairy && sum !== lineFairy.sum ? lineFairy : null;
  const cans = fairy ? fairyP * fairy.cans + (1 - fairyP) * natural : natural;
  return { sum, natural, fairy, cans };
}

function lineStats(board, line, leftover, fairyP) {
  const knownNums = [];
  let unknown = 0;
  for (const index of line.cells) {
    if (board[index] == null) unknown += 1;
    else knownNums.push(Number(board[index]));
  }
  const lineFairy = unknown > 0 ? fairyTarget(knownNums) : null;
  const combos = unknown === 0 ? [[]] : combinations(leftover, unknown);
  let score = 0;
  let sum = 0;
  let best = 0;
  let high = 0;
  let fairyHits = 0;
  for (const combo of combos) {
    const numbers = knownNums.concat(combo);
    const valued = comboValue(numbers, fairyP, lineFairy);
    score += valued.cans;
    sum += valued.sum;
    if (valued.sum === 6) best += 1;
    else if (valued.fairy?.kind === "low") best += fairyP;
    if (valued.sum === 24) high += 1;
    else if (valued.fairy?.kind === "high") high += fairyP;
    if (valued.fairy) fairyHits += 1;
  }
  const count = combos.length || 1;
  return {
    ev: score / count,
    avgSum: sum / count,
    pBest: best / count,
    pHigh: high / count,
    pFairy: fairyP > 0 && lineFairy ? fairyHits / count : 0,
    fairyKind: fairyP > 0 && lineFairy ? lineFairy.kind : null,
    knownFairy: fairyP > 0 && lineFairy ? lineFairy.kind : null,
  };
}

export function analyzeBoard(board, fairyChance = DEFAULT_FAIRY_CHANCE) {
  const known = (board || []).map((value) => (value == null ? null : Number(value)));
  const leftover = remainingNumbers(known);
  const empty = [];
  for (let i = 0; i < 9; i += 1) {
    if (known[i] == null) empty.push(i);
  }
  const revealed = revealedCount(known);
  const fairyP = revealed < MAX_REVEALS ? clampFairyChance(fairyChance) / 100 : 0;
  const lines = LINES.map((line) => ({
    ...line,
    ...lineStats(known, line, leftover, fairyP),
  }));
  const bestLine = lines.reduce((lead, line) => (line.ev > lead.ev ? line : lead));
  return {
    count: leftover.length,
    lines,
    bestLine,
    remaining: leftover,
    empty,
    revealed,
    fairyChance: clampFairyChance(fairyChance),
  };
}

export function suggestReveal(board, fairyChance = DEFAULT_FAIRY_CHANCE) {
  const analysis = analyzeBoard(board, fairyChance);
  if (analysis.revealed >= MAX_REVEALS || !analysis.empty.length) {
    return {
      index: null,
      ev: analysis.bestLine.ev,
      readyToPick: true,
      analysis,
    };
  }

  const fairyP = clampFairyChance(fairyChance) / 100;
  let best = null;
  for (const cell of analysis.empty) {
    const boost = fairyP > 0 ? nextScratchFairy(board, cell, analysis.remaining) : null;
    let weighted = 0;
    for (const number of analysis.remaining) {
      const natural = knownBoard(board);
      natural[cell] = number;
      let score = analyzeBoard(natural, fairyChance).bestLine.ev;
      if (boost && number !== boost.missing) {
        const changed = knownBoard(board);
        changed[cell] = boost.missing;
        score =
          fairyP * analyzeBoard(changed, fairyChance).bestLine.ev +
          (1 - fairyP) * score;
      }
      weighted += score;
    }
    const ev = weighted / analysis.remaining.length;
    const lineCount = LINES.filter((line) => line.cells.includes(cell)).length;
    if (
      !best ||
      ev > best.ev + 0.01 ||
      (Math.abs(ev - best.ev) <= 0.01 && lineCount > best.lineCount)
    ) {
      best = { index: cell, ev, lineCount, fairy: boost };
    }
  }
  return { ...best, readyToPick: false, analysis };
}

export function explainStep(board, suggestion, fairyChance = DEFAULT_FAIRY_CHANCE) {
  const revealed = revealedCount(board);
  const analysis = suggestion?.analysis || analyzeBoard(board, fairyChance);
  const best = analysis.bestLine;
  const percent = clampFairyChance(fairyChance);

  if (revealed === 0) {
    return "The first scratch is random. Tap the tile the game opened and type that number.";
  }
  if (suggestion?.readyToPick || revealed >= MAX_REVEALS) {
    const chance = Math.round((best.pBest || 0) * 100);
    let text = `Pick the ${best.name}. It is worth about ${Math.round(best.ev)} cans from the leftover 1–9 layouts`;
    if (chance) text += `, with a ${chance}% shot at 1-2-3 (1680)`;
    return `${text}. Fairy does not change the score after 4 tiles are open.`;
  }
  const tile = cellLabel(suggestion.index);
  const onLines = LINES.filter((line) => line.cells.includes(suggestion.index))
    .map((line) => line.name)
    .join(", ");
  let text = `Uncover ${tile} next. It sits on ${onLines}, so it updates the most line averages. After this scratch the best line would be worth about ${Math.round(
    suggestion.ev
  )} cans`;
  if (percent > 0 && analysis.lines.some((line) => line.knownFairy)) {
    text += `. Lines that already show two of 1-2-3 or 7-8-9 still mix a ${percent}% fairy into their average until that last cell is revealed`;
  }
  const boost =
    percent > 0
      ? suggestion.fairy ||
        nextScratchFairy(board, suggestion.index, analysis.remaining)
      : null;
  if (boost) {
    text += `. A ${percent}% fairy can change this next number to ${boost.missing} and complete ${boost.label}`;
  }
  return `${text}.`;
}

export function lineCombinations(board, line, fairyChance = DEFAULT_FAIRY_CHANCE) {
  const known = (board || []).map((value) => (value == null ? null : Number(value)));
  const leftover = remainingNumbers(known);
  const slots = line.cells.map((index) => known[index]);
  const unknown = slots.filter((value) => value == null).length;
  const picks = unknown === 0 ? [[]] : combinations(leftover, unknown);
  const fairyP =
    revealedCount(known) < MAX_REVEALS && unknown > 0
      ? clampFairyChance(fairyChance) / 100
      : 0;
  const lineFairy = unknown > 0 ? fairyTarget(slots.filter((value) => value != null)) : null;
  return picks
    .map((pick) => {
      let next = 0;
      const numbers = slots.map((value) => (value == null ? pick[next++] : value));
      const valued = comboValue(numbers, fairyP, lineFairy);
      return {
        numbers,
        sum: valued.sum,
        cans: valued.cans,
        natural: valued.natural,
        fairy: valued.fairy,
        known: slots.map((value) => value != null),
      };
    })
    .sort((a, b) => b.cans - a.cans || a.sum - b.sum);
}

const expectedCache = new Map();

function boardKey(board) {
  let key = "";
  for (let i = 0; i < 9; i += 1) {
    key += board[i] == null ? "x" : String(board[i]);
  }
  return key;
}

export function expectedCansPerCard(fairyChance = DEFAULT_FAIRY_CHANCE) {
  const percent = clampFairyChance(fairyChance);
  if (expectedCache.has(percent)) return expectedCache.get(percent);

  const fairyP = percent / 100;
  const valueMemo = new Map();
  const suggestMemo = new Map();
  const analyzeMemo = new Map();

  function analyze(board) {
    const key = boardKey(board);
    if (analyzeMemo.has(key)) return analyzeMemo.get(key);
    const result = analyzeBoard(board, percent);
    analyzeMemo.set(key, result);
    return result;
  }

  function pickCell(board) {
    const key = boardKey(board);
    if (suggestMemo.has(key)) return suggestMemo.get(key);
    const analysis = analyze(board);
    let best = null;
    for (const cell of analysis.empty) {
      const boost = fairyP > 0 ? nextScratchFairy(board, cell, analysis.remaining) : null;
      let weighted = 0;
      for (const number of analysis.remaining) {
        const natural = board.slice();
        natural[cell] = number;
        let score = analyze(natural).bestLine.ev;
        if (boost && number !== boost.missing) {
          const changed = board.slice();
          changed[cell] = boost.missing;
          score = fairyP * analyze(changed).bestLine.ev + (1 - fairyP) * score;
        }
        weighted += score;
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
    suggestMemo.set(key, best);
    return best;
  }

  function value(board) {
    const key = boardKey(board);
    if (valueMemo.has(key)) return valueMemo.get(key);
    const revealed = revealedCount(board);
    let ev;
    if (revealed >= MAX_REVEALS) {
      ev = analyze(board).bestLine.ev;
    } else if (revealed === 0) {
      const leftover = remainingNumbers(board);
      const reps = [
        [0, 4],
        [1, 4],
        [4, 1],
      ];
      let total = 0;
      let weight = 0;
      for (const [index, w] of reps) {
        let inner = 0;
        for (const n of leftover) {
          const next = board.slice();
          next[index] = n;
          inner += value(next);
        }
        total += (w * inner) / leftover.length;
        weight += w;
      }
      ev = total / weight;
    } else {
      const leftover = remainingNumbers(board);
      const cell = pickCell(board).index;
      const boost = fairyP > 0 ? nextScratchFairy(board, cell, leftover) : null;
      let sum = 0;
      for (const n of leftover) {
        const natural = board.slice();
        natural[cell] = n;
        let score = value(natural);
        if (boost && n !== boost.missing) {
          const changed = board.slice();
          changed[cell] = boost.missing;
          score = fairyP * value(changed) + (1 - fairyP) * score;
        }
        sum += score;
      }
      ev = sum / leftover.length;
    }
    valueMemo.set(key, ev);
    return ev;
  }

  const ev = value(Array(9).fill(null));
  expectedCache.set(percent, ev);
  return ev;
}

export function peekExpectedCansPerCard(fairyChance = DEFAULT_FAIRY_CHANCE) {
  const percent = clampFairyChance(fairyChance);
  return expectedCache.has(percent) ? expectedCache.get(percent) : null;
}

export function canPlaceNumber(board, index, number) {
  const n = Number(number);
  if (n < 1 || n > 9) return false;
  return (board || []).every((value, i) => i === index || Number(value) !== n);
}
