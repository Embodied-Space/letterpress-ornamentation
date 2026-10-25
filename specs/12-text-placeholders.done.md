# 12 — Text placeholders

## Goal
Rough in where the type goes in a layout, so borders and ornaments can be designed around the text
before it's set. A placed FPO ("for position only") block stands in for the type.

## Scope
- A **Text** item in the palette. Clicking it opens a small form that sets up a text block; dragging it onto
  the canvas places a block with those settings (so several lines of the same size are quick to place).
  The palette item shows the current settings.
- A text block always has a **font size** (pt), and its size comes from one of:
  - **Text**: the wording, whose width is estimated from the font size and a type style (below).
    Height is the font size.
  - **Line width**: an approximate line width (pt), when the wording isn't known yet. Height is the font size.
  - **Block**: a width and a height (pt), for a block of several lines. The text is optional.
  The text is optional for the last two, and is shown in the block when given.
- Sizes are in whole points, rounded up. For Text and Line width, the width is first rounded up to a whole
  quarter em of the font size, then to a whole point (a quarter em of 18 pt is 4.5 pt, so 100 pt becomes
  103.5 and then 104). A Block's width and height are only rounded up to whole points.
- Width estimate: characters × the style's average character width (in ems) × font size.
  - The average widths are data, in `data/type-styles.json`: defaults for broad styles (roman, gothic,
    condensed, extended, typewriter), and room for per-font values.
  - `data/type-styles.md` explains how to measure a font and add it: set a given phrase, measure it, divide.
- The block is drawn as a clearly marked FPO placeholder, unlike any ornament piece: a tinted, dashed box with
  its text (or "FPO") and its size, e.g. `18 pt · 144 × 18`.
  - In lockup view the text reads backwards, like type; in print view it reads correctly (13).
  - Print view shows the text only (no box or size), in a lighter ink than the ornaments.
- A placed block behaves like a piece: it's dragged on the 1 pt grid, selected, moved in a group, rotated 90°
  (type set sideways), deleted and undone like one. It can't overlap anything and counts as solid in the form
  for gap measurement (05). It has no connectors, so nothing snaps to it (09).
- Double-clicking a placed block opens the same form to change its text, size or width. Its top-left corner
  stays put; if the new size would overlap something, the change is refused and the form says so.
- Text blocks are saved, loaded, exported and imported with the design (06), with their resolved width and
  height, so changing `type-styles.json` later doesn't move a saved design.

## Out of scope
- Real fonts, real text rendering or exact set widths.
- Choosing or counting physical type (no inventory limits on text).
- Line breaking, justification or spacing out a line to a measure.
- `M` (16): a text block has no mirror piece, so it is left as it is.

## Confirmed decisions
- Wanted: text placeholders set by font size plus either text or an approximate line width.
- Placeholders are for roughing in only, and must look clearly different from ornament pieces.
- The placeholder text reads backwards in lockup view and correctly in print view (13).
- Width from text uses a per-style average character width: defaults for condensed, extended, gothic and so
  on, plus optional per-font values, kept in a data file with a markdown guide to measuring a phrase.
- One line per block, or a block given as a width and height in points.
- Widths snap to quarter ems.
- Blocks can be edited after placing them, by double-clicking.
- Blocks can be rotated 90°.
- Added from a Text item in the palette.

## Acceptance criteria
- Clicking the palette's Text item opens the form; its settings show on the item, and dragging the item places
  a block with them.
- "Menu" at 18 pt in a 0.5 em style is 4 × 0.5 × 18 = 36 pt wide and 18 pt high. A 100 pt line width at 18 pt
  becomes 104 pt. A 100.2 × 30.5 pt block becomes 101 × 31.
- A block can't be dropped or moved onto a piece or another block; it's included in the form size and gaps.
- The block text reads backwards in lockup view and correctly in print view.
- `R` turns a block 90°; double-click opens its form, and an edit that would overlap is refused.
- A design with text blocks survives save, reload, export and import unchanged, and undo restores an edit.
