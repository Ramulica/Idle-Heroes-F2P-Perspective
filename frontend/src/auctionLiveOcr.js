/**
 * Live Auction House screenshot OCR — same-tier Attack lists.
 * Strategy: parchment-card binarize → slice into listing rows → OCR each band
 * (left = Attack, right = bid/buyout). Session-only; never History clears.
 */

import {
  LIVE_MARKET_MAX,
  normalizeLiveMarketState,
} from "./auctionHouse";

let ahOcrWorkerPromise = null;
let ahOcrProgressHandler = null;

async function getAhOcrWorker() {
  if (!ahOcrWorkerPromise) {
    ahOcrWorkerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (
            typeof ahOcrProgressHandler === "function" &&
            m?.status === "recognizing text"
          ) {
            ahOcrProgressHandler(Math.round((m.progress || 0) * 100));
          }
        },
      });
      return worker;
    })().catch((err) => {
      ahOcrWorkerPromise = null;
      throw err;
    });
  }
  return ahOcrWorkerPromise;
}

export function warmAuctionLiveOcr() {
  if (typeof window === "undefined") return;
  void getAhOcrWorker().catch(() => {});
}

function loadImageElement(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

/** Dark-brown text on tan AH cards → hard black/white (no invert). */
function binarizeParchment(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    // Text is dark brown; cards/background light or mid. Green timers ignored.
    const isGreenTimer = g > r + 25 && g > b + 15 && g > 90;
    const v = isGreenTimer || luma > 135 ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
}

function makeScaledCanvas(img, scale) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  binarizeParchment(ctx, canvas.width, canvas.height);
  return canvas;
}

function cropCanvas(source, x, y, w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    source,
    Math.round(x),
    Math.round(y),
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return canvas;
}

/**
 * AH list screenshots show ~5 parchment rows under a header.
 * Crop chrome, slice into equal bands.
 */
function sliceListingBands(fullCanvas, rowCount = 5) {
  const w = fullCanvas.width;
  const h = fullCanvas.height;
  // Header ~10–14%, bottom chrome ~6–10% on phone shots
  const top = Math.round(h * 0.11);
  const bottom = Math.round(h * 0.92);
  const usable = Math.max(1, bottom - top);
  const bandH = usable / rowCount;
  const bands = [];
  for (let i = 0; i < rowCount; i += 1) {
    const y = top + bandH * i;
    const row = cropCanvas(fullCanvas, 0, y, w, bandH);
    // Left ~52%: Attack / HP / Speed. Right ~48%: timer + bid/buyout.
    const left = cropCanvas(row, 0, 0, w * 0.52, bandH);
    const right = cropCanvas(row, w * 0.48, 0, w * 0.52, bandH);
    bands.push({ row, left, right, index: i });
  }
  return bands;
}

async function recognizeDigits(worker, canvas) {
  await worker.setParameters({
    tessedit_pageseg_mode: "7", // single text line
    tessedit_char_whitelist: "0123456789",
    preserve_interword_spaces: "1",
  });
  const {
    data: { text },
  } = await worker.recognize(canvas);
  return String(text || "");
}

async function recognizeSparse(worker, canvas) {
  await worker.setParameters({
    tessedit_pageseg_mode: "6",
    tessedit_char_whitelist: "0123456789: ",
    preserve_interword_spaces: "1",
  });
  const {
    data: { text },
  } = await worker.recognize(canvas);
  return String(text || "");
}

function numsFrom(text) {
  return [...String(text || "").replace(/,/g, "").matchAll(/\d+/g)]
    .map((m) => Number(m[0]))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function isAtk(n) {
  return n >= 3500 && n <= 22000;
}
function isHp(n) {
  return n >= 2500 && n <= 25000;
}
function isSpd(n) {
  return n >= 25 && n <= 90;
}
function isPrice(n) {
  return n >= 100 && n <= 25000 && n < 9000;
}

/**
 * From left-band numbers: Attack is the first (largest) 4-digit flat in range.
 */
function parseAtkFromLeft(nums) {
  const atkLike = nums.filter(isAtk);
  if (!atkLike.length) return { atk: 0, hp: 0, spd: 0 };
  // First atk-like in reading order is Attack (list is Atk, HP, Spd).
  const atk = atkLike[0];
  const rest = nums.slice(nums.indexOf(atk) + 1);
  const hp = rest.find((n) => isHp(n) && n !== atk) || 0;
  const spd = rest.find((n) => isSpd(n)) || 0;
  return { atk, hp, spd };
}

/**
 * From right-band: skip timer HHMMSS pieces, then bid + buyout.
 * Missing buyout (∞ / --) → buyout 0.
 */
function parsePricesFromRight(nums) {
  const filtered = [];
  let i = 0;
  while (i < nums.length) {
    // Skip timer triplets
    if (
      i + 2 < nums.length &&
      nums[i] <= 72 &&
      nums[i + 1] <= 59 &&
      nums[i + 2] <= 59 &&
      (nums[i + 1] > 9 || nums[i + 2] > 9 || nums[i] <= 48)
    ) {
      i += 3;
      continue;
    }
    filtered.push(nums[i]);
    i += 1;
  }
  const prices = filtered.filter(isPrice);
  if (!prices.length) return { bid: 0, buyout: 0 };
  if (prices.length === 1) return { bid: prices[0], buyout: 0 };
  // Bidding then Buyout (buyout >= bid usually; not always)
  return { bid: prices[0], buyout: prices[prices.length - 1] };
}

function parseBandPair(leftText, rightText) {
  const leftNums = numsFrom(leftText);
  const rightNums = numsFrom(rightText);
  const { atk, hp, spd } = parseAtkFromLeft(leftNums);
  let { bid, buyout } = parsePricesFromRight(rightNums);
  // Sometimes prices leak into left OCR — salvage trailing prices
  if (!bid && !buyout) {
    const salvaged = leftNums.filter(isPrice);
    if (salvaged.length >= 2) {
      bid = salvaged[salvaged.length - 2];
      buyout = salvaged[salvaged.length - 1];
    } else if (salvaged.length === 1) {
      bid = salvaged[0];
    }
  }
  if (!(atk > 0)) return null;
  if (!(bid > 0) && !(buyout > 0)) return null;
  return { atk, hp, spd, bid, buyout };
}

/**
 * Bulk / OCR text: lines `atk bid buyout` or full AH dumps.
 */
export function parseAuctionLiveText(text) {
  const rows = [];
  const lines = String(text || "")
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Explicit: 6026 1800 2200   or  6026,1800,2200  or 6026 1800 (bid only)
    const parts = trimmed
      .split(/[\s,;|/]+/)
      .map((p) => Number(String(p).replace(/[^\d]/g, "")))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (parts.length >= 2 && isAtk(parts[0])) {
      const atk = parts[0];
      const rest = parts.slice(1).filter((n) => n < 9000);
      if (rest.length >= 2) {
        rows.push({ atk, bid: rest[0], buyout: rest[1] });
        continue;
      }
      if (rest.length === 1) {
        rows.push({ atk, bid: rest[0], buyout: 0 });
        continue;
      }
    }
  }

  if (rows.length) return normalizeLiveMarketState(rows);

  // Fallback: global number stream row scanner
  return normalizeLiveMarketState(
    parseAuctionLiveRowsFromNumbers(numsFrom(text))
  );
}

