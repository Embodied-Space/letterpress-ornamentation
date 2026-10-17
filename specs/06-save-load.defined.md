# 06 — Save / load

## Goal
Keep designs between sessions and be able to move them around, so ideas from one sitting aren't lost.

## Scope
- Autosave the current design to `localStorage`.
- Multiple named designs in `localStorage`: save as, open, delete.
- Export a design as a `.json` file, and import one back.
- Design format: `{ "version": 1, "name": "...", "pieces": [ { "type": "<piece id>", "x": <pt>, "y": <pt>, "rotation": 0|90|180|270 } ] }`.

## Out of scope
- Cloud sync or sharing links.
- Image/PDF export.

## Confirmed decisions
- `localStorage` plus JSON export/import.

## Open questions
- Importing a design that goes over the current inventory, or uses an unknown piece id: load it with a warning and flag the bad pieces (suggested), or reject it?

## Acceptance criteria
- Reloading the page brings back the last design.
- Export → import gives an identical design.
- `localStorage` errors (private mode, quota) don't break the app; just show a notice.
