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

const STEP = 54;

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

/**
 * Absolute heading in general degrees: 0° = right, CCW (90° = up, 180° = left).
 * SVG y-down.
 */
function dirAbsolute(deg) {
  const r = (deg * Math.PI) / 180;
  return [Math.cos(r), -Math.sin(r)];
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
  const left60 = dirLeftOfUp(60);
  const left120 = dirLeftOfUp(120);

  // Branch 1: 3 vertical up
  const b1 = addPolyline(list, byId, {
    prefix: "b-1-m",
    parentId: rootId,
    branch,
    segments: [{ count: 3, dir: up }],
    stats: [],
  });

  // 1.1: 8 nodes at absolute 150° (user 210° / up-left)
  addPolyline(list, byId, {
    prefix: "b-1-1-",
    parentId: b1,
    branch,
    segments: [{ count: 8, dir: dirAbsolute(150) }],
    stats: BLUE_LEAVES[0],
  });

  // 1.2: 2 vertical, then 6 at absolute 150°
  addPolyline(list, byId, {
    prefix: "b-1-2-",
    parentId: b1,
    branch,
    segments: [
      { count: 2, dir: up },
      { count: 6, dir: dirAbsolute(150) },
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

  // 2.1: 4 continue -60°, then 4 on absolute 210°
  addPolyline(list, byId, {
    prefix: "b-2-1-",
    parentId: b2,
    branch,
    segments: [
      { count: 4, dir: left60 },
      { count: 4, dir: dirAbsolute(210) },
    ],
    stats: BLUE_LEAVES[2],
  });

  // 2.2: user 150↔210 swapped → 210/150 zigzag
  addPolyline(list, byId, {
    prefix: "b-2-2-",
    parentId: b2,
    branch,
    segments: [
      { count: 1, dir: dirAbsolute(210) },
      { count: 2, dir: dirAbsolute(150) },
      { count: 2, dir: dirAbsolute(210) },
      { count: 1, dir: dirAbsolute(150) },
      { count: 2, dir: dirAbsolute(210) },
    ],
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

  // 3.1: 6 continue, then 2 on absolute 150°
  addPolyline(list, byId, {
    prefix: "b-3-1-",
    parentId: b3,
    branch,
    segments: [
      { count: 6, dir: left120 },
      { count: 2, dir: dirAbsolute(150) },
    ],
    stats: BLUE_LEAVES[4],
  });

  // 3.2: first 2 keep +60 from branch-3 heading, then 4@210, 2@150
  const b32first = rotCW(left120[0], left120[1], 60);
  addPolyline(list, byId, {
    prefix: "b-3-2-",
    parentId: b3,
    branch,
    segments: [
      { count: 2, dir: b32first },
      { count: 4, dir: dirAbsolute(210) },
      { count: 2, dir: dirAbsolute(150) },
    ],
    stats: BLUE_LEAVES[5],
  });
}

/** Red top-right = mirror of blue (left↔right). */
function buildRed(list, byId, rootX, rootY) {
  const branch = "red";
  const rootId = "red-root";
  addRoot(list, byId, { id: rootId, branch, x: rootX, y: rootY });

  const up = dirRightOfUp(0);
  const right60 = dirRightOfUp(60);
  const right120 = dirRightOfUp(120);

  const b1 = addPolyline(list, byId, {
    prefix: "r-1-m",
    parentId: rootId,
    branch,
    segments: [{ count: 3, dir: up }],
    stats: [],
  });

  // Mirror of blue 1.1 @150 → 30°
  addPolyline(list, byId, {
    prefix: "r-1-1-",
    parentId: b1,
    branch,
    segments: [{ count: 8, dir: dirAbsolute(30) }],
    stats: RED_LEAVES[0],
  });

  // Mirror of blue 1.2: 2 up, then 6 @ 30°
  addPolyline(list, byId, {
    prefix: "r-1-2-",
    parentId: b1,
    branch,
    segments: [
      { count: 2, dir: up },
      { count: 6, dir: dirAbsolute(30) },
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

  // Mirror of blue 2.1 @210 → 330°
  addPolyline(list, byId, {
    prefix: "r-2-1-",
    parentId: b2,
    branch,
    segments: [
      { count: 4, dir: right60 },
      { count: 4, dir: dirAbsolute(330) },
    ],
    stats: RED_LEAVES[2],
  });

  // Mirror of blue 2.2: 210→330, 150→30
  addPolyline(list, byId, {
    prefix: "r-2-2-",
    parentId: b2,
    branch,
    segments: [
      { count: 1, dir: dirAbsolute(330) },
      { count: 2, dir: dirAbsolute(30) },
      { count: 2, dir: dirAbsolute(330) },
      { count: 1, dir: dirAbsolute(30) },
      { count: 2, dir: dirAbsolute(330) },
    ],
    stats: RED_LEAVES[3],
  });

  const b3 = addPolyline(list, byId, {
    prefix: "r-3-m",
    parentId: rootId,
    branch,
    segments: [{ count: 3, dir: right120 }],
    stats: [],
  });

  // Mirror of blue 3.1 @150 → 30°
  addPolyline(list, byId, {
    prefix: "r-3-1-",
    parentId: b3,
    branch,
    segments: [
      { count: 6, dir: right120 },
      { count: 2, dir: dirAbsolute(30) },
    ],
    stats: RED_LEAVES[4],
  });

  // Mirror of blue 3.2: 210→330, 150→30
  const r32first = rotCCW(right120[0], right120[1], 60);
  addPolyline(list, byId, {
    prefix: "r-3-2-",
    parentId: b3,
    branch,
    segments: [
      { count: 2, dir: r32first },
      { count: 4, dir: dirAbsolute(330) },
      { count: 2, dir: dirAbsolute(30) },
    ],
    stats: RED_LEAVES[5],
  });
}

/**
 * Green grows down from the bottom root. User angles are given in the same
 * "up" frame as blue/red (90=up, 150=up-left, 30=up-right); map to down by +180°.
 * Branch 1 (right): user 150 → 330. Branch 3 (left mirror): → 210. Branch 2: → 270.
 */
function buildGreen(list, byId, rootX, rootY) {
  const branch = "green";
  const rootId = "green-root";
  addRoot(list, byId, { id: rootId, branch, x: rootX, y: rootY });

  const down = dirAbsolute(270);
  const downRight = dirAbsolute(330); // user 150
  const downLeft = dirAbsolute(210); // user 30 / mirror of 150

  const leaves = [
    [pct("Control Immunity Offset", 2.5)],
    [flat("Speed", 20)],
    [],
    [],
    [],
    [],
  ];

  // Branch 1 (right): 3 @ user 150° → 330°, then split
  const b1 = addPolyline(list, byId, {
    prefix: "g-1-m",
    parentId: rootId,
    branch,
    segments: [{ count: 3, dir: downRight }],
    stats: [],
  });

  // 1.1: 3 @ 150→330, 5 @ 90→270
  addPolyline(list, byId, {
    prefix: "g-1-1-",
    parentId: b1,
    branch,
    segments: [
      { count: 3, dir: downRight },
      { count: 5, dir: down },
    ],
    stats: leaves[0],
  });

  // 1.2: 1 @ 90→270, 1 @ 150→330, 6 @ 90→270
  addPolyline(list, byId, {
    prefix: "g-1-2-",
    parentId: b1,
    branch,
    segments: [
      { count: 1, dir: down },
      { count: 1, dir: downRight },
      { count: 6, dir: down },
    ],
    stats: leaves[1],
  });

  // Branch 2 (center): 3 @ 90→270, then split
  const b2 = addPolyline(list, byId, {
    prefix: "g-2-m",
    parentId: rootId,
    branch,
    segments: [{ count: 3, dir: down }],
    stats: [],
  });

  // 2.1: 2 @ 150→330, 3 @ 90→270, 1 @ 30→210, 2 @ 90→270
  addPolyline(list, byId, {
    prefix: "g-2-1-",
    parentId: b2,
    branch,
    segments: [
      { count: 2, dir: downRight },
      { count: 3, dir: down },
      { count: 1, dir: downLeft },
      { count: 2, dir: down },
    ],
    stats: leaves[2],
  });

  // 2.2: 2 @ 30→210, 3 @ 90→270, 1 @ 150→330, 2 @ 90→270
  addPolyline(list, byId, {
    prefix: "g-2-2-",
    parentId: b2,
    branch,
    segments: [
      { count: 2, dir: downLeft },
      { count: 3, dir: down },
      { count: 1, dir: downRight },
      { count: 2, dir: down },
    ],
    stats: leaves[3],
  });

  // Branch 3 (left): mirror of branch 1
  const b3 = addPolyline(list, byId, {
    prefix: "g-3-m",
    parentId: rootId,
    branch,
    segments: [{ count: 3, dir: downLeft }],
    stats: [],
  });

  // 3.1: mirror of 1.1
  addPolyline(list, byId, {
    prefix: "g-3-1-",
    parentId: b3,
    branch,
    segments: [
      { count: 3, dir: downLeft },
      { count: 5, dir: down },
    ],
    stats: leaves[4],
  });

  // 3.2: mirror of 1.2
  addPolyline(list, byId, {
    prefix: "g-3-2-",
    parentId: b3,
    branch,
    segments: [
      { count: 1, dir: down },
      { count: 1, dir: downLeft },
      { count: 6, dir: down },
    ],
    stats: leaves[5],
  });
}

function buildTree() {
  const list = [];
  const byId = {};

  // Upside-down equilateral triangle — roots tight; large STEP
  const cx = 560;
  const topY = 560;
  const half = 24;
  const blue = [cx - half, topY];
  const red = [cx + half, topY];
  const green = [cx, topY + half * Math.sqrt(3)];

  buildBlue(list, byId, blue[0], blue[1]);
  buildRed(list, byId, red[0], red[1]);
  buildGreen(list, byId, green[0], green[1]);

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

/** Map points stop accruing after this infusion level. */
export const INFUSION_POINT_CAP_LEVEL = 40;

/**
 * Map points from infusion level:
 * 15–30 → +1 per level (16 pts at 30), 31–40 → +3 per level (+30 at 40). Cap 46.
 */
export function infusionPointBudget(level) {
  const n = Math.round(Number(level));
  if (!Number.isFinite(n) || n < INFUSION_UNLOCK_LEVEL) return 0;
  const tier1 = Math.min(n, 30) - 14; // level 15 → 1 … 30 → 16
  const tier2 = n >= 31 ? (Math.min(n, INFUSION_POINT_CAP_LEVEL) - 30) * 3 : 0;
  return tier1 + tier2;
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

/**
 * Unselected nodes from the nearest selected ancestor (or root) down to `id`,
 * ordered root→leaf so parents are selected before children.
 */
function missingPathTo(id, selectedSet) {
  const node = INFUSION_NODE_BY_ID[id];
  if (!node) return null;
  const chain = [];
  let cur = node;
  while (cur) {
    if (selectedSet.has(cur.id)) break;
    chain.push(cur.id);
    if (!cur.parentId) break;
    cur = INFUSION_NODE_BY_ID[cur.parentId];
    if (!cur) return null;
  }
  chain.reverse();
  return chain;
}

export function canSelectInfusionNode(selectedSet, id, budget) {
  const node = INFUSION_NODE_BY_ID[id];
  if (!node) return false;
  if (selectedSet.has(id)) return false;
  const chain = missingPathTo(id, selectedSet);
  if (!chain?.length) return false;
  return selectedSet.size + chain.length <= budget;
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
  const chain = missingPathTo(id, set);
  if (!chain?.length) return selected;
  if (set.size + chain.length > budget) return selected;
  return [...selected, ...chain];
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

/** Aggregate selected node stats for the map summary. */
export function summarizeInfusionStats(selectedIds) {
  const map = new Map();
  for (const row of collectInfusionStats(selectedIds)) {
    const key = `${row.stat}|${row.unit || ""}`;
    const prev = map.get(key);
    if (prev) prev.value += row.value;
    else map.set(key, { stat: row.stat, value: row.value, unit: row.unit || "" });
  }
  return [...map.values()].sort((a, b) => a.stat.localeCompare(b.stat));
}

export function formatInfusionStatLine(row) {
  if (!row) return "";
  const sign = row.value > 0 ? "+" : "";
  const unit = row.unit === "%" ? "%" : "";
  return `${row.stat} ${sign}${row.value}${unit}`;
}

export function infusionNodeTip(node) {
  if (!node) return "";
  if (!node.stats?.length) return "Path node";
  return node.stats.map(formatInfusionStatLine).join(" · ");
}
