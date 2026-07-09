# Michael Shin — Portfolio

A static, no-build portfolio site. Design concept: **"Drafting Table"** — paper (`#F6F5F1`), ink (`#111110`), one signal-orange accent (`#FF4D00`), mono annotations, big tight-tracked type.

## Structure

```
index.html          Homepage (hero, selected work, capabilities, closer, contact footer)
architecture.html   Studio work index — leads the Work section (Miami River Fish
                    Market flagship + 6 projects + coursework archive)
utern.html          Flagship case study — UTern
apex-student.html   Flagship case study — Apex Student (LOLA)
stamped.html        Concept study — Stamped
photography.html    Visual archive + 2026 Michele Edelson Photography Award feature
about.html          About page
css/style.css       All styling (design tokens at the top in :root)
js/main.js          Scroll-reveal animation
```

Work order on the homepage: Architecture first (full-width card), then UTern,
Apex Student, Stamped, Photography. Next-project chain: Architecture → UTern →
Apex → Stamped → Photography → Architecture.

## Filling in the blanks

- Anything highlighted **orange** on the page is a `<span class="todo">` — a metric, date, or detail you still need to fill. Search the HTML for `todo` to find them all. Delete the span (keep the text) once filled.
- Every hatched frame with corner ticks is a `<figure class="ph">` image placeholder. Replace with a real image:
  ```html
  <!-- before -->
  <figure class="ph" style="--ar: 4/5"><span>LOLA — Character Sheet</span></figure>
  <!-- after -->
  <img src="img/lola-character-sheet.jpg" alt="LOLA character sheet" />
  ```
  Put images in an `img/` folder. Keep them under ~300KB each (use WebP).
- Social links are `href="#"` in every footer and on the About page — replace with real profile URLs.

## Running locally

```
python -m http.server 4173
```
Then open http://localhost:4173. (Or just double-click `index.html` — no server required.)

## Deploying

Drag the whole folder into [Netlify Drop](https://app.netlify.com/drop), or push to GitHub and enable Pages, or `vercel deploy`. No build step.

## Design rules (don't break these)

- One accent color, used sparingly — links, hovers, one word per page.
- No new fonts. Inter Tight for everything, JetBrains Mono for labels only.
- Curation over volume: four items in Work, maximum.
- Motion is one move (fade-up reveal), repeated. Nothing bounces.
