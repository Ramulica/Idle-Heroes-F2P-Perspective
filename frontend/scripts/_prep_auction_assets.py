"""Prep Auction House assets: SG icon (bg removed) + hero portrait crops."""
from pathlib import Path

import numpy as np
from PIL import Image

assets = Path(
    r"C:\Users\andre\.cursor\projects\d-idle-Heroes-studeis-idle-heroes-guids\assets"
)
sg_src = (
    assets
    / "c__Users_andre_AppData_Roaming_Cursor_User_workspaceStorage_9e93fe72736913b1b483940603accfd3_images_image-4038695c-eb3e-4f51-9c48-b8b533895743.png"
)
heroes_src = (
    assets
    / "c__Users_andre_AppData_Roaming_Cursor_User_workspaceStorage_9e93fe72736913b1b483940603accfd3_images_image-ce596cdf-f921-43db-a24e-2e839b3b1c09.png"
)

out_root = Path(__file__).resolve().parents[1] / "src" / "assets" / "auction"
out_heroes = out_root / "heroes"
out_root.mkdir(parents=True, exist_ok=True)
out_heroes.mkdir(parents=True, exist_ok=True)

# --- SG icon: remove dark brown background ---
sg = Image.open(sg_src).convert("RGBA")
arr = np.asarray(sg).copy()
r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
luma = 0.299 * r + 0.587 * g + 0.114 * b
brown = (r < 120) & (g < 90) & (b < 80) & (luma < 95)
near = (r < 140) & (g < 110) & (b < 100) & (luma < 120) & ~brown
alpha = a.astype(np.float32)
alpha[brown] = 0
alpha[near] *= 0.25
arr[:, :, 3] = alpha.astype(np.uint8)
sg_out = Image.fromarray(arr, "RGBA")
bbox = sg_out.getbbox()
if bbox:
    sg_out = sg_out.crop(bbox)
sg_out.save(out_root / "star-gem.png")
print("SG saved", sg_out.size)

names = [
    "vulcan",
    "logan",
    "hylas",
    "natalie",
    "geester",
    "elena",
    "fan",
    "phorcys",
    "carrie",
    "drake",
    "amen-ra",
    "aspen",
    "mockman",
    "aranea",
    "vesa",
    "starlight",
    "freya",
    "rogge",
    "elyvia",
    "flora",
    "cthugha",
    "delacium",
    "morax",
    "waldeck",
    "natasha",
    "ignis",
    "holmes-young",
    "penny",
    "xia",
    "sherlock",
    "inosuke",
    "valentino",
    "onikirimaru",
    "eloise",
    "tix",
    "jahra",
    "horus",
    "annabelle",
    "aylamak",
    "betty",
]

sheet = Image.open(heroes_src).convert("RGBA")
w, h = sheet.size
cols, rows = 8, 5
cw, ch = w // cols, h // rows
print("cell", cw, ch, "sheet", w, h)
for i, name in enumerate(names):
    row, col = i // cols, i % cols
    x0, y0 = col * cw, row * ch
    pad = 1
    crop = sheet.crop((x0 + pad, y0 + pad, x0 + cw - pad, y0 + ch - pad))
    crop.save(out_heroes / f"{name}.png")
print("heroes", len(names))
