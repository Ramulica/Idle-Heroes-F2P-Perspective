/**
 * Imprint Infusion: 3 independent trees.
 * Blue (top-left) + Red (top-right, mirror) use detailed polylines.
 * Green (bottom) keeps the same 3×3→6×8 topology as a placeholder.
 */

export const INFUSION_UNLOCK_LEVEL = 15;

export const BRANCH_META = {
  blue: { label: "Blue", color: "#4aa8ff" },
  red: { label: "Red", color: "#e05050" },
  green: { label: "Green", color: "#3ecf9a" },
};

const pct = (stat, value) => ({ stat, value, unit: "%" });
const flat = (stat, value) => ({ stat, value, unit: "" });

const STEP = 34;

/** SVG y-down: 0° = up, positive deg = left of vertical. */
function dirLeftOfUp(deg) {
  const r = (deg * Math.PI) / 180;
  return [-Math.sin(r), -Math.cos(r)];
}

/** SVG y-down: 0° = up, positive deg = right of vertical. */
function dirRightOfUp(deg) {
  const r = (deg * Math.PI) / 180;
  return [Math.sin(r), -Math.cos(r)];
}

/** Clockwise rotation in screen space (y-down). */
function rotCW(vx, vy, deg) {
  const r = (deg * Math.PI) / 180;
  return [
    vx * Math.cos(r) - vy * Math.sin(r),
    vx * Math.sin(r) + vy * Math.cos(r),
  ];
}

function rotCCW(vx, vy, deg) {
  return rotCW(vx, vy, -deg);
}

function pushNode(list, byId, node) {
  list.push(node);
  byId[node.id] = node;
}

/**
 * Walk polyline segments from a parent node.
 * segments: [{ count, dir: [dx,dy] }] — each step moves STEP along unit dir.
 */
function addPolyline(list, byId, {
  prefix,
  parentId,
  branch,
  segments,
  stats,
}) {
  const parent = byId[parentId];
  let x = parent.x;
  let y = parent.y;
  let prev = parentId;
  let index = 0;
  const total = segments.reduce((sum, seg) => sum + seg.count, 0);

  segments.forEach((seg) => {
    const len = Math.hypot(seg.dir[0], seg.dir[1]) || 1;
    const ux = seg.dir[0] / len;
    const uy = seg.dir[1] / len;
    for (let i = 0; i < seg.count; i += 1) {
      x += ux * STEP;
      y += uy * STEP;
      index += 1;
      const id = `${prefix}${index}`;
      const rowStats =
        typeof stats === "function" ? stats(index - 1, total) : stats || [];
      pushNode(list, byId, {
        id,
        branch,
        x,
        y,
        parentId: prev,
        stats: rowStats,
      });
      prev = id;
    }
  });
  return prev;
}

function addRoot(list, byId, { id, branch, x, y }) {
  pushNode(list, byId, {
    id,
    branch,
    x,
    y,
    parentId: null,
    stats: [],
  });
}

const BLUE_LEAVES = [
  [pct("Armor", 12)],
  [pct("Dodge", 2.5), pct("Block", 7.5)],
  [pct("Control Immunity", 3.3)],
  [pct("Damage Reduction", 3.3), pct("Crit Damage Reduction", 3.3)],
  [pct("All Damage Reduction", 2.5)],
  [pct("Effect of Being Healed", 6.6)],
];

const RED_LEAVES = [
  [pct("Crit", 3.3)],
  [pct("Crit Damage", 9.5)],
  [pct("Holy Damage", 7.5)],
  (i, len) =>
    i === len - 1
      ? [pct("Precision", 6.6), flat("Crit", -50)]
      : [pct("Precision", 6.6)],
  [pct("All Damage Dealt", 3.3)],
  [pct("Damage Reduction Offset", 2.0)],
];

