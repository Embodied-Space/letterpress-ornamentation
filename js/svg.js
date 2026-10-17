// Small helpers for building SVG. 1 SVG unit = 1 pt.

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
