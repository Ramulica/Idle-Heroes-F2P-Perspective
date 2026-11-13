/**
 * Imprint Infusion: 3 independent trees (blue NW, red NE, green S).
 * Each side: root → 3 arms × 3 nodes → each arm splits to 2 → 8 nodes each (6 ways).
 */

export const INFUSION_UNLOCK_LEVEL = 15;

export const BRANCH_META = {
  blue: { label: "Blue", color: "#4aa8ff" },
  red: { label: "Red", color: "#e05050" },
  green: { label: "Green", color: "#3ecf9a" },
};

const pct = (stat, value) => ({ stat, value, unit: "%" });
const flat = (stat, value) => ({ stat, value, unit: "" });

function pushNode(list, byId, node) {
  list.push(node);
  byId[node.id] = node;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** n points from near start toward end (inclusive of end). */
function pointsToward(x0, y0, x1, y1, n) {
  const out = [];
  for (let i = 1; i <= n; i += 1) {
    const t = i / n;
    out.push([lerp(x0, x1, t), lerp(y0, y1, t)]);
  }
  return out;
}

function addChain(list, byId, { prefix, count, parentId, branch, stats, points }) {
  let prev = parentId;
  for (let i = 0; i < count; i += 1) {
    const id = `${prefix}${i + 1}`;
    const [x, y] = points[i];
    const rowStats =
      typeof stats === "function" ? stats(i, count) : stats || [];
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
  return prev;
}

/**
 * Build one independent side tree.
 * leafStats: length-6 array of stats (or stats fn) for the 6 outer ways.
 * armAngles: 3 angles in radians for the mid arms from root.
 */
function buildSide(list, byId, {
  branch,
  rootId,
  rootX,
  rootY,
  armAngles,
  armLen = 120,
  leafLen = 220,
  leafSpread = 0.28,
  leafStats,
}) {
  pushNode(list, byId, {
    id: rootId,
    branch,
    x: rootX,
    y: rootY,
    parentId: null,
    stats: [],
  });

  armAngles.forEach((angle, armIndex) => {
    const midEndX = rootX + Math.cos(angle) * armLen;
    const midEndY = rootY + Math.sin(angle) * armLen;
    const midPoints = pointsToward(rootX, rootY, midEndX, midEndY, 3);
    const midLast = addChain(list, byId, {
      prefix: `${branch[0]}-a${armIndex}-m`,
      count: 3,
      parentId: rootId,
      branch,
      stats: [],
      points: midPoints,
    });

    [-1, 1].forEach((side, leafIndex) => {
      const wayIndex = armIndex * 2 + leafIndex;
      const leafAngle = angle + side * leafSpread;
      const leafEndX = midEndX + Math.cos(leafAngle) * leafLen;
      const leafEndY = midEndY + Math.sin(leafAngle) * leafLen;
      const leafPoints = pointsToward(midEndX, midEndY, leafEndX, leafEndY, 8);
      const statsSpec = leafStats[wayIndex] || [];
      addChain(list, byId, {
        prefix: `${branch[0]}-a${armIndex}-l${leafIndex}-`,
        count: 8,
        parentId: midLast,
        branch,
        stats: statsSpec,
        points: leafPoints,
      });
    });
  });
}

function buildTree() {
  const list = [];
  const byId = {};

  // Blue NW — 6 ways: black, white, yellow, brown, green, red
  buildSide(list, byId, {
    branch: "blue",
    rootId: "blue-root",
    rootX: 380,
    rootY: 360,
    armAngles: [(-150 * Math.PI) / 180, (-110 * Math.PI) / 180, (-70 * Math.PI) / 180],
    leafStats: [
      [pct("Armor", 12)],
      [pct("Dodge", 2.5), pct("Block", 7.5)],
      [pct("Control Immunity", 3.3)],
      [pct("Damage Reduction", 3.3), pct("Crit Damage Reduction", 3.3)],
      [pct("All Damage Reduction", 2.5)],
      [pct("Effect of Being Healed", 6.6)],
    ],
  });

  // Red NE — 6 ways: black, white, yellow, brown, green, red
  buildSide(list, byId, {
    branch: "red",
    rootId: "red-root",
    rootX: 620,
    rootY: 360,
    armAngles: [(-110 * Math.PI) / 180, (-70 * Math.PI) / 180, (-30 * Math.PI) / 180],
    leafStats: [
      [pct("Crit", 3.3)],
      [pct("Crit Damage", 9.5)],
      [pct("Holy Damage", 7.5)],
      (i, len) =>
        i === len - 1
          ? [pct("Precision", 6.6), flat("Crit", -50)]
          : [pct("Precision", 6.6)],
      [pct("All Damage Dealt", 3.3)],
      [pct("Damage Reduction Offset", 2.0)],
    ],
  });

  // Green S — same format; CIO + Speed on two ways (others path-only for now)
  buildSide(list, byId, {
    branch: "green",
    rootId: "green-root",
    rootX: 500,
    rootY: 470,
    armAngles: [(70 * Math.PI) / 180, (90 * Math.PI) / 180, (110 * Math.PI) / 180],
    armLen: 100,
    leafLen: 240,
    leafSpread: 0.22,
    leafStats: [
      [pct("Control Immunity Offset", 2.5)],
      [flat("Speed", 20)],
      [],
      [],
      [],
      [],
    ],
  });

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
