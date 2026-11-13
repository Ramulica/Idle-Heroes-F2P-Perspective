/** Imprint Infusion tree: hub + blue (NW) / red (NE) / green (S) branches. */

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

function addChain(list, byId, { ids, parentId, branch, stats, points }) {
  let prev = parentId;
  ids.forEach((id, i) => {
    const [x, y] = points[i];
    pushNode(list, byId, {
      id,
      branch,
      x,
      y,
      parentId: prev,
      stats: typeof stats === "function" ? stats(i, ids.length) : stats,
    });
    prev = id;
  });
  return prev;
}

function buildTree() {
  const list = [];
  const byId = {};

  // --- Blue (NW) ---
  addChain(list, byId, {
    ids: ["b-s1", "b-s2"],
    parentId: null,
    branch: "blue",
    stats: [],
    points: [
      [420, 380],
      [360, 320],
    ],
  });

  // Upper fork: white then continues; black parallel from b-s2
  addChain(list, byId, {
    ids: ["b-w1", "b-w2", "b-w3", "b-w4"],
    parentId: "b-s2",
    branch: "blue",
    stats: [pct("Dodge", 2.5), pct("Block", 7.5)],
    points: [
      [300, 250],
      [250, 200],
      [200, 155],
      [150, 115],
    ],
  });
  addChain(list, byId, {
    ids: ["b-k1", "b-k2", "b-k3", "b-k4", "b-k5"],
    parentId: "b-s2",
    branch: "blue",
    stats: [pct("Armor", 12)],
    points: [
      [280, 290],
      [220, 250],
      [165, 210],
      [115, 175],
      [70, 140],
    ],
  });

  // Middle fork: yellow / brown
  addChain(list, byId, {
    ids: ["b-y1", "b-y2", "b-y3", "b-y4", "b-y5"],
    parentId: "b-s2",
    branch: "blue",
    stats: [pct("Control Immunity", 3.3)],
    points: [
      [310, 340],
      [255, 305],
      [200, 275],
      [145, 250],
      [95, 230],
    ],
  });
  addChain(list, byId, {
    ids: ["b-n1", "b-n2", "b-n3", "b-n4", "b-n5"],
    parentId: "b-s2",
    branch: "blue",
    stats: [pct("Damage Reduction", 3.3), pct("Crit Damage Reduction", 3.3)],
    points: [
      [330, 375],
      [275, 360],
      [220, 350],
      [165, 345],
      [115, 340],
    ],
  });

  // Lower fork: green / red
  addChain(list, byId, {
    ids: ["b-g1", "b-g2", "b-g3", "b-g4"],
    parentId: "b-s2",
    branch: "blue",
    stats: [pct("All Damage Reduction", 2.5)],
    points: [
      [340, 420],
      [285, 445],
      [230, 470],
      [175, 495],
    ],
  });
  addChain(list, byId, {
    ids: ["b-r1", "b-r2", "b-r3", "b-r4", "b-r5"],
    parentId: "b-s2",
    branch: "blue",
    stats: [pct("Effect of Being Healed", 6.6)],
    points: [
      [360, 460],
      [310, 500],
      [260, 535],
      [210, 565],
      [160, 595],
    ],
  });

  // --- Red (NE) ---
  addChain(list, byId, {
    ids: ["r-s1", "r-s2"],
    parentId: null,
    branch: "red",
    stats: [],
    points: [
      [580, 380],
      [640, 320],
    ],
  });

  addChain(list, byId, {
    ids: ["r-k1", "r-k2", "r-k3", "r-k4", "r-k5"],
    parentId: "r-s2",
    branch: "red",
    stats: [pct("Crit", 3.3)],
    points: [
      [700, 250],
      [750, 200],
      [800, 155],
      [850, 115],
      [900, 85],
    ],
  });
  addChain(list, byId, {
    ids: ["r-w1", "r-w2", "r-w3", "r-w4"],
    parentId: "r-s2",
    branch: "red",
    stats: [pct("Crit Damage", 9.5)],
    points: [
      [720, 290],
      [780, 255],
      [835, 220],
      [885, 190],
    ],
  });
  addChain(list, byId, {
    ids: ["r-y1", "r-y2", "r-y3", "r-y4", "r-y5"],
    parentId: "r-s2",
    branch: "red",
    stats: [pct("Holy Damage", 7.5)],
    points: [
      [690, 340],
      [745, 310],
      [800, 285],
      [855, 265],
      [905, 250],
    ],
  });
  addChain(list, byId, {
    ids: ["r-n1", "r-n2", "r-n3", "r-n4", "r-n5"],
    parentId: "r-s2",
    branch: "red",
    stats: (i, len) =>
      i === len - 1
        ? [pct("Precision", 6.6), flat("Crit", -50)]
        : [pct("Precision", 6.6)],
    points: [
      [670, 375],
      [725, 365],
      [780, 360],
      [835, 355],
      [885, 350],
    ],
  });
  addChain(list, byId, {
    ids: ["r-g1", "r-g2", "r-g3", "r-g4", "r-g5"],
    parentId: "r-s2",
    branch: "red",
    stats: [pct("All Damage Dealt", 3.3)],
    points: [
      [660, 420],
      [715, 445],
      [770, 470],
      [825, 495],
      [875, 520],
    ],
  });
  addChain(list, byId, {
    ids: ["r-r1", "r-r2", "r-r3", "r-r4", "r-r5"],
    parentId: "r-s2",
    branch: "red",
    stats: [pct("Damage Reduction Offset", 2.0)],
    points: [
      [640, 460],
      [690, 500],
      [740, 535],
      [790, 565],
      [840, 595],
    ],
  });

  // --- Green (S) ---
  addChain(list, byId, {
    ids: ["g-s1", "g-s2", "g-s3"],
    parentId: null,
    branch: "green",
    stats: [],
    points: [
      [500, 470],
      [500, 530],
      [500, 590],
    ],
  });
  addChain(list, byId, {
    ids: ["g-r1", "g-r2", "g-r3", "g-r4", "g-r5", "g-r6"],
    parentId: "g-s3",
    branch: "green",
    stats: [pct("Control Immunity Offset", 2.5)],
    points: [
      [430, 640],
      [430, 690],
      [430, 740],
      [430, 790],
      [430, 840],
      [430, 885],
    ],
  });
  addChain(list, byId, {
    ids: ["g-b1", "g-b2", "g-b3", "g-b4", "g-b5", "g-b6"],
    parentId: "g-s3",
    branch: "green",
    stats: [flat("Speed", 20)],
    points: [
      [570, 640],
      [570, 690],
      [570, 740],
      [570, 790],
      [570, 840],
      [570, 885],
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

export function isInfusionNodeActive(selectedSet, id) {
  return selectedSet.has(id);
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

/** Toggle: select if allowed; deselect clears node + descendants. */
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
