# 05 — Gap measurement

## Goal
Show exactly what empty space has to be filled with spacing material, and where, so you don't have to work it out by hand.

## Scope
- **Form = the bounding box of all placed pieces.** Recalculate it whenever pieces change.
- Split the empty space inside the form into rectangles using **horizontal strips**:
  1. Cut the form into full-width horizontal bands at every piece's top and bottom edge.
  2. Within each band, the empty runs between pieces (and between a piece and the edge of the form) are gap rectangles.
  3. Optionally merge vertically stacked rectangles of the same width and x-position into one taller rectangle (a single block of spacing).
- Draw each gap rectangle as a tinted overlay, labeled `width × height` in points (also in picas where it divides evenly).
- The info panel lists all gaps (sorted top to bottom, then left to right) and the overall form size.

## Out of scope
- Choosing which spacers fill a gap (see 08).
- A form size you set yourself, or chase/furniture modelling.
- Space inside a piece's own body (the body is treated as solid).

## Confirmed decisions
- Form is the pieces' bounding box.
- Split into horizontal strips (like lines of type, filled line by line).
- Gap sizes in v1; spacer suggestions come later.

## Open questions
- Should step 3 (merging) be on by default, or a toggle?
- Leave out gaps narrower than some minimum, or always show every gap down to 1 pt?

## Acceptance criteria
- Gap areas + piece areas = form area, exactly.
- No gap rectangle overlaps another gap or a piece.
- A closed rectangular border of pieces produces an inside gap with correct dimensions.
