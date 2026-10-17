# 01 — Piece data

## Goal
Describe every ornament piece in a single data file, so the canvas, inventory and gap logic all read from one source of truth, and real measurements can replace the placeholders without code changes.

## Scope
- `data/pieces.json`: an array of piece types.
- Each piece type has:
  - `id`: kebab-case, stable (used in saved designs)
  - `name`: human-readable label
  - `width`, `height`: body size in **points**, in the default (0°) orientation
  - `count`: how many you own
  - `lines`: the double-line artwork as SVG path data in piece-local point coordinates (origin top-left)
  - `connectors`: where the double line meets the edge of the body: `{ "edge": "top|right|bottom|left", "offset": <pt from the edge's start> }`
  - `placeholder`: `true` until the real measurements have been entered
- Placeholder data for the 4 known piece types:

| id | Size | Size (pt) | Count | Notes |
|---|---|---|---|---|
| `corner-block` | 1" × 1" | 72 × 72 | 4 | corner |
| `corner-small` | 2 × 3 pica | 24 × 36 | 5 | corner; orientation of the 2×3 still to confirm |
| `offset` | 4 × 1 pica | 48 × 12 | 6 | moves the line 8 pt sideways |
| `straight` | 4 pica × 4 pt | 48 × 4 | 30 | straight double-line rule |

## Out of scope
- Spacing material (see 08).
- Photos or bitmap artwork of the pieces. Vector placeholders only for now.

## Confirmed decisions
- All units are points (1 pica = 12 pt, 1" = 72 pt).
- The data lives in a JSON file with placeholders now; real dimensions will come from photos and measurements later.
- Every piece type has the same double-line spacing and thickness.
- `width`, `height` and `count` must be whole numbers (the canvas grid is 1 pt).
- A connector's `offset` is measured from the left end of the top/bottom edge, or the top end of the left/right edge.
- `lines` is filled (not stroked) path data. Placeholder art: two 1 pt lines with a 1 pt gap.

## Open questions
- Exact line thickness, the gap between the two lines, and where the line sits within each body (needed for 07).
- Is the 2×3 pica corner 2 wide × 3 tall, and which way does it turn?
- For the offset piece, where does the line enter and leave, relative to the body?

## Acceptance criteria
- `data/pieces.json` loads and validates on page start, and an error is shown if a required field is missing.
- Changing a `count` or size in the JSON changes the tool's behavior with no code edits.
