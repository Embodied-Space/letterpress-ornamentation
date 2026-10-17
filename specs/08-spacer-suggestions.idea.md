# 08 — Spacer suggestions

## Goal
For every gap rectangle from 05, suggest the actual spacing material to fill it, so you know what to pull from the case.

## Scope (draft)
- Spacer types from the user:
  - Leads and slugs (strips, cut or in set lengths)
  - Quads/spaces in 8, 12, 24, 30, 36 pt: em (M) and en (N)
  - Small spacing down to brass (1 pt) and coppers (0.5 pt)
- Each strip from 05 (one line height) is filled across its width with spaces of the strip's body size. Height that doesn't match a body size is made up with leads, slugs, brass and coppers.
- Prefer fewer, larger pieces.
- Show the combination per gap, and a total list of materials to pull.

## Out of scope
- Furniture and the chase.

## Confirmed decisions
- Comes after 05; gap sizes only in v1.

## Open questions
- Exact list of spacer sizes and thicknesses (e.g. lead = 2 pt? slug = 6 pt? thin spaces?).
- Track spacer inventory (counts owned)? Not in v1.
- Leads/slugs: cut to length, or labor-saving set lengths?
- How to handle a 0.5 pt remainder, since the canvas grid is 1 pt.

## Acceptance criteria
- To be defined.
