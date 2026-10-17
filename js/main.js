import { loadPieces } from './pieces.js';
import { renderPalette, updatePaletteUsage } from './palette.js';
import { Design } from './design.js';
import { Canvas } from './canvas.js';

const NOTICE_MS = 2500;

function showError(message) {
  const el = document.getElementById('error');
  el.textContent = message;
  el.hidden = false;
}

let noticeTimer;
function showNotice(message) {
  const el = document.getElementById('notice');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { el.hidden = true; }, NOTICE_MS);
}

async function start() {
  const status = document.getElementById('status');
  let pieces;
  try {
    pieces = await loadPieces();
  } catch (err) {
    status.textContent = 'Could not load pieces.';
    showError(err.message);
    console.error(err);
    return;
  }

  const design = new Design(pieces);
  const rotateBtn = document.getElementById('btn-rotate');
  const deleteBtn = document.getElementById('btn-delete');
  const selectionInfo = document.getElementById('selection-info');
  const snapBtn = document.getElementById('btn-snap');

  const canvas = new Canvas(document.getElementById('canvas'), design, {
    onNotice: showNotice,
    onSnapChange(on) {
      snapBtn.setAttribute('aria-pressed', String(on));
    },
    onSelectionChange(piece) {
      rotateBtn.disabled = deleteBtn.disabled = piece === null;
      selectionInfo.textContent = piece === null ? ''
        : `${design.types.get(piece.type).name} at ${piece.x}, ${piece.y} pt · ${piece.rotation}°`;
    },
  });

  const paletteList = document.getElementById('palette-list');
  renderPalette(paletteList, pieces, (id, e) => canvas.beginNewPiece(id, e));
  updatePaletteUsage(paletteList, design);
  design.subscribe(() => updatePaletteUsage(paletteList, design));

  rotateBtn.addEventListener('click', () => canvas.rotateSelected());
  deleteBtn.addEventListener('click', () => canvas.deleteSelected());
  snapBtn.addEventListener('click', () => canvas.setSnapLines(!canvas.snapLines));
  document.getElementById('btn-zoom-in').addEventListener('click', () => canvas.zoom(1.25));
  document.getElementById('btn-zoom-out').addEventListener('click', () => canvas.zoom(0.8));
  document.getElementById('btn-fit').addEventListener('click', () => canvas.fit());

  const placeholders = pieces.filter((p) => p.placeholder).length;
  status.textContent = placeholders > 0
    ? `${placeholders} of ${pieces.length} piece types use placeholder measurements.`
    : `${pieces.length} piece types loaded.`;
}

start();