export function parseAuctionLiveRowsFromNumbers(nums) {
  const rows = [];
  const a = Array.isArray(nums) ? nums : [];
  let i = 0;
  while (i < a.length) {
    if (!isAtk(a[i])) {
      i += 1;
      continue;
    }
    const atk = a[i];
    let j = i + 1;
    let hp = 0;
    let spd = 0;
    if (j < a.length && isHp(a[j]) && a[j] !== atk) {
      hp = a[j];
      j += 1;
    }
    if (j < a.length && isSpd(a[j])) {
      spd = a[j];
      j += 1;
    }
    if (
      j + 2 < a.length &&
      a[j] <= 72 &&
      a[j + 1] <= 59 &&
      a[j + 2] <= 59
    ) {
      j += 3;
    }
    let bid = 0;
    let buyout = 0;
    if (j < a.length && isPrice(a[j])) {
      bid = a[j];
      j += 1;
    }
    if (j < a.length && isPrice(a[j])) {
      buyout = a[j];
      j += 1;
    }
    if (atk && (bid || buyout)) {
      rows.push({ atk, hp, spd, bid, buyout });
      i = Math.max(j, i + 1);
      continue;
    }
    i += 1;
  }
  return rows;
}

export function mergeLiveMarketScreenshots(existing, incoming) {
  return normalizeLiveMarketState([
    ...(Array.isArray(existing) ? existing : []),
    ...(Array.isArray(incoming) ? incoming : []),
  ]);
}

export async function ocrAuctionLiveImage(fileOrBlob, onProgress) {
  const img = await loadImageElement(fileOrBlob);
  const scale = img.width < 800 ? 2.4 : img.width < 1200 ? 2 : 1.6;
  const full = makeScaledCanvas(img, scale);
  const bands = sliceListingBands(full, 5);
  const worker = await getAhOcrWorker();
  ahOcrProgressHandler =
    typeof onProgress === "function" ? onProgress : null;

  const rows = [];
  const texts = [];
  try {
    for (let i = 0; i < bands.length; i += 1) {
      const { left, right } = bands[i];
      if (typeof onProgress === "function") {
        onProgress(Math.round(((i + 0.3) / bands.length) * 100));
      }
      // Upscale each band crop again for tiny fonts
      const left2 = document.createElement("canvas");
      left2.width = left.width * 2;
      left2.height = left.height * 2;
      left2.getContext("2d").drawImage(left, 0, 0, left2.width, left2.height);
      const right2 = document.createElement("canvas");
      right2.width = right.width * 2;
      right2.height = right.height * 2;
      right2.getContext("2d").drawImage(right, 0, 0, right2.width, right2.height);

      const leftText = await recognizeDigits(worker, left2);
      const rightText = await recognizeSparse(worker, right2);
      texts.push(`L${i}:${leftText} | R${i}:${rightText}`);
      const parsed = parseBandPair(leftText, rightText);
      if (parsed) rows.push(parsed);
      if (typeof onProgress === "function") {
        onProgress(Math.round(((i + 1) / bands.length) * 100));
      }
    }
  } finally {
    ahOcrProgressHandler = null;
  }

  // Whole-image fallback if bands failed
  if (!rows.length) {
    const fallback = await recognizeSparse(worker, full);
    texts.push(`FULL:${fallback}`);
    return {
      text: texts.join("\n"),
      rows: parseAuctionLiveText(fallback),
    };
  }

  return {
    text: texts.join("\n"),
    rows: normalizeLiveMarketState(rows),
  };
}

export { LIVE_MARKET_MAX };
