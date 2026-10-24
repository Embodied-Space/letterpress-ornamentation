# 12 — Text placeholders

## Goal
Rough in where the type goes in a layout, so borders and ornaments can be designed around the text
before it's set. A placed FPO ("for position only") block stands in for the type.

## Scope (draft)
- Add a text block by giving a **font size** (pt) and either:
  - the **text** itself, whose width is estimated from the font size, or
  - an **approximate line width** (pt), when the wording isn't known yet.
- The block's height is the font size (the body of the type). Its width is the given or estimated width.
  Both are rounded up to whole points.
- The block is drawn as a clearly marked FPO placeholder: a tinted box with its text (or "FPO") and
  its size, e.g. `18 pt · 144 × 18`.
- A placed text block behaves like a piece: dragged on the 1 pt grid, can't overlap anything, and counts as
  solid in the form for gap measurement (05).
- Text blocks are saved and loaded with the design (06).

## Out of scope
- Real fonts, real text rendering or exact set widths.
- Choosing or counting physical type (no inventory limits on text).
- Line breaking, justification or spacing out a line to a measure.

## Confirmed decisions
- Wanted: text placeholders set by font size plus either text or an approximate line width.
- Placeholders are for roughing in only, and must look clearly different from ornament pieces.
- The placeholder text reads backwards in lockup view and correctly in print view (13).

## Open questions
- How is width estimated from text? A single average character width (for example, 0.5 × the font size),
  or per-font values? Either way, the factor belongs in a data file, not in code.
- One line per block, or several lines with a leading value (block height = lines × (size + leading))?
- Should the block snap to sensible widths (whole picas, or ems/ens of the font size) to make
  spacing easier?
- Can a block be edited after placing it (change the text, size or width), and how: an info panel form,
  or double-click?
- Can text blocks be rotated 90° (type set sideways)?
- Where do you add one: a "Text" item in the palette that opens a small form, or a toolbar button?

## Acceptance criteria
- To be defined.
