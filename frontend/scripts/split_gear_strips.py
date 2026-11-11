from PIL import Image
from pathlib import Path

strips = Path(r"d:\idle Heroes studeis\idle_heroes_guids\frontend\src\assets\stats\gear\_strips")
out = Path(r"d:\idle Heroes studeis\idle_heroes_guids\frontend\src\assets\stats\gear")
out.mkdir(parents=True, exist_ok=True)
slots = ["weapon", "armor", "accessory", "boots"]

for strip_path in sorted(strips.glob("strip-*.png")):
    im = Image.open(strip_path).convert("RGBA")
    w, h = im.size
    piece = w // 4
    set_id = strip_path.stem.replace("strip-", "")
    for i, slot in enumerate(slots):
        left = i * piece
        right = (i + 1) * piece if i < 3 else w
        crop = im.crop((left, 0, right, h))
        # square pad
        side = max(crop.size)
        sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        sq.paste(crop, ((side - crop.size[0]) // 2, (side - crop.size[1]) // 2))
        dest = out / f"gear-{set_id}-{slot}.png"
        sq.save(dest)
        print("saved", dest.name, sq.size)
