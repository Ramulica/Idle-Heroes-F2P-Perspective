"""
Crop starspawn icons above the level badge (no scrub).
Shift crop up so faces sit mid-circle; keep gold ring.
"""
from __future__ import annotations

import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "src" / "assets" / "stats" / "starspawns"
ICONS = OUT / "icons"
PREV = OUT / "_preview"
ICONS.mkdir(parents=True, exist_ok=True)
PREV.mkdir(parents=True, exist_ok=True)

ASSETS = Path(
    r"C:\Users\andre\.cursor\projects\d-idle-Heroes-studeis-idle-heroes-guids\assets"
)
P2 = ASSETS / "c__Users_andre_AppData_Roaming_Cursor_User_workspaceStorage_9e93fe72736913b1b483940603accfd3_images_image-5f765f1c-c71b-47f4-adff-d5f5f45ab3a5.png"
P3 = ASSETS / "c__Users_andre_AppData_Roaming_Cursor_User_workspaceStorage_9e93fe72736913b1b483940603accfd3_images_image-2ca23432-e75e-4da2-ab58-53de5e152f14.png"

NAMES2 = [
    "wraith",
    "honor",
    "fervor",
    "nature",
    "twilight",
    "splendor",
    "transcendence",
    "valor",
    "wisdom",
    "freedom",
    "coldblood",
    "prayer",
]
NAMES3 = ["grace", "bravery", "trial", "justice", "crystal", "piety"]
SIZE = 160

# (dx, dy, half_frac) — dy negative moves crop up (drops badge, centers face)
OFFSETS = {
    # dx: + right, dy: + down (move crop). Face too low → raise dy. Face too left → lower dx.
    "wraith": (0.02, -0.20, 0.92),
    "honor": (0.02, -0.22, 0.90),
    "fervor": (0.06, -0.18, 0.92),
    "nature": (0.00, -0.18, 0.92),
    "twilight": (0.04, -0.20, 0.90),
    "splendor": (0.02, -0.20, 0.90),
    "transcendence": (0.06, -0.20, 0.90),
    "valor": (0.00, -0.20, 0.92),
    "wisdom": (-0.08, -0.16, 0.94),
    "freedom": (0.04, -0.20, 0.92),
    "coldblood": (0.02, -0.20, 0.90),
    "prayer": (0.00, -0.18, 0.92),
    "grace": (0.02, -0.20, 0.90),
    "bravery": (0.00, -0.22, 0.90),
    "trial": (0.06, -0.14, 0.94),
    "justice": (0.02, -0.20, 0.90),
    "crystal": (0.00, -0.22, 0.90),
    "piety": (0.00, -0.20, 0.90),
}


def page_bbox_fast(bgr: np.ndarray):
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    white = (r > 232) & (g > 232) & (b > 232)
    black = (r < 42) & (g < 32) & (b < 30)
    ys, xs = np.where(~(white | black))
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def detect_ring(cell_bgr: np.ndarray):
    h, w = cell_bgr.shape[:2]
    gray = cv2.cvtColor(cell_bgr, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (9, 9), 2)
    circles = cv2.HoughCircles(
        blur,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=min(h, w) // 2,
        param1=100,
        param2=26,
        minRadius=int(min(h, w) * 0.26),
        maxRadius=int(min(h, w) * 0.50),
    )
    if circles is None:
        raise RuntimeError("no circle")
    cx0, cy0 = w / 2.0, h * 0.42
    best = min(
        circles[0],
        key=lambda c: (float(c[0]) - cx0) ** 2 + (float(c[1]) - cy0) ** 2,
    )
    return float(best[0]), float(best[1]), float(best[2])


