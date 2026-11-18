"""Сканы Уэйта–Смит (Wikimedia Commons, «RWS1909 - …») → img/waite/<id>.webp.

  python3 tools/waite_images.py <папка со сканами>

Имена сканов: 00_Fool.jpeg … 21_World.jpeg, Wands_01.jpeg … Pentacles_14.jpeg.
Все карты приводятся к 480×832 (пропорции сканов гуляют на 3 %, рамку не режем).
"""
import pathlib, sys
from PIL import Image, ImageFilter

W, H, Q = 480, 832, 60
src = pathlib.Path(sys.argv[1])
out = pathlib.Path(__file__).resolve().parent.parent / 'img' / 'waite'
out.mkdir(parents=True, exist_ok=True)

done = 0
for f in sorted(src.iterdir()):
    stem = f.stem  # 00_Fool | Cups_11
    head, _, rest = stem.partition('_')
    if head.isdigit():
        cid = f'm{int(head):02d}'
    else:
        cid = f'{head.lower()}{int(rest):02d}'
    im = Image.open(f).convert('RGB').filter(ImageFilter.GaussianBlur(0.6))  # гасим растр печати, иначе webp тяжёлый
    im.resize((W, H), Image.LANCZOS).save(out / f'{cid}.webp', 'WEBP', quality=Q, method=6)
    done += 1
print(done, 'карт →', out)
