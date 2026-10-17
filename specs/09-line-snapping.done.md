# 09 — Line snapping

## Goal
Make the double lines of neighboring pieces join up exactly while dragging, without having to line them up by eye.
Split out of 07 (connectors) and built ahead of the numbered order at the user's request.

## Scope
- A "Snap lines" toggle in the canvas toolbar (shortcut `S`), on by default.
- While a piece is dragged (new from the palette, or a placed piece being moved), each of its connectors (from `pieces.json`, turned with the piece's rotation) is compared with the connectors of every placed piece.
- Two connectors match when they face each other (opposite outward directions). If a match is within 10 screen pixels, the dragged piece jumps so the two connector points coincide: the pieces butt edge to edge with their lines aligned.
- The closest match wins. A snap is only offered if the snapped position is on whole points and overlaps nothing.
- A small circle marks the joint while snapped.

## Out of scope
- Highlighting joined and loose connectors on placed pieces (see 07).
- Joins across a spacing gap (lines not touching).

## Confirmed decisions
- Snapping is a mode you can turn on and off.
- The snap setting is not saved (not part of the design data).
- The snap distance is in screen pixels, so it feels the same at every zoom level.
- Works with placeholder connectors now; snaps will be right once real connector offsets are in `pieces.json`.

## Acceptance criteria
- With snapping on, a straight rule dropped a few points from the end of another butts against it with the lines aligned.
- With snapping off, the same drop lands where it was dropped (1 pt grid only).
- Snapping never produces an overlap or a fractional coordinate.
