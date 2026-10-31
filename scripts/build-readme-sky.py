"""Encode day/bird and night/star sky borders around fixed profile cards."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops

ROOT = Path(__file__).resolve().parents[1]
WIDTH, HEIGHT = 1200, 1002
CARD_WIDTH, CARD_HEIGHT = 1080, 874
LEFT, TOP = 60, 64


def build(theme):
    card = Image.open(ROOT / f'assets/profile-{theme}.png').convert('RGBA')
    card = card.resize((CARD_WIDTH, CARD_HEIGHT), Image.Resampling.LANCZOS)
    frames = []
    for source in sorted((ROOT / 'tmp/readme-sky' / theme).glob('sky-*.png')):
        sky = Image.open(source).convert('RGB').resize((WIDTH, HEIGHT), Image.Resampling.BICUBIC)
        sky = sky.filter(ImageFilter.GaussianBlur(.3))
        sky.paste(card, (LEFT, TOP), card)
        frames.append(sky)
    if len(frames) != 72:
        raise ValueError(f'Expected exactly 72 {theme} sky frames')
    # A shared palette keeps all still portrait/text pixels identical.
    samples = Image.new('RGB', (WIDTH, HEIGHT * 4))
    for n, i in enumerate([0, 9, 18, 36]):
        samples.paste(frames[i], (0, HEIGHT * n))
    palette = samples.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    region = (LEFT+20, TOP+20, LEFT+CARD_WIDTH-20, TOP+CARD_HEIGHT-20)
    baseline = indexed[0].convert('RGB').crop(region)
    if any(ImageChops.difference(baseline, frame.convert('RGB').crop(region)).getbbox() for frame in indexed[1:]):
        raise ValueError('The portrait/text panel must remain completely still')
    name = 'profile-sky' if theme == 'light' else 'profile-sky-night'
    output = ROOT / f'assets/{name}.gif'
    indexed[0].save(output, save_all=True, append_images=indexed[1:], duration=200,
                    loop=0, optimize=True, disposal=1)
    frames[0].save(ROOT / f'assets/{name}-static.png', optimize=True)
    with Image.open(output) as check:
        if check.n_frames != 72 or check.info.get('loop') != 0:
            raise ValueError('Animation must loop with all 72 frames')
    print(f'Built {output.name}: {output.stat().st_size/1024/1024:.2f} MiB, 72 frames, 14.4-second loop', flush=True)


for theme in ['light', 'dark']:
    build(theme)
