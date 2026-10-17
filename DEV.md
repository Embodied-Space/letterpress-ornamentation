# Development

## Requirements
- A modern browser
- Any static file server (ES modules don't load over `file://`)
- Git, and a GitHub account for deployment

## Run locally
From the project root, start any static server, for example:

```sh
python -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000.

There is no build step, and no dependencies to install.

## Project layout
See the folder structure in `CLAUDE.md`. In short: the app is in `index.html`, `css/` and `js/`; the
ornament set is in `data/pieces.json`; plans are in `specs/`; reference material is in `references/`.

## Updating the ornament set
Edit `data/pieces.json` (format in `specs/01-piece-data.defined.md`). Sizes are in points.
Set `"placeholder": false` on a piece once its real measurements are in. Put the photos and
measurement notes you worked from in `references/`.

## Working with specs
- Specs live in `specs/` as `<index>-<title>.<idea|defined|done>.md`.
- Move a spec through its stages by renaming the file: `idea` → `defined` (decisions confirmed) → `done` (built).

## Deploy (GitHub Pages)
- TODO: the project isn't a git repository yet. Run `git init` and create the GitHub repo.
- TODO: in the repo settings, under Pages, deploy from the default branch, root folder. Record the URL in `README.md`.

## Testing
- TODO: no test setup decided yet. Gap measurement (spec 05) is the main logic worth unit-testing.
