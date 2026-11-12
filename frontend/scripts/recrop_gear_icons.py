"""Tighten gear icon crops without punching holes in the art."""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

GEAR_DIR = Path(__file__).resolve().parents[1] / "src" / "assets" / "stats" / "gear"
INSET_RATIO = 0.04


def is_parchment(r: int, g: int, b: int, a: int) -> bool:
    if a < 15:
        return True
    bright = (r + g + b) > 500 and abs(r - g) < 55 and b < r + 10 and g > 150
    soft = r > 175 and g > 140 and b > 95 and (r + g + b) > 450 and abs(r - g) < 70
    return bright or soft


def flood_outside(arr: np.ndarray) -> np.ndarray:
    h, w = arr.shape[:2]
    rgba = arr.astype(np.int16)
    outside = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        q.append((0, x))
        q.append((h - 1, x))
    for y in range(h):
        q.append((y, 0))
        q.append((y, w - 1))

    while q:
        y, x = q.popleft()
        if y < 0 or y >= h or x < 0 or x >= w or visited[y, x]:
            continue
        visited[y, x] = True
        r, g, b, a = (int(rgba[y, x, i]) for i in range(4))
        if not is_parchment(r, g, b, a):
            continue
        outside[y, x] = True
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                q.append((ny, nx))
    return outside


def square_crop(im: Image.Image, left: int, top: int, right: int, bottom: int) -> Image.Image:
    w = right - left + 1
    h = bottom - top + 1
    side = max(w, h)
    cx = (left + right + 1) / 2
    cy = (top + bottom + 1) / 2
    l = int(round(cx - side / 2))
    t = int(round(cy - side / 2))
    r = l + side
    b = t + side

    pad_l = max(0, -l)
    pad_t = max(0, -t)
    pad_r = max(0, r - im.size[0])
    pad_b = max(0, b - im.size[1])
    if pad_l or pad_t or pad_r or pad_b:
        canvas = Image.new(
            "RGBA",
            (im.size[0] + pad_l + pad_r, im.size[1] + pad_t + pad_b),
            (0, 0, 0, 0),
        )
        canvas.paste(im, (pad_l, pad_t))
        im = canvas
        l += pad_l
        t += pad_t
        r += pad_l
        b += pad_t
    return im.crop((l, t, r, b))


def recrop(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    outside = flood_outside(arr)
    # Only clear edge parchment; never touch interior pixels.
    arr[outside, 3] = 0
    content = arr[:, :, 3] > 20
    ys, xs = np.where(content)
    if len(xs) == 0:
        return im
    left, right = int(xs.min()), int(xs.max())
    top, bottom = int(ys.min()), int(ys.max())
    side = max(right - left + 1, bottom - top + 1)
    inset = max(1, int(round(side * INSET_RATIO)))
    left += inset
    top += inset
    right -= inset
    bottom -= inset
    if right <= left or bottom <= top:
        return Image.fromarray(arr)
    crop = square_crop(Image.fromarray(arr), left, top, right, bottom)
    # Bake onto cream so any leftover alpha never shows as black holes in UI.
    cream = Image.new("RGBA", crop.size, (255, 250, 240, 255))
    cream.paste(crop, (0, 0), crop)
    return cream.convert("RGBA")


def main() -> None:
    files = sorted(GEAR_DIR.glob("gear-*-*.png"))
    if not files:
        raise SystemExit(f"No gear icons in {GEAR_DIR}")
    for path in files:
        out = recrop(path)
        out.save(path)
        print(f"saved {path.name} {out.size}")


if __name__ == "__main__":
    main()
