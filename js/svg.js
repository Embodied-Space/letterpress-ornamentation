// Small helpers for building SVG. 1 SVG unit = 1 pt.

import { textLabel } from './text.js';

export const SVG_NS = 'http://www.w3.org/2000/svg';

export function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

// Transform that turns a piece type (drawn at the origin, unrotated) and puts the top-left of its
// rotated footprint at (x, y). Rotation is clockwise, as SVG's y axis points down.
export function placementTransform(type, x, y, rotation) {
  switch (rotation) {
    case 90: return `translate(${x + type.height} ${y}) rotate(90)`;
    case 180: return `translate(${x + type.width} ${y + type.height}) rotate(180)`;
    case 270: return `translate(${x} ${y + type.width}) rotate(270)`;
    default: return `translate(${x} ${y})`;
  }
}

// A piece type drawn in its default orientation at the origin: the body plus its double-line art.
export function pieceGraphic(piece) {
  const g = svgEl('g', { class: 'piece' });
  g.append(
    svgEl('rect', { class: 'piece-body', x: 0, y: 0, width: piece.width, height: piece.height }),
    svgEl('path', { class: 'piece-lines', d: piece.lines }),
  );
  return g;
}

// A text placeholder (spec 12) drawn at the origin, unrotated: a tinted FPO box with its text and its size.
// The text is mirrored so it reads backwards on the metal and correctly in print view (spec 13). The size
// label's font size is set by the canvas, which keeps it a constant size on screen.
export function textGraphic(t) {
  const g = svgEl('g', { class: 'piece text-block' });
  const clip = svgEl('svg', { class: 'text-clip', width: t.width, height: t.height, overflow: 'hidden' });
  const mirrored = svgEl('g', { transform: `translate(${t.width} 0) scale(-1 1)` });
  const content = svgEl('text', {
    class: 'text-content',
    x: t.width / 2,
    y: t.height / 2,
    'font-size': Math.min(t.size, t.height),
    // An estimated width is drawn as set to the estimate, so the box and the text agree.
    ...(t.sizing === 'text' && { textLength: t.width, lengthAdjust: 'spacingAndGlyphs' }),
  });
  content.textContent = t.content || 'FPO';
  mirrored.append(content);
  const size = svgEl('text', { class: 'text-size' });
  size.textContent = textLabel(t);
  clip.append(mirrored, size);
  g.append(svgEl('rect', { class: 'piece-body text-body', x: 0, y: 0, width: t.width, height: t.height }), clip);
  return g;
}

// The graphic for a piece type, or for a text block's geometry (textType()).
export const graphicFor = (type) => (type.text ? textGraphic(type.text) : pieceGraphic(type));
