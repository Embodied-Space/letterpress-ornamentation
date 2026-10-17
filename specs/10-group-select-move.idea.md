# 10 — Group select and move

## Goal
Move a finished part of a design (a corner with its rules, a whole border) as one unit, so trying a
different arrangement doesn't mean moving every piece again.

## Scope (draft)
- Select several placed pieces at once, and show the selection clearly.
- Drag any selected piece to move the whole selection together, keeping the pieces' positions relative to each other.
- The move follows the same rules as a single piece: whole points only, and it's rejected (everything goes back) if any piece would overlap a piece outside the selection.
- Delete removes every selected piece.

## Out of scope
- Saved or named groups that persist after the selection is cleared.
- Copying or duplicating a selection.
- Mirroring a group (pieces can only be rotated).

## Confirmed decisions
- Wanted: select a group of pieces and move them together.
- This lifts the "multi-select, groups" exclusion in 03.

## Open questions
- How do you select a group: shift/ctrl-click to add or remove pieces, a selection box dragged on the canvas, or both? Dragging on empty canvas pans now, so a selection box needs a modifier key or a mode.
- Can a group be rotated? If so, about which point, keeping whole-point coordinates and returning exactly after four turns?
- Should line snapping (09) work while dragging a group, using the connectors on the outside of the group?
- Should right-click rotate the group while dragging, as it does for one piece?
- What does the toolbar show when several pieces are selected (count, combined size)?

## Acceptance criteria
- To be defined.
