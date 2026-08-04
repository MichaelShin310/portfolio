#!/usr/bin/env python3
"""Synthesise the UI sound bed for the scene: soft key clicks, send, and
message chimes.  Everything is kept quiet - it should read as interface, not
as music."""
import numpy as np, subprocess, sys, os

SR = 48000
DUR = 42.6
OUT = sys.argv[1] if len(sys.argv) > 1 else "audio.m4a"
rng = np.random.default_rng(7)

buf = np.zeros(int(SR * DUR))

def place(sig, t, gain=1.0):
    i = int(t * SR)
    n = min(len(sig), len(buf) - i)
    if n > 0:
        buf[i:i + n] += sig[:n] * gain

def env(n, attack, decay):
    a = int(SR * attack) or 1
    e = np.exp(-np.linspace(0, 1, n) / decay)
    e[:a] *= np.linspace(0, 1, a)
    return e

def tone(freq, dur, decay=0.28, drop=1.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = np.linspace(freq, freq * drop, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.16 * np.sin(2 * ph)) * env(n, 0.004, decay)

def click(dur=0.028, tilt=2600):
    """A short noise burst rolled off above `tilt` Hz - reads as a key press."""
    n = int(SR * dur)
    b = rng.normal(0, 1, n)
    k = np.exp(-np.arange(160) / max(1.0, SR / tilt))
    b = np.convolve(b, k / k.sum())[:n]
    b *= env(n, 0.0008, 0.09)
    m = np.abs(b).max()
    return b / m if m > 0 else b

# ------------------------------------------------------------- key clicks
t = 0.58
while t < 3.30:
    place(click(), t, 0.030 * (0.75 + 0.5 * rng.random()))
    t += 0.055 + 0.045 * rng.random()

# ---------------------------------------------------------------- send
place(tone(560, 0.10, 0.20) , 3.80, 0.075)
place(tone(840, 0.16, 0.24) , 3.86, 0.065)

# ------------------------------------------- outgoing / incoming messages
for t in (4.30, 9.50, 17.70):                       # user bubbles
    place(tone(700, 0.13, 0.20, drop=1.06), t, 0.055)
for t in (6.10, 13.30, 21.50):                      # Bob replies
    place(tone(470, 0.20, 0.26, drop=0.94), t, 0.062)
    place(tone(313, 0.26, 0.30, drop=0.97), t + 0.02, 0.030)

# ------------------------------------------------ typing dots, very faint
for t0, t1 in ((4.95, 6.10), (12.15, 13.30), (20.35, 21.50)):
    t = t0 + 0.15
    while t < t1 - 0.1:
        place(click(0.02, 3400), t, 0.011)
        t += 0.30

# ---------------------------------------------------- checklist ticks
for i, t in enumerate((22.6, 24.4, 26.3, 28.4)):
    place(tone(660 + i * 55, 0.14, 0.18), t, 0.030)

# ------------------------------------------- card done, closing, endcard
for i, f in enumerate((523.25, 659.25, 783.99)):    # C-E-G
    place(tone(f, 0.9, 0.42), 29.55 + i * 0.075, 0.038)
place(tone(196, 1.5, 0.60), 34.20, 0.030)
for i, f in enumerate((659.25, 987.77)):
    place(tone(f, 1.4, 0.55), 38.45 + i * 0.10, 0.032)

# ---------------------------------------------------------------- polish
# gentle tail so nothing clips off, then a soft limiter
fade = int(SR * 0.5)
buf[-fade:] *= np.linspace(1, 0, fade)
buf[:int(SR * 0.05)] *= np.linspace(0, 1, int(SR * 0.05))
peak = np.abs(buf).max()
if peak > 0:
    buf = buf / peak * 0.20                      # ~ -14 dBFS peak
buf = np.tanh(buf * 1.6) / 1.6

stereo = np.stack([buf, buf], axis=1)
pcm = (np.clip(stereo, -1, 1) * 32767).astype('<i2').tobytes()
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(SR),
                "-ac", "2", "-i", "-", "-c:a", "aac", "-b:a", "192k", OUT],
               input=pcm, check=True)
print(f"wrote {OUT} ({DUR:.1f}s)")
