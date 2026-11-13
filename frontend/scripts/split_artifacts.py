"""Split the Idle Heroes artifact icon sheet into individual PNGs.

Keep frames opaque — do NOT punch gold/highlights to transparent.
Layout: two 4×6 blocks (right block missing bottom-right) = 47 icons.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parents[1] / "src" / "assets" / "stats" / "artifacts" / "_artifacts-sheet.png"
OUT = Path(__file__).resolve().parents[1] / "src" / "assets" / "stats" / "artifacts"


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"missing sheet: {SRC}")

    im = Image.open(SRC).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)
    arr = np.asarray(im.convert("RGB"))
    h, w, _ = arr.shape
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    # Pink/magenta frame ink only (tight) — not gold
    pink = (r > 160) & (b > 140) & (r > g + 25) & (b > g + 15) & (r + b > g * 2.2)

    left_xs = [24, 150, 278, 405]
    right_xs = [542, 668, 795, 922]
    left_ys = [18, 144, 270, 395, 517, 643]
    right_ys = [12, 138, 263, 389, 512, 637]
    cell_w, cell_h = 93, 94

    def refine(x0: int, y0: int) -> tuple[int, int, int, int] | None:
        x1 = min(w, x0 + cell_w + 14)
        y1 = min(h, y0 + cell_h + 14)
        xs0 = max(0, x0 - 10)
        ys0 = max(0, y0 - 10)
        region = pink[ys0:y1, xs0:x1]
        ys, xs = np.where(region)
        if len(xs) < 40:
            return (
                max(0, x0 - 2),
                max(0, y0 - 2),
                min(w, x0 + cell_w + 4),
                min(h, y0 + cell_h + 4),
            )
        return (
            int(xs.min()) + xs0,
            int(ys.min()) + ys0,
            int(xs.max()) + xs0 + 1,
            int(ys.max()) + ys0 + 1,
        )

    boxes: list[tuple[int, int, int, int]] = []
    for y in left_ys:
        for x in left_xs:
            boxes.append(refine(x, y))
    for row, y in enumerate(right_ys):
        for col, x in enumerate(right_xs):
            if row == 5 and col == 3:
                continue
            boxes.append(refine(x, y))

    print(f"boxes {len(boxes)}")
    for i, box in enumerate(boxes, 1):
        x0, y0, x1, y1 = box
        # 1px pad, keep fully opaque RGB crop (no alpha holes)
        pad = 1
        crop = im.crop(
            (max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad))
        ).convert("RGB")
        side = max(crop.size)
        # cream canvas matching UI (not black) so any letterbox is invisible
        sq = Image.new("RGB", (side, side), (255, 248, 232))
        sq.paste(crop, ((side - crop.size[0]) // 2, (side - crop.size[1]) // 2))
        dest = OUT / f"arti-{i:02d}.png"
        sq.save(dest, optimize=True)
        print("saved", dest.name, sq.size)

    print("done", len(boxes))


if __name__ == "__main__":
    main()
