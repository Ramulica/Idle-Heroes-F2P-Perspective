/**
 * Browser OCR for live Auction House screenshots (same-tier Attack list).
 * Parses Attack + bidding/buyout for session-only undercutting — never History.
 *
 * Typical row: Atk · HP · Spd · timer · Bidding Price · Buyout Price
 * Paste multiple screenshots to fill top LIVE_MARKET_MAX Attack copies.
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
      await worker.setParameters({
        // Sparse / uneven AH list rows
        tessedit_pageseg_mode: "4",
        preserve_interword_spaces: "1",
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

/** Dark AH UI → high-contrast white-on-black (or inverted) for Tesseract. */
async function loadImageToCanvas(fileOrBlob) {
  const url = URL.createObjectURL(fileOrBlob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = url;
    });
    const maxW = 1800;
    const scaleUp = img.width < 900 ? 2 : img.width > maxW ? maxW / img.width : 1.25;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scaleUp));
    canvas.height = Math.max(1, Math.round(img.height * scaleUp));
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) {
      sum += 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
    }
    const avg = sum / (d.length / 4);
    const darkUi = avg < 110;
    for (let i = 0; i < d.length; i += 4) {
      // Prefer green/white channel punch (timers + numbers on dark AH).
      const g =
        0.2 * d[i] + 0.55 * d[i + 1] + 0.1 * d[i + 2] + 0.15 * Math.max(d[i], d[i + 1]);
      let v = g;
      if (darkUi) v = 255 - g;
      v = v > 150 ? 255 : v < 100 ? 0 : Math.round((v - 100) * (255 / 50));
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function extractOrderedNumbers(text) {
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
function isHour(n) {
  return n >= 0 && n <= 72;
}
function isMinSec(n) {
  return n >= 0 && n <= 59;
}
function isPrice(n) {
  return n >= 100 && n <= 25000;
}

/**
 * Idle Heroes AH list row scanner:
 * Atk, HP, Spd, [HH, MM, SS], BiddingPrice, BuyoutPrice
 */
export function parseAuctionLiveRowsFromNumbers(nums) {
  const rows = [];
  let i = 0;
  const a = Array.isArray(nums) ? nums : [];
  while (i < a.length) {
    const atk = a[i];
    if (!isAtk(atk)) {
      i += 1;
      continue;
    }
    let j = i + 1;
    // Optional HP (OCR often truncates — skip if missing)
    let hp = 0;
    if (j < a.length && isHp(a[j]) && a[j] !== atk) {
      hp = a[j];
      j += 1;
    }
    // Optional Speed
    let spd = 0;
    if (j < a.length && isSpd(a[j])) {
      spd = a[j];
      j += 1;
    }
    // Optional timer HH:MM:SS
    if (
      j + 2 < a.length &&
      isHour(a[j]) &&
      isMinSec(a[j + 1]) &&
      isMinSec(a[j + 2])
    ) {
      j += 3;
    }
    // Bidding + Buyout (need at least one price)
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
    // OCR sometimes swaps / drops bid — buyout alone is enough
    if (!buyout && bid) {
      buyout = bid;
      bid = 0;
    }
    // Fix common OCR: 13000 → 3000 when atk is ~6k and buyout absurdly high
    if (buyout > 9000 && buyout % 1000 < 50 && buyout / 10 >= 500) {
      const fixed = Math.round(buyout / 10);
      if (fixed >= 500 && fixed <= 6000) buyout = fixed;
    }
    if (buyout > 0) {
      rows.push({ atk, hp, spd, bid, buyout });
      i = Math.max(j, i + 1);
      continue;
    }
    i += 1;
  }
  return rows;
}

/**
 * Also catch "Buyout … NNNN" / "Bidding … NNNN" near an Attack value on the same chunk.
 */
function parseLabeledBuyouts(text) {
  const rows = [];
  const chunks = String(text || "").split(/\n+/);
  for (const chunk of chunks) {
    const flat = chunk.replace(/,/g, " ");
    const atkMatch = flat.match(/\b([4-9]\d{3}|1\d{4})\b/);
    if (!atkMatch) continue;
    const atk = Number(atkMatch[1]);
    if (!isAtk(atk)) continue;
    const buyoutMatch =
      flat.match(/Buyout[^0-9]{0,24}(\d{3,5})/i) ||
      flat.match(/Buy\s*out[^0-9]{0,24}(\d{3,5})/i);
    const bidMatch =
      flat.match(/Bidding\s*Price[^0-9]{0,24}(\d{3,5})/i) ||
      flat.match(/Bidding[^0-9]{0,24}(\d{3,5})/i);
    const buyout = buyoutMatch ? Number(buyoutMatch[1]) : 0;
    const bid = bidMatch ? Number(bidMatch[1]) : 0;
    if (buyout >= 100 || bid >= 100) {
      rows.push({
        atk,
        bid: isPrice(bid) ? bid : 0,
        buyout: isPrice(buyout) ? buyout : isPrice(bid) ? bid : 0,
      });
    }
  }
  return rows;
}

/**
 * Pull Attack / bid / buyout from OCR or pasted AH list text.
 */
export function parseAuctionLiveText(text) {
  const nums = extractOrderedNumbers(text);
  const fromPattern = parseAuctionLiveRowsFromNumbers(nums);
  const fromLabels = parseLabeledBuyouts(text);
  return normalizeLiveMarketState([...fromPattern, ...fromLabels]);
}

/**
 * Merge another screenshot/paste into the session set (top Attack kept).
 */
export function mergeLiveMarketScreenshots(existing, incoming) {
  return normalizeLiveMarketState([
    ...(Array.isArray(existing) ? existing : []),
    ...(Array.isArray(incoming) ? incoming : []),
  ]);
}

export async function ocrAuctionLiveImage(fileOrBlob, onProgress) {
  const canvas = await loadImageToCanvas(fileOrBlob);
  ahOcrProgressHandler =
    typeof onProgress === "function" ? onProgress : null;
  try {
    const worker = await getAhOcrWorker();
    const {
      data: { text },
    } = await worker.recognize(canvas);
    // Second pass: digits-only helps prices on noisy rows
    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      tessedit_char_whitelist: "0123456789: ",
    });
    const {
      data: { text: digitText },
    } = await worker.recognize(canvas);
    // Restore general params for next image
    await worker.setParameters({
      tessedit_pageseg_mode: "4",
      tessedit_char_whitelist: "",
      preserve_interword_spaces: "1",
    });
    const combined = `${text}\n${digitText}`;
    return {
      text: combined,
      rows: parseAuctionLiveText(combined),
    };
  } finally {
    ahOcrProgressHandler = null;
  }
}
