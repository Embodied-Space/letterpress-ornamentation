// The SVG canvas: zoom/pan, drawing placed pieces, and placing/moving/rotating/deleting them (spec 03).
// 1 SVG unit = 1 pt. All rules about where a piece may go live in Design; this only asks it.
//
// Print view (spec 13) mirrors the .world groups left to right. The view (viewBox, zoom, pan) is in
// screen-side "view" coordinates; everything else works in lockup coordinates, which toLockup()
// converts pointer positions into, so editing behaves the same in both views.

import { svgEl, pieceGraphic, placementTransform } from './svg.js';
import {
  footprint, boundingBox, rectsOverlap, turnArrangement,
} from './design.js';
import { findSnap, outsideJoins } from './connectors.js';
import { straightTypes, fillRun, layRun } from './autofill.js';

const DRAG_THRESHOLD_PX = 3;
const SNAP_RADIUS_PX = 10; // how close (on screen) line ends must be to snap together
const GAP_LABEL_PX = 11;
const MIN_SCALE = 0.25; // screen px per pt
const MAX_SCALE = 40;
const FINE_GRID_MIN_SCALE = 6; // show the 1 pt grid from this zoom up
const DEFAULT_AREA = { x: 0, y: 0, width: 576, height: 432 }; // 8" × 6", shown when nothing is placed
const FIT_MARGIN = 24;

const clampScale = (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

// The rectangle between two corners.
const rectBetween = (a, b) => ({
  x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y),
});

export class Canvas {
  constructor(svg, design, {
    onSelectionChange = () => {}, onNotice = () => {}, onSnapChange = () => {}, onAutofillChange = () => {},
    onViewChange = () => {},
  } = {}) {
    this.svg = svg;
    this.design = design;
    this.onSelectionChange = onSelectionChange;
    this.onNotice = onNotice;
    this.onSnapChange = onSnapChange;
    this.onAutofillChange = onAutofillChange;
    this.onViewChange = onViewChange;
    this.snapLines = true;
    this.autofill = true; // straight auto-fill mode (spec 11)
    this.printView = false;
    this.swallowContextMenu = false;
    this.worlds = svg.querySelectorAll('.world');
    this.layerSheet = svg.querySelector('#layer-sheet');
    this.layerPaper = svg.querySelector('#layer-paper');
    this.layerGaps = svg.querySelector('#layer-gaps');
    this.gaps = [];
    this.layerPieces = svg.querySelector('#layer-pieces');
    this.layerGhost = svg.querySelector('#layer-ghost');
    this.gridLines = svg.querySelectorAll('.grid-line');
    this.fineGrid = svg.querySelector('#grid-fine');

    this.view = { x: 0, y: 0, scale: 1 };
    this.fitted = false;
    this.selected = new Set(); // uids (spec 10)
    this.straights = straightTypes(design.types);
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
    this.onAutofillChange(this.autofill);
    this.onViewChange(this.printView);
  }

  setSnapLines(on) {
    this.snapLines = on;
    this.onSnapChange(on);
    if (this.drag?.client) this.updateGhost();
  }

  setAutofill(on) {
    this.autofill = on;
    this.onAutofillChange(on);
    if (this.drag?.client) this.updateGhost();
  }

  // Switches between lockup view and print view (spec 13). The visible area is mirrored too, so the
  // form stays where it was on screen. Not while dragging: the drag was started in the other view.
  setPrintView(on) {
    if (on === this.printView || this.drag) return;
    const { width } = this.svg.getBoundingClientRect();
    this.view = { ...this.view, x: -(this.view.x + width / this.view.scale) };
    this.printView = on;
    for (const g of this.worlds) g.setAttribute('transform', on ? 'scale(-1 1)' : '');
    this.svg.classList.toggle('print', on);
    this.applyView();
    this.onViewChange(on);
  }

  // --- View --------------------------------------------------------------

  toPoint(clientX, clientY) {
    const rect = this.svg.getBoundingClientRect();
    return {
      x: this.view.x + (clientX - rect.left) / this.view.scale,
      y: this.view.y + (clientY - rect.top) / this.view.scale,
    };
  }

  // The lockup coordinates under a screen position.
  toLockup(clientX, clientY) {
    const pt = this.toPoint(clientX, clientY);
    return this.printView ? { x: -pt.x, y: pt.y } : pt;
  }

  // The lockup coordinates at the middle of the visible canvas.
  visibleCenter() {
    const rect = this.svg.getBoundingClientRect();
    return this.toLockup(rect.left + rect.width / 2, rect.top + rect.height / 2);
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
    this.renderGaps(); // labels keep a constant screen size
  }

