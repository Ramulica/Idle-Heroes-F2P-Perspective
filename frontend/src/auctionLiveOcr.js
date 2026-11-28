/**
 * Browser OCR for live Auction House screenshots.
 * Parses Attack + buyout pairs for session-only undercutting — never History.
 */

import { normalizeLiveMarketState } from "./auctionHouse";

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
        tessedit_pageseg_mode: "6",
        preserve_interword_spaces: "1",
        tessedit_char_whitelist: "0123456789., AtkHPSpdSG",
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

async function loadImageToCanvas(fileOrBlob) {
  const url = URL.createObjectURL(fileOrBlob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    const maxW = 1600;
    const scale = img.width > maxW ? maxW / img.width : 1;
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // Boost contrast for parchment / blue SG UI text.
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
      const v = g > 140 ? 255 : g < 90 ? 0 : Math.round(g);
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Pull Attack/buyout candidates from OCR or pasted text.
 * Heuristic: on each line, pick a mid Attack (3–5 digit) and a buyout (SG).
 */
export function parseAuctionLiveText(text) {
  const lines = String(text || "")
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/);
  const rows = [];

  for (const line of lines) {
    const cleaned = line.replace(/,/g, " ").replace(/[^\d.\s]/g, " ");
    const nums = [...cleaned.matchAll(/\d{2,6}/g)]
      .map((m) => Number(m[0]))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (nums.length < 2) continue;

    // Prefer larger value as Attack when one looks like flats (3k–20k) and one like SG.
    let atk = null;
    let buyout = null;
    const atkLike = nums.filter((n) => n >= 2500 && n <= 25000);
    const priceLike = nums.filter((n) => n >= 50 && n <= 20000);
    if (atkLike.length && priceLike.length) {
      atk = Math.max(...atkLike);
      buyout = Math.min(
        ...priceLike.filter((n) => n !== atk || priceLike.length === 1)
      );
      if (buyout === atk && priceLike.length > 1) {
        buyout = Math.min(...priceLike.filter((n) => n < atk));
      }
    } else {
      // Fallback: first = atk, last = buyout when two distinct numbers.
      const uniq = [...new Set(nums)];
      if (uniq.length >= 2) {
        atk = uniq[0];
        buyout = uniq[uniq.length - 1];
      }
    }
    if (atk != null && buyout != null && atk !== buyout) {
      rows.push({ atk, buyout });
    }
  }

  // Whole-text pair scan if line split failed (dense OCR dump).
  if (!rows.length) {
    const all = [
      ...String(text || "")
        .replace(/,/g, "")
        .matchAll(/\d{3,5}/g),
    ].map((m) => Number(m[0]));
    for (let i = 0; i + 1 < all.length; i += 1) {
      const a = all[i];
      const b = all[i + 1];
      if (a >= 2500 && a <= 25000 && b >= 50 && b <= 20000 && a !== b) {
        rows.push({ atk: a, buyout: b });
        i += 1;
      }
    }
  }

  return normalizeLiveMarketState(rows);
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
    return {
      text: String(text || ""),
      rows: parseAuctionLiveText(text),
    };
  } finally {
    ahOcrProgressHandler = null;
  }
}
