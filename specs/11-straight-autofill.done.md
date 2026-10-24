# 11 — Straight auto-fill

## Goal
Lay a long run of straight rule in one drag, without placing every straight one at a time: pull a
piece away from the piece it's joined to, and straights fill in behind it.

## Scope
- An "Auto-fill" toggle in the canvas toolbar (shortcut `F`), on by default. With it off, dragging a joined piece is an ordinary move.
- Auto-fill starts when you drag a placed piece, or a selection (10), away from a piece it's joined to. "Joined" means one of its connectors touches a facing connector of a piece that isn't being dragged, and that connector is on the trailing edge (it faces back against the drag direction).
- While auto-filling, the drag is locked to that axis. Straights fill the space behind the dragged piece, end to end, starting from the connector it was joined to. The dragged piece lands butted against the end of the run, with its lines joined.
- If the selection has several trailing joins (for example the right side of a border dragged right), each one gets its own run of the same length.
- The run is previewed while dragging and placed when the pointer is released.
- Each straight is placed with the usual rules: whole points, no overlaps, and no more than `count` from `pieces.json`.
- Straights are turned to match the direction of the run (horizontal or vertical).

## Out of scope
- Filling with pieces other than straights (offsets, corners).
- Turning corners or routing around other pieces.
- Suggesting spacing for the leftover length (see 08).
- Shortening or lengthening a placed run as one unit. Once dropped, the run is ordinary separate pieces.

## Confirmed decisions
- Wanted: auto-fill straight pieces while dragging.
- Auto-fill is a mode you can turn on and off, like line snapping (09). The setting is not saved (not part of the design data).
- The run fills from the joined connector up to the pointer: as many of the longest straight (48 pt) as fit, then the shorter straights still in stock (42, 24, 12, 6 pt), longest first, getting as close to the dragged length as possible without going past it.
- "Straight" is worked out from `pieces.json`: a piece with exactly two connectors, one on each end (left and right), at the same offset. Its length is its width. No straight lengths are written in code.
- The drag direction is the main direction of the pointer's movement since the drag began. Dragging mostly sideways, or towards the join, is an ordinary move with no fill.
- Rotating during the drag (`R` or right-click) cancels auto-fill for the rest of that drag.
- Line snapping (09) is off while a run is being filled. The run end is already where the piece joins.
- When the run comes up short because there aren't enough straights left, the drop still happens at the shorter length, and a notice says so.
- When the run or the dragged pieces would overlap another piece, the preview is red and the drop is rejected, like any other overlapping drop.
- Works with placeholder connectors now. Runs will line up correctly once real connector offsets are in `pieces.json`.

## Acceptance criteria
- Dragging a corner that's joined to a straight 196 pt further out along the run places 4 × 48 pt straights in the gap, and the corner butts against the last one with its lines aligned.
- Dragging the same corner sideways moves it with no fill.
- Turning the piece during the drag drops it with no fill.
- With the Auto-fill toggle off, the same drag moves the corner with no fill.
- A run never places more of a straight than are owned, never overlaps, and every piece is on whole points.
