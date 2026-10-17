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
- No overlaps allowed. Pieces that only touch along an edge don't overlap.
- Exception: a loaded design may already contain overlaps (see 06). They're shown and flagged, and editing can't add new ones.
- Shortcuts: `R` rotates (also while dragging), right-click rotates while dragging, `Delete`/`Backspace` deletes, `Esc` cancels a drag or deselects.
- Rotation turns a piece clockwise about its center, rounded to whole points so that turning back undoes it exactly.
- Undo/redo is not in v1; it may come later.
- Zoom with the mouse wheel or the +/− buttons, pan by dragging empty canvas, and "Fit" zooms to the placed pieces.

## Acceptance criteria
- Every placed piece has whole-point x/y coordinates.
- An overlapping placement is never stored in the design state.
- Rotating a 24×36 piece four times returns it to its original orientation and footprint.
