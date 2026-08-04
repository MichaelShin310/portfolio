# UTern hook video — motion source

Kinetic-typography hook for UTern. 1080×1920, 30fps, 10.40s.
Output lives at `img/utern/utern-hook-9x16.mp4` (poster: `utern-hook-poster.jpg`).

**Script (18 words):**
> We don't just find you internships — we match you with companies and prove that you're ready. With UTern.

## How it works

`scene.html` exposes a single pure function, `renderFrame(t)`, that draws the
whole composition for any time `t`. Nothing uses CSS transitions or
`requestAnimationFrame`, so a given `t` always produces identical pixels —
which is what makes frame-by-frame capture reliable.

`capture.js` drives headless Chromium: it calls `renderFrame(t)` for each of the
312 frames and screenshots the viewport. `build.sh` then muxes the audio under
the frames with ffmpeg.

## Timing

Every cut sits on a **measured onset** in the soundtrack, not on a metronome
grid — the track's hits are not evenly spaced, so a fitted BPM grid drifts off
them. Onsets were extracted by spectral flux at 5ms resolution; they arrive in
pairs roughly 0.12s apart (hit plus flam), and the cuts take the stronger one of
each pair. The result is the `CUT` array in `scene.html`:

```js
const CUT = [0.145, 0.595, 1.280, 1.845, 2.410, 2.905, 3.835, 4.235,
             5.030, 5.320, 6.045, 6.400, 7.115, 7.435, 7.615, 8.485, 8.745];
```

Card *i* runs from `CUT[i]` to `CUT[i+1]`. Emphasis words skip an onset so they
hold longer; connectors take a single short interval. Measured against the
encoded file, every cut lands within one frame of its onset (33ms at 30fps).

`ready.` holds across two further onsets (8.015, 8.220) and takes a scale pulse
on each, so the climax word punches with the track rather than sitting still.

### Audio

The music ends by itself at ~9.2s. Everything after that in the reference clip
is that video's own outro sting, so `build.sh` trims the track at 9.25s. The
logo lands at 8.745 — the last hit with music still ringing under it — and the
card plays out silent.

## Editing the copy

The beat sheet is the `CARDS` array in `scene.html`. Each entry is one card:

| field | meaning |
|---|---|
| `w` | the word |
| `bg` | `'w'` white card / `'b'` blue card — these alternate to give the hard colour flips |
| `fx` | which animation runs (`punch`, `wipeL`, `converge`, `stamp`, `hero`, …) |
| `size` | font size in px; oversized values get clamped to the 940px safe width |
| `rule`, `whip`, `whipY` | optional underline / speed-streak accents |
| `pulses` | absolute times to kick on, for a card that holds across extra onsets |

Cards take their timing by position: card *i* uses `CUT[i]`. So `CARDS` and
`CUT` must stay the same length, with one extra `CUT` entry at the end for the
logo. To retime a cut, move its value in `CUT` to another onset — keep the last
entry on a hit that still has music under it.

## Rebuilding

```bash
./build.sh path/to/soundtrack.wav
```

Fonts (Inter Tight, JetBrains Mono) are fetched once and inlined as base64 into
`fonts/embed.css`; `assets/` holds the logo, bird, and grain tile. Both
`fonts/` and `frames/` are generated and git-ignored.

## Colours

Brand blue `#4782E7` (sampled from the UTern logo) and white, nothing else.
