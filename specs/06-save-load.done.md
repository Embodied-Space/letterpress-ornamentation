# 06 — Save / load

## Goal
Keep designs between sessions and be able to move them around, so ideas from one sitting aren't lost.

## Scope
- Autosave the current design to `localStorage`.
- Multiple named designs in `localStorage`: save as, open, delete.
- A Clear button removes every piece and starts a new "Untitled" design (asks first, and warns if there are unsaved changes). Added at the user's request.
- Export a design as a `.json` file, and import one back.
- Design format: `{ "version": 1, "name": "...", "pieces": [ { "type": "<piece id>", "x": <pt>, "y": <pt>, "rotation": 0|90|180|270 } ] }`.

## Out of scope
- Cloud sync or sharing links.
- Image/PDF export.

## Confirmed decisions
- `localStorage` plus JSON export/import.
- A saved, autosaved or imported design that breaks the rules (more of a piece than owned, overlapping pieces) loads with **all its pieces shown**. The affected piece types are highlighted red in the palette, overlapping pieces get a red outline, and a notice lists the problems.
- Editing never makes it worse: a used-up type still can't be placed, and an overlapping piece can only be moved to a free spot. Deleting or moving pieces clears the red.
- Pieces with an unknown piece id can't be drawn (no size), so they're left out and named in the notice.
- A malformed file (wrong version, missing fields, fractional coordinates, a rotation other than 0/90/180/270) is refused with an error.
- The "Snap lines" setting is not part of the save data.
- Named designs are snapshots: "Save as" with the current name updates it. Opening or importing asks first if the current design has unsaved changes; deleting a saved design asks first.

## Acceptance criteria
- Reloading the page brings back the last design.
- Export → import gives an identical design.
- `localStorage` errors (private mode, quota) don't break the app; just show a notice.
