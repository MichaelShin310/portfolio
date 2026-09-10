# -*- coding: utf-8 -*-
"""Build 1200x630 share cards in the site's own design language."""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = r"C:\Users\micha\Projects\michael-portfolio"
OUT  = os.path.join(ROOT, "img", "og")
os.makedirs(OUT, exist_ok=True)

W, H     = 1200, 630
PAD      = 68
SPLIT    = 700                      # left column ends here
INK      = (246, 245, 241)
PAPER    = (5, 5, 5)
PANEL    = (11, 12, 13)
ACCENT   = (255, 77, 0)
LINE     = (44, 44, 42)

UF = r"C:\Users\micha\AppData\Local\Microsoft\Windows\Fonts"
F_DISPLAY = os.path.join(UF, "RedHatDisplay-Medium.ttf")
F_BODY    = os.path.join(UF, "IBMPlexSans-Regular.ttf")
F_MONO    = r"C:\Windows\Fonts\consola.ttf"
for f in (F_DISPLAY, F_BODY, F_MONO):
    assert os.path.exists(f), f

def tracked(draw, xy, text, font, fill, track=3.4):
    """Consolas with letter-spacing, standing in for JetBrains Mono."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + track

def wrap(draw, text, font, max_w):
    lines, cur = [], ""
    for word in text.split():
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=font) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur); cur = word
    if cur: lines.append(cur)
    return lines

def cover(path, box_w, box_h):
    im = Image.open(os.path.join(ROOT, path)).convert("RGB")
    s = max(box_w / im.width, box_h / im.height)
    im = im.resize((max(1, round(im.width*s)), max(1, round(im.height*s))), Image.LANCZOS)
    left = (im.width - box_w) // 2
    top  = max(0, int((im.height - box_h) * 0.32))   # bias to the upper third
    return im.crop((left, top, left + box_w, top + box_h))

def mark(path, box_w, box_h, frac=0.62):
    panel = Image.new("RGB", (box_w, box_h), PANEL)
    im = Image.open(os.path.join(ROOT, path)).convert("RGBA")
    s = min(box_w*frac / im.width, box_h*frac / im.height)
    im = im.resize((max(1, round(im.width*s)), max(1, round(im.height*s))), Image.LANCZOS)
    panel.paste(im, ((box_w - im.width)//2, (box_h - im.height)//2), im)
    return panel

def card(out_name, title, desc, art, accent_last=False, title_px=64):
    img  = Image.new("RGB", (W, H), PAPER)
    d    = ImageDraw.Draw(img)

    box_w = W - SPLIT
    img.paste(art(box_w, H), (SPLIT, 0))
    d.line([(SPLIT, 0), (SPLIT, H)], fill=LINE, width=1)

    f_title = ImageFont.truetype(F_DISPLAY, title_px)
    f_desc  = ImageFont.truetype(F_BODY, 23)
    f_mono  = ImageFont.truetype(F_MONO, 17)

    tracked(d, (PAD, PAD), "MICHAEL SHIN", f_mono, (150, 149, 145))

    max_w = SPLIT - PAD*2
    lines = wrap(d, title, f_title, max_w)
    lh    = round(title_px * 1.04)
    y     = 196 if len(lines) < 3 else 158
    for i, ln in enumerate(lines):
        last = (i == len(lines) - 1)
        if accent_last and last and " " in ln:
            head, tail = ln.rsplit(" ", 1)
            d.text((PAD, y), head + " ", font=f_title, fill=INK)
            d.text((PAD + d.textlength(head + " ", font=f_title), y), tail,
                   font=f_title, fill=ACCENT)
        elif accent_last and last:
            d.text((PAD, y), ln, font=f_title, fill=ACCENT)
        else:
            d.text((PAD, y), ln, font=f_title, fill=INK)
        y += lh

    y += 30
    for ln in wrap(d, desc, f_desc, max_w):
        d.text((PAD, y), ln, font=f_desc, fill=(176, 175, 170))
        y += 34

    d.rectangle([PAD, H - PAD - 44, PAD + 52, H - PAD - 41], fill=ACCENT)
    tracked(d, (PAD, H - PAD - 22), "MICHAELSHINSTUDIO.COM", f_mono, (128, 127, 123))

    p = os.path.join(OUT, out_name)
    img.save(p, "JPEG", quality=88, optimize=True, progressive=True)
    print("%-22s %6.1f KB" % (out_name, os.path.getsize(p)/1024))

CARDS = [
 ("home.jpg",         "Brand, growth and product.",
  "CMO at UTern. I write the brand, run the growth, and merge the code.",
  lambda w,h: cover("img/architecture/fish-market-exterior.jpg", w, h), True, 62),
 ("utern.jpg",        "UTern",
  "Brand voice, launch content, and the surfaces it lives on \u2014 shipped to production.",
  lambda w,h: mark("img/utern/utern-logo-white-trim.png", w, h, 0.70), False, 76),
 ("architecture.jpg", "Architecture",
  "Studio work \u00b7 University of Miami B.Arch",
  lambda w,h: cover("img/architecture/fish-market-arcade.jpg", w, h), False, 68),
 ("apex.jpg",         "APEX STUDENT",
  "A brand system, a website, and a character named LOLA.",
  lambda w,h: mark("img/apex/lola-wave-web.png", w, h, 0.58), False, 62),
 ("stamped.jpg",      "Stamped",
  "Travel content, treated like a luxury product.",
  lambda w,h: cover("img/stamped/stamped-flow-create.jpg", w, h), False, 68),
 ("photography.jpg",  "Photography",
  "Winner, 2026 Michele Edelson Photography Award.",
  lambda w,h: cover("img/photography/bouquet-for-the-rain.jpg", w, h), False, 68),
 ("about.jpg",        "I study buildings and build brands.",
  "Architecture student at the University of Miami. CMO at UTern.",
  lambda w,h: cover("img/photography/frame-03.jpg", w, h), False, 56),
]

for name, title, desc, art, acc, px in CARDS:
    card(name, title, desc, art, acc, px)