/** Blue top-left detailed geometry (user spec). */
function buildBlue(list, byId, rootX, rootY) {
  const branch = "blue";
  const rootId = "blue-root";
  addRoot(list, byId, { id: rootId, branch, x: rootX, y: rootY });

  const up = dirLeftOfUp(0);
  const left45 = dirLeftOfUp(45);
  const left60 = dirLeftOfUp(60);
  const left120 = dirLeftOfUp(120);
  const right120FromVertical = dirRightOfUp(120);

  // Branch 1: 3 vertical up
  const b1 = addPolyline(list, byId, {
    prefix: "b-1-m",
    parentId: rootId,
    branch,
    segments: [{ count: 3, dir: up }],
    stats: [],
  });

  // 1.1: 8 nodes at -45° from vertical
  addPolyline(list, byId, {
    prefix: "b-1-1-",
    parentId: b1,
    branch,
    segments: [{ count: 8, dir: left45 }],
    stats: BLUE_LEAVES[0],
  });

  // 1.2: 2 vertical, then 6 at -45°
  addPolyline(list, byId, {
    prefix: "b-1-2-",
    parentId: b1,
    branch,
    segments: [
      { count: 2, dir: up },
      { count: 6, dir: left45 },
    ],
    stats: BLUE_LEAVES[1],
  });

  // Branch 2: 3 nodes at -60° from vertical
  const b2 = addPolyline(list, byId, {
    prefix: "b-2-m",
    parentId: rootId,
    branch,
    segments: [{ count: 3, dir: left60 }],
    stats: [],
  });

  // 2.1: 4 continue -60°, then 4 at -120° to the right from that heading
  const b21turn = rotCW(left60[0], left60[1], 120);
  addPolyline(list, byId, {
    prefix: "b-2-1-",
    parentId: b2,
    branch,
    segments: [
      { count: 4, dir: left60 },
      { count: 4, dir: b21turn },
    ],
    stats: BLUE_LEAVES[2],
  });

  // 2.2: 1 @ +120° from vertical, then zigzag -120 / +120 / -120 / +120
  // Counts as written: 1+3+3+1+3 (11) — keep literal so angles can be checked
  let d = right120FromVertical;
  const zig = [{ count: 1, dir: d }];
  d = rotCCW(d[0], d[1], 120);
  zig.push({ count: 3, dir: d });
  d = rotCW(d[0], d[1], 120);
  zig.push({ count: 3, dir: d });
  d = rotCCW(d[0], d[1], 120);
  zig.push({ count: 1, dir: d });
  d = rotCW(d[0], d[1], 120);
  zig.push({ count: 3, dir: d });
  addPolyline(list, byId, {
    prefix: "b-2-2-",
    parentId: b2,
    branch,
    segments: zig,
    stats: BLUE_LEAVES[3],
  });

  // Branch 3: 3 nodes at -120° from vertical
  const b3 = addPolyline(list, byId, {
    prefix: "b-3-m",
    parentId: rootId,
    branch,
    segments: [{ count: 3, dir: left120 }],
    stats: [],
  });

  // 3.1: 6 continue, then 2 at -120° to the left from that heading
  const b31turn = rotCCW(left120[0], left120[1], 120);
  addPolyline(list, byId, {
    prefix: "b-3-1-",
    parentId: b3,
    branch,
    segments: [
      { count: 6, dir: left120 },
      { count: 2, dir: b31turn },
    ],
    stats: BLUE_LEAVES[4],
  });

  // 3.2: 2 @ +60 from heading, 4 @ +120, 2 @ -120 left
  let d3 = rotCW(left120[0], left120[1], 60);
  const b32 = [{ count: 2, dir: d3 }];
  d3 = rotCW(d3[0], d3[1], 120);
  b32.push({ count: 4, dir: d3 });
  d3 = rotCCW(d3[0], d3[1], 120);
  b32.push({ count: 2, dir: d3 });
  addPolyline(list, byId, {
    prefix: "b-3-2-",
    parentId: b3,
    branch,
    segments: b32,
    stats: BLUE_LEAVES[5],
  });
}

