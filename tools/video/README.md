# Interview-prep video remake

Rebuilds the UTern "Skills 01 — Interview" vertical (1080×1920) cut into
`img/utern/utern-interview-prep.mp4`.

```
python3 remake_interview_video.py out.mp4
```

Needs `ffmpeg`, `numpy`, `pillow`, and the original screen recording (path is
set in `SRC` at the top of the script).

## What it changes

- **Drops the intro.** The source opened on a 3.5s teaser of the finished
  summary card. The remake opens on the live home screen, right before the
  prompt is typed.
- **Removes the baked-in bottom gradient.** The source burned a caption slab
  into the pixels: a white ramp that started fading app content at y≈1060 and
  went fully opaque by y≈1470 — roughly the bottom 45% of the frame, which is
  exactly where the newest chat message lands. The gradient is a solid fill of
  the app's own background colour (247,245,242) at a known per-row alpha, so it
  can be inverted: `orig = (obs − a·C) / (1 − a)`. `alpha.npy` holds the alpha
  ramp, recovered by taking a per-row minimum over the clip (text scrolls
  through every row, so the darkest pixel a row ever sees measures the wash).
  `kt.npy` holds per-frame overlay strength — the source fades the whole
  overlay out and back in at each caption change, and the inversion has to
  follow it. Recovery runs to a≈0.955 and feathers out after that; the footage
  is flat UI, so amplification stays clean. Net effect: chat content is legible
  to y≈1365 instead of y≈1060.
- **Compact caption block.** Eyebrow + up to two headline lines in the empty
  space under the chat (y1512–1711), with a small blue rule instead of a
  full-width gradient. No caption runs longer than 8.4s; the source held one
  for 25s.
- **New copy** — interview-skills coaching: practice out loud → in your head
  doesn't count → five rules (answer what they asked, say I not we, details
  beat adjectives, end with the result, then stop talking). The app demo runs
  underneath as b-roll; the rules are timed so each lands on the matching
  moment in the conversation.
- **Re-scripted closing callout** and a dissolve straight into the brand card,
  skipping the source's wipe (which briefly re-revealed the washed app and
  brought the old caption slab back) and the half second of empty canvas
  before the card animates in.

Runtime: 49.5s, down from 56.2s.