def extract_icon(full_bgr, cell, name):
    x0, y0, x1, y1 = cell
    pad = 8
    xa, ya = max(0, x0 - pad), max(0, y0 - pad)
    xb = min(full_bgr.shape[1], x1 + pad)
    yb = min(full_bgr.shape[0], y1 + pad)
    cell_img = full_bgr[ya:yb, xa:xb]
    rcx, rcy, rr = detect_ring(cell_img)

    dx, dy, half_frac = OFFSETS.get(name, (0.0, -0.14, 0.90))
    cx = xa + rcx + dx * rr
    cy = ya + rcy + dy * rr
    half = int(round(rr * half_frac))

    sx0 = int(round(cx)) - half
    sy0 = int(round(cy)) - half
    sx1 = sx0 + half * 2
    sy1 = sy0 + half * 2

    pad_l = max(0, -sx0)
    pad_t = max(0, -sy0)
    pad_r = max(0, sx1 - full_bgr.shape[1])
    pad_b = max(0, sy1 - full_bgr.shape[0])
    src = full_bgr
    if pad_l or pad_t or pad_r or pad_b:
        # Fill with purple-ish so edges aren't white page
        src = cv2.copyMakeBorder(
            full_bgr, pad_t, pad_b, pad_l, pad_r, cv2.BORDER_REPLICATE
        )
        sx0 += pad_l
        sy0 += pad_t
        sx1 += pad_l
        sy1 += pad_t

    crop = src[sy0:sy1, sx0:sx1].copy()
    if crop.shape[0] != crop.shape[1]:
        s = min(crop.shape[:2])
        crop = crop[:s, :s]

    h, w = crop.shape[:2]
    purple = tuple(
        int(v) for v in np.median(crop[h // 3 : h // 2, 4:14].reshape(-1, 3), axis=0)
    )
    white = (crop[:, :, 2] > 235) & (crop[:, :, 1] > 235) & (crop[:, :, 0] > 235)
    crop[white] = purple

    # Cover leftover badge band at bottom
    for y in range(int(h * 0.86), h):
        for x in range(int(w * 0.12), int(w * 0.88)):
            b, g, r = [int(v) for v in crop[y, x]]
            tan = r > 120 and g > 90 and b < 170 and r >= g and (r - b) > 12
            cream = r > 190 and g > 175 and b > 150
            if tan or cream:
                crop[y, x] = purple
    cv2.ellipse(
        crop,
        (w // 2, int(h * 0.97)),
        (int(w * 0.26), int(h * 0.08)),
        0,
        0,
        360,
        purple,
        -1,
    )

    s = crop.shape[0]
    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    alpha = np.zeros((s, s), np.uint8)
    cv2.circle(alpha, (s // 2, s // 2), s // 2 - 1, 255, -1, lineType=cv2.LINE_AA)
    rgba = np.dstack([rgb, alpha])
    img = Image.fromarray(rgba, "RGBA").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    img.save(ICONS / f"{name}.png")
    print(f"saved {name}")


def grid_cells(bbox, cols, rows):
    minx, miny, maxx, maxy = bbox
    cw = (maxx - minx) / cols
    rh = (maxy - miny) / rows
    return [
        (
            int(minx + c * cw),
            int(miny + r * rh),
            int(minx + (c + 1) * cw),
            int(miny + (r + 1) * rh),
        )
        for r in range(rows)
        for c in range(cols)
    ]


def img3_cells(bbox):
    minx, miny, maxx, maxy = bbox
    cw = (maxx - minx) / 4
    mid = miny + (maxy - miny) * 0.52
    cells = [
        (int(minx + c * cw), miny, int(minx + (c + 1) * cw), int(mid)) for c in range(4)
    ]
    cells += [
        (int(minx + c * cw), int(mid), int(minx + (c + 1) * cw), maxy) for c in range(2)
    ]
    return cells


def make_contact_sheet(names):
    cols = 6
    rows = math.ceil(len(names) / cols)
    cell = 110
    sheet = Image.new("RGBA", (cols * cell, rows * cell), (24, 16, 36, 255))
    for i, name in enumerate(names):
        im = (
            Image.open(ICONS / f"{name}.png")
            .convert("RGBA")
            .resize((cell - 10, cell - 10), Image.Resampling.LANCZOS)
        )
        sheet.paste(im, ((i % cols) * cell + 5, (i // cols) * cell + 5), im)
    sheet.save(PREV / "contact.png")


def make_cartoon_star(path, size=128):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = cy = size / 2
    outer, inner = size * 0.42, size * 0.18
    pts = [
        (
            cx + (outer if i % 2 == 0 else inner) * math.cos(-math.pi / 2 + i * math.pi / 5),
            cy + (outer if i % 2 == 0 else inner) * math.sin(-math.pi / 2 + i * math.pi / 5),
        )
        for i in range(10)
    ]
    draw.polygon([(x + 3, y + 4) for x, y in pts], fill=(60, 30, 10, 80))
    draw.polygon(pts, fill=(255, 196, 45, 255))
    draw.line(pts + [pts[0]], fill=(120, 60, 10, 255), width=3)
    pts2 = [
        (
            cx
            + ((outer * 0.58) if i % 2 == 0 else (inner * 0.65))
            * math.cos(-math.pi / 2 + i * math.pi / 5),
            cy
            + ((outer * 0.58) if i % 2 == 0 else (inner * 0.65))
            * math.sin(-math.pi / 2 + i * math.pi / 5),
        )
        for i in range(10)
    ]
    draw.polygon(pts2, fill=(255, 236, 120, 255))
    draw.ellipse(
        (cx - size * 0.09, cy - size * 0.2, cx + size * 0.01, cy - size * 0.08),
        fill=(255, 255, 235, 230),
    )
    img.save(path)


def main():
    im2 = cv2.imread(str(P2))
    for name, cell in zip(NAMES2, grid_cells(page_bbox_fast(im2), 4, 3)):
        extract_icon(im2, cell, name)

    im3 = cv2.imread(str(P3))
    for name, cell in zip(NAMES3, img3_cells(page_bbox_fast(im3))):
        extract_icon(im3, cell, name)

    make_cartoon_star(OUT / "star-destiny.png")
    make_contact_sheet(NAMES2 + NAMES3)
    print("done")


if __name__ == "__main__":
    main()