/** Red top-right = mirror of blue (left↔right). */
function buildRed(list, byId, rootX, rootY) {
  const branch = "red";
  const rootId = "red-root";
  addRoot(list, byId, { id: rootId, branch, x: rootX, y: rootY });

  const up = dirRightOfUp(0);
  const right45 = dirRightOfUp(45);
  const right60 = dirRightOfUp(60);
  const right120 = dirRightOfUp(120);
  const left120FromVertical = dirLeftOfUp(120);

  const b1 = addPolyline(list, byId, {
    prefix: "r-1-m",
    parentId: rootId,
    branch,
    segments: [{ count: 3, dir: up }],
    stats: [],
  });

  addPolyline(list, byId, {
    prefix: "r-1-1-",
    parentId: b1,
    branch,
    segments: [{ count: 8, dir: right45 }],
    stats: RED_LEAVES[0],
  });

  addPolyline(list, byId, {
    prefix: "r-1-2-",
    parentId: b1,
    branch,
    segments: [
      { count: 2, dir: up },
      { count: 6, dir: right45 },
    ],
    stats: RED_LEAVES[1],
  });

  const b2 = addPolyline(list, byId, {
    prefix: "r-2-m",
    parentId: rootId,
    branch,
    segments: [{ count: 3, dir: right60 }],
    stats: [],
  });

  // Mirror of blue 2.1 turn-right-120 → turn-left-120
  const r21turn = rotCCW(right60[0], right60[1], 120);
  addPolyline(list, byId, {
    prefix: "r-2-1-",
    parentId: b2,
    branch,
    segments: [
      { count: 4, dir: right60 },
      { count: 4, dir: r21turn },
    ],
    stats: RED_LEAVES[2],
  });

  // Mirror of blue 2.2: 1 @ +120 from vertical (mirrored → left), then zig
  let d = left120FromVertical;
  const zig = [{ count: 1, dir: d }];
  d = rotCW(d[0], d[1], 120);
  zig.push({ count: 3, dir: d });
  d = rotCCW(d[0], d[1], 120);
  zig.push({ count: 3, dir: d });
  d = rotCW(d[0], d[1], 120);
  zig.push({ count: 1, dir: d });
  d = rotCCW(d[0], d[1], 120);
  zig.push({ count: 3, dir: d });
  addPolyline(list, byId, {
    prefix: "r-2-2-",
    parentId: b2,
    branch,
    segments: zig,
    stats: RED_LEAVES[3],
  });

  const b3 = addPolyline(list, byId, {
    prefix: "r-3-m",
    parentId: rootId,
    branch,
    segments: [{ count: 3, dir: right120 }],
    stats: [],
  });

  const r31turn = rotCW(right120[0], right120[1], 120);
  addPolyline(list, byId, {
    prefix: "r-3-1-",
    parentId: b3,
    branch,
    segments: [
      { count: 6, dir: right120 },
      { count: 2, dir: r31turn },
    ],
    stats: RED_LEAVES[4],
  });

  // Mirror of blue 3.2: +60 right → -60 left, then flip turn signs
  let d3 = rotCCW(right120[0], right120[1], 60);
  const r32 = [{ count: 2, dir: d3 }];
  d3 = rotCCW(d3[0], d3[1], 120);
  r32.push({ count: 4, dir: d3 });
  d3 = rotCW(d3[0], d3[1], 120);
  r32.push({ count: 2, dir: d3 });
  addPolyline(list, byId, {
    prefix: "r-3-2-",
    parentId: b3,
    branch,
    segments: r32,
    stats: RED_LEAVES[5],
  });
}

