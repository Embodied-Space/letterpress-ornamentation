// The SVG canvas: zoom/pan, drawing placed pieces, and placing/moving/rotating/deleting them (spec 03).
// 1 SVG unit = 1 pt. All rules about where a piece may go live in Design; this only asks it.

import { svgEl, pieceGraphic, placementTransform } from './svg.js';
import { footprint, boundingBox } from './design.js';
import { findSnap } from './connectors.js';

const DRAG_THRESHOLD_PX = 3;
const SNAP_RADIUS_PX = 10; // how close (on screen) line ends must be to snap together
const MIN_SCALE = 0.25; // screen px per pt
const MAX_SCALE = 40;
const FINE_GRID_MIN_SCALE = 6; // show the 1 pt grid from this zoom up
const DEFAULT_AREA = { x: 0, y: 0, width: 576, height: 432 }; // 8" × 6", shown when nothing is placed
const FIT_MARGIN = 24;

const clampScale = (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

export class Canvas {
  constructor(svg, design, { onSelectionChange = () => {}, onNotice = () => {}, onSnapChange = () => {} } = {}) {
    this.svg = svg;
    this.design = design;
    this.onSelectionChange = onSelectionChange;
    this.onNotice = onNotice;
    this.onSnapChange = onSnapChange;
    this.snapLines = true;
    this.swallowContextMenu = false;
    this.layerPieces = svg.querySelector('#layer-pieces');
    this.layerGhost = svg.querySelector('#layer-ghost');
    this.gridLines = svg.querySelectorAll('.grid-line');
    this.fineGrid = svg.querySelector('#grid-fine');

    this.view = { x: 0, y: 0, scale: 1 };
    this.fitted = false;
    this.selectedUid = null;
    this.drag = null;

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    design.subscribe(() => this.render());
    new ResizeObserver(() => (this.fitted ? this.applyView() : this.fit())).observe(svg);
    svg.addEventListener('pointerdown', (e) => this.onCanvasPointerDown(e));
    svg.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    // Right-click rotates while dragging; don't let the browser menu open for it.
    window.addEventListener('contextmenu', (e) => {
      if (this.drag || this.swallowContextMenu) {
        e.preventDefault();
        this.swallowContextMenu = false;
      }
    });

    this.render();
    this.onSnapChange(this.snapLines);
  }

  setSnapLines(on) {
    this.snapLines = on;
    this.onSnapChange(on);
    if (this.drag?.client) this.updateGhost();
  }

  // --- View --------------------------------------------------------------

  toPoint(clientX, clientY) {
    const rect = this.svg.getBoundingClientRect();
    return {
      x: this.view.x + (clientX - rect.left) / this.view.scale,
      y: this.view.y + (clientY - rect.top) / this.view.scale,
    };
  }

  isOverCanvas({ clientX, clientY }) {
    const r = this.svg.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  applyView() {
    const { width, height } = this.svg.getBoundingClientRect();
    if (!width || !height) return;
    const { x, y, scale } = this.view;
    this.svg.setAttribute('viewBox', `${x} ${y} ${width / scale} ${height / scale}`);
    for (const line of this.gridLines) line.setAttribute('stroke-width', 1 / scale);
    this.fineGrid.style.display = scale >= FINE_GRID_MIN_SCALE ? '' : 'none';
  }

  // Zoom to show every placed piece (or a default area when there are none).
  fit() {
    const { width, height } = this.svg.getBoundingClientRect();
    if (!width || !height) return;
    const area = boundingBox(this.design.pieces.map((p) => this.design.rectOf(p))) ?? DEFAULT_AREA;
    const w = area.width + 2 * FIT_MARGIN;
    const h = area.height + 2 * FIT_MARGIN;
    const scale = clampScale(Math.min(width / w, height / h));
    this.view = {
      scale,
      x: area.x - FIT_MARGIN - (width / scale - w) / 2,
      y: area.y - FIT_MARGIN - (height / scale - h) / 2,
    };
    this.fitted = true;
    this.applyView();
  }

  // Zoom by `factor`, keeping the point under (clientX, clientY) still. Defaults to the center.
  zoom(factor, clientX, clientY) {
    const rect = this.svg.getBoundingClientRect();
    const cx = clientX ?? rect.left + rect.width / 2;
    const cy = clientY ?? rect.top + rect.height / 2;
    const anchor = this.toPoint(cx, cy);
    const scale = clampScale(this.view.scale * factor);
    this.view = {
      scale,
      x: anchor.x - (cx - rect.left) / scale,
      y: anchor.y - (cy - rect.top) / scale,
    };
    this.applyView();
  }

  onWheel(e) {
    e.preventDefault();
    this.zoom(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
  }

  // --- Drawing -----------------------------------------------------------

  render() {
    const lifted = this.drag?.kind === 'move' && this.drag.moved ? this.drag.uid : null;
    this.layerPieces.replaceChildren(...this.design.pieces.map((p) => {
      const type = this.design.types.get(p.type);
      const g = pieceGraphic(type);
      g.classList.add('placed');
      g.classList.toggle('selected', p.uid === this.selectedUid);
      g.classList.toggle('lifted', p.uid === lifted);
      g.dataset.uid = p.uid;
      g.setAttribute('transform', placementTransform(type, p.x, p.y, p.rotation));
      return g;
    }));
    // Re-report the selection so its details stay current after a move, rotate or delete.
    if (this.selectedUid !== null) this.select(this.design.get(this.selectedUid) ? this.selectedUid : null);
  }

  select(uid) {
    this.selectedUid = uid;
    for (const g of this.layerPieces.children) {
      g.classList.toggle('selected', Number(g.dataset.uid) === uid);
    }
    this.onSelectionChange(uid === null ? null : this.design.get(uid));
  }

  // The drop position for the current drag, snapped to the 1 pt grid.
  dropPosition(client) {
    const d = this.drag;
    const pt = this.toPoint(client.clientX, client.clientY);
    if (d.kind === 'new') {
      const fp = footprint(this.design.types.get(d.typeId), d.rotation);
      return { x: Math.round(pt.x - fp.width / 2), y: Math.round(pt.y - fp.height / 2) };
    }
    return { x: Math.round(pt.x - d.grabX), y: Math.round(pt.y - d.grabY) };
  }

  updateGhost() {
    const d = this.drag;
    if (!d.client || !this.isOverCanvas(d.client)) {
      d.target = null;
      this.layerGhost.replaceChildren();
      return;
    }
    const ignoreUid = d.kind === 'move' ? d.uid : null;
    let candidate = { type: d.typeId, ...this.dropPosition(d.client), rotation: d.rotation };
    const snap = this.snapLines
      ? findSnap(this.design, candidate, ignoreUid, SNAP_RADIUS_PX / this.view.scale)
      : null;
    if (snap) candidate = { ...candidate, x: snap.x, y: snap.y };
    d.target = candidate;

    const ok = this.design.canOccupy(candidate, ignoreUid);
    const type = this.design.types.get(d.typeId);
    const g = pieceGraphic(type);
    g.classList.add('ghost');
    g.classList.toggle('invalid', !ok);
    g.setAttribute('transform', placementTransform(type, candidate.x, candidate.y, d.rotation));
    const nodes = [g];
    if (snap) {
      nodes.push(svgEl('circle', {
        class: 'snap-marker', cx: snap.point.x, cy: snap.point.y, r: 6 / this.view.scale,
      }));
    }
    this.layerGhost.replaceChildren(...nodes);
  }

  // --- Dragging ----------------------------------------------------------

  // Called by the palette: start dragging a new piece of this type.
  beginNewPiece(typeId, e) {
    if (this.drag || e.button !== 0) return;
    e.preventDefault();
    if (!this.design.hasSpare(typeId)) {
      this.onNotice(`All ${this.design.types.get(typeId).count} of this piece are already placed.`);
      return;
    }
    this.beginDrag({ kind: 'new', typeId, rotation: 0, moved: true }, e);
  }

  onCanvasPointerDown(e) {
    if (this.drag || (e.button !== 0 && e.button !== 1)) return;
    e.preventDefault();
    const pieceEl = e.button === 0 ? e.target.closest('.placed') : null;
    if (pieceEl) {
      const piece = this.design.get(Number(pieceEl.dataset.uid));
      this.select(piece.uid);
      const pt = this.toPoint(e.clientX, e.clientY);
      this.beginDrag({
        kind: 'move', uid: piece.uid, typeId: piece.type, rotation: piece.rotation,
        grabX: pt.x - piece.x, grabY: pt.y - piece.y, moved: false,
      }, e);
    } else {
      this.beginDrag({ kind: 'pan', view: { ...this.view }, moved: false }, e);
    }
  }

  beginDrag(drag, e) {
    this.drag = { ...drag, pointerId: e.pointerId, start: { clientX: e.clientX, clientY: e.clientY } };
    this.svg.classList.toggle('dragging', drag.kind !== 'pan');
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  onPointerMove(e) {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    // Pressing another mouse button while one is held arrives as a pointermove, not a pointerdown.
    if (e.button === 2 && (e.buttons & 2)) {
      this.rotateDrag();
      return;
    }
    // The left button was let go while another is still held: treat it as the drop.
    if (d.kind !== 'pan' && e.button === 0 && !(e.buttons & 1)) {
      this.finishDrag(true);
      return;
    }
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.start.clientX, e.clientY - d.start.clientY) < DRAG_THRESHOLD_PX) return;
      d.moved = true;
      if (d.kind === 'pan') this.svg.classList.add('panning');
      if (d.kind === 'move') this.render();
    }
    if (d.kind === 'pan') {
      this.view = {
        ...d.view,
        x: d.view.x - (e.clientX - d.start.clientX) / d.view.scale,
        y: d.view.y - (e.clientY - d.start.clientY) / d.view.scale,
      };
      this.applyView();
      return;
    }
    d.client = { clientX: e.clientX, clientY: e.clientY };
    this.updateGhost();
  }

  onPointerUp(e) {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    this.finishDrag(e.type === 'pointerup');
  }

  // Ends the current drag; `commit` drops the piece where the ghost is (false cancels).
  finishDrag(commit) {
    const d = this.drag;
    this.endDrag();
    const dropped = commit ? d.target : null;

    if (d.kind === 'pan') {
      if (!d.moved && commit) this.select(null);
    } else if (d.kind === 'new' && dropped) {
      const piece = this.design.place(d.typeId, dropped.x, dropped.y, dropped.rotation);
      if (piece) this.select(piece.uid);
      else this.onNotice("Can't place it there: it would overlap another piece.");
    } else if (d.kind === 'move' && d.moved && dropped) {
      if (!this.design.move(d.uid, dropped.x, dropped.y, dropped.rotation)) {
        this.onNotice("Can't move it there: it would overlap another piece.");
      }
    }
    this.render(); // clears the lifted look if the piece went back
  }

  // Turns the piece being dragged 90° clockwise. For a placed piece, the point you grabbed
  // stays under the pointer.
  rotateDrag() {
    const d = this.drag;
    if (!d || d.kind === 'pan') return;
    this.swallowContextMenu = true;
    if (d.kind === 'move') {
      const fp = footprint(this.design.types.get(d.typeId), d.rotation);
      [d.grabX, d.grabY] = [fp.height - d.grabY, d.grabX];
      if (!d.moved) {
        d.moved = true;
        d.client = d.start;
        this.render();
      }
    }
    d.rotation = (d.rotation + 90) % 360;
    if (d.client) this.updateGhost();
  }

  endDrag() {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    this.drag = null;
    this.layerGhost.replaceChildren();
    this.svg.classList.remove('dragging', 'panning');
  }

  // --- Commands ----------------------------------------------------------

  rotateSelected() {
    if (this.drag) {
      this.rotateDrag();
      return;
    }
    if (this.selectedUid === null) return;
    if (!this.design.rotate(this.selectedUid)) this.onNotice("Can't rotate it: it would overlap another piece.");
  }

  deleteSelected() {
    if (this.drag || this.selectedUid === null) return;
    this.design.remove(this.selectedUid);
  }

  onKeyDown(e) {
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'r' || e.key === 'R') {
      this.rotateSelected();
    } else if (e.key === 's' || e.key === 'S') {
      this.setSnapLines(!this.snapLines);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.deleteSelected();
    } else if (e.key === 'Escape') {
      if (this.drag) {
        this.endDrag();
        this.render();
      } else {
        this.select(null);
      }
    }
  }
}
