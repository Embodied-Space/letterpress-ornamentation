import { loadPieces } from './pieces.js';
import { renderPalette, updatePaletteUsage } from './palette.js';
import { Design, boundingBox } from './design.js';
import { Canvas } from './canvas.js';
import { computeGaps } from './gaps.js';
import { renderInfo } from './info.js';
import {
  serializeDesign, loadCurrent, saveCurrent, DEFAULT_NAME,
} from './storage.js';
import { setupDesignsUI } from './designs-ui.js';
import { setupPaperUI } from './paper-ui.js';

const NOTICE_MS = 2500;
const LONG_NOTICE_MS = 7000;

function showError(message) {
  const el = document.getElementById('error');
  el.textContent = message;
  el.hidden = false;
}

let noticeTimer;
function showNotice(message, ms = NOTICE_MS) {
  const el = document.getElementById('notice');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { el.hidden = true; }, ms);
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
  const autofillBtn = document.getElementById('btn-autofill');
  const lockupBtn = document.getElementById('btn-view-lockup');
  const printBtn = document.getElementById('btn-view-print');
  const nameEl = document.getElementById('design-name');

  const canvas = new Canvas(document.getElementById('canvas'), design, {
    onNotice: showNotice,
    onSnapChange(on) {
      snapBtn.setAttribute('aria-pressed', String(on));
    },
    onAutofillChange(on) {
      autofillBtn.setAttribute('aria-pressed', String(on));
    },
    onViewChange(print) {
      lockupBtn.setAttribute('aria-pressed', String(!print));
      printBtn.setAttribute('aria-pressed', String(print));
    },
    onSelectionChange(selected) {
      rotateBtn.disabled = deleteBtn.disabled = selected.length === 0;
      if (selected.length <= 1) {
        const [piece] = selected;
        selectionInfo.textContent = piece === undefined ? ''
          : `${design.types.get(piece.type).name} at ${piece.x}, ${piece.y} pt · ${piece.rotation}°`;
      } else {
        const box = boundingBox(selected.map((p) => design.rectOf(p)));
        selectionInfo.textContent = `${selected.length} pieces · ${box.width} × ${box.height} pt`;
      }
    },
  });

  const paletteList = document.getElementById('palette-list');
  renderPalette(paletteList, pieces, (id, e) => canvas.beginNewPiece(id, e));
  updatePaletteUsage(paletteList, design);
  design.subscribe(() => updatePaletteUsage(paletteList, design));

  const infoEls = {
    formEl: document.getElementById('form-size'),
    listEl: document.getElementById('gap-list'),
    countEl: document.getElementById('gap-count'),
  };
  const updateGaps = () => {
    const result = computeGaps(design.pieces.map((p) => design.rectOf(p)));
    canvas.setGaps(result.gaps);
    renderInfo(infoEls, result, (i) => canvas.highlightGap(i));
  };
  updateGaps();
  design.subscribe(updateGaps);

  setupPaperUI({
    design,
    canvas,
    widthEl: document.getElementById('paper-width'),
    heightEl: document.getElementById('paper-height'),
    unitEl: document.getElementById('paper-unit'),
    noteEl: document.getElementById('paper-note'),
    centreBtn: document.getElementById('paper-centre'),
    removeBtn: document.getElementById('paper-remove'),
  });

  // --- Save / load (spec 06) ---------------------------------------------

  let currentName = DEFAULT_NAME;
  const getCurrent = () => serializeDesign(currentName, design);

  let storageWarned = false;
  const autosave = () => {
    try {
      saveCurrent(getCurrent());
    } catch (err) {
      if (!storageWarned) {
        storageWarned = true;
        showNotice(`Autosave isn't working in this browser (${err.message}). Use Export to keep a copy.`, LONG_NOTICE_MS);
      }
    }
  };
  design.subscribe(autosave);

  const setName = (name) => {
    currentName = name;
    nameEl.textContent = name;
    autosave();
  };

  // A loaded design may break the overlap and inventory rules; it's shown with the problems in red.
  const loadDesign = (data) => {
    currentName = data.name;
    nameEl.textContent = data.name;
    const skipped = design.load(data.pieces, data.paper ?? null);
    canvas.fit();

    const { overLimit, overlapping } = design.problems();
    const problems = [...overLimit].map((id) => {
      const type = design.types.get(id);
      return `${design.usedCount(id)} × ${type.name}, but you own ${type.count}`;
    });
    if (overlapping.size > 0) problems.push(`${overlapping.size} pieces overlap`);
    const messages = [];
    if (problems.length > 0) messages.push(`This design breaks the rules (marked in red): ${problems.join('; ')}.`);
    if (skipped.length > 0) {
      const ids = [...new Set(skipped.map((p) => p.type))].join(', ');
      messages.push(`Left out ${skipped.length} piece(s) of unknown type: ${ids}.`);
    }
    if (messages.length > 0) showNotice(messages.join(' '), LONG_NOTICE_MS);
  };

  setupDesignsUI({
    getCurrent,
    setName,
    loadDesign,
    notify: (message) => showNotice(message, LONG_NOTICE_MS),
  });

  try {
    const saved = loadCurrent();
    if (saved) loadDesign(saved);
  } catch (err) {
    showNotice(`Couldn't restore the last design: ${err.message}`, LONG_NOTICE_MS);
  }

  // --- Toolbar -----------------------------------------------------------

  const undoBtn = document.getElementById('btn-undo');
  const redoBtn = document.getElementById('btn-redo');
  const updateHistory = () => {
    undoBtn.disabled = !design.canUndo;
    redoBtn.disabled = !design.canRedo;
  };
  updateHistory();
  design.subscribe(updateHistory);
  undoBtn.addEventListener('click', () => canvas.undo());
  redoBtn.addEventListener('click', () => canvas.redo());
  rotateBtn.addEventListener('click', () => canvas.rotateSelected());
  deleteBtn.addEventListener('click', () => canvas.deleteSelected());
  snapBtn.addEventListener('click', () => canvas.setSnapLines(!canvas.snapLines));
  autofillBtn.addEventListener('click', () => canvas.setAutofill(!canvas.autofill));
  lockupBtn.addEventListener('click', () => canvas.setPrintView(false));
  printBtn.addEventListener('click', () => canvas.setPrintView(true));
  document.getElementById('btn-zoom-in').addEventListener('click', () => canvas.zoom(1.25));
  document.getElementById('btn-zoom-out').addEventListener('click', () => canvas.zoom(0.8));
  document.getElementById('btn-fit').addEventListener('click', () => canvas.fit());

  const placeholders = pieces.filter((p) => p.placeholder).length;
  status.textContent = placeholders > 0
    ? `${placeholders} of ${pieces.length} piece types use placeholder measurements.`
    : `${pieces.length} piece types loaded.`;
}

start();
