# Michael Shin — Portfolio

A static, no-build portfolio site. Dark editorial: near-black ground
(`#050505`), warm off-white ink (`#F6F5F1`), one signal-orange accent
(`#FF4D00`). Space Grotesk for display, Inter Tight for body, JetBrains Mono
for labels. Hairline rules instead of decoration.

## Structure

```
index.html          Homepage — the motion rebuild (see below)
utern.html          Flagship case study — UTern (brand + shipped product work)
architecture.html   Studio work index (fish market flagship + projects + coursework)
apex-student.html   Case study — APEX STUDENT (LOLA)
stamped.html        Concept study — Stamped
photography.html    Visual archive + 2026 Michele Edelson Photography Award
about.html          About page
css/style.css       Shared styling + design tokens (:root). Inner pages only.
css/home.css        Homepage layout and motion start-states
css/resume.css      About page — the CV layout
js/main.js          Inner pages: smooth scroll, arrive, depth, magnetic,
                    architecture accordion
js/home.js          Homepage: the five motion primitives
favicon.svg         Monogram
img/og/             1200x630 share cards (generated, see below)
tools/              make-og-cards.py
sitemap.xml
robots.txt
```

Work order on the homepage: **UTern first** (full-width lead card), then
Architecture, APEX STUDENT, Stamped, Photography. The next-project chain
follows the same loop: UTern → Architecture → APEX → Stamped → Photography →
UTern.

## The homepage motion system

The opener is a camera lens, so the whole page behaves like one: sections are
not revealed, the camera arrives at them. **Five primitives, nothing else** —
add a sixth and it stops being a language:

| | |
|---|---|
| **scrub** | driven by scroll *position*, not triggered by crossing a line |
| **depth** | images sit further back than their captions and move slower |
| **counter-motion** | image drifts one way, its text the other |
| **velocity** | the tool lanes lead with scroll speed, then settle |
| **magnetic** | links pull toward the cursor and ease back |

Built on **Lenis 1.3.26** (smooth scroll, jsDelivr) and **GSAP 3.15.0 +
ScrollTrigger** (cdnjs). Both pinned. No build step.

**Motion is additive and must stay that way.** `js/home.js` adds `.motion` to
`<html>` only after confirming GSAP loaded *and* reduced motion is off. Every
hidden start-state in `css/home.css` is scoped to that class, and the
horizontal rail layout is scoped to `html.motion` too — an early version
clipped five cards into a track nothing could translate, which silently lost
two projects when the CDN was blocked. If you add a section, add its
start-state under `html.motion` and check it with the scripts removed.

**The work lane** is infinite moving cards: it drifts forever, hovering a card
lifts it in 3D toward you, dims its neighbours and holds the lane still so it
can be read. The dim runs through GSAP rather than a CSS class, because the
arrive tween leaves an inline `opacity` on every card that no class can
outrank.

**The name card** carries the page's only ambient motion: a one-point
perspective floor that travels toward the viewer (transversals sit at 1/d, so
advancing every d by one geometric step and wrapping the phase loops with no
seam), a wireframe icosahedron — the Fly's Eye Dome from studio — built from
its real vertex set and rotated live, and a cursor spotlight.

`window.__lenis` is exposed deliberately: Lenis owns the scroll position, so
`window.scrollTo()` gets reverted on the next frame and automated checks need
a way in.

## The name card: light reveals the type

`img/hero/name-bed.mp4` is a faceted crystal with a beam that starts near
vertical and swings down to the lower left over 8 seconds. It is **scrubbed,
not looped** — `.namecard` is a 280vh track and the stage pins inside it, so
scroll position drives `currentTime` directly.

The name is not faded in, it is **lit — by where the beam actually is**, not
by scroll position. `tools/trace-beam.py` samples every frame across the x band
the name occupies and records the lowest row the beam still lights; the result
is baked into `BEAM_Y` in `js/home.js` as how far down the light has reached
per frame. At runtime that gets mapped out of video space through the
`object-fit: cover` transform and compared against where the type actually
sits, so the mask front rides the beam at any viewport size. **Re-run the
tracer and repaste `BEAM_Y` if the clip is ever replaced** — otherwise the
reveal will drift away from the light.

The type is **glass**: a ghost copy, cloned at runtime and stripped of its
heading semantics, sits behind carrying an edge-only stroke, and the real copy
on top is a clipped gradient fill that only shows where the beam has passed.
So the letters read as unlit glass in the dark and light up as the beam
crosses them.

