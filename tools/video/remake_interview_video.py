#!/usr/bin/env python3
"""
Remake of the UTern "Skills 01 - Interview" vertical video.

Changes vs. the source cut:
  * the 2.1s intro teaser is dropped - it now opens on the live app
  * the baked-in bottom gradient (which washed out everything below y=1060)
    is inverted out, so ~340px of chat content that used to be hidden is
    visible again
  * the caption is one short centred line in the empty space under the chat
    instead of a full-width gradient slab
  * new copy: interview-skills coaching instead of the product walkthrough
"""

import subprocess, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SRC = os.environ.get("SKILLS01_SRC", "Skills01Interview.mp4")
OUT = sys.argv[1] if len(sys.argv) > 1 else "out.mp4"
HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.environ.get("CANVAS_FONTS", "/mnt/skills/examples/canvas-design/canvas-fonts")

W, H, FPS = 1080, 1920, 30
BG = np.array([247., 245., 242.])          # app background == overlay colour
BLUE = (46, 119, 241)
INK = (10, 10, 10)

# ---------------------------------------------------------------- source cuts
T_START = 3.50      # intro teaser gone, home screen settled, just before typing
T_CALLOUT = 44.62   # chat ends, full-screen callout begins
T_CUT = 48.60       # leave the callout here - at ~49.6 the source lifts its
                    # scrim and brings the original caption slab back...
T_OUTRO = 51.85     # ...and dissolve straight into the brand card, skipping the
                    # source's wipe (which re-reveals the washed app) and the
                    # half second of empty canvas before the card animates in
T_END = 56.2333
DISSOLVE = 12       # frames

def s2o(t):  # source time -> output time
    return t - T_START

# ------------------------------------------------------- gradient removal fit
alpha = np.load(os.path.join(HERE, "alpha.npy"))        # per-row overlay alpha
k_raw = np.load(os.path.join(HERE, "kt.npy"))           # per-frame overlay strength

# k_raw is measured off the caption text and floors at ~0.5 during the
# overlay's fade transitions, where the gradient is actually fully off.
k_t = np.clip((k_raw - 0.50) / 0.45, 0.0, 1.0)

CAP, B0, B1 = 0.955, 0.93, 0.985     # recover to a=0.955, feather 0.93->0.985
Y0 = 1040                            # first row the gradient touches
fade_w = np.clip((alpha - B0) / (B1 - B0), 0, 1)[Y0:, None, None]
a_col = np.clip(alpha, 0, CAP)[Y0:, None, None]

def ungradient(img, k):
    """Invert the baked linear-gradient wash over the bottom of the frame."""
    if k <= 0.002:
        return img
    a = a_col * k
    band = img[Y0:]
    rec = (band - a * BG) / (1.0 - a)
    w = fade_w * k
    img[Y0:] = np.clip(rec * (1 - w) + BG * w, 0, 255)
    return img

# ------------------------------------------------------------------ typefaces
def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

F_HEAD = font("Outfit-Bold.ttf", 54)
F_CLOSE = font("Outfit-Bold.ttf", 78)

# ------------------------------------------------------------------ the script
# One short line at a time - no eyebrow, no rule, no second line.  It reads as
# one continuous piece of advice rather than a numbered list.
#   (line, out_start, out_end)   times in OUTPUT seconds
CAPTIONS = [
    ("Reading isn’t practice.",      0.20,  3.80),
    ("Say your answers out loud.",   3.80,  8.20),
    ("Answer the question asked.",   8.20, 12.60),
    ("Say “I”, not “we”.", 12.60, 21.00),
    ("Trade adjectives for facts.", 21.00, 29.00),
    ("Stop when you’ve answered.",  29.00, 35.80),
    ("Do it once. Walk in calm.",   35.80, 40.90),
]

CAP_Y = 1606                          # top of the single caption line
MAX_TEXT_W = W - 120                  # keep the side margins honest

