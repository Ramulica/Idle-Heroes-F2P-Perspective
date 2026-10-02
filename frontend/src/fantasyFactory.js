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

function uniqueRotations(cells) {
  const seen = new Set();
  const out = [];
  for (let k = 0; k < 6; k += 1) {
    const rot = rotateCells(cells, k);
    const id = rot.map(([q, r]) => `${q},${r}`).join(";");
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(rot);
  }
  return out;
}

function makePiece(id, rarity, cells) {
  const norm = normalizeCells(cells);
  return {
    id,
    rarity,
    cells: norm,
    size: norm.length,
    rotations: uniqueRotations(norm),
  };
}

export const COMMON_PIECES = [
  makePiece("c1", "common", [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ]),
  makePiece("c2", "common", [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ]),
  makePiece("c3", "common", [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
  ]),
  makePiece("c4", "common", [
    [0, 0],
    [1, 0],
    [1, -1],
    [2, -1],
  ]),
  makePiece("c5", "common", [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
  ]),
  makePiece("c6", "common", [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, -1],
  ]),
  makePiece("c7", "common", [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
  ]),
  makePiece("c8", "common", [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, -1],
  ]),
  makePiece("c9", "common", [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ]),
  makePiece("c10", "common", [
    [0, 0],
    [1, 0],
    [0, -1],
    [-1, 1],
  ]),
];

const HEX7 = [
  [0, 0],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];
const HEX6 = [
  [0, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

export const RARE_PIECES = [
  makePiece("r1", "rare", HEX6),
  makePiece("r2", "rare", rotateCells(HEX6, 1)),
  makePiece("r3", "rare", rotateCells(HEX6, 2)),
  makePiece("r4", "rare", HEX7),
];

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

function eachPlacement(piece, remaining, fn) {
  const spins = piece.rotations || uniqueRotations(piece.cells);
  spins.forEach((cells) => {
    const rotated = { ...piece, cells };
    originsFor(rotated, remaining).forEach(([oq, or]) => {
      fn(scorePlacement(rotated, oq, or, remaining));
    });
  });
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

function perfectFit(keys, pieces) {
  const remaining = new Set(keys);
  const size = remaining.size;
  for (let i = 0; i < pieces.length; i += 1) {
    const piece = pieces[i];
    if (piece.size !== size) continue;
    let found = false;
    eachPlacement(piece, remaining, (scored) => {
      if (found) return;
      if (scored.waste === 0 && scored.hit === size) found = true;
    });
    if (found) return true;
  }
  return false;
}

function bestBite(piece, remaining) {
  let best = null;
  eachPlacement(piece, remaining, (scored) => {
    const leftover = subtractKeys(remaining, scored.hitKeys);
    const cost = scored.waste * 22 + cheapLeftover(leftover);
    if (!best || cost < best.cost) best = { cost, scored, leftover };
  });
  return best;
}

function cheapLeftover(remaining) {
  if (!remaining.size) return 0;
  const groups = components(remaining);
  let cost = groups.length * 6;
  groups.forEach((group) => {
    const n = group.length;
    if (n === 1) cost += 140;
    else if (n === 2) cost += 80;
    else if (n === 3) cost += 70;
    else if (n === 4) cost += perfectFit(group, COMMON_PIECES) ? 2 : 55;
    else if (n === 5) cost += 48;
    else if (n === 6) cost += perfectFit(group, RARE_PIECES) ? 4 : 36;
    else if (n === 7) cost += perfectFit(group, RARE_PIECES) ? 3 : 32;
    else if (n % 4 === 1) cost += 18 + n;
    else if (n % 4 === 2) cost += 14 + n;
    else if (n % 4 === 3) cost += 16 + n;
    else cost += 8 + n;
  });
  return cost;
}

function expectedFuture(remaining) {
  if (!remaining.size) return 0;
  const base = cheapLeftover(remaining);
  if (remaining.size > 22) return base;
  let common = 0;
  COMMON_PIECES.forEach((piece) => {
    const bite = bestBite(piece, remaining);
    common += bite ? bite.cost : base + 40;
  });
  let rare = 0;
  RARE_PIECES.forEach((piece) => {
    const bite = bestBite(piece, remaining);
    rare += bite ? bite.cost : base + 40;
  });
  return (
    COMMON_CHANCE * (common / COMMON_PIECES.length) +
    RARE_CHANCE * (rare / RARE_PIECES.length)
  );
}

let leftoverMemo = new Map();

function leftoverKey(remaining) {
  return [...remaining].sort().join(";");
}

export function leftoverShapeCost(remaining) {
  if (!remaining.size) return 0;
  const key = leftoverKey(remaining);
  if (leftoverMemo.has(key)) return leftoverMemo.get(key);
  const extra = remaining.size <= 12 ? expectedFuture(remaining) * 0.5 : 0;
  const value = cheapLeftover(remaining) + extra;
  leftoverMemo.set(key, value);
  return value;
}

function pack(value, main, next, leftover, remainingAfterMain) {
  return {
    value,
    main,
    next,
    leftover: leftover.size,
    leftoverKeys: leftover,
    remainingAfterMain,
  };
}

export function bestMainPlacement(remainingKeys, mainPiece, nextPiece = null) {
  leftoverMemo = new Map();
  const remaining = remainingSet(remainingKeys);
  if (!mainPiece || remaining.size === 0) return null;

  let best = null;
  let bestMainWaste = Infinity;
  let bestNextWaste = Infinity;
  let bestLeft = Infinity;
  let leftoverGoodEnough = false;

  function consider(main, next, leftover, afterMainSize) {
    const nextW = next ? next.waste : 0;
    if (main.waste > bestMainWaste) return;
    if (main.waste < bestMainWaste) {
      bestMainWaste = main.waste;
      bestNextWaste = Infinity;
      bestLeft = Infinity;
      leftoverGoodEnough = false;
      best = null;
    }
    if (nextW > bestNextWaste) return;
    if (nextW < bestNextWaste) {
      bestNextWaste = nextW;
      bestLeft = Infinity;
      leftoverGoodEnough = false;
      best = null;
    }
    if (leftoverGoodEnough) return;
    const leftCost =
      leftover.size > 16 ? cheapLeftover(leftover) : leftoverShapeCost(leftover);
    if (leftCost < bestLeft) {
      bestLeft = leftCost;
      best = pack(leftCost, main, next, leftover, afterMainSize);
      leftoverGoodEnough = leftover.size > 20 && leftCost < 80;
    }
  }

  eachPlacement(mainPiece, remaining, (main) => {
    if (main.waste > bestMainWaste) return;
    const afterMain = subtractKeys(remaining, main.hitKeys);

    if (!nextPiece || afterMain.size === 0) {
      consider(main, null, afterMain, afterMain.size);
      return;
    }

    eachPlacement(nextPiece, afterMain, (next) => {
      if (main.waste === bestMainWaste && next.waste > bestNextWaste) return;
      consider(
        main,
        next,
        subtractKeys(afterMain, next.hitKeys),
        afterMain.size
      );
    });
  });

  return best;
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
