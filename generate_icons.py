"""Generate PWA app icons using PIL."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'icons')
os.makedirs(OUT_DIR, exist_ok=True)

SIZES = [192, 512]
BG = (27, 116, 228)       # #1b74e4
FG = (255, 255, 255)       # white
RADIUS_RATIO = 0.18        # corner radius as fraction of size

def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background
    r = int(size * RADIUS_RATIO)
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=r,
        fill=BG,
    )

    # Try to use a TrueType font, fall back to default
    font_size = int(size * 0.55)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except (IOError, OSError):
        try:
            font = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", font_size)
        except (IOError, OSError):
            font = ImageFont.load_default()

    # Draw "S" letter
    text = "S"
    # Use textbbox for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=FG)

    path = os.path.join(OUT_DIR, f'icon-{size}.png')
    img.save(path, 'PNG')
    print(f'Created {path} ({size}x{size})')

for s in SIZES:
    create_icon(s)