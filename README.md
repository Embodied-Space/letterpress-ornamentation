# Letterpress Ornaments Layout Tool

A browser-based tool for planning letterpress layouts with a double-line-rule ornament set:
corners, line offsets and straight rules that all share the same line spacing and thickness.

Try out borders and space-filling designs on screen, using only the pieces you actually own. Then
get a plan you can set from: where each piece goes, and the size of every gap that needs spacing
material.

> **Status:** early development. Piece dimensions are placeholders until real measurements are taken.

## Features (v1, in progress)
- Drag ornament pieces onto a canvas measured in points; they snap to a 1 pt grid and rotate in 90° steps
- Right-click while dragging to rotate; optional "Snap lines" mode joins the double lines of neighboring pieces
- Shift-click pieces, or shift-drag a box on empty canvas, to select several; drag, rotate or delete them together
- Press `M` to swap the selected pieces for their mirror images (a "z" offset for an "s", one corner for its mirror), or turn a symmetric piece to match
- Drag a piece (or a selection) straight out from the piece it's joined to, and straight rules fill the gap behind it. Toggle this with the "Auto-fill" button or `F`; rotating during the drag also turns it off for that drag
- Undo and redo edits (`Ctrl/⌘ Z`, `Shift Ctrl/⌘ Z`). Loading, importing or clearing a design starts a fresh history
- Pieces can't overlap, and you can't place more of a piece than you own
- Text placeholders: click the palette's Text item to set a font size and the wording (its width is estimated),
  a line width, or a block size; then drag it onto the canvas. Double-click a placed block to change it. The
  text reads backwards in lockup view and correctly in print view
- Automatic gap measurement: the empty space inside the form, split into horizontal strips and labeled in points
- Lockup view (the form as it sits in the chase) and print view (the mirrored impression, lines only); switch with `P`
- Set a paper size (pt, picas, inches or cm) and drag the sheet's edge to place it around the form
- Save designs in your browser; export and import them as JSON

## Planned
- Highlighting where the double lines of neighboring pieces join
- Suggested spacing material (quads, leads, slugs, brass, coppers) for each gap

## Using it
Open the hosted page: https://embodied-space.github.io/letterpress-ornamentation/

## Units
All measurements are in points: 12 pt = 1 pica, 72 pt = 1 inch.
