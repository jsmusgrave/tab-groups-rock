"""Render a Chrome Web Store promo tile from the icon geometry.

Usage: python3 store/promo_tile.py icons/icon.svg store/promo-tile-440x280.png
       python3 store/promo_tile.py icons/icon.svg store/marquee-tile-1400x560.png marquee
Needs Pillow and macOS's Avenir Next font.
"""
import re
import sys

from PIL import Image, ImageDraw, ImageFont

svg_path, out_path = sys.argv[1], sys.argv[2]
marquee = sys.argv[3:] == ['marquee']
# Each layout: canvas, icon size, text inset, title and tagline sizes, line offsets, gap to the icon.
if marquee:
    W, H, ICON, X, TITLE, TAG, DY, GAP = 1400, 560, 400, 96, 92, 38, (0, 108, 268, 320), 48
else:
    W, H, ICON, X, TITLE, TAG, DY, GAP = 440, 280, 196, 28, 34, 15, (0, 40, 104, 125), 18
SS = 4
BG = '#1b1a19'
RED = '#ec3013'
FONT = '/System/Library/Fonts/Avenir Next.ttc'
HEAVY, MEDIUM = 8, 5

shapes = re.findall(r'<polygon points="([^"]+)" fill="(#[0-9a-fA-F]{6})"', open(svg_path).read())
img = Image.new('RGB', (W * SS, H * SS), BG)
d = ImageDraw.Draw(img)

# Icon: 128-unit art scaled to ICON px, flush with the right edge so the tabs run off the tile.
k = ICON / 128 * SS
ox, oy = (W - ICON) * SS, (H - ICON) / 2 * SS
for pts, fill in shapes:
    xy = [(ox + float(x) * k, oy + float(y) * k) for x, y in (p.split(',') for p in pts.split())]
    d.polygon(xy, fill=fill)

def font(index, size):
    return ImageFont.truetype(FONT, size * SS, index=index)

title, tag = font(HEAVY, TITLE), font(MEDIUM, TAG)
lines = [('Tab Groups', title, '#ffffff', DY[0]), ('Rock', title, RED, DY[1]),
         ('Archive tab groups', tag, '#bab6b6', DY[2]), ('as Obsidian notes.', tag, '#bab6b6', DY[3])]
right = max(d.textbbox((0, 0), t, font=f)[2] for t, f, _, _ in lines) / SS
assert X + right + GAP <= W - ICON, f'text ends at {X + right:.0f}, icon starts at {W - ICON}'
block_h = DY[3] + TAG * 1.4
top = (H - block_h) / 2 - TAG * 0.4
for text, f, fill, dy in lines:
    d.text((X * SS, (top + dy) * SS), text, font=f, fill=fill)

img.resize((W, H), Image.LANCZOS).save(out_path, optimize=True)
