# "Interview tomorrow" — original Bob video

Builds `img/utern/utern-interview-tomorrow.mp4`: a 42.6s vertical (1080×1920)
video about the chatbot, written and animated from scratch rather than cut from
a screen recording.

```
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 render.py video_only.mp4
python3 audio.py audio.m4a
ffmpeg -i video_only.mp4 -i audio.m4a -map 0:v -map 1:a -c copy \
  -movflags +faststart utern-interview-tomorrow.mp4
```

Needs `ffmpeg`, `numpy`, `pillow`, `playwright`, and the Outfit typeface
(`CANVAS_FONTS`, defaults to the canvas-design font directory).

## How it works

`scene.html` is the whole video — the app UI rebuilt in HTML/CSS against the
real product's design (background `#F7F5F2`, brand blue `#2E77F1`, 34px bubble
radius, 44px body type). It exposes `window.seek(t)`, which sets every animated
property from a single time value: the typed prompt, message reveals, typing
dots, the feed's scroll position, the checklist card writing itself out word by
word, scene crossfades, and the caption.

`render.py` drives that with Playwright — `seek(t)`, screenshot, repeat at 30fps
— so every frame is deterministic and there is no reliance on wall-clock
animation. `audio.py` synthesises the UI sound bed (key clicks, send, message
chimes, a closing figure) with numpy, peaking around −14 dBFS so it reads as
interface rather than music.

The feed's scroll is measured, not guessed: after fonts load, `measure()`
records each message's laid-out position and height plus the bottom edge of
every word in the final card, so the card can grow line by line as it writes and
the scroll can follow it exactly.

## The cut

Home screen → the user types "I have an interview tomorrow. Help me prep." →
Bob asks what the role is and which part they're dreading → the user admits they
freeze → Bob reframes it as recall, not nerves → the user names a project → Bob
writes a four-item checklist to rehearse tonight → "Ten minutes tonight. You'll
walk in ready." → brand card.

Caption treatment matches the other video in this repo: one short centred line
at 54px in the empty space under the chat, no eyebrow, no rule, no gradient
slab. Seven lines, none longer than 5.6s.
