# Letterpress Ornaments Layout Tool

A static web tool (GitHub Pages) for laying out a double-line-rule letterpress ornament set: try out
borders and space-filling designs, stay within the pieces actually owned, and see the size of every
gap that needs spacing material.

## Folder structure (planned)
- `index.html`, `css/`, `js/`: the app. Plain HTML/JS (ES modules) + SVG, no build step.
- `data/pieces.json`: ornament piece types (size in pt, line geometry, connectors, count owned).
- `specs/`: one small spec per concern.
- `references/`: knowledge base of reference assets (photos, measurements, code, transcripts).
- `README.md` (for users), `DEV.md` (setup and workflows for humans).

## Specs
- Named `<index>-<title>.<idea|defined|done>.md`, numbered in build order.
- Change status by renaming the file. Only `defined` specs are ready to build. Rename to `done` when built.
- Keep specs to one concern each; split rather than grow them.

## Currently building
- v1, due the week of 2026-10-19: specs `01` to `06` in `specs/` are built. Live at https://embodied-space.github.io/letterpress-ornamentation/
- `09` (line snapping) was split out of 07 and built early, at the user's request.
- `10` (group select and move), `11` (straight auto-fill), `13` (lockup and print views) and `14` (paper) are built.
- `07` (connector highlighting), `08` (spacer suggestions) and `12` (text placeholders) are `idea`: don't build
  them until they're `defined`.

## Git
- Never commit or push. The user handles all git commits and pushes; leave changes in the working tree.

## References
- Before designing or implementing anything, check `references/` for relevant photos, measurements or notes.

## Units & domain
- Everything is in points: 1 pica = 12 pt, 1 inch = 72 pt. 1 SVG unit = 1 pt.
- The form is the bounding box of the placed pieces. Gaps are split into horizontal strips (lines of type).

## Common mistakes to avoid
- Adding a build step, framework or npm dependency. It must deploy as plain static files.
- Putting piece sizes or counts in code. They belong in `data/pieces.json` only.
- Treating placeholder geometry (`"placeholder": true`) as real. Real measurements are still to come.
- Allowing overlaps, or placing more pieces than `count`. Both are hard rules for editing. The one
  exception: a loaded or imported design that already breaks them is shown with the problems in red (spec 06).
- Coordinates that aren't whole points (the grid is 1 pt), or floating-point drift from repeated rotation.
- Mirroring or flipping pieces. Physical type can only be rotated.
- Opening `index.html` over `file://`. ES modules need a local server (see DEV.md).
- Building past the spec: ask before adding features that aren't in a `defined` spec.
