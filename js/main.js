import { loadPieces } from './pieces.js';

function showError(message) {
  const el = document.getElementById('error');
  el.textContent = message;
  el.hidden = false;
}

async function start() {
  let pieces;
  try {
    pieces = await loadPieces();
  } catch (err) {
    showError(err.message);
    console.error(err);
    return;
  }
  // The palette, canvas and info panel (specs 02–05) are built from `pieces` from here on.
  document.getElementById('status').textContent =
    `Loaded ${pieces.length} piece types.`;
}

start();
