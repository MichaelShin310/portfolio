# Michael Shin — Portfolio

A static, no-build portfolio site. Dark editorial: near-black ground
(`#050505`), warm off-white ink (`#F6F5F1`), one signal-orange accent
(`#FF4D00`). Space Grotesk for display, Inter Tight for body, JetBrains Mono
for labels. Hairline rules instead of decoration.

## Structure

```
index.html          Homepage — opener, hero, credential row, work, capabilities,
                    stack, closer, contact footer
utern.html          Flagship case study — UTern (brand + shipped product work)
architecture.html   Studio work index (fish market flagship + projects + coursework)
apex-student.html   Case study — APEX STUDENT (LOLA)
stamped.html        Concept study — Stamped
photography.html    Visual archive + 2026 Michele Edelson Photography Award
about.html          About page
css/style.css       All styling (design tokens at the top in :root)
js/main.js          Scroll reveal, the scroll-scrubbed opener, the architecture
                    accordion
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
- Motion is one move (fade-up reveal), repeated. Nothing bounces.
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
