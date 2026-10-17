// Gap measurement (spec 05): the empty space inside the form, split into rectangles. No DOM code here.

import { boundingBox } from './design.js';

// `rects` are the placed pieces' footprints. Returns { form, gaps }, where form is the pieces'
// bounding box (null if there are none) and gaps are sorted top to bottom, then left to right.
//
// 1. Cut the form into full-width bands at every piece's top and bottom edge.
// 2. In each band, every empty run between pieces (or a piece and the form's edge) is a gap.
// 3. With `merge`, a gap directly below one with the same x and width extends it instead.
export function computeGaps(rects, { merge = true } = {}) {
  const form = boundingBox(rects);
  if (!form) return { form: null, gaps: [] };
  const formRight = form.x + form.width;

  const edges = [...new Set(rects.flatMap((r) => [r.y, r.y + r.height]))].sort((a, b) => a - b);
  const gaps = [];
  let above = new Map(); // "x0:x1" → gap that reaches down to the current band's top

  for (let i = 0; i < edges.length - 1; i++) {
    const top = edges[i];
    const bottom = edges[i + 1];
    const inBand = rects
      .filter((r) => r.y < bottom && r.y + r.height > top)
      .sort((a, b) => a.x - b.x);

    const runs = [];
    let x = form.x;
    for (const r of inBand) {
      if (r.x > x) runs.push([x, r.x]);
      x = Math.max(x, r.x + r.width);
    }
    if (x < formRight) runs.push([x, formRight]);

    const current = new Map();
    for (const [x0, x1] of runs) {
      const key = `${x0}:${x1}`;
      let gap = merge ? above.get(key) : undefined;
      if (gap) {
        gap.height += bottom - top;
      } else {
        gap = { x: x0, y: top, width: x1 - x0, height: bottom - top };
        gaps.push(gap);
      }
      current.set(key, gap);
    }
    above = current;
  }

  gaps.sort((a, b) => a.y - b.y || a.x - b.x);
  return { form, gaps: gaps.map((g) => Object.freeze(g)) };
}

// "24 pt (2 pi)" when it's a whole number of picas, otherwise "5 pt".
export function formatLength(pt) {
  return pt % 12 === 0 ? `${pt} pt (${pt / 12} pi)` : `${pt} pt`;
}

export function formatSize({ width, height }) {
  return `${formatLength(width)} × ${formatLength(height)}`;
}
