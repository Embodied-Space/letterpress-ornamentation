# 13 — Lockup view and print view

## Goal
Switch between seeing the form as it's locked up on the press and seeing what it will print, so a design
can be checked as the finished print, not only as an arrangement of metal.

## Scope (draft)
- A view toggle in the canvas toolbar: **Lockup** and **Print** (shortcut `P`).
- **Lockup view** is what the tool shows today: the form as it sits in the chase, seen from above. Piece
  bodies, gaps and spacing sizes are shown.
- **Print view** shows the impression: the whole form mirrored left to right, with only the inked double lines
  (no bodies, gap overlays or labels), on a paper-coloured background.
  - Hovering a piece shows the outline of its body. Nothing else of the metal is shown.
  - The 1 pt grid is shown only while dragging.
  - If a paper size is set (14), the paper edge is shown, mirrored with the form.
- Editing works in both views. In print view, everything works as seen on screen: a piece moves the way the
  pointer moves, and `R` turns it clockwise on screen (anticlockwise on the metal). The design data is
  updated to match (mirrored back into lockup coordinates).
- Text placeholders (12) read backwards in lockup view and correctly in print view, like real type.
- The design data doesn't change between views. Print view is a different way of drawing the same design.

## Out of scope
- Mirroring individual pieces. Pieces can only be rotated; the mirror applies to the whole view.
- Ink spread, impression depth, paper texture or colour choice.
- Exporting or printing the print view (could be its own spec).
- Setting, placing and saving the paper (see 14).

## Confirmed decisions
- Wanted: a lockup view and a print view.
- Everything built so far is the lockup view.
- The artwork in `data/pieces.json` is drawn as it looks on the face of the type (lockup), so the print view
  is its mirror image.
- Pieces can be edited in print view.
- Print view shows the paper edge only when a paper size is set.
- Hover shows only the outline of the piece under the pointer. The grid appears only while dragging.
- Text placeholders read backwards in lockup view and correctly in print view.
- `R` always turns a piece clockwise on screen, in either view.
- The view is a screen setting, not saved with the design (like line snapping).
- Shortcut: `P`.

## Open questions
- None yet.

## Acceptance criteria
- `P` and the toolbar toggle switch views; the view isn't saved with the design.
- Print view is the exact left-right mirror of the lines in lockup view, with no bodies, gaps or labels.
- Hovering a piece in print view outlines its body; the grid shows only while dragging.
- A piece dragged right on screen in print view moves right on screen, and the saved coordinates match the
  same piece seen in lockup view.
- `R` turns the selected piece clockwise on screen in both views.
- Snapping, the no-overlap rule and inventory limits work the same in both views.
