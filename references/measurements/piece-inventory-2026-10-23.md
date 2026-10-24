# Piece inventory: counted 2026-10-23

Counted by hand. Feeds `data/pieces.json` (spec 01). "p" below means points.

## As counted (verbatim)
- lines are 6 points tall and range from 6 points wide (x3), 12 points wide (x20), 24p (x1), 48p (x75), 42p (x1)
- an offset block that is 12pX48p (x5), and some 18pX18p offset blocks (x3 gentle "z", x3 gentle "s", x4 strong "z" and x2 strong "s")
- a 12pX12p "u-turn" block (x4)
- a 12pX12p terminator (x4 "p" style, x3 "q" style)
- 12pX12p quarter-turns/quarter-circles (x7)
- 24pX24p corners (x2, labelled "5", if it is arranged like a capital L, the top aligns right along the edge, and the exit from the right is 6p from the bottom)
- 24pX36p corners (x2 labelled "4" which are "L" style with the same offsets as the 24pX24p block, x1 labelled "3" which is a mirror of "4")
- 48pX48p corner (x1 labelled "11" which is "L" style with a top exit 6p offset from the left and the right exit also 6p offset from the bottom, x3 labelled "10" which are a mirror image of "11")

## How it was entered (to confirm)
Connector offsets in `pieces.json` are to the centre of the 6 pt line.
- Exit offsets ("6p from the bottom") are read as the gap between the body edge and the edge of the
  6 pt line, so the line's centre is 9 pt from that edge. "Aligns right along the edge" = 0 gap (centre at 3 pt).
- 24 × 36 corners are 24 wide × 36 tall, with the long side vertical in the L.
- 18 × 18 offsets (confirmed): gentle and strong enter and leave at the same points, with the line
  flush to the edge (centres 3 → 15). The only difference is how swoopy the curve is.
- Guessed, not measured: the 12 × 48 offset moves the line 6 pt; "z" enters high on the left and
  leaves low on the right.
- Guessed: the u-turn's two ends both leave one 12 pt edge, side by side (centres at 3 and 9).
- Guessed: terminators take the line in at the bottom, at one side (the "stem"); "q" is the mirror of "p".
- Guessed: the quarter turn joins the top edge (centre 3 from the left) to the right edge (centre 9 from the top).
- All artwork is still placeholder (two 1 pt lines, 1 pt gap); line thickness and spacing are unmeasured.

See `artwork-from-photos-2026-10-24.md` for what the photos confirmed and changed (corner 5, corners 3/4).
