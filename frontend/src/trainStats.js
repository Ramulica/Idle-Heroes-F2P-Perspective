/**
 * Board-wide Train stats from OCR'd screenshots.
 * Sections: basic (always), faction/class (when hero matches),
 * gamemode (only when that mode is selected).
 */

const KINDS = new Set(["basic", "faction", "class", "gamemode"]);

/** Flat + % HP/Attack stay out of the Train table and totals. */
export const HIDDEN_TRAIN_STATS = new Set([
  "HP",
  "Attack",
  "Fixed HP",
  "Fixed Attack",
]);

export function isHiddenTrainStat(stat) {
  return HIDDEN_TRAIN_STATS.has(String(stat || "").trim());
}

const FACTIONS = [
  "Transcendence",
  "Shadow",
  "Fortress",
  "Abyss",
  "Forest",
  "Dark",
  "Light",
];

const CLASSES = ["Warrior", "Mage", "Ranger", "Assassin", "Priest"];

/** Names + ids used to resolve gamemode exclusives (keep in sync with gameModes.js). */
const GAME_MODE_TARGETS = [
  { id: "void-campaign", name: "Void Campaign" },
  { id: "void-invasion", name: "Void Invasion" },
  { id: "void-hoard", name: "Void Hoard" },
  { id: "realms-gate", name: "Realms Gate" },
  { id: "void-vortex", name: "Void Vortex" },
  { id: "tower-of-dream", name: "Tower of Dream" },
  { id: "seal-land", name: "Seal Land" },
  { id: "aspen-dungeon", name: "Aspen Dungeon" },
  { id: "interdimensional-arena", name: "Interdimensional Arena" },
  { id: "trial-of-the-champion", name: "Trial of the Champion" },
  { id: "free-team-up-arena", name: "Free Team-up Arena" },
  { id: "star-arena", name: "Star Arena" },
  { id: "starland-arena", name: "Starland Arena" },
  { id: "force-war", name: "Force War" },
  { id: "sword-edge-arena", name: "Sword Edge Arena" },
  { id: "star-expedition", name: "Star Expedition" },
  { id: "aurora-sanctuary", name: "Aurora Sanctuary" },
  { id: "forbidden-zone-showdown", name: "Forbidden Zone Showdown" },
  // Train "Feature" labels that may not match board mode ids 1:1
  { id: "campaign", name: "Campaign" },
  { id: "ethereal-realm", name: "Ethereal Realm" },
  { id: "void-ark", name: "Void Ark" },
  { id: "tower-of-oblivion", name: "Tower of Oblivion" },
  { id: "forbidden-zone", name: "Forbidden Zone" },
];

const GAME_MODE_ALIASES = [
  [/^inter[-\s]?dimensional\s+arena$/i, "Interdimensional Arena"],
  [/^trial\s+of\s+the\s+champion$/i, "Trial of the Champion"],
  [/^free\s+team[-\s]?up\s+arena$/i, "Free Team-up Arena"],
  // Train often says "Forbidden Zone"; board mode is Forbidden Zone Showdown.
  [/^forbidden\s+zone(?:\s+showdown)?$/i, "Forbidden Zone Showdown"],
  [/^void\s+campaign$/i, "Void Campaign"],
];

/** Known / common Train stat names for OCR cleanup. */
const KNOWN_STATS = [
  "Speed",
  "Armor Break",
  "Precision",
  "Crit",
  "Crit Damage",
  "Crit Damage Reduction",
  "Crit Damage Offset",
  "Block",
  "Armor",
  "Skill Damage",
  "Holy Damage",
  "Damage Reduction",
  "Damage Reduction Offset",
  "All Damage Dealt",
  "All Damage Reduction",
  "All-damage Reduction",
  "All-damage Reduction Offset",
  "Control Immunity",
  "Control Immunity Offset",
  "Control Precision",
  "Dodge",
  "Dodge Offset",
  "Heal Effect",
  "Effect of Being Healed",
  "Maim",
  "Damage Reduction by Attack",
  "Reduces DoT received",
  "Dodge Rate",
  "HP",
  "Attack",
  "Fixed HP",
  "Fixed Attack",
  "Reduce Damage dealt by Warriors",
  "Reduce Damage dealt by Mages",
  "Reduce Damage dealt by Rangers",
  "Reduce Damage dealt by Assassins",
  "Reduce Damage dealt by Priests",
  "Damage against Bled enemies",
  "Damage against Burned enemies",
  "Damage against Poisoned enemies",
  "Damage against Stunned enemies",
  "Damage against Petrified enemies",
  "Damage against Frozen enemies",
];

