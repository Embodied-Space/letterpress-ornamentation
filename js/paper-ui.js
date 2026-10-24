// The Paper section of the info panel (spec 14): the sheet's size in a chosen unit, and buttons to
// re-centre or remove it. Sizes are stored in whole points; the unit is kept only for showing them.

import { boundingBox, PAPER_UNITS } from './design.js';

const DECIMALS = { pt: 0, pc: 2, in: 3, cm: 2 };

const toPoints = (value, unit) => Math.max(1, Math.round(value * PAPER_UNITS[unit]));
const fromPoints = (pt, unit) => String(Number((pt / PAPER_UNITS[unit]).toFixed(DECIMALS[unit])));

export function setupPaperUI({ design, canvas, widthEl, heightEl, unitEl, noteEl, centreBtn, removeBtn }) {
  let unit = unitEl.value;
  let shown; // the paper the fields were last filled from

  // Top-left for a sheet this size, centred on the form, or on the visible canvas if it's empty.
  const centred = (width, height) => {
    const form = boundingBox(design.pieces.map((p) => design.rectOf(p)));
    const c = form ? { x: form.x + form.width / 2, y: form.y + form.height / 2 } : canvas.visibleCenter();
    return { x: Math.round(c.x - width / 2), y: Math.round(c.y - height / 2) };
  };

  const show = (paper) => {
    shown = paper;
    if (paper) {
      unit = paper.unit;
      unitEl.value = unit;
      widthEl.value = fromPoints(paper.width, unit);
      heightEl.value = fromPoints(paper.height, unit);
      noteEl.textContent = `${paper.width} × ${paper.height} pt. Drag its edge on the canvas to move it.`;
    } else {
      widthEl.value = heightEl.value = '';
      noteEl.textContent = 'No paper. Enter a size to add one.';
    }
    centreBtn.disabled = removeBtn.disabled = !paper;
  };

  const applySize = () => {
    const old = design.paper;
    if (widthEl.value.trim() === '' && heightEl.value.trim() === '') {
      if (old) design.setPaper(null);
      return;
    }
    const w = Number(widthEl.value);
    const h = Number(heightEl.value);
    if (!(w > 0 && h > 0 && Number.isFinite(w) && Number.isFinite(h))) {
      if (old) show(old); // a half-entered or invalid size: keep the paper as it was
      return;
    }
    const width = toPoints(w, unit);
    const height = toPoints(h, unit);
    // A new sheet is centred on the form; a resized one keeps its centre where it was.
    const position = old
      ? { x: old.x + Math.round((old.width - width) / 2), y: old.y + Math.round((old.height - height) / 2) }
      : centred(width, height);
    design.setPaper({ width, height, ...position, unit });
    show(design.paper); // shows the size rounded to whole points, even if nothing changed
  };

  widthEl.addEventListener('change', applySize);
  heightEl.addEventListener('change', applySize);
  unitEl.addEventListener('change', () => {
    unit = unitEl.value;
    if (design.paper) design.setPaper({ ...design.paper, unit });
  });
  centreBtn.addEventListener('click', () => {
    const { paper } = design;
    if (paper) design.setPaper({ ...paper, ...centred(paper.width, paper.height) });
  });
  removeBtn.addEventListener('click', () => design.setPaper(null));

  // Only refill the fields when the paper itself changes, so typing isn't interrupted by piece edits.
  design.subscribe(() => {
    if (design.paper !== shown) show(design.paper);
  });
  show(design.paper);
}
