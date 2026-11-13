"""Split the Idle Heroes artifact icon sheet into individual PNGs.

Layout: two 4×6 blocks (right block missing bottom-right) = 47 icons.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(
    r"C:\Users\andre\AppData\Roaming\Cursor\User\workspaceStorage"
    r"\9e93fe72736913b1b483940603accfd3\images"
    r"\image-bb7f6539-f0d3-41f5-97a5-2d9c26d4537d.png"
)
OUT = Path(__file__).resolve().parents[1] / "src" / "assets" / "stats" / "artifacts"
SHEET_COPY = OUT / "_artifacts-sheet.png"


def is_tan(r: int, g: int, b: int) -> bool:
    return r > 175 and 130 < g < 205 and b < 170 and r > b + 25 and r >= g


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)
    im.save(SHEET_COPY)

    # Measured from pink-frame detection: left block + right block.
    # Each cell ~93×90 with small gaps; refine by local pink search.
    left_xs = [24, 150, 278, 405]
    right_xs = [542, 668, 795, 922]
    # Row tops differ slightly between blocks
    left_ys = [18, 144, 270, 395, 517, 643]
    right_ys = [12, 138, 263, 389, 512, 637]
    cell_w, cell_h = 93, 94

    arr = np.asarray(im.convert("RGB"))
    h, w, _ = arr.shape
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    pink = (r > 150) & (b > 130) & (r > g + 15) & (b > g + 5)

    def refine(x0: int, y0: int) -> tuple[int, int, int, int] | None:
        """Search near expected cell for pink frame bbox."""
        x1 = min(w, x0 + cell_w + 12)
        y1 = min(h, y0 + cell_h + 12)
        xs0 = max(0, x0 - 8)
        ys0 = max(0, y0 - 8)
        region = pink[ys0:y1, xs0:x1]
        ys, xs = np.where(region)
        if len(xs) < 40:
            # fallback: non-tan content
            sub = arr[ys0:y1, xs0:x1]
            mask = np.zeros(sub.shape[:2], dtype=bool)
            for yy in range(sub.shape[0]):
                for xx in range(sub.shape[1]):
                    mask[yy, xx] = not is_tan(*tuple(sub[yy, xx]))
            ys, xs = np.where(mask)
            if len(xs) < 40:
                return None
            return (
                int(xs.min()) + xs0,
                int(ys.min()) + ys0,
                int(xs.max()) + xs0 + 1,
                int(ys.max()) + ys0 + 1,
            )
        return (
            int(xs.min()) + xs0,
            int(ys.min()) + ys0,
            int(xs.max()) + xs0 + 1,
            int(ys.max()) + ys0 + 1,
        )

    boxes: list[tuple[int, int, int, int]] = []
    # Left block 4×6
    for row, y in enumerate(left_ys):
        for col, x in enumerate(left_xs):
            box = refine(x, y)
            if box is None:
                print("MISSING left", row, col, x, y)
            else:
                boxes.append(box)
    # Right block 4×6 minus last cell
    for row, y in enumerate(right_ys):
        for col, x in enumerate(right_xs):
            if row == 5 and col == 3:
                continue
            box = refine(x, y)
            if box is None:
                print("MISSING right", row, col, x, y)
            else:
                boxes.append(box)

    print(f"boxes {len(boxes)}")
    for i, box in enumerate(boxes, 1):
        pad = 2
        x0, y0, x1, y1 = box
        crop = im.crop(
            (max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad))
        )
        c = np.asarray(crop).copy()
        flat = c.reshape(-1, 4)
        for i_px, px in enumerate(flat):
            if is_tan(int(px[0]), int(px[1]), int(px[2])):
                flat[i_px, 3] = 0
        out = Image.fromarray(c, "RGBA")
        # normalize to square canvas
        side = max(out.size)
        sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        sq.paste(out, ((side - out.size[0]) // 2, (side - out.size[1]) // 2))
        dest = OUT / f"arti-{i:02d}.png"
        sq.save(dest)
        print("saved", dest.name, sq.size, box)

    # remove any old extras beyond 47
    for old in OUT.glob("arti-*.png"):
        num = int(old.stem.split("-")[1])
        if num > len(boxes):
            old.unlink()
            print("removed", old.name)

    print("done", len(boxes))


if __name__ == "__main__":
    main()
