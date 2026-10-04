"""Optimize raster images in assets in place. Requires Pillow."""
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent
frontend = root / 'frontend'
assets = frontend / 'assets'
config_path = root / 'backend/config.json'
config = json.loads(config_path.read_text(encoding='utf-8-sig'))
before_total = after_total = changed = 0
for file in sorted(assets.rglob('*')):
    if not file.is_file() or file.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.webp') or 'optimized' in file.relative_to(assets).parts:
        continue
    before = file.stat().st_size
    before_total += before
    if before > 500_000:
        temp = file.with_name(file.name + '.tmp')
        with Image.open(file) as source:
            image = ImageOps.exif_transpose(source)
            image.thumbnail((1080, 1620), Image.Resampling.LANCZOS)
            if file.suffix.lower() in ('.jpg', '.jpeg'):
                image = image.convert('RGB')
                for quality in (82, 78, 74, 70):
                    image.save(temp, 'JPEG', quality=quality, optimize=True, progressive=True)
                    if temp.stat().st_size <= 300_000:
                        break
            elif file.suffix.lower() == '.webp':
                image.save(temp, 'WEBP', quality=80, method=6)
            else:
                image.save(temp, 'PNG', optimize=True)
        with Image.open(temp) as check:
            check.verify()
        if temp.stat().st_size < before:
            temp.replace(file)
            changed += 1
        else:
            temp.unlink()
    after_total += file.stat().st_size
    print(f'{file.relative_to(assets)}: {before:,} -> {file.stat().st_size:,} bytes')

mapping = {'assets/optimized/photo01.jpg':'assets/photo-01.JPG', 'assets/optimized/photo02.jpg':'assets/photo-02.JPG', 'assets/optimized/photo06.jpg':'assets/photo-06.JPG'}
for key, value in config.get('photos', {}).items():
    if value in mapping:
        config['photos'][key] = mapping[value]
config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
page = frontend / 'index.html'
html = page.read_text(encoding='utf-8')
for old, new in mapping.items():
    html = html.replace(old, new)
page.write_text(html, encoding='utf-8')
optimized = assets / 'optimized'
# Remove only generated copies whose replacements exist; preserve unknown files.
for old, new in mapping.items():
    copy = frontend / old
    if copy.is_file() and (frontend / new).is_file():
        copy.unlink()
if optimized.is_dir() and not any(optimized.iterdir()):
    optimized.rmdir()
print(f'TOTAL: {before_total:,} -> {after_total:,} bytes; optimized {changed} images')
