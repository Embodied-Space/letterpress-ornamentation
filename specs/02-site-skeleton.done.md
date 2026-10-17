# 02 — Site skeleton

## Goal
A static site that runs locally and on GitHub Pages with no build step.

## Scope
- `index.html`, `css/style.css`, `js/` as ES modules (`<script type="module">`).
- Layout: piece palette (left), SVG canvas (center), info panel (right) for gaps and inventory.
- GitHub Pages serving from the repo root on the default branch.

## Out of scope
- Bundlers, frameworks, npm dependencies.
- Custom domain.

## Confirmed decisions
- Plain HTML/JS + SVG, no build step.
- Hosted on GitHub Pages: repo `Embodied-Space/letterpress-ornamentation`, served at https://embodied-space.github.io/letterpress-ornamentation/

## Acceptance criteria
- The page loads from a local static server (ES modules don't work over `file://`) and from the Pages URL.
- No console errors on load.
