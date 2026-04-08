"""Strip quiz frame: corner flood-fill + tight crop on outline + pink/lavender haze pass."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "mascot-raw.png"
OUT = ROOT / "public" / "quiz-mascot.png"


def is_outline(r: int, g: int, b: int, a: int) -> bool:
    """Soft grey pixel-art outline (~#8b8680), not black."""
    return a > 200 and max(r, g, b) < 162 and (r + g + b) < 500


def is_haze(r: int, g: int, b: int, a: int) -> bool:
    """Panel / shadow / stray pink — not fur, bow, eyes, blush, or neutral white."""
    if a < 55:
        return False
    if max(r, g, b) < 100:
        return False
    if b > r + 10 and b > g + 7 and b > 128:
        return False
    if r > 193 and 108 < g < 210 and 120 < b < 235 and (r - g) > 17:
        return False
    if min(r, g, b) > 239 and abs(r - g) < 10 and abs(r - b) < 11:
        return False
    if r > 158 and g > 108 and b > 118:
        return True
    if min(r, g, b) > 200 and (r >= g + 4 or r >= b + 5):
        return True
    return False


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing {SRC}")
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    px = im.load()
    transparent = (0, 0, 0, 0)

    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        try:
            ImageDraw.floodfill(im, xy, transparent, thresh=48)
        except ValueError:
            pass

    xs: list[int] = []
    ys: list[int] = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_outline(r, g, b, a):
                xs.append(x)
                ys.append(y)

    if not xs:
        raise SystemExit("No outline found in image")

    pad = 12
    minx = max(0, min(xs) - pad)
    maxx = min(w - 1, max(xs) + pad)
    miny = max(0, min(ys) - pad)
    maxy = min(h - 1, max(ys) + pad)

    for y in range(h):
        for x in range(w):
            if x < minx or x > maxx or y < miny or y > maxy:
                px[x, y] = transparent

    for y in range(miny, maxy + 1):
        for x in range(minx, maxx + 1):
            r, g, b, a = px[x, y]
            if a > 50 and is_haze(r, g, b, a):
                px[x, y] = transparent

    # Anti-aliased pink/beige fringe touching transparency
    for y in range(miny, maxy + 1):
        for x in range(minx, maxx + 1):
            r, g, b, a = px[x, y]
            if a < 55 or max(r, g, b) < 150:
                continue
            if b > r + 8 and b > g + 5 and b > 125:
                continue
            if r > 193 and 108 < g < 210 and 120 < b < 235 and (r - g) > 17:
                continue
            if min(r, g, b) > 236 and abs(r - g) < 10:
                continue
            if min(r, g, b) > 178 and r + g + b > 565 and (r - min(g, b)) > 6:
                tn = 0
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nx, ny = x + dx, y + dy
                    if nx < minx or nx > maxx or ny < miny or ny > maxy:
                        tn += 1
                    elif px[nx, ny][3] < 45:
                        tn += 1
                if tn >= 1:
                    px[x, y] = transparent

    OUT.parent.mkdir(parents=True, exist_ok=True)
    im.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
