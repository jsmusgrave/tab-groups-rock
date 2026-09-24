from PIL import Image, ImageDraw

STONE = (90, 98, 107)
STONE_DARK = (61, 68, 76)
STONE_LIGHT = (140, 148, 156)
BG = (245, 243, 238)


def draw_icon(size):
	img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
	d = ImageDraw.Draw(img)
	pad = size * 0.08
	d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=size * 0.18, fill=BG)

	# simple stacked-rock / cairn motif, placeholder for dev testing
	cx = size / 2
	base_y = size - pad * 1.6
	widths = [0.62, 0.46, 0.30]
	heights = [0.16, 0.14, 0.12]
	colors = [STONE, STONE_DARK, STONE_LIGHT]
	y = base_y
	for w, h, c in zip(widths, heights, colors):
		half_w = size * w / 2
		half_h = size * h / 2
		d.ellipse([cx - half_w, y - half_h * 2, cx + half_w, y], fill=c)
		y -= half_h * 1.7

	img.save(f"icon{size}.png")


for s in (16, 48, 128):
	draw_icon(s)

print("icons written")
