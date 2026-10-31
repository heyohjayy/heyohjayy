"""Composite a fixed profile card over moving sky, then encode an optimized GIF.

Run scripts/render-readme-sky.cjs against the local preview first.
Only the cloud border changes; portrait and text pixels remain identical.
"""
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops

ROOT = Path(__file__).resolve().parents[1]
WIDTH, HEIGHT = 1200, 1002
CARD_WIDTH, CARD_HEIGHT = 1080, 874
LEFT, TOP = 60, 64
card = Image.open(ROOT / 'assets/profile-light.png').convert('RGBA')
card = card.resize((CARD_WIDTH, CARD_HEIGHT), Image.Resampling.LANCZOS)
frames = []
for source in sorted((ROOT / 'tmp/readme-sky').glob('sky-*.png')):
    sky = Image.open(source).convert('RGB').resize((WIDTH, HEIGHT), Image.Resampling.BICUBIC)
    sky = sky.filter(ImageFilter.GaussianBlur(.65))
    sky.paste(card, (LEFT, TOP), card)
    frames.append(sky)
if len(frames) != 48:
    raise ValueError('Expected exactly 48 sky frames')
# One palette across every frame keeps the static card from shimmering.
samples = Image.new('RGB', (WIDTH, HEIGHT * 4))
for n, i in enumerate([0, 6, 12, 24]):
    samples.paste(frames[i], (0, HEIGHT * n))
palette = samples.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
region = (LEFT+20, TOP+20, LEFT+CARD_WIDTH-20, TOP+CARD_HEIGHT-20)
baseline = indexed[0].convert('RGB').crop(region)
if any(ImageChops.difference(baseline, frame.convert('RGB').crop(region)).getbbox() for frame in indexed[1:]):
    raise ValueError('The portrait/text panel must remain completely still')
output = ROOT / 'assets/profile-sky.gif'
indexed[0].save(output, save_all=True, append_images=indexed[1:], duration=180,
                loop=0, optimize=True, disposal=1)
frames[0].save(ROOT / 'assets/profile-sky-static.png', optimize=True)
with Image.open(output) as check:
    if check.n_frames != 48 or check.info.get('loop') != 0:
        raise ValueError('Animation must loop with all 48 frames')
print(f'Built {output.name}: {output.stat().st_size/1024/1024:.2f} MiB, 48 frames, 8.64-second loop')