def render_caption(line):
    """Pre-render one caption line, centred, as an RGBA layer."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    w = d.textlength(line, font=F_HEAD)
    assert w <= MAX_TEXT_W, f"caption too wide ({w:.0f}px): {line!r}"
    d.text(((W - w) / 2, CAP_Y), line, font=F_HEAD, fill=INK + (255,))
    return np.asarray(layer).astype(float)

CAP_LAYERS = [render_caption(l) for l, _, _ in CAPTIONS]

FADE_IN, FADE_OUT, SLIDE = 0.34, 0.26, 10

def caption_at(t):
    """-> (layer, opacity, y-offset) for output time t, or None."""
    for i, (_, t0, t1) in enumerate(CAPTIONS):
        if t0 <= t < t1:
            if t - t0 < FADE_IN:
                p = (t - t0) / FADE_IN
                e = 1 - (1 - p) ** 3                      # ease-out cubic
                return CAP_LAYERS[i], e, int(round(SLIDE * (1 - e)))
            if t1 - t < FADE_OUT:
                return CAP_LAYERS[i], max(0.0, (t1 - t) / FADE_OUT), 0
            return CAP_LAYERS[i], 1.0, 0
    return None

def composite(img, layer, op, dy, y0):
    if op <= 0.003:
        return img
    a = layer[:, :, 3:4] * (op / 255.0)
    rgb = layer[:, :, :3]
    if dy:
        a = np.roll(a, dy, axis=0)
        rgb = np.roll(rgb, dy, axis=0)
    img[y0:] = img[y0:] * (1 - a[y0:]) + rgb[y0:] * a[y0:]
    return img

# ------------------------------------------------------ closing callout rescript
# The source's own callout keeps its blue rule at y804-809; only its three
# lines of product copy (rows 856-1114) get painted out and rewritten.
CLOSE_LINES = ["Say it out loud once.", "Then it’s just talking."]
CLOSE_TOP, CLOSE_BOT, CLOSE_FEATHER = 822, 1178, 30
CLOSE_X, CLOSE_Y, CLOSE_LH = 60, 852, 96

_m = np.zeros(H, dtype=np.float32)
_m[CLOSE_TOP:CLOSE_BOT] = 1.0
_m[CLOSE_TOP:CLOSE_TOP + CLOSE_FEATHER] = np.linspace(0, 1, CLOSE_FEATHER)
_m[CLOSE_BOT - CLOSE_FEATHER:CLOSE_BOT] = np.linspace(1, 0, CLOSE_FEATHER)
CLOSE_MASK = _m[:, None, None]

def render_close():
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i, ln in enumerate(CLOSE_LINES):
        d.text((CLOSE_X, CLOSE_Y + i * CLOSE_LH), ln, font=F_CLOSE, fill=INK + (255,))
    return np.asarray(layer).astype(float)

CLOSE_LAYER = render_close()

def smoothstep(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)

# ------------------------------------------------------------------- the render
FSZ = W * H * 3

def decoder(start, end):
    return subprocess.Popen(
        ["ffmpeg", "-v", "error", "-ss", f"{start}", "-to", f"{end}", "-i", SRC,
         "-vf", f"fps={FPS},format=rgb24", "-f", "rawvideo", "-"],
        stdout=subprocess.PIPE)

def process(img, t_src, t_out):
    gi = min(len(k_t) - 1, int(round(t_src * FPS)))
    img = ungradient(img, float(k_t[gi]))

    # wipe whatever is left of the original caption slab
    if t_src < 45.10:
        w = 1.0 if t_src < 44.90 else (45.10 - t_src) / 0.20
        img[1470:] = img[1470:] * (1 - w) + BG * w

    if t_src < T_CALLOUT:
        c = caption_at(t_out)
        if c:
            img = composite(img, c[0], c[1], c[2], CAP_Y - 40)
    else:
        # re-script the full-screen callout, keeping its blue rule.  The
        # paint-out ramps in alongside the source's own scrim so the box
        # never shows an edge against live app content.
        w = smoothstep((t_src - T_CALLOUT) / 0.42) * CLOSE_MASK
        img[CLOSE_TOP:CLOSE_BOT] = (
            img[CLOSE_TOP:CLOSE_BOT] * (1 - w[CLOSE_TOP:CLOSE_BOT])
            + BG * w[CLOSE_TOP:CLOSE_BOT])
        e = smoothstep((t_src - T_CALLOUT - 0.38) / 0.45)
        img = composite(img, CLOSE_LAYER, e,
                        int(round(16 * (1 - e))), CLOSE_TOP - 20)
    return img

def main():
    afilter = (f"[1:a]atrim=start={T_START}:end={T_CUT},asetpts=PTS-STARTPTS[a1];"
               f"[1:a]atrim=start={T_OUTRO}:end={T_END},asetpts=PTS-STARTPTS[a2];"
               f"[a1][a2]concat=n=2:v=0:a=1,afade=t=in:st=0:d=0.35[aout]")
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-i", SRC,
         "-filter_complex", afilter,
         "-map", "0:v", "-map", "[aout]",
         "-c:v", "libx264", "-preset", "slow", "-crf", "19",
         "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
         "-c:a", "aac", "-b:a", "192k", "-shortest", OUT],
        stdin=subprocess.PIPE)

    # ---- body: home screen through the closing callout
    dec = decoder(T_START, T_CUT)
    i, last = 0, None
    while True:
        buf = dec.stdout.read(FSZ)
        if len(buf) < FSZ:
            break
        img = np.frombuffer(buf, dtype=np.uint8).reshape(H, W, 3).astype(np.float32)
        last = process(img, i / FPS + T_START, i / FPS)
        enc.stdin.write(np.clip(last, 0, 255).astype(np.uint8).tobytes())
        i += 1
        if i % 300 == 0:
            print(f"  body {i}", flush=True)
    dec.stdout.close(); dec.wait()

    # ---- tail: dissolve into the untouched brand card
    dec = decoder(T_OUTRO, T_END)
    j = 0
    while True:
        buf = dec.stdout.read(FSZ)
        if len(buf) < FSZ:
            break
        img = np.frombuffer(buf, dtype=np.uint8).reshape(H, W, 3).astype(np.float32)
        if j < DISSOLVE:
            w = smoothstep((j + 1) / DISSOLVE)
            img = last * (1 - w) + img * w
        enc.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
        j += 1
    dec.stdout.close(); dec.wait()

    enc.stdin.close(); enc.wait()
    n = i + j
    print(f"wrote {OUT}  ({n} frames = {n/FPS:.2f}s; body {i}, tail {j})")

if __name__ == "__main__":
    main()
