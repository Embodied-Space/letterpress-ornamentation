# 07 — Connector highlighting

## Goal
Make it obvious when pieces' double lines join properly, so closed shapes are easy to build and mistakes are easy to see.

## Scope (draft)
- Use `connectors` from `pieces.json` (see 01), transformed by each piece's rotation.
- Highlight joined connectors (same point, facing each other) in one color, and connectors that don't meet anything in another.
- Optional: report whether the line forms a closed loop.

## Out of scope
- Automatic routing and suggestions for completing a shape.
- Snapping lines together while dragging (built as 09).

## Confirmed decisions
- Both grid snapping (03) and connector awareness are wanted.

## Open questions
- Needs real line geometry for every piece (see 01's open questions). Stays `idea` until then.
- Can pieces join with a gap filled by spacing (lines not touching), or must lines always butt directly?

## Acceptance criteria
- To be defined once the geometry is known.
