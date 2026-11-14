from PIL import Image
from pathlib import Path
import collections

base = Path(
    r"C:\Users\andre\.cursor\projects\d-idle-Heroes-studeis-idle-heroes-guids\assets"
)
out_tenants = Path(
    r"d:\idle Heroes studeis\idle_heroes_guids\frontend\src\assets\stats\tenants"
)
out_cloud = Path(
    r"d:\idle Heroes studeis\idle_heroes_guids\frontend\src\assets\stats\cloudIsland"
)
out_tenants.mkdir(parents=True, exist_ok=True)
out_cloud.mkdir(parents=True, exist_ok=True)

files = [
    (
        "tenants-btn.png",
        out_tenants,
        "c__Users_andre_AppData_Roaming_Cursor_User_workspaceStorage_9e93fe72736913b1b483940603accfd3_images_image-23d3125d-910e-4584-81ec-fb86ffce233d.png",
    ),
    (
        "house-01.png",
        out_tenants,
        "c__Users_andre_AppData_Roaming_Cursor_User_workspaceStorage_9e93fe72736913b1b483940603accfd3_images_image-a3868ef9-ebe3-445f-8a2c-eee43a291ecd.png",
    ),
    (
        "house-02.png",
        out_tenants,
        "c__Users_andre_AppData_Roaming_Cursor_User_workspaceStorage_9e93fe72736913b1b483940603accfd3_images_image-72a1052a-b5b9-4a7f-9f36-000049e0dbf6.png",
    ),
    (
        "house-03.png",
        out_tenants,
        "c__Users_andre_AppData_Roaming_Cursor_User_workspaceStorage_9e93fe72736913b1b483940603accfd3_images_image-9923bb95-e2ba-42d2-bca9-29cc033053e6.png",
    ),
    (
        "house-04.png",
        out_tenants,
        "c__Users_andre_AppData_Roaming_Cursor_User_workspaceStorage_9e93fe72736913b1b483940603accfd3_images_image-76d0ab80-4ec1-4a05-9998-1864d8e7e0ae.png",
    ),
    (
        "cloud-btn.png",
        out_cloud,
        "c__Users_andre_AppData_Roaming_Cursor_User_workspaceStorage_9e93fe72736913b1b483940603accfd3_images_image-32224e75-4165-4fb3-83bb-fe6dbbdad950.png",
    ),
    (
        "build-01.png",
        out_cloud,
        "c__Users_andre_AppData_Roaming_Cursor_User_workspaceStorage_9e93fe72736913b1b483940603accfd3_images_image-57f772c6-6004-4090-9004-5b57a608abb0.png",
    ),
    (
        "build-02.png",
        out_cloud,
        "c__Users_andre_AppData_Roaming_Cursor_User_workspaceStorage_9e93fe72736913b1b483940603accfd3_images_image-2c266284-e62d-4100-a24e-13cec11bde1a.png",
    ),
]


def is_beige(p):
    r, g, b, a = p
    if a < 20:
        return True
    if r > 190 and g > 170 and b > 140 and r - b < 80 and g - b < 60 and abs(r - g) < 40:
        return True
    if r > 245 and g > 245 and b > 245:
        return True
    return False


def is_blue_bg(p):
    r, g, b, a = p
    if a < 20:
        return True
    if b > r + 40 and b > g + 20 and r < 120 and g < 150 and b > 140:
        return True
    return False


def flood_clear(im, match_fn):
    w, h = im.size
    px = im.load()
    visited = [[False] * h for _ in range(w)]
    q = collections.deque()
    seeds = [
        (0, 0),
        (w - 1, 0),
        (0, h - 1),
        (w - 1, h - 1),
        (w // 2, 0),
        (0, h // 2),
        (w - 1, h // 2),
        (w // 2, h - 1),
    ]
    for x, y in seeds:
        if match_fn(px[x, y]):
            q.append((x, y))
            visited[x][y] = True
    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny] and match_fn(px[nx, ny]):
                visited[nx][ny] = True
                q.append((nx, ny))
    return im


def remove_grass_base(im):
    w, h = im.size
    px = im.load()

    def is_grass_or_dirt(p):
        r, g, b, a = p
        if a < 10:
            return False
        if g > r + 25 and g > b + 25 and g > 90 and r < 180:
            return True
        if 70 < r < 170 and 50 < g < 130 and 30 < b < 100 and r >= g >= b and (r - b) > 25:
            if g < r - 5:
                return True
        return False

    visited = [[False] * w for _ in range(h)]
    q = collections.deque()
    for x in range(w):
        for y in range(h - 1, max(h // 3, 0), -1):
            if px[x, y][3] > 0 and is_grass_or_dirt(px[x, y]):
                edge = x < 3 or y < 3 or x > w - 4 or y > h - 4
                near_t = False
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] < 10:
                        near_t = True
                if edge or near_t:
                    q.append((x, y))
                    visited[y][x] = True
                    break
    for x in range(w):
        for y in (0, h - 1):
            if px[x, y][3] > 0 and is_grass_or_dirt(px[x, y]) and not visited[y][x]:
                q.append((x, y))
                visited[y][x] = True
    for y in range(h):
        for x in (0, w - 1):
            if px[x, y][3] > 0 and is_grass_or_dirt(px[x, y]) and not visited[y][x]:
                q.append((x, y))
                visited[y][x] = True
    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in (
            (x - 1, y),
            (x + 1, y),
            (x, y - 1),
            (x, y + 1),
            (x - 1, y - 1),
            (x + 1, y - 1),
            (x - 1, y + 1),
            (x + 1, y + 1),
        ):
            if (
                0 <= nx < w
                and 0 <= ny < h
                and not visited[ny][nx]
                and is_grass_or_dirt(px[nx, ny])
            ):
                visited[ny][nx] = True
                q.append((nx, ny))
    return im


def crop_alpha(im, pad=4):
    bbox = im.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.width, r + pad)
    b = min(im.height, b + pad)
    return im.crop((l, t, r, b))


for name, outdir, src in files:
    im = Image.open(base / src).convert("RGBA")
    if name == "tenants-btn.png":
        im = flood_clear(im, is_blue_bg)
    elif name == "cloud-btn.png":
        im = flood_clear(im, is_beige)
    else:
        im = flood_clear(im, is_beige)
        im = remove_grass_base(im)
        im = flood_clear(im, is_beige)
    im = crop_alpha(im)
    dest = outdir / name
    im.save(dest)
    print("wrote", dest, im.size)
