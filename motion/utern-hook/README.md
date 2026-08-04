# UTern hook video — motion source

Kinetic-typography hook for UTern. 1080×1920, 30fps, 10.60s.
Output lives at `img/utern/utern-hook-9x16.mp4` (poster: `utern-hook-poster.jpg`).

**Script (21 words, one per musical event):**
> We don't just find you internships on a job board. We find you matches to companies that prove you are ready.

## How it works

`scene.html` exposes a single pure function, `renderFrame(t)`, that draws the
whole composition for any time `t`. Nothing uses CSS transitions or
`requestAnimationFrame`, so a given `t` always produces identical pixels —
which is what makes frame-by-frame capture reliable.

`capture.js` drives headless Chromium: it calls `renderFrame(t)` for each of the
318 frames and screenshots the viewport. `build.sh` then muxes the audio under
the frames with ffmpeg.

## Timing

Every cut sits on a **measured onset**, not a metronome grid — the track's hits
are not evenly spaced, so a fitted BPM grid drifts off them.

Spectral flux at 5ms resolution finds 43 onsets, but they pair up ~0.12s apart.
Comparing the spectra of each pair shows both halves are the same sound with the
second 2–3x louder: a flam, heard as one accented hit. Merging the pairs gives
**23 real musical events**, and every one of them gets a card — 21 words plus two
for the logo. That is the `CUT` array in `scene.html`.

Card *i* runs from `CUT[i]` to `CUT[i+1]`, so cards are as short as 6 frames.
Measured against the encoded file, every cut lands within one frame of its onset
(33ms at 30fps).

Where a pair's two halves are near-equal in strength, either can anchor the cut.
`prove` uses the earlier 7.320 rather than 7.435, which buys it 0.295s instead of
0.180s and puts the squeeze on `that`, a connector.

`ready` holds across two further onsets (8.485, 8.600) and takes a scale pulse on
each, so the climax word punches with the track rather than sitting still.

### Short cards

Because a card can be shorter than an animation's natural duration, `D(d)` caps
every duration at 55% of the card's hold — long cards are unaffected, short ones
snap. `fitStagger()` does the same for per-letter animations, shrinking the
stagger so the last letter of a 9-letter word still lands before the cut.

### Audio

The music ends by itself at ~9.2s. Everything after that in the reference clip
is that video's own outro sting, so `build.sh` trims the track at 9.25s.

The logo takes the last **two** events: 8.745 reveals it, and 9.010 punches it
and brings in the end card below. The card then plays out silent.

### End card

`CLEARED FOR TAKEOFF` over `LAUNCHING SOON` (`#tag` / `#tag2` in `scene.html`).

The wording deliberately avoids "ready": the script's climax word is `ready`,
held longest of any card, and repeating it ~1.3s later would spend the payoff
twice. "Cleared for takeoff" is aviation phrasing for permission granted *after
the checks pass*, so it completes "…prove you are ready" instead of echoing it —
and it pays off the tern in the logo. The piece runs 0.2s longer than the words
alone need, so both CTA lines have time to read.

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
