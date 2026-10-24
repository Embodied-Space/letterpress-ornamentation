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
  - `mirror` (optional): the `id` of the piece type that is its mirror image, or its own `id` if it is symmetric (spec 16)
  - `placeholder`: `true` until the real measurements have been entered
- The 19 piece types from the hand count of 2026-10-23 (sizes and counts are real; see
  `references/measurements/piece-inventory-2026-10-23.md` for what is still guessed):

| id | Size (pt) | Count | Notes |
|---|---|---|---|
| `line-6`, `line-12`, `line-24`, `line-42`, `line-48` | w × 6 | 3, 20, 1, 1, 75 | straight double line |
| `offset-48` | 48 × 12 | 5 | moves the line sideways |
| `offset-18-gentle-z`, `-gentle-s` | 18 × 18 | 3, 3 | gentle (less swoopy) offset; s is the mirror of z |
| `offset-18-strong-z`, `-strong-s` | 18 × 18 | 4, 2 | strong (swoopier) offset, same exits as gentle; s is the mirror of z |
| `u-turn` | 12 × 12 | 4 | turns the line back |
| `terminator-p`, `terminator-q` | 12 × 12 | 4, 3 | line end; q is the mirror of p |
| `quarter-turn` | 12 × 12 | 7 | quarter circle |
| `corner-5` | 24 × 24 | 2 | L corner |
| `corner-4`, `corner-3` | 36 × 24 | 2, 1 | L corner; 3 is the mirror of 4 |
| `corner-11`, `corner-10` | 48 × 48 | 1, 3 | L corner; 10 is the mirror of 11 |

## Out of scope
- Spacing material (see 08).
- Photos or bitmap artwork of the pieces. The artwork is vector, traced from the photos in
  `references/ornament_pictures/` (see `references/measurements/artwork-from-photos-2026-10-24.md`).

## Confirmed decisions
- All units are points (1 pica = 12 pt, 1" = 72 pt).
- The data lives in a JSON file with placeholders now; real dimensions will come from photos and measurements later.
- Every piece type has the same double-line spacing and thickness.
- `width`, `height` and `count` must be whole numbers (the canvas grid is 1 pt).
- A connector's `offset` is measured from the left end of the top/bottom edge, or the top end of the left/right edge.
- `lines` is filled (not stroked) path data. The two lines are 0.6 pt wide and 2.5 pt apart (centre to
  centre), centred on the connector. `references/code/piece-artwork.py` generates it.

## Open questions
- Line thickness and spacing are read from photos (about ±0.2 pt). A proof or caliper reading would confirm them.
- The centre of the 48 × 48 spiral (`corner-10`, `corner-11`) is approximate; they stay `placeholder` until a
  sharper photo or proof is traced.

## Acceptance criteria
- `data/pieces.json` loads and validates on page start, and an error is shown if a required field is missing.
- Changing a `count` or size in the JSON changes the tool's behavior with no code edits.
