import { svgEl, pieceGraphic } from './svg.js';

const PREVIEW_PADDING = 2;

// `onDragStart(pieceId, pointerEvent)` is called when a palette item is pressed.
export function renderPalette(listEl, pieces, onDragStart) {
  listEl.replaceChildren(...pieces.map((piece) => {
    const item = document.createElement('li');
    item.className = 'palette-item';
    item.dataset.pieceId = piece.id;
    item.title = 'Drag onto the canvas';
    item.addEventListener('pointerdown', (e) => onDragStart(piece.id, e));

    const pad = PREVIEW_PADDING;
    const preview = svgEl('svg', {
      class: 'palette-preview',
      viewBox: `${-pad} ${-pad} ${piece.width + 2 * pad} ${piece.height + 2 * pad}`,
      'aria-hidden': 'true',
    });
    preview.append(pieceGraphic(piece));

    const text = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'palette-name';
    name.textContent = piece.name;
    const meta = document.createElement('div');
    meta.className = 'palette-meta';
    meta.textContent = `${piece.width} × ${piece.height} pt` + (piece.placeholder ? ' · placeholder' : '');
    const usage = document.createElement('div');
    usage.className = 'palette-usage';
    text.append(name, meta, usage);

    item.append(preview, text);
    return item;
  }));
}

// Show `used / owned` per piece type and disable types with none left (spec 04).
// Types with a problem from a loaded design (more placed than owned, or overlapping) are marked red.
export function updatePaletteUsage(listEl, design) {
  const { overLimit, overlapping } = design.problems();
  const overlappingTypes = new Set(design.pieces.filter((p) => overlapping.has(p.uid)).map((p) => p.type));

  for (const item of listEl.children) {
    const id = item.dataset.pieceId;
    const used = design.usedCount(id);
    const owned = design.types.get(id).count;
    const spare = design.hasSpare(id);
    item.querySelector('.palette-usage').textContent = `${used} / ${owned} used`;
    item.classList.toggle('used-up', !spare);
    item.classList.toggle('problem', overLimit.has(id) || overlappingTypes.has(id));
    item.setAttribute('aria-disabled', String(!spare));

    const notes = [];
    if (overLimit.has(id)) notes.push(`${used - owned} more placed than you own: delete some.`);
    if (overlappingTypes.has(id)) notes.push('Some of these overlap another piece: move them apart.');
    if (notes.length === 0) notes.push(spare ? 'Drag onto the canvas' : 'All of these are placed. Delete one to free it up.');
    item.title = notes.join(' ');
  }
}
