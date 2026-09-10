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

## Filling in the blanks

- Every hatched frame is gone; `<figure class="ph">` without `has-img` is still
  available as a placeholder if a new section needs one. Replace with a real
  image the same way as everywhere else:
  ```html
  <figure class="ph has-img" style="--ar: 4/5"><img src="img/…" alt="…" loading="lazy" /></figure>
  ```
  Keep images under ~300KB each (use WebP where you can).
- **One thing still missing: `og:image`.** Every page has Open Graph title and
  description, but a share card needs an *absolute* URL, which needs the final
  domain. Once the site has one, add
  `<meta property="og:image" content="https://<domain>/img/…" />` to each head.

## Running locally

```
python -m http.server 4173
```

Then open http://localhost:4173. (Or just double-click `index.html` — no server
required.)

## Deploying

Drag the whole folder into [Netlify Drop](https://app.netlify.com/drop), push to
GitHub and enable Pages, or `vercel deploy`. No build step.
