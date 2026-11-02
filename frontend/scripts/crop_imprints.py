from PIL import Image
import os

path = r"d:\idle Heroes studeis\idle_heroes_guids\frontend\src\assets\stats\imprints\_imprint-list.png"
out = r"d:\idle Heroes studeis\idle_heroes_guids\frontend\src\assets\stats\imprints"
im = Image.open(path).convert("RGB")
w, h = im.size
print("size", w, h)
px = im.load()


def is_purple(r, g, b):
    return r > 80 and b > 100 and b > r and b > g + 20 and r < 200


left = int(w * 0.22)
centers = []
y = 0
while y < h:
    count = sum(1 for x in range(left) if is_purple(*px[x, y]))
    if count > 8:
        y0 = y
        while y < h:
            count = sum(1 for x in range(left) if is_purple(*px[x, y]))
            if count <= 8:
                break
            y += 1
        y1 = y
        cy = (y0 + y1) // 2
        xs = [x for x in range(left) if is_purple(*px[x, cy])]
        if xs:
            cx = (min(xs) + max(xs)) // 2
            rad = max((max(xs) - min(xs)) // 2, (y1 - y0) // 2)
            centers.append((cx, cy, rad))
    else:
        y += 1

print("found", len(centers))
for i, c in enumerate(centers, 1):
    print(i, c)

for i, (cx, cy, rad) in enumerate(centers[:10], 1):
    pad = max(rad + 8, 30)
    box = (max(0, cx - pad), max(0, cy - pad), min(w, cx + pad), min(h, cy + pad))
    crop = im.crop(box).convert("RGBA")
    side = max(crop.size)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(crop, ((side - crop.size[0]) // 2, (side - crop.size[1]) // 2))
    dest = os.path.join(out, f"imprint-{i:02d}.png")
    sq.save(dest)
    print("saved", dest, sq.size)
