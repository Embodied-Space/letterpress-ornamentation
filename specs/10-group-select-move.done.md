# 10 — Group select and move

## Goal
Move a finished part of a design (a corner with its rules, a whole border) as one unit, so trying a
different arrangement doesn't mean moving every piece again.

## Scope
- Select several placed pieces at once, and show the selection clearly (every selected piece is outlined).
- Drag any selected piece to move the whole selection together, keeping the pieces' positions relative to each other.
- The move follows the same rules as a single piece: whole points only, and it's rejected (everything goes back) if any piece would overlap a piece outside the selection.
- Rotate the selection 90° (`R`, the Rotate button, or right-click while dragging) about the center of its bounding box.
- Delete removes every selected piece.
- Line snapping (09) works while dragging a selection, using the connectors of the selected pieces against the pieces outside it.
- The toolbar shows the selection's piece count and bounding-box size when more than one piece is selected.

## Out of scope
- Saved or named groups that persist after the selection is cleared.
- Copying or duplicating a selection.
- Mirroring a group (pieces can only be rotated).

## Confirmed decisions
- Wanted: select a group of pieces and move them together.
- This lifts the "multi-select, groups" exclusion in 03.
- Selecting:
  - Click a piece to select only that piece.
  - Shift-click a piece to add it to the selection or take it out.
  - Shift-drag on empty canvas draws a selection box. Every piece it touches is added to the selection.
  - A plain drag on empty canvas still pans, and a plain click there clears the selection.
- Pressing on a piece that's already selected and dragging moves the whole selection. Clicking it without dragging selects just that piece.
- Rotating a group turns every piece and its place within the group 90° about the center of the group's bounding box. It's rounded to whole points the same way a single piece is (03), so turning back undoes it exactly and four turns return to the start. A turn that would overlap is rejected.
- `Esc` clears the whole selection.

## Acceptance criteria
- Dragging a selection of several pieces keeps every piece's offset from the others unchanged, and every piece ends on whole points.
- A group drop or rotation that would overlap a piece outside the selection changes nothing.
- Rotating a selection four times returns every piece to its original position and rotation.
- Delete with several pieces selected removes all of them and frees them in the palette counts.
