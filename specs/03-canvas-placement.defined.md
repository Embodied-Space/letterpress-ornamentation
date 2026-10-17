# 03 — Canvas placement

## Goal
Place, move, rotate and remove pieces quickly on a canvas measured in points, so trying out a design takes seconds.

## Scope
- SVG canvas where 1 SVG unit = 1 pt. Zoom and pan.
- Drag from the palette to place a piece. Drag a placed piece to move it.
- Snapping to a **1 pt grid**.
- Rotation in 90° steps (keyboard shortcut and button). Rotating swaps width and height.
- Delete a selected piece (Delete/Backspace key and button).
- **Overlaps are blocked**: a drop or rotation that would overlap another piece is rejected, and the piece goes back to where it was.

## Out of scope
- Mirroring and flipping (real type can't be flipped).
- Multi-select, groups, repeat tools.
- Connector highlighting (see 07).

## Confirmed decisions
- 1 pt grid only (no 0.5 pt mode).
- 90° rotation.
- No overlaps allowed.

## Open questions
- Keyboard shortcuts (suggested: `R` rotate, `Del` delete).
- Undo/redo: in v1 or not?

## Acceptance criteria
- Every placed piece has whole-point x/y coordinates.
- An overlapping placement is never stored in the design state.
- Rotating a 24×36 piece four times returns it to its original orientation and footprint.
