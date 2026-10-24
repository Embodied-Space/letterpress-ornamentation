# 16 — Swap for the mirror piece

## Goal
Try the mirror image of part of a design without hunting for the other piece in the palette: press `M`
to swap a placed piece for its mirror image, using the pieces actually owned.

## Scope
- `pieces.json` gets an optional `mirror` field on each piece type (01):
  - the `id` of the piece type that is its mirror image (`offset-18-gentle-z` ↔ `offset-18-gentle-s`), or
  - its own `id` when the piece is its own mirror image (straight lines, the u-turn), or
  - left out when its mirror image isn't in the set (the 48 × 12 offset).
- `M` swaps every selected piece for its mirror image, in place: flipped left to right as seen on screen,
  in the same footprint.
  - A piece with a mirror partner becomes the partner, at the rotation whose connectors match the flip.
  - A piece that is its own mirror image is turned to the rotation that matches the flip. For a straight
    line or the u-turn that is a half turn.
- The swap is one undo step (15).

## Out of scope
- Mirroring a whole selection as one block (moving pieces to mirrored places). Each piece stays where it is.
- A toolbar button. `M` only.
- Swapping while dragging.

## Confirmed decisions
- Requested: `M` replaces a piece with its mirrored piece when there is one, or turns a symmetric piece a
  half turn.
- Mirror pairs are data (`mirror` in `pieces.json`), not code.
- The flip is left to right on screen, so a piece stays where it is. In print view the result is the same,
  because both flips are left to right.
- The rotation is chosen by matching the piece's connectors after the flip. If several rotations match,
  a partner keeps the current rotation if it can, and a piece that is its own mirror prefers a half turn.
- It's all or nothing: if a partner has none left (04), nothing changes and a notice says so. Selected
  pieces with no mirror image are left as they are, with a notice.
- `mirror` must name a known piece type, and pairs must point at each other.

## Acceptance criteria
- A gentle "z" placed at 0° becomes a gentle "s" in the same footprint, and `M` again brings back the "z".
- A straight line or u-turn turns a half turn. A 48 × 12 offset stays as it is, with a notice.
- With every "s" already placed, `M` on a "z" changes nothing and shows a notice.
- One undo after `M` restores every swapped piece.
