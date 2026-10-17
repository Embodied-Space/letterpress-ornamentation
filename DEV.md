# Development

## Requirements
- A modern browser
- Any static file server (ES modules don't load over `file://`)
- Git, and a GitHub account for deployment

## Run locally
From the project root, start any static server, for example:

```sh
python -c "import http.server as h; h.SimpleHTTPRequestHandler.extensions_map['.js']='text/javascript'; h.test(HandlerClass=h.SimpleHTTPRequestHandler, port=8000)"
# or
npx serve .
```

Then open http://localhost:8000.

On Windows, plain `python -m http.server` can serve `.js` as `text/plain` (it takes MIME types from
the registry), and the browser then refuses to run the modules and the page stays on "Loading pieces…".
The one-liner above forces the right type. GitHub Pages isn't affected.

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
- Repo: https://github.com/Embodied-Space/letterpress-ornamentation
- GitHub Pages deploys the `main` branch from the root folder. Pushing to `main` updates the site.
- Live site: https://embodied-space.github.io/letterpress-ornamentation/

## Testing
- TODO: no test setup decided yet. Gap measurement (spec 05) is the main logic worth unit-testing.
