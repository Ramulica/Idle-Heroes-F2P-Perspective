"""Tighten gear icon crops: drop strip parchment and outer beige rim."""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

GEAR_DIR = Path(__file__).resolve().parents[1] / "src" / "assets" / "stats" / "gear"
# Zoom into the colored frame so the thin outer parchment rim disappears.
INSET_RATIO = 0.055


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
        a = int(rgba[y, x, 3])
        if a < 15:
            outside[y, x] = True
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                    q.append((ny, nx))
            continue

        r, g, b = (int(rgba[y, x, i]) for i in range(3))
        is_gap = (r + g + b) > 480 and abs(r - g) < 55 and b < r + 10 and g > 140
        is_soft = r > 170 and g > 130 and b > 90 and (r + g + b) > 430 and abs(r - g) < 70
        if not (is_gap or is_soft):
            continue

        adj = y in (0, h - 1) or x in (0, w - 1)
        if not adj:
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and outside[ny, nx]:
                    adj = True
                    break
        if not adj:
            continue

        outside[y, x] = True
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                q.append((ny, nx))

    return outside


def content_bbox(arr: np.ndarray) -> tuple[int, int, int, int]:
    outside = flood_outside(arr)
    content = (arr[:, :, 3] > 20) & ~outside
    ys, xs = np.where(content)
    if len(xs) == 0:
        ys, xs = np.where(arr[:, :, 3] > 20)
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


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


def recrop(path: Path) -> tuple[Image.Image, tuple[int, int, int, int]]:
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    left, top, right, bottom = content_bbox(arr)
    side = max(right - left + 1, bottom - top + 1)
    inset = max(2, int(round(side * INSET_RATIO)))
    left += inset
    top += inset
    right -= inset
    bottom -= inset
    if right <= left or bottom <= top:
        raise ValueError(f"inset too large for {path.name}")
    crop = square_crop(im, left, top, right, bottom)
    # Fill remaining soft parchment with transparency near edges after crop.
    carr = np.array(crop)
    r, g, b, a = (carr[:, :, i].astype(int) for i in range(4))
    soft = (a > 20) & (r > 200) & (g > 185) & (b > 150) & (np.abs(r - g) < 45)
    carr[soft, 3] = 0
    return Image.fromarray(carr), (left, top, right, bottom)


def main() -> None:
    files = sorted(GEAR_DIR.glob("gear-*-*.png"))
    if not files:
        raise SystemExit(f"No gear icons in {GEAR_DIR}")
    for path in files:
        out, bbox = recrop(path)
        out.save(path)
        print(f"saved {path.name} {out.size} from {bbox}")


if __name__ == "__main__":
    main()