Timing is eased out, so the sweep crosses the type at a readable pace and the
crystal then keeps turning right up to the point the section has actually left
the screen. **The scrub ends at `bottom top`, not `bottom bottom`** — a sticky
stage still takes a full viewport to slide away after its pin releases, and
ending at the pin left the clip frozen on its last frame for every pixel of
that slide. The ease exponent is tuned against that: the beam has cleared the
type by the time the pin releases (~58% of the track), and the rest of the clip
plays out while the stage exits.

**Any section that pins a stage must have `padding: 0`.** `.lens`, `.namecard`
and `.spine` all override the global `section { padding: … 0 }`. With
border-box that padding offsets the stage inside its own track *and* leaves a
band of black between one shot and the next — it caused the same visible seam
twice, in two different sections.

**The lens hands over by dissolve, not by wipe.** `.namecard` is pulled up
`-100vh` so it sits underneath the lens's last screen, already pinned and full
frame; the lens stage then fades out over it. Two things this depends on, both
easy to undo by accident:

- `.lens` must stay `background: transparent`. The *stage* inside it carries
  the background and is what fades — an opaque background on the section keeps
  painting over the card below no matter how far the stage fades.
- Neither section may carry the global `section { padding: … 0 }`. With
  border-box it shortens the distance the stage can pin over *and* leaves a
  band of empty black between one shot and the next.

Degradation is the usual rule, with two extras: `--rev` defaults to `200%`,
which shows everything, so with no JS the name is simply there; and
`html.motion` is what buys the 280vh track, so without it the section
collapses to one screen rather than leaving 280vh of dead scroll. Under real
reduced motion the overlap is removed too (`margin-top: 0`), since nothing
dissolves and nothing should overlap.

With film present the card takes `.has-bed` and the drawn icosahedron hides
entirely: the crystal is already a lit faceted solid and two of them is the
same idea twice. Delete the video and the icosahedron comes straight back.

**Encoding matters here.** Scrubbing seeks constantly, so the file is encoded
**all-intra** (`-g 1`) — every frame a keyframe, which makes seeking instant.
At 1280×720 that is only 3.8MB, smaller than the 4.8MB opener:

```
ffmpeg -i source.mp4 -an -c:v libx264 -preset slow -crf 21 -g 1        -pix_fmt yuv420p -movflags +faststart img/hero/name-bed.mp4
```

A normal GOP encode is half the size but scrubs badly — don't be tempted.

**Brief for replacement footage:** dark (the name is bone white at 13rem over
it), no text, no people, no competing colour, and a single clear directional
move the mask can follow. On phones the 16:9 source is cropped hard and the
crystal falls outside the frame — the beam alone carries it, which is fine.

## The inner pages

They share the homepage's **grammar**, not its choreography: the same Lenis
settings (so moving between them does not feel like two different sites), the
same single arrive move with the same easing, the same magnetic links, and the
same idea that images sit further back than the words about them.

Magnetic is applied **by selector** in `js/main.js` rather than by
`data-magnetic` in the markup, so the six inner pages gained it without being
edited.

Depth on images is deliberately slight — `scale: 1.05`, ±2%. Most of those
frames are product screenshots that are already cover-cropped, and the scale
needed to hide a larger drift eats the UI they exist to show. `.contain`
frames (logos, full drawings) are excluded outright: they are sized to fit and
must not be cropped at all.

`.reveal`'s hidden start-state is scoped to `html.motion`, which `js/main.js`
sets only once GSAP is confirmed. **This matters more here than on the
homepage** — it used to be ungated, which meant a blocked CDN or a failed
script left every one of these pages completely blank.

The architecture accordion sits outside the motion guard. It is navigation,
not decoration, so it works with or without GSAP.

## The About page

It is Michael's actual résumé, transcribed from `RESUME.pdf` and
`Shin,Michael_Resume.pdf` and merged (the newer file has the photography
award, the older one has APEX Student — both are true). Four sections:
Experience, Education, Leadership, Tools, each reverse-chronological.

Typos in the source PDFs are silently corrected here — "Dimploma",
"Tresurer", "instillation", "Architectur". The phone number on the PDF is
deliberately **not** on the page: a public portfolio is a spam magnet and the
email is already the contact route.

## The tools wall

