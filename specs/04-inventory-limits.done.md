# 04 — Inventory limits

## Goal
Make sure every design can be built with the pieces you actually own.

## Scope
- The palette shows `used / owned` for each piece type, from `count` in `pieces.json`.
- **Hard limit**: once all of a piece type are used, it can't be placed. Its palette item is disabled.
- Deleting a placed piece frees one up again.

## Out of scope
- Spacer inventory.
- Editing counts in the UI (edit `pieces.json` instead).

## Confirmed decisions
- Hard limit, not a warning. Enforced in the design model, not just the palette.
- Pressing a used-up palette item shows a short notice instead of starting a drag.

## Open questions
- None. (Loading a saved design that uses more pieces than you own: decided in 06, it loads with the piece type flagged red.)

## Acceptance criteria
- You can't get more than `count` placed pieces of any type through dragging.
- The counts update immediately when a piece is placed or deleted.