const STAT_ALIASES = [
  [/^all[\s-]*damage\s*reduction\s*offset$/i, "All Damage Reduction Offset"],
  [/^all[\s-]*damage\s*reduction$/i, "All Damage Reduction"],
  [/^all[\s-]*damage\s*dealt$/i, "All Damage Dealt"],
  [/^damage\s*reduction\s*by\s*attack$/i, "Damage Reduction by Attack"],
  [/^damage\s*reduction\s*offset$/i, "Damage Reduction Offset"],
  [/^crit\s*damage\s*reduction$/i, "Crit Damage Reduction"],
  [/^crit\s*damage\s*offset$/i, "Crit Damage Offset"],
  [/^crit\s*damage$/i, "Crit Damage"],
  [/^damage\s*reduction$/i, "Damage Reduction"],
  [/^control\s*immunity\s*offset$/i, "Control Immunity Offset"],
  [/^control\s*immunity$/i, "Control Immunity"],
  [/^control\s*precision$/i, "Control Precision"],
  [/^dodge\s*offset$/i, "Dodge Offset"],
  [/^dodge\s*rate$/i, "Dodge"],
  [/^reduces?\s*dot\s*received$/i, "Reduces DoT received"],
  [/^effect\s*of\s*being\s*healed$/i, "Effect of Being Healed"],
  [/^heal\s*effect$/i, "Heal Effect"],
  [/^skill\s*damage$/i, "Skill Damage"],
  [/^holy\s*damage$/i, "Holy Damage"],
  [/^armor\s*break$/i, "Armor Break"],
  [/^fixed\s*hp$/i, "Fixed HP"],
  [/^fixed\s*attack$/i, "Fixed Attack"],
  [/^reduce\s*damage\s*dealt\s*by\s*warriors?$/i, "Reduce Damage dealt by Warriors"],
  [/^reduce\s*damage\s*dealt\s*by\s*mages?$/i, "Reduce Damage dealt by Mages"],
  [/^reduce\s*damage\s*dealt\s*by\s*rangers?$/i, "Reduce Damage dealt by Rangers"],
  [/^reduce\s*damage\s*dealt\s*by\s*assassins?$/i, "Reduce Damage dealt by Assassins"],
  [/^reduce\s*damage\s*dealt\s*by\s*priests?$/i, "Reduce Damage dealt by Priests"],
  [/^damage\s*against\s*bled(?:\s*enemies)?$/i, "Damage against Bled enemies"],
  [/^damage\s*against\s*burned(?:\s*enemies)?$/i, "Damage against Burned enemies"],
  [/^damage\s*against\s*poisoned(?:\s*enemies)?$/i, "Damage against Poisoned enemies"],
  [/^damage\s*against\s*stunned(?:\s*enemies)?$/i, "Damage against Stunned enemies"],
  [/^damage\s*against\s*petrified(?:\s*enemies)?$/i, "Damage against Petrified enemies"],
  [/^damage\s*against\s*frozen(?:\s*enemies)?$/i, "Damage against Frozen enemies"],
];

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `train-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function sectionKey(section) {
  if (!section) return "";
  if (section.kind === "basic") return "basic";
  return `${section.kind}:${(section.target || "").toLowerCase()}`;
}

export function defaultTrain() {
  return { sections: [] };
}

function normalizeStatName(raw) {
  let name = String(raw || "")
    .replace(/\s+/g, " ")
    .replace(/^[^A-Za-z]+/, "")
    .trim();
  if (!name) return "";
  for (const [re, canon] of STAT_ALIASES) {
    if (re.test(name)) return canon;
  }
  const lower = name.toLowerCase();
  const known = KNOWN_STATS.find((s) => s.toLowerCase() === lower);
  if (known) return known;
  // Title-ish cleanup
  return name
    .split(" ")
    .map((w) => {
      if (!w) return w;
      if (/^(of|by|for|and|the|vs)$/i.test(w)) return w.toLowerCase();
      return w[0].toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function parseStatToken(token) {
  const t = String(token || "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  // "Skill Damage +35.0%" or "Fixed HP +570,083,388" or "HP +51.1%"
  const m = t.match(
    /^(.+?)\s*[+:]?\s*\+?\s*(-?[\d,]+(?:\.\d+)?)\s*(%?)\s*$/i
  );
  if (!m) return null;
  const stat = normalizeStatName(m[1]);
  if (!stat) return null;
  const value = Number(String(m[2]).replace(/,/g, ""));
  if (!Number.isFinite(value) || value === 0) return null;
  const unit = m[3] === "%" ? "%" : "";
  return { stat, value, unit };
}

function normalizeStatRow(raw) {
  if (!raw || typeof raw !== "object") return null;
  const stat = normalizeStatName(raw.stat);
  if (!stat || isHiddenTrainStat(stat)) return null;
  const n = Number(raw.value);
  if (!Number.isFinite(n) || n === 0) return null;
  const unit = raw.unit === "%" ? "%" : "";
  return { stat, value: n, unit };
}

function resolveFaction(raw) {
  const t = String(raw || "").trim();
  if (!t) return null;
  const hit = FACTIONS.find((f) => f.toLowerCase() === t.toLowerCase());
  return hit || t;
}

function resolveClass(raw) {
  const t = String(raw || "").trim();
  if (!t) return null;
  const hit = CLASSES.find((c) => c.toLowerCase() === t.toLowerCase());
  return hit || t;
}

function resolveGameModeTarget(raw) {
  let t = String(raw || "").trim();
  if (!t) return null;
  for (const [re, canon] of GAME_MODE_ALIASES) {
    if (re.test(t)) {
      t = canon;
      break;
    }
  }
  const lower = t.toLowerCase();
  const byName = GAME_MODE_TARGETS.find((g) => g.name.toLowerCase() === lower);
  if (byName) return byName.name;
  const byId = GAME_MODE_TARGETS.find((g) => g.id === lower || g.id === t);
  if (byId) return byId.name;
  const fuzzy = GAME_MODE_TARGETS.find(
    (g) =>
      g.name.toLowerCase() === lower ||
      g.name.toLowerCase().includes(lower) ||
      lower.includes(g.name.toLowerCase())
  );
  return fuzzy ? fuzzy.name : t;
}

function gameModeIdForTarget(target) {
  const name = String(target || "").trim().toLowerCase();
  if (!name) return null;
  const row = GAME_MODE_TARGETS.find(
    (g) =>
      g.name.toLowerCase() === name ||
      g.id === name ||
      g.id === target
  );
  return row?.id || null;
}

export function normalizeTrainSection(raw) {
  if (!raw || typeof raw !== "object") return null;
  const kind = KINDS.has(raw.kind) ? raw.kind : null;
  if (!kind) return null;
  let target = null;
  if (kind === "faction") target = resolveFaction(raw.target);
  else if (kind === "class") target = resolveClass(raw.target);
  else if (kind === "gamemode") target = resolveGameModeTarget(raw.target);
  if (kind !== "basic" && !target) return null;
  const stats = [];
  for (const row of Array.isArray(raw.stats) ? raw.stats : []) {
    const n = normalizeStatRow(row);
    if (n) stats.push(n);
  }
  if (!stats.length) return null;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newId(),
    kind,
    target: kind === "basic" ? null : target,
    stats,
  };
}

export function normalizeTrain(raw) {
  const sections = [];
  const list = Array.isArray(raw?.sections)
    ? raw.sections
    : Array.isArray(raw)
      ? raw
      : [];
  for (const row of list) {
    const section = normalizeTrainSection(row);
    if (section) sections.push(section);
  }
  // Dedupe by section key — keep last
  const byKey = new Map();
  for (const section of sections) {
    byKey.set(sectionKey(section), section);
  }
  return { sections: [...byKey.values()] };
}

export function mergeTrainSections(existing, incoming) {
  const base = normalizeTrain(existing);
  const add = normalizeTrain(incoming);
  const byKey = new Map();
  for (const section of base.sections) {
    byKey.set(sectionKey(section), section);
  }
  for (const section of add.sections) {
    byKey.set(sectionKey(section), {
      ...section,
      id: byKey.get(sectionKey(section))?.id || section.id,
    });
  }
  return { sections: [...byKey.values()] };
}

export function clearTrain() {
  return defaultTrain();
}

export function removeTrainSection(train, id) {
  const next = normalizeTrain(train);
  return {
    sections: next.sections.filter((s) => s.id !== id),
  };
}

export function formatTrainStat(row) {
  if (!row?.stat) return "—";
  const n = Number(row.value);
  if (!Number.isFinite(n) || n === 0) return row.stat;
  const shown = Number.isInteger(n)
    ? n.toLocaleString("en-US")
    : String(Math.round(n * 10) / 10);
  return row.unit === "%" ? `${row.stat} +${shown}%` : `${row.stat} +${shown}`;
}

export function formatTrainStatValue(row) {
  if (!row) return "—";
  const n = Number(row.value);
  if (!Number.isFinite(n) || n === 0) return "—";
  const shown = Number.isInteger(n)
    ? n.toLocaleString("en-US")
    : String(Math.round(n * 10) / 10);
  return row.unit === "%" ? `+${shown}%` : `+${shown}`;
}

export function formatTrainSectionLabel(section) {
  if (!section) return "—";
  if (section.kind === "basic") return "Basic";
  if (section.kind === "faction") return `Faction · ${section.target}`;
  if (section.kind === "class") return `Class · ${section.target}`;
  if (section.kind === "gamemode") return `Game mode · ${section.target}`;
  return section.kind;
}

function trainStatKey(stat, unit = "") {
  return `${stat}|${unit || ""}`;
}

function sectionSortRank(section) {
  const kindOrder = { basic: 0, faction: 1, class: 2, gamemode: 3 };
  const kind = kindOrder[section.kind] ?? 9;
  const target = String(section.target || "").toLowerCase();
  return { kind, target };
}

/**
 * Pivot Train data for the UI table:
 * rows = exclusives (basic / faction / class / gamemode),
 * columns = stats ordered by how many sections have them.
 */
export function buildTrainMatrix(train) {
  const data = normalizeTrain(train);
  const sections = data.sections
    .map((section) => ({
      ...section,
      stats: section.stats.filter((s) => !isHiddenTrainStat(s.stat)),
    }))
    .filter((section) => section.stats.length > 0)
    .sort((a, b) => {
      const ra = sectionSortRank(a);
      const rb = sectionSortRank(b);
      if (ra.kind !== rb.kind) return ra.kind - rb.kind;
      return ra.target.localeCompare(rb.target);
    });

  const counts = new Map();
  for (const section of sections) {
    const seen = new Set();
    for (const row of section.stats) {
      const key = trainStatKey(row.stat, row.unit);
      if (seen.has(key)) continue;
      seen.add(key);
      const cur = counts.get(key) || {
        key,
        stat: row.stat,
        unit: row.unit || "",
        count: 0,
      };
      cur.count += 1;
      counts.set(key, cur);
    }
  }

  const columns = [...counts.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.stat.localeCompare(b.stat) || (a.unit || "").localeCompare(b.unit || "");
  });

  const rows = sections.map((section) => {
    const values = {};
    for (const row of section.stats) {
      const key = trainStatKey(row.stat, row.unit);
      values[key] = formatTrainStatValue(row);
    }
    return {
      id: section.id,
      section,
      label: formatTrainSectionLabel(section),
      values,
    };
  });

  return { columns, rows };
}

/** In-game exclusive type group for Train headers (OCR may say Feature). */
const EXCLUSIVE_TYPE_RE =
  /Faction|Class|Feature|Game\s*Mode|Gamemode|Mode/i;

/**
 * Parse OCR / pasted Train text into sections.
 * Multi-feature screenshots often come back as one long line; we scan for
 * every Exclusive/Basic marker instead of relying on newlines.
 */
export function parseTrainText(text) {
  const raw = String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[|]/g, "I")
    .replace(/[“”"']/g, "")
    .replace(/[【〔［]/g, "[")
    .replace(/[】〕］]/g, "]")
    .replace(/\u00a0/g, " ");
  if (!raw.trim()) return defaultTrain();

  const flat = raw.replace(/[ \t]+/g, " ").replace(/\n+/g, "\n").trim();

  const markers = findTrainMarkers(flat);
  if (markers.length === 0) {
    const stats = splitStatBody(flat);
    if (!stats.length) return defaultTrain();
    return normalizeTrain({
      sections: [{ kind: "basic", target: null, stats }],
    });
  }

  const sections = [];
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    const end = i + 1 < markers.length ? markers[i + 1].index : flat.length;
    const body = flat.slice(marker.bodyStart, end);
    sections.push({
      kind: marker.kind,
      target: marker.target,
      stats: splitStatBody(body),
    });
  }
  return normalizeTrain({ sections });
}

const KNOWN_EXCLUSIVE_TARGETS = [
  ...GAME_MODE_TARGETS.map((g) => g.name),
  ...FACTIONS,
  ...CLASSES,
].sort((a, b) => b.length - a.length);

function extractExclusiveTarget(afterColon) {
  const slice = String(afterColon || "").replace(/^\s+/, "");
  const bracket = slice.match(/^\[([^\]]+)\]/);
  if (bracket) {
    return { raw: bracket[1].trim(), consumed: bracket[0].length };
  }
  for (const name of KNOWN_EXCLUSIVE_TARGETS) {
    const re = new RegExp(
      `^(${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=\\s|[.,]|$)`,
      "i"
    );
    const hit = slice.match(re);
    if (hit) {
      return { raw: hit[1], consumed: hit[0].length };
    }
  }
  // Fallback: take title-case words until a "Stat +value" pattern begins.
  const fallback = slice.match(
    /^([A-Za-z][A-Za-z0-9]*(?:\s+[A-Za-z][A-Za-z0-9]*){0,4})(?=\s+[A-Z][A-Za-z].*?\+)/
  );
  if (fallback) {
    return { raw: fallback[1].trim(), consumed: fallback[1].length };
  }
  return null;
}

function findTrainMarkers(text) {
  const markers = [];
  const basicRe = /Basic\s+Attribute\s+Bonus/gi;
  let m;
  while ((m = basicRe.exec(text)) !== null) {
    markers.push({
      index: m.index,
      bodyStart: m.index + m[0].length,
      kind: "basic",
      target: null,
    });
  }

  const exclusiveHeadRe = /Exclusive\s+for\s*\(\s*([^)]+?)\s*\)\s*:/gi;
  while ((m = exclusiveHeadRe.exec(text)) !== null) {
    const typeRaw = String(m[1] || "").trim();
    if (!EXCLUSIVE_TYPE_RE.test(typeRaw)) continue;
    const after = text.slice(m.index + m[0].length);
    const extracted = extractExclusiveTarget(after);
    if (!extracted?.raw) continue;
    const type = typeRaw.toLowerCase().replace(/\s+/g, " ");
    let kind = "gamemode";
    let target = extracted.raw;
    if (type.startsWith("faction")) {
      kind = "faction";
      target = resolveFaction(extracted.raw);
    } else if (type.startsWith("class")) {
      kind = "class";
      target = resolveClass(extracted.raw);
    } else {
      target = resolveGameModeTarget(extracted.raw);
    }
    markers.push({
      index: m.index,
      bodyStart: m.index + m[0].length + extracted.consumed,
      kind,
      target,
    });
  }

  markers.sort((a, b) => a.index - b.index);
  const out = [];
  let lastBody = -1;
  for (const marker of markers) {
    if (marker.index < lastBody) continue;
    out.push(marker);
    lastBody = marker.bodyStart;
  }
  return out;
}

function splitStatBody(body) {
  const cleaned = String(body || "")
    .replace(
      /Exclusive\s+for\s*\(\s*[^)]+?\s*\)\s*:\s*(?:\[[^\]]*\]|[A-Za-z][A-Za-z0-9 \-']*)/gi,
      " "
    )
    .replace(/Basic\s+Attribute\s+Bonus/gi, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];

  // Global "Stat +value" matches — commas are often lost by OCR on dense blocks.
  const tokenRe =
    /([A-Za-z][A-Za-z][A-Za-z0-9\-]*(?:\s+(?:of|by|for|and|the|vs|against|[A-Za-z][A-Za-z0-9\-]*)){0,6})\s*\+\s*(-?[\d,]+(?:\.\d+)?)\s*(%)?/gi;
  const stats = [];
  let m;
  while ((m = tokenRe.exec(cleaned)) !== null) {
    const row = parseStatToken(`${m[1]} +${m[2]}${m[3] || ""}`);
    if (row) stats.push(row);
  }
  if (stats.length) return stats;

  const parts = cleaned.split(/,(?=\s*[A-Za-z])/);
  for (const part of parts) {
    const row = parseStatToken(part);
    if (row) stats.push(row);
  }
  return stats;
}

/**
 * Preprocess screenshot for OCR (green-on-brown → high-contrast).
 */
export function preprocessTrainImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(2.5, Math.max(1.5, 1400 / Math.max(img.width, 1)));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          // Keep both white headers and green stats bright before invert.
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          let y = Math.max(luma, g);
          y = (y - 70) * 1.7 + 70;
          y = 255 - y;
          const v = y < 120 ? 0 : y > 180 ? 255 : y;
          d[i] = d[i + 1] = d[i + 2] = v;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Could not load image"));
    if (typeof source === "string") {
      img.src = source;
    } else if (source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else {
      reject(new Error("Unsupported image source"));
    }
  });
}

/** Shared OCR worker — warm once so later loads feel near-instant. */
let trainOcrWorkerPromise = null;
let trainOcrProgressHandler = null;

async function getTrainOcrWorker() {
  if (!trainOcrWorkerPromise) {
    trainOcrWorkerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (
            typeof trainOcrProgressHandler === "function" &&
            m?.status === "recognizing text"
          ) {
            trainOcrProgressHandler(Math.round((m.progress || 0) * 100));
          }
        },
      });
      await worker.setParameters({
        tessedit_pageseg_mode: "6", // assume a uniform block of text
        preserve_interword_spaces: "1",
      });
      return worker;
    })().catch((err) => {
      trainOcrWorkerPromise = null;
      throw err;
    });
  }
  return trainOcrWorkerPromise;
}

/** Kick off Tesseract download/init in the background (safe to call often). */
export function warmTrainOcr() {
  if (typeof window === "undefined") return;
  void getTrainOcrWorker().catch(() => {});
}

/**
 * Lazy OCR via tesseract.js — runs entirely in the browser.
 * Reuses a warmed worker when available.
 */
export async function ocrTrainImage(fileOrBlob, onProgress) {
  const canvas = await preprocessTrainImage(fileOrBlob);
  trainOcrProgressHandler =
    typeof onProgress === "function" ? onProgress : null;
  try {
    const worker = await getTrainOcrWorker();
    const {
      data: { text },
    } = await worker.recognize(canvas);
    return parseTrainText(text);
  } finally {
    trainOcrProgressHandler = null;
  }
}

/** Void Campaign train exclusives also count in Void Invasion. */
function trainGameModeApplies(sectionModeId, boardModeId) {
  if (!boardModeId || !sectionModeId) return false;
  if (boardModeId === sectionModeId) return true;
  if (boardModeId === "void-invasion" && sectionModeId === "void-campaign") {
    return true;
  }
  if (
    boardModeId === "forbidden-zone-showdown" &&
    (sectionModeId === "forbidden-zone" ||
      sectionModeId === "forbidden-zone-showdown")
  ) {
    return true;
  }
  return false;
}

const trainPct = (stat, value) => ({ stat, value, unit: "%" });
const trainFlat = (stat, value) => ({ stat, value, unit: "" });

/** Star Expedition / Ethereal Realm share this Feature exclusive block. */
const TRAIN_EXAMPLE_STAR_ETHEREAL = [
  trainPct("Attack", 11.5),
  trainPct("Armor Break", 10.5),
  trainFlat("Speed", 100),
  trainPct("Heal Effect", 10),
  trainPct("HP", 14.5),
  trainPct("Reduces DoT received", 12),
  trainPct("Holy Damage", 18.5),
  trainPct("Maim", 7),
  trainPct("Damage Reduction by Attack", 45),
  trainPct("Control Precision", 10.5),
  trainPct("Dodge", 2),
  trainPct("Crit Damage Reduction", 7.5),
  trainPct("All Damage Dealt", 7),
  trainPct("Crit Damage", 31.5),
  trainPct("Dodge Offset", 2.5),
  trainPct("All Damage Reduction", 7.5),
];

const TRAIN_EXAMPLE_FORBIDDEN_ZONE = [
  trainPct("Attack", 7.5),
  trainFlat("Speed", 100),
  trainPct("Crit Damage", 22.5),
  trainPct("HP", 10.5),
  trainPct("Reduces DoT received", 12),
  trainPct("Holy Damage", 9),
  trainPct("Maim", 7),
  trainPct("Heal Effect", 10),
  trainPct("Control Precision", 7.5),
  trainPct("Dodge", 2),
  trainPct("Crit Damage Reduction", 7.5),
  trainPct("All Damage Dealt", 3),
  trainPct("Damage Reduction by Attack", 45),
  trainPct("Dodge Offset", 2.5),
  trainPct("All Damage Reduction", 7.5),
];

/**
 * Example Feature exclusives from a Train screenshot
 * (Star Expedition, Ethereal Realm, Forbidden Zone).
 */
export function trainExampleSections() {
  return normalizeTrain({
    sections: [
      {
        kind: "gamemode",
        target: "Star Expedition",
        stats: TRAIN_EXAMPLE_STAR_ETHEREAL,
      },
      {
        kind: "gamemode",
        target: "Ethereal Realm",
        stats: TRAIN_EXAMPLE_STAR_ETHEREAL,
      },
      {
        kind: "gamemode",
        target: "Forbidden Zone Showdown",
        stats: TRAIN_EXAMPLE_FORBIDDEN_ZONE,
      },
    ],
  });
}

/**
 * Collect train rows that apply to this hero / game mode.
 */
export function collectTrainStatRows(train, hero, gameModeId) {
  if (!hero) return [];
  const data = normalizeTrain(train);
  const rows = [];
  for (const section of data.sections) {
    if (section.kind === "basic") {
      // always
    } else if (section.kind === "faction") {
      if (
        String(hero.faction || "").toLowerCase() !==
        String(section.target || "").toLowerCase()
      ) {
        continue;
      }
    } else if (section.kind === "class") {
      if (
        String(hero.heroClass || "").toLowerCase() !==
        String(section.target || "").toLowerCase()
      ) {
        continue;
      }
    } else if (section.kind === "gamemode") {
      const modeId = gameModeIdForTarget(section.target);
      if (!trainGameModeApplies(modeId, gameModeId)) continue;
    } else {
      continue;
    }
    for (const stat of section.stats) {
      if (isHiddenTrainStat(stat.stat)) continue;
      rows.push({ ...stat });
    }
  }
  return rows;
}
