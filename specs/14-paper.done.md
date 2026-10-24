# 14 — Paper

## Goal
Set the sheet the design will be printed on and place it relative to the form, so the margins around the
printed ornament can be judged.

## Scope (draft)
- A **Paper** section in the info panel, under Form:
  - Width and height fields with one unit menu: pt, picas, inches, cm.
  - With no size entered, there is no paper (the default for new designs).
  - A "Remove" button to go back to no paper, and a "Centre" button to re-centre it on the form.
- The paper is drawn as an outline in lockup view, and as the sheet edge in print view (13), mirrored with
  the form.
- When a size is first set, the paper is centred on the form (or on the middle of the visible canvas if no
  pieces are placed).
- Drag the paper's edge to move the paper relative to the form, on the 1 pt grid, in either view. Moving
  works as seen on screen, like pieces in print view.
- Once placed, the paper stays where it is: adding, moving or deleting pieces doesn't move it.
- Paper size, unit and position are saved with the design.

## Out of scope
- Resizing the paper by dragging; the size is only typed in.
- Preset sheet sizes (Letter, A4…).
- Warnings when the form runs off the paper.
- Printing or exporting at paper size.

## Confirmed decisions
- Paper size and position are saved with the design.
- Units: inches, cm and picas (plus points, the tool's own unit).
- The paper defaults to centred on the form and is moved by dragging its edge.
- The paper stays put when the form changes.
- Shown as an outline in lockup view as well as in print view.
- Where it lives in the UI was left to Claude: the info panel, under Form.
- Size and position are stored in whole points, the same 1 pt grid as pieces. Sizes entered in cm (or
  fractions of an inch) are rounded to the nearest point, and the field shows the rounded value back in
  the chosen unit. The unit is kept only to show the size the same way next time.
- Save format: an optional `"paper": { "width": <pt>, "height": <pt>, "x": <pt>, "y": <pt>, "unit": "pt|pc|in|cm" }`
  field, where `x` and `y` are the paper's top-left corner in lockup coordinates. The format stays at version 1:
  older files load with no paper. A malformed `paper` field is refused like other format errors (06).

## Open questions
- None yet.

## Acceptance criteria
- Entering 8.5 × 11 in gives a 612 × 792 pt sheet centred on the form; entering 21 × 29.7 cm gives 595 × 842 pt.
- Dragging the paper edge moves it in whole points and never moves a piece.
- Adding pieces after the paper is placed leaves the paper where it was.
- Export → import keeps the paper's size, unit and position; a design with no paper still loads.
- In print view the paper and form are mirrored together, so the margins swap left and right.
