/** Pointy-top axial neighbours: E, NE, NW, W, SW, SE */
export const HEX_DIRS = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

export const BOARD_ROWS = 7;
export const BOARD_COLS = 20;
export const COMMON_CHANCE = 0.8;
export const RARE_CHANCE = 0.2;

export function cellKey(q, r) {
  return `${q},${r}`;
}

export function parseKey(key) {
  const [q, r] = String(key).split(",").map(Number);
  return [q, r];
}

export function oddRToAxial(col, row) {
  return [col - (row - (row & 1)) / 2, row];
}

export function axialToOddR(q, r) {
  return [q + (r - (r & 1)) / 2, r];
}

export function rotateAxial(q, r) {
  return [-r, q + r];
}

export function normalizeCells(cells) {
  const sorted = cells
    .map(([q, r]) => [q, r])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const [oq, or] = sorted[0];
  return sorted.map(([q, r]) => [q - oq, r - or]);
}

export function rotateCells(cells, times = 1) {
  let out = cells.map(([q, r]) => [q, r]);
  const n = ((times % 6) + 6) % 6;
  for (let i = 0; i < n; i += 1) {
    out = out.map(([q, r]) => rotateAxial(q, r));
  }
  return normalizeCells(out);
}

function fingerprint(cells) {
  return normalizeCells(cells)
    .map(([q, r]) => `${q},${r}`)
    .join(";");
}

function uniqueOrientations(seed) {
  const seen = new Set();
  const out = [];
  for (let k = 0; k < 6; k += 1) {
    const cells = rotateCells(seed, k);
    const id = fingerprint(cells);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(cells);
  }
  return out;
}

export function axialPixel(q, r, size) {
  return {
    x: size * Math.sqrt(3) * (q + r / 2),
    y: size * 1.5 * r,
  };
}