  // Zoom to show every placed piece and the paper (or a default area when there are none).
  fit() {
    const { width, height } = this.svg.getBoundingClientRect();
    if (!width || !height) return;
    const rects = this.design.pieces.map((p) => this.design.rectOf(p));
    if (this.design.paper) rects.push(this.design.paper);
    let area = boundingBox(rects) ?? DEFAULT_AREA;
    if (this.printView) area = { ...area, x: -(area.x + area.width) };
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

  setGaps(gaps) {
    this.gaps = gaps;
    this.renderGaps();
  }

  // Tinted gap rectangles, labeled `w × h` where the label fits inside.
  renderGaps() {
    const fontSize = GAP_LABEL_PX / this.view.scale;
    this.layerGaps.replaceChildren(...this.gaps.map((gap, i) => {
      const g = svgEl('g', { class: 'gap', 'data-index': i });
      const label = `${gap.width} × ${gap.height}`;
      const title = svgEl('title');
      title.textContent = `${label} pt`;
      g.append(svgEl('rect', { class: 'gap-area', x: gap.x, y: gap.y, width: gap.width, height: gap.height }), title);
      // Rough text width: ~0.6 em per character.
      if (label.length * 0.6 * fontSize <= gap.width && fontSize * 1.2 <= gap.height) {
        const text = svgEl('text', {
          class: 'gap-label',
          x: gap.x + gap.width / 2,
          y: gap.y + gap.height / 2,
          'font-size': fontSize,
        });
        text.textContent = label;
        g.append(text);
      }
      return g;
    }));
  }

  highlightGap(index) {
    for (const g of this.layerGaps.children) {
      g.classList.toggle('highlight', Number(g.dataset.index) === index);
    }
  }

  // The paper (spec 14): a sheet filled in print view, below the grid, and its edge above the grid,
  // with a wider invisible edge to grab it by.
  renderPaper(paper) {
    this.svg.classList.toggle('has-paper', paper !== null);
    if (!paper) {
      this.layerSheet.replaceChildren();
      this.layerPaper.replaceChildren();
      return;
    }
    const rect = { x: paper.x, y: paper.y, width: paper.width, height: paper.height };
    this.layerSheet.replaceChildren(svgEl('rect', { class: 'paper-sheet', ...rect }));
    const hit = svgEl('rect', { class: 'paper-hit', ...rect });
    const title = svgEl('title');
    title.textContent = 'Paper: drag its edge to move it';
    hit.append(title);
    this.layerPaper.replaceChildren(svgEl('rect', { class: 'paper-edge', ...rect }), hit);
  }

  render() {
    this.renderPaper(this.design.paper);
    const lifted = new Set(this.drag?.kind === 'move' && this.drag.moved ? this.drag.uids : []);
    const { overlapping } = this.design.problems(); // only possible after loading a saved design
    this.layerPieces.replaceChildren(...this.design.pieces.map((p) => {
      const type = this.design.types.get(p.type);
      const g = pieceGraphic(type);
      g.classList.add('placed');
      g.classList.toggle('selected', this.selected.has(p.uid));
      g.classList.toggle('lifted', lifted.has(p.uid));
      g.classList.toggle('overlapping', overlapping.has(p.uid));
      g.dataset.uid = p.uid;
      g.setAttribute('transform', placementTransform(type, p.x, p.y, p.rotation));
      return g;
    }));
    // Re-report the selection so its details stay current after a move, rotate or delete.
    this.select([...this.selected].filter((uid) => this.design.get(uid)));
  }

  select(uids) {
    this.selected = new Set(uids);
    for (const g of this.layerPieces.children) {
      g.classList.toggle('selected', this.selected.has(Number(g.dataset.uid)));
    }
    this.onSelectionChange(this.design.pieces.filter((p) => this.selected.has(p.uid)));
  }

  // Shift-click: add a piece to the selection or take it out.
  toggleSelected(uid) {
    const next = new Set(this.selected);
    if (!next.delete(uid)) next.add(uid);
    this.select(next);
  }

  // The drop position for the current drag, snapped to the 1 pt grid: the new piece's top-left, or
  // the top-left of the moved pieces' bounding box.
  dropPosition(client) {
    const d = this.drag;
    const pt = this.toLockup(client.clientX, client.clientY);
    if (d.kind === 'new') {
      const fp = footprint(this.design.types.get(d.typeId), d.rotation);
      return { x: Math.round(pt.x - fp.width / 2), y: Math.round(pt.y - fp.height / 2) };
    }
    return { x: Math.round(pt.x - d.grabX), y: Math.round(pt.y - d.grabY) };
  }

  // Where a drag would drop: { moves, adds } for Design.applyChanges(), plus the snap joint if any.
  newTarget(d) {
    const candidate = { type: d.typeId, ...this.dropPosition(d.client), rotation: d.rotation };
    const at = (dx, dy) => ({ ...candidate, x: candidate.x + dx, y: candidate.y + dy });
    const snap = this.snapLines
      ? findSnap(this.design, [candidate], new Set(), SNAP_RADIUS_PX / this.view.scale,
        (dx, dy) => this.design.canOccupy(at(dx, dy)))
      : null;
    return { moves: [], adds: [at(snap?.dx ?? 0, snap?.dy ?? 0)], snapPoint: snap?.point };
  }

  moveTarget(d) {
    const fill = this.autofillTarget(d);
    if (fill) return fill;
    const origin = this.dropPosition(d.client);
    const at = (dx, dy) => d.members.map((m) => ({
      uid: m.uid, type: m.type, x: origin.x + m.dx + dx, y: origin.y + m.dy + dy, rotation: m.rotation,
    }));
    const snap = this.snapLines
      ? findSnap(this.design, at(0, 0), d.uids, SNAP_RADIUS_PX / this.view.scale,
        (dx, dy) => this.design.canApply({ moves: at(dx, dy) }))
      : null;
    return { moves: at(snap?.dx ?? 0, snap?.dy ?? 0), adds: [], snapPoint: snap?.point };
  }

  // Straight auto-fill (spec 11): pulling the dragged pieces away from a join on their trailing edge
  // lays straights behind them, with the drag locked to that axis. Null for an ordinary move.
  autofillTarget(d) {
    if (!this.autofill || !d.autofill || d.joins.length === 0) return null;
    const pt = this.toLockup(d.client.clientX, d.client.clientY);
    const mx = pt.x - d.startPt.x;
    const my = pt.y - d.startPt.y;
    if (mx === 0 && my === 0) return null;
    const dir = Math.abs(mx) >= Math.abs(my) ? { x: Math.sign(mx), y: 0 } : { x: 0, y: Math.sign(my) };
    const trailing = d.joins.filter((j) => j.nx === -dir.x && j.ny === -dir.y);
    if (trailing.length === 0) return null;

    const fill = fillRun(this.design, this.straights, Math.round(mx * dir.x + my * dir.y), trailing.length);
    const runs = trailing.map((j) => layRun(this.design, fill.ids, j, dir));
    const shiftX = runs[0].end.x - trailing[0].x;
    const shiftY = runs[0].end.y - trailing[0].y;
    return {
      moves: d.members.map((m) => ({
        uid: m.uid, type: m.type, x: d.origin.x + m.dx + shiftX, y: d.origin.y + m.dy + shiftY, rotation: m.rotation,
      })),
      adds: runs.flatMap((r) => r.placements),
      run: { length: fill.length, limited: fill.limited },
    };
  }

  updateGhost() {
    const d = this.drag;
    if (!d.client || !this.isOverCanvas(d.client)) {
      d.target = null;
      this.layerGhost.replaceChildren();
      return;
    }
    d.target = d.kind === 'new' ? this.newTarget(d) : this.moveTarget(d);
    const { moves, adds, snapPoint } = d.target;
    const ok = this.design.canApply(d.target);
    const nodes = [...moves, ...adds].map((p) => {
      const type = this.design.types.get(p.type);
      const g = pieceGraphic(type);
      g.classList.add('ghost');
      g.classList.toggle('invalid', !ok);
      g.setAttribute('transform', placementTransform(type, p.x, p.y, p.rotation));
      return g;
    });
    if (snapPoint) {
      nodes.push(svgEl('circle', {
        class: 'snap-marker', cx: snapPoint.x, cy: snapPoint.y, r: 6 / this.view.scale,
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
    const paperEl = e.button === 0 ? e.target.closest('.paper-hit') : null;
    const pt = this.toLockup(e.clientX, e.clientY);
    if (e.button === 0 && e.shiftKey) {
      if (pieceEl) this.toggleSelected(Number(pieceEl.dataset.uid));
      else this.beginDrag({ kind: 'box', from: pt, moved: false }, e);
    } else if (pieceEl) {
      // Pressing a selected piece drags the whole selection (spec 10); otherwise just this piece.
      const uid = Number(pieceEl.dataset.uid);
      if (!this.selected.has(uid)) this.select([uid]);
      const uids = new Set(this.selected);
      const { box, members } = this.design.arrangement(uids);
      this.beginDrag({
        kind: 'move', uids, clickUid: uid, members, width: box.width, height: box.height,
        origin: { x: box.x, y: box.y }, grabX: pt.x - box.x, grabY: pt.y - box.y, startPt: pt,
        joins: outsideJoins(this.design, uids), autofill: true, moved: false,
      }, e);
    } else if (paperEl && this.design.paper) {
      const { paper } = this.design;
      this.beginDrag({ kind: 'paper', grabX: pt.x - paper.x, grabY: pt.y - paper.y, moved: false }, e);
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
    if (d.kind === 'paper') {
      const pt = this.toLockup(e.clientX, e.clientY);
      d.target = { x: Math.round(pt.x - d.grabX), y: Math.round(pt.y - d.grabY) };
      this.renderPaper({ ...this.design.paper, ...d.target });
      return;
    }
    if (d.kind === 'box') {
      d.to = this.toLockup(e.clientX, e.clientY);
      this.layerGhost.replaceChildren(svgEl('rect', { class: 'selection-box', ...rectBetween(d.from, d.to) }));
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
      if (!d.moved && commit) this.select([]);
    } else if (d.kind === 'paper') {
      if (dropped) this.design.setPaper({ ...this.design.paper, ...dropped });
    } else if (d.kind === 'box') {
      if (commit && d.to) {
        const area = rectBetween(d.from, d.to);
        const hit = this.design.pieces.filter((p) => rectsOverlap(area, this.design.rectOf(p)));
        this.select([...this.selected, ...hit.map((p) => p.uid)]);
      }
    } else if (d.kind === 'new' && dropped) {
      const [c] = dropped.adds;
      const piece = this.design.place(c.type, c.x, c.y, c.rotation);
      if (piece) this.select([piece.uid]);
      else this.onNotice("Can't place it there: it would overlap another piece.");
    } else if (d.kind === 'move' && !d.moved) {
      if (commit) this.select([d.clickUid]); // a click on a selected piece selects just that one
    } else if (d.kind === 'move' && dropped) {
      if (!this.design.applyChanges(dropped)) {
        this.onNotice(dropped.run
          ? "Can't stretch it there: the run would overlap another piece."
          : "Can't move it there: it would overlap another piece.");
      } else if (dropped.run?.limited) {
        this.onNotice(`Not enough straights left: the run stops at ${dropped.run.length} pt.`);
      }
    }
    this.render(); // clears the lifted look if the pieces went back
  }

  // Turns the piece or pieces being dragged 90° clockwise on screen, which in print view is
  // anticlockwise on the metal. For placed pieces, the point you grabbed stays under the pointer,
  // and auto-fill (spec 11) is off for the rest of the drag.
  rotateDrag() {
    const d = this.drag;
    if (!d || d.kind === 'pan' || d.kind === 'paper' || d.kind === 'box') return;
    this.swallowContextMenu = true;
    const clockwise = !this.printView;
    if (d.kind === 'move') {
      [d.grabX, d.grabY] = clockwise ? [d.height - d.grabY, d.grabX] : [d.grabY, d.width - d.grabX];
      d.members = turnArrangement(d.members, d.width, d.height, clockwise);
      [d.width, d.height] = [d.height, d.width];
      d.autofill = false;
      if (!d.moved) {
        d.moved = true;
        d.client = d.start;
        this.render();
      }
    } else {
      d.rotation = (d.rotation + (clockwise ? 90 : 270)) % 360;
    }
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
    if (this.selected.size === 0) return;
    // Clockwise on screen: anticlockwise on the metal when the view is mirrored.
    if (!this.design.rotateGroup(this.selected, !this.printView)) {
      this.onNotice("Can't rotate it: it would overlap another piece.");
    }
  }

  deleteSelected() {
    if (this.drag || this.selected.size === 0) return;
    this.design.removeMany(this.selected);
  }

  onKeyDown(e) {
    if (e.target.closest?.('input, textarea, select, [contenteditable], dialog')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'r' || e.key === 'R') {
      this.rotateSelected();
    } else if (e.key === 's' || e.key === 'S') {
      this.setSnapLines(!this.snapLines);
    } else if (e.key === 'f' || e.key === 'F') {
      this.setAutofill(!this.autofill);
    } else if (e.key === 'p' || e.key === 'P') {
      this.setPrintView(!this.printView);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.deleteSelected();
    } else if (e.key === 'Escape') {
      if (this.drag) {
        this.endDrag();
        this.render();
      } else {
        this.select([]);
      }
    }
  }
}
