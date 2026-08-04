# UTern hook video — motion source

Kinetic-typography hook for UTern. 1080×1920, 30fps, 11.90s.
Output lives at `img/utern/utern-hook-9x16.mp4` (poster: `utern-hook-poster.jpg`).

**Script (18 words):**
> We don't just find you internships — we match you with companies and prove that you're ready. With UTern.

## How it works

`scene.html` exposes a single pure function, `renderFrame(t)`, that draws the
whole composition for any time `t`. Nothing uses CSS transitions or
`requestAnimationFrame`, so a given `t` always produces identical pixels —
which is what makes frame-by-frame capture reliable.

`capture.js` drives headless Chromium: it calls `renderFrame(t)` for each of the
357 frames and screenshots the viewport. `build.sh` then muxes the audio under
the frames with ffmpeg.

## Timing

The cadence is pinned to the soundtrack rather than eyeballed. The track runs at
**176.5 BPM** (a 0.3399s grid) with the first beat at **0.26s**, so every word
change lands on a beat:

```js
const B = 0.339943, T0 = 0.26;
const bt = i => T0 + i * B;      // beat index -> seconds
```

Words hold for two beats early and one beat later on, so the cut rhythm
accelerates into the ending. The track's largest onset is at **9.76s** — that's
`bt(28)`, and it's where the logo lands.

## Editing the copy

The beat sheet is the `CARDS` array in `scene.html`. Each entry is one card:

| field | meaning |
|---|---|
| `w` | the word |
| `a`, `b` | start/end **beat index** (multiply by `B`, add `T0`, for seconds) |
| `bg` | `'w'` white card / `'b'` blue card — these alternate to give the hard colour flips |
| `fx` | which animation runs (`punch`, `wipeL`, `converge`, `stamp`, `hero`, …) |
| `size` | font size in px; oversized values get clamped to the 940px safe width |
| `n` | word number shown in the HUD counter |
| `rule`, `whip`, `whipY` | optional underline / speed-streak accents |

Keep `b` of one card equal to `a` of the next so there are no gaps. If you add
or remove words, the last card should still end at beat 28 to keep the logo on
the drop.

## Rebuilding

```bash
./build.sh path/to/soundtrack.wav
```

Fonts (Inter Tight, JetBrains Mono) are fetched once and inlined as base64 into
`fonts/embed.css`; `assets/` holds the logo, bird, and grain tile. Both
`fonts/` and `frames/` are generated and git-ignored.

## Colours

Brand blue `#4782E7` (sampled from the UTern logo) and white, nothing else.
