/**
 * Board-wide Train stats from OCR'd screenshots.
 * Sections: basic (always), faction/class (when hero matches),
 * gamemode (only when that mode is selected).
 */

const KINDS = new Set(["basic", "faction", "class", "gamemode"]);

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
  if (!stat) return null;
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
  const t = String(raw || "").trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  const byName = GAME_MODE_TARGETS.find((g) => g.name.toLowerCase() === lower);
  if (byName) return byName.name;
  const byId = GAME_MODE_TARGETS.find((g) => g.id === lower || g.id === t);
  if (byId) return byId.name;
  const fuzzy = GAME_MODE_TARGETS.find(
    (g) =>
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

export function formatTrainSectionLabel(section) {
  if (!section) return "—";
  if (section.kind === "basic") return "Basic Attribute Bonus";
  if (section.kind === "faction") return `Faction · ${section.target}`;
  if (section.kind === "class") return `Class · ${section.target}`;
  if (section.kind === "gamemode") return `Game mode · ${section.target}`;
  return section.kind;
}

/**
 * Parse OCR / pasted Train text into sections.
 */
export function parseTrainText(text) {
  const raw = String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[|]/g, "I")
    .replace(/\u00a0/g, " ");
  if (!raw.trim()) return defaultTrain();

  // Force headers onto their own lines (OCR often glues them to prior text).
  const flat = raw
    .replace(
      /\s*(Basic\s+Attribute\s+Bonus)/gi,
      "\n$1\n"
    )
    .replace(
      /\s*(Exclusive\s+for\s*\(\s*(?:Faction|Class|Game\s*Mode|Gamemode|Mode)\s*\)\s*:\s*\[[^\]]+\])/gi,
      "\n$1\n"
    )
    .replace(
      /\s*(Exclusive\s+for\s*\(\s*(?:Faction|Class|Game\s*Mode|Gamemode|Mode)\s*\)\s*:\s*[^\n,]+)/gi,
      "\n$1\n"
    )
    .replace(/\n+/g, "\n")
    .trim();

  const headerRe =
    /(?:^|\n)\s*(Basic\s+Attribute\s+Bonus|Exclusive\s+for\s*\(\s*(Faction|Class|Game\s*Mode|Gamemode|Mode)\s*\)\s*:\s*\[?\s*([^\n\]]+?)\s*\]?)\s*(?=\n|$)/gi;

  const matches = [...flat.matchAll(headerRe)];
  if (matches.length === 0) {
    // Fallback: try whole blob as basic stats
    const stats = splitStatBody(flat);
    if (!stats.length) return defaultTrain();
    return normalizeTrain({
      sections: [{ kind: "basic", target: null, stats }],
    });
  }

  const sections = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : flat.length;
    const body = flat.slice(start, end);
    const header = m[1] || "";
    let kind = "basic";
    let target = null;
    if (/^Basic/i.test(header)) {
      kind = "basic";
    } else {
      const type = String(m[2] || "").toLowerCase();
      target = String(m[3] || "").replace(/[\]\[]/g, "").trim();
      if (type.startsWith("faction")) kind = "faction";
      else if (type.startsWith("class")) kind = "class";
      else kind = "gamemode";
    }
    const stats = splitStatBody(body);
    sections.push({ kind, target, stats });
  }
  return normalizeTrain({ sections });
}

function splitStatBody(body) {
  const cleaned = String(body || "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];
  // Split on commas that precede a new stat (letter after comma)
  const parts = cleaned.split(/,(?=\s*[A-Za-z])/);
  const stats = [];
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
          // Prefer green channel (stat text), boost contrast, invert for dark UI
          let y = 0.15 * r + 0.7 * g + 0.15 * b;
          y = (y - 90) * 1.55 + 90;
          y = 255 - y;
          const v = y < 110 ? 0 : y > 170 ? 255 : y;
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

/**
 * Lazy OCR via tesseract.js — runs entirely in the browser.
 */
export async function ocrTrainImage(fileOrBlob, onProgress) {
  const canvas = await preprocessTrainImage(fileOrBlob);
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (typeof onProgress === "function" && m?.status === "recognizing text") {
        onProgress(Math.round((m.progress || 0) * 100));
      }
    },
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(canvas);
    return parseTrainText(text);
  } finally {
    await worker.terminate();
  }
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
      if (!gameModeId || !modeId || gameModeId !== modeId) continue;
    } else {
      continue;
    }
    for (const stat of section.stats) {
      rows.push({ ...stat });
    }
  }
  return rows;
}
