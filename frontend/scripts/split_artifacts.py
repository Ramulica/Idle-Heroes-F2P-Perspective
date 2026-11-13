"""Split artifact sheet with fixed cell boxes (opaque RGB, no alpha holes)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

SRC = Path(__file__).resolve().parents[1] / "src" / "assets" / "stats" / "artifacts" / "_artifacts-sheet.png"
OUT = Path(__file__).resolve().parents[1] / "src" / "assets" / "stats" / "artifacts"

# Measured cell origins from the sheet; each tile is ~93×93 inside pink frame.
# First left cell is slightly inset vs the rest of the left block.
LEFT_XS = [23, 147, 274, 401]
RIGHT_XS = [538, 665, 792, 919]
LEFT_YS = [17, 140, 266, 391, 513, 639]
RIGHT_YS = [8, 134, 259, 385, 508, 633]
CELL = 98


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    w, h = im.size
    OUT.mkdir(parents=True, exist_ok=True)

    boxes: list[tuple[int, int, int, int]] = []
    for y in LEFT_YS:
        for x in LEFT_XS:
            boxes.append((x, y, min(w, x + CELL), min(h, y + CELL)))
    for row, y in enumerate(RIGHT_YS):
        for col, x in enumerate(RIGHT_XS):
            if row == 5 and col == 3:
                continue
            boxes.append((x, y, min(w, x + CELL), min(h, y + CELL)))

    print("boxes", len(boxes))
    for i, box in enumerate(boxes, 1):
        crop = im.crop(box)
        dest = OUT / f"arti-{i:02d}.png"
        crop.save(dest, optimize=True)
        print("saved", dest.name, crop.size)

    print("done")


if __name__ == "__main__":
    main()