Icons are the real marks. The Adobe apps, Rhino, AutoCAD and SketchUp are
extracted from the installs on this machine by `tools/extract-app-icons.ps1` —
Simple Icons carries no Adobe marks (dropped over trademark policy) and no
Rhino, so a public set would have forced exactly the design tools into plain
type. Re-run the script after upgrading an app; the paths carry version
numbers.

Adobe Animate is in the wall too, and Grasshopper deliberately is not: it
ships as a `.gha` plug-in with no extractable icon and lives inside Rhino,
so it stays a text credit on the About page.

The dev marks (Next.js, React, TypeScript, Supabase, Vercel, GitHub, Resend,
Google Analytics, Semrush) are Simple Icons SVGs vendored into `img/tools/`.
Four of them ship pure black and were lightened to `#F6F5F1` so they are
visible on the dark wall.

## Editorial rules (don't break these)

- **Every number on this site has to survive a question about where it came
  from.** No rounded-up reach figures, no "+50% engagement" without a baseline
  anyone can check. Where the honest answer is "still early," say that — the
  `.ledger` component exists for exactly this and replaced the old vanity stat
  row on the case studies.
- One accent color, used sparingly — links, hovers, one word per page.
- No new fonts. Space Grotesk for display, Inter Tight for body, JetBrains Mono
  for labels only.
- Curation over volume. Five items in Work, maximum.
- Tools are **tools**. Techniques ("double opt-in", "audience
  de-duplication") are not tools and do not belong on the wall.
- Motion is one language, not a pile of effects. Five primitives, listed
  above. Nothing bounces.
- Decoration has to carry information. The old drafting-sheet garnish (corner
  ticks, hatch fills, sheet codes like `A-01`, the fixed titleblock) is gone
  deliberately — don't reintroduce it.

## Components worth knowing

- `.ledger` / `.ledger-row` — label-and-statement rows. Use instead of `.stats`
  for outcomes.
- `.build` / `.build-item` — the shipped-work index on the UTern page. Each row
  is one thing that exists in production, with `.tag` chips for the stack.
- `.stack` / `.stack-group` — the tools grid on the homepage.
- `.principle` — a pull quote with a source line.
- `.about-facts` — the sticky facts panel on the About page.
- `.status-strip .fact` — the four-fact credential row under the homepage hero.

## Domain, share cards and search

The canonical domain is **michaelshinstudio.com**. It is hard-coded in three
places — change all three together if it ever moves:

- `<link rel="canonical">` and `og:url` / `og:image` in each page head
- `SITE` in `tools/make-og-cards.py`
- `sitemap.xml` and `robots.txt`

Page URLs keep their `.html` extension so they resolve on any host, GitHub
Pages included. If you deploy somewhere that prefers clean URLs (Vercel with
`cleanUrls`, Netlify's default), drop the extension from the canonicals and the
sitemap so they don't point through a redirect.

**Share cards** live in `img/og/` at 1200×630 and are generated, not drawn by
hand:

```
python tools/make-og-cards.py
```

The script composites the site's own language — near-black ground, the mono
`MICHAEL SHIN` eyebrow, display title with an optional orange last word, an
orange rule, and a project image or logo mark in the right panel. It needs
Pillow, plus Red Hat Display and IBM Plex Sans (standing in for Space Grotesk
and Inter Tight, which aren't installed locally) and Consolas for the mono. If
you install the real fonts, point `F_DISPLAY` / `F_BODY` / `F_MONO` at them and
re-run.

`sitemap.xml`, `robots.txt`, and a `Person` JSON-LD block on the homepage are
all in place. Update `lastmod` in the sitemap when the content meaningfully
changes.

## Filling in the blanks

- Every hatched frame is gone; `<figure class="ph">` without `has-img` is still
  available as a placeholder if a new section needs one. Replace with a real
  image the same way as everywhere else:
  ```html
  <figure class="ph has-img" style="--ar: 4/5"><img src="img/…" alt="…" loading="lazy" /></figure>
  ```
  Keep images under ~300KB each (use WebP where you can).
- **Logo art is trimmed to its alpha bounds.** `utern-logo-white-trim.png` and
  `utern-logo-trim.png` exist because the originals carry a large transparent
  band at the bottom, which made `object-fit: contain` center the canvas
  instead of the mark. Trim any new logo the same way before framing it.

## Running locally

```
python -m http.server 4173
```

Then open http://localhost:4173. (Or just double-click `index.html` — no server
required.)

## Deploying

Drag the whole folder into [Netlify Drop](https://app.netlify.com/drop), push to
GitHub and enable Pages, or `vercel deploy`. No build step.
