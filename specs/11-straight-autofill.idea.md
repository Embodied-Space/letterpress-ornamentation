# 11 — Straight auto-fill

## Goal
Lay a long run of straight rule in one drag, without placing every 4-pica straight one at a time.

## Scope (draft)
- While dragging, straight pieces are filled in automatically along the drag, end to end.
- Previewed while dragging and placed when the pointer is released.
- Each straight is placed with the usual rules: whole points, no overlaps, and no more than `count` from `pieces.json`.
- Straights are turned to match the direction of the run (horizontal or vertical).

## Out of scope
- Filling with pieces other than straights (offsets, corners).
- Turning corners or routing around other pieces.
- Suggesting spacing for the leftover length (see 08).

## Confirmed decisions
- Wanted: auto-fill straight pieces while dragging.

## Open questions
- What starts an auto-fill drag: dragging out from the end of a placed piece's line, a separate tool or mode, a modifier key, or dragging a straight from the palette?
- Is the run locked to horizontal or vertical, following the drag's main direction?
- A straight is 48 pt long. When the dragged length isn't a multiple of 48, round to the nearest whole straight, stop at the last one that fits, or leave the remainder as a gap?
- When the run hits the inventory limit or another piece, stop there and show why, or refuse the whole run?
- Should the run line up with connectors (09) so it joins the piece it starts from? That needs real line geometry for the placement to be right.
- Can a run that's already placed be shortened or lengthened by dragging its end, or does it become ordinary separate pieces?

## Acceptance criteria
- To be defined.