/** Green bottom placeholder — same abstract 3×3→6×8, pointing down. */
function buildGreenPlaceholder(list, byId, rootX, rootY) {
  const branch = "green";
  const rootId = "green-root";
  addRoot(list, byId, { id: rootId, branch, x: rootX, y: rootY });

  const d0 = dirLeftOfUp(180);
  const dL = dirLeftOfUp(180 - 40);
  const dR = dirRightOfUp(180 - 40);

  const leaves = [
    [pct("Control Immunity Offset", 2.5)],
    [flat("Speed", 20)],
    [],
    [],
    [],
    [],
  ];

  [dL, d0, dR].forEach((dir, armIndex) => {
    const mid = addPolyline(list, byId, {
      prefix: `g-a${armIndex}-m`,
      parentId: rootId,
      branch,
      segments: [{ count: 3, dir }],
      stats: [],
    });
    const left = rotCCW(dir[0], dir[1], 18);
    const right = rotCW(dir[0], dir[1], 18);
    [left, right].forEach((leafDir, leafIndex) => {
      addPolyline(list, byId, {
        prefix: `g-a${armIndex}-l${leafIndex}-`,
        parentId: mid,
        branch,
        segments: [{ count: 8, dir: leafDir }],
        stats: leaves[armIndex * 2 + leafIndex],
      });
    });
  });
}

function buildTree() {
  const list = [];
  const byId = {};

  // Upside-down equilateral triangle — roots closer toward center
  const cx = 500;
  const topY = 390;
  const half = 58;
  const blue = [cx - half, topY];
  const red = [cx + half, topY];
  const green = [cx, topY + half * Math.sqrt(3)];

  buildBlue(list, byId, blue[0], blue[1]);
  buildRed(list, byId, red[0], red[1]);
  buildGreenPlaceholder(list, byId, green[0], green[1]);

  return { list, byId };
}

const built = buildTree();
export const INFUSION_NODES = built.list;
export const INFUSION_NODE_BY_ID = built.byId;

export const INFUSION_EDGES = INFUSION_NODES.filter((n) => n.parentId).map(
  (n) => ({
    from: n.parentId,
    to: n.id,
  })
);

export const INFUSION_ROOTS = ["blue-root", "red-root", "green-root"];

export function infusionPointBudget(level) {
  const n = Math.round(Number(level));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n - INFUSION_UNLOCK_LEVEL);
}

export function normalizeInfusionNodes(rawIds, budget) {
  const selected = [];
  const seen = new Set();
  const max = Math.max(0, Number(budget) || 0);
  for (const id of Array.isArray(rawIds) ? rawIds : []) {
    if (selected.length >= max) break;
    if (!INFUSION_NODE_BY_ID[id] || seen.has(id)) continue;
    const node = INFUSION_NODE_BY_ID[id];
    if (node.parentId && !seen.has(node.parentId)) continue;
    seen.add(id);
    selected.push(id);
  }
  return selected;
}

export function canSelectInfusionNode(selectedSet, id, budget) {
  const node = INFUSION_NODE_BY_ID[id];
  if (!node) return false;
  if (selectedSet.has(id)) return false;
  if (selectedSet.size >= budget) return false;
  if (node.parentId && !selectedSet.has(node.parentId)) return false;
  return true;
}

function descendantsOf(id) {
  const kids = INFUSION_NODES.filter((n) => n.parentId === id).map((n) => n.id);
  const out = [...kids];
  kids.forEach((kid) => out.push(...descendantsOf(kid)));
  return out;
}

export function toggleInfusionNode(selectedIds, id, budget) {
  const selected = [...selectedIds];
  const set = new Set(selected);
  if (set.has(id)) {
    const drop = new Set([id, ...descendantsOf(id)]);
    return selected.filter((x) => !drop.has(x));
  }
  if (!canSelectInfusionNode(set, id, budget)) return selected;
  return [...selected, id];
}

export function collectInfusionStats(selectedIds) {
  const rows = [];
  for (const id of selectedIds || []) {
    const node = INFUSION_NODE_BY_ID[id];
    if (!node?.stats?.length) continue;
    for (const row of node.stats) rows.push({ ...row });
  }
  return rows;
}

export function infusionNodeTip(node) {
  if (!node) return "";
  if (!node.stats?.length) return "Path node";
  return node.stats
    .map((s) => {
      const sign = s.value > 0 ? "+" : "";
      const unit = s.unit === "%" ? "%" : "";
      return `${s.stat} ${sign}${s.value}${unit}`;
    })
    .join(" · ");
}