export function hexCornerPoints(q, r, size) {
  const { x, y } = axialPixel(q, r, size);
  const pts = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    pts.push(`${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

export const BOARD_CELLS = (() => {
  const cells = [];
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const [q, r] = oddRToAxial(col, row);
      cells.push({ col, row, q, r, key: cellKey(q, r) });
    }
  }
  return cells;
})();

export const BOARD_KEYS = new Set(BOARD_CELLS.map((cell) => cell.key));

const BOARD_PIX = BOARD_CELLS.map((cell) => axialPixel(cell.q, cell.r, 1));
export const BOARD_BOUNDS = {
  minX: Math.min(...BOARD_PIX.map((p) => p.x)),
  maxX: Math.max(...BOARD_PIX.map((p) => p.x)),
  minY: Math.min(...BOARD_PIX.map((p) => p.y)),
  maxY: Math.max(...BOARD_PIX.map((p) => p.y)),
};

function makePieces(rarity, seeds) {
  const pieces = [];
  seeds.forEach((seed, seedIndex) => {
    uniqueOrientations(seed).forEach((cells, orient) => {
      pieces.push({
        id: `${rarity[0]}${seedIndex + 1}${orient}`,
        rarity,
        cells,
        size: cells.length,
      });
    });
  });
  return pieces;
}

export const COMMON_PIECES = makePieces("common", [
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [1, -1],
  ],
]);

export const RARE_PIECES = makePieces("rare", [
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, -1],
    [1, 1],
  ],
]);

export const ALL_PIECES = [...COMMON_PIECES, ...RARE_PIECES];

export function pieceById(id) {
  return ALL_PIECES.find((piece) => piece.id === id) || null;
}

export function remainingSet(keys) {
  return new Set(keys || []);
}

export function translateCells(cells, oq, or) {
  return cells.map(([q, r]) => [q + oq, r + or]);
}

export function originsFor(piece, remaining) {
  const seen = new Set();
  const origins = [];
  remaining.forEach((key) => {
    const [tq, tr] = parseKey(key);
    piece.cells.forEach(([pq, pr]) => {
      const oq = tq - pq;
      const or = tr - pr;
      const ok = cellKey(oq, or);
      if (seen.has(ok)) return;
      seen.add(ok);
      origins.push([oq, or]);
    });
  });
  return origins;
}

export function scorePlacement(piece, oq, or, remaining) {
  const world = translateCells(piece.cells, oq, or);
  const hitKeys = [];
  const wasteKeys = [];
  world.forEach(([q, r]) => {
    const key = cellKey(q, r);
    if (remaining.has(key)) hitKeys.push(key);
    else wasteKeys.push(key);
  });
  return {
    origin: [oq, or],
    world,
    hitKeys,
    wasteKeys,
    hit: hitKeys.length,
    waste: wasteKeys.length,
  };
}

function subtractKeys(remaining, keys) {
  const next = new Set(remaining);
  keys.forEach((key) => next.delete(key));
  return next;
}

function components(remaining) {
  const left = new Set(remaining);
  const groups = [];
  left.forEach((start) => {
    if (!left.has(start)) return;
    const group = [];
    const stack = [start];
    left.delete(start);
    while (stack.length) {
      const key = stack.pop();
      group.push(key);
      const [q, r] = parseKey(key);
      HEX_DIRS.forEach(([dq, dr]) => {
        const nkey = cellKey(q + dq, r + dr);
        if (!left.has(nkey)) return;
        left.delete(nkey);
        stack.push(nkey);
      });
    }
    groups.push(group);
  });
  return groups;
}

function exactlyCoveredByCatalog(keys) {
  const remaining = new Set(keys);
  const size = remaining.size;
  if (size !== 3 && size !== 5) return false;
  for (let i = 0; i < ALL_PIECES.length; i += 1) {
    const piece = ALL_PIECES[i];
    if (piece.size !== size) continue;
    const origins = originsFor(piece, remaining);
    for (let j = 0; j < origins.length; j += 1) {
      const [oq, or] = origins[j];
      const scored = scorePlacement(piece, oq, or, remaining);
      if (scored.waste === 0 && scored.hit === size) return true;
    }
  }
  return false;
}

export function leftoverShapeCost(remaining) {
  if (!remaining.size) return 0;
  const groups = components(remaining);
  const detailed = remaining.size <= 24;
  let cost = 0;
  groups.forEach((group) => {
    const n = group.length;
    if (detailed && (n === 3 || n === 5) && exactlyCoveredByCatalog(group)) {
      cost += 1;
      return;
    }
    if (n === 1) cost += 55;
    else if (n === 2) cost += 34;
    else if (n === 4) cost += 18;
    else if (n % 3 === 1) cost += 12 + n;
    else if (n % 3 === 2) cost += 8 + n;
    else cost += 4 + n;
  });
  return cost + groups.length * 3;
}

function coarseValue(mainWaste, nextWaste, leftoverSize) {
  return mainWaste * 1_000_000 + nextWaste * 10_000 + leftoverSize * 80;
}

function finishBest(candidates, bestCoarse) {
  let best = null;
  candidates.forEach((row) => {
    if (row.coarse > bestCoarse) return;
    const value = row.coarse + leftoverShapeCost(row.leftover);
    if (!best || value < best.value) {
      best = {
        value,
        main: row.main,
        next: row.next,
        leftover: row.leftover.size,
        leftoverKeys: row.leftover,
        remainingAfterMain: row.remainingAfterMain,
      };
    }
  });
  return best;
}

function searchMains(remaining, mainPiece, attachNext) {
  const candidates = [];
  let bestCoarse = Infinity;
  originsFor(mainPiece, remaining).forEach(([oq, or]) => {
    const main = scorePlacement(mainPiece, oq, or, remaining);
    const afterMain = subtractKeys(remaining, main.hitKeys);
    attachNext(main, afterMain, (next, leftover) => {
      const coarse = coarseValue(main.waste, next ? next.waste : 0, leftover.size);
      if (coarse > bestCoarse) return;
      if (coarse < bestCoarse) {
        bestCoarse = coarse;
        candidates.length = 0;
      }
      if (leftover.size > 24 && candidates.length) return;
      candidates.push({
        coarse,
        main,
        next,
        leftover,
        remainingAfterMain: afterMain.size,
      });
    });
  });
  return finishBest(candidates, bestCoarse);
}

export function bestMainPlacement(remainingKeys, mainPiece, nextPiece = null) {
  const remaining = remainingSet(remainingKeys);
  if (!mainPiece || remaining.size === 0) return null;
  const pairSearch = Boolean(nextPiece) && remaining.size <= 36;

  if (!pairSearch) {
    const mainOnly = searchMains(remaining, mainPiece, (main, afterMain, consider) => {
      consider(null, afterMain);
    });
    if (!mainOnly || !nextPiece || mainOnly.leftoverKeys.size === 0) return mainOnly;
    const follow = searchMains(mainOnly.leftoverKeys, nextPiece, (next, leftover, consider) => {
      consider(next, leftover);
    });
    if (!follow) return mainOnly;
    return {
      ...mainOnly,
      next: follow.main,
      leftover: follow.leftover,
      leftoverKeys: follow.leftoverKeys,
      value: coarseValue(mainOnly.main.waste, follow.main.waste, follow.leftover) + leftoverShapeCost(follow.leftoverKeys),
    };
  }

  return searchMains(remaining, mainPiece, (main, afterMain, consider) => {
    if (afterMain.size === 0) {
      consider(null, afterMain);
      return;
    }
    originsFor(nextPiece, afterMain).forEach(([nq, nr]) => {
      const next = scorePlacement(nextPiece, nq, nr, afterMain);
      consider(next, subtractKeys(afterMain, next.hitKeys));
    });
  });
}

export function applyPlacement(remainingKeys, placement) {
  if (!placement?.main) return [...remainingKeys];
  const next = new Set(remainingKeys);
  placement.main.hitKeys.forEach((key) => next.delete(key));
  return [...next];
}

export function expectedPieceMix() {
  return { common: COMMON_CHANCE, rare: RARE_CHANCE };
}
