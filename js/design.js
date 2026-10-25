// The design state: which pieces are placed where (spec 03). No DOM code here.
// Every change goes through canOccupy(), so an invalid layout is never stored.
// Text placeholders (spec 12) are pieces too, of type TEXT_TYPE, with their size in `text`.

import { TEXT_TYPE, textType, isValidText, textData } from './text.js';

export const ROTATIONS = [0, 90, 180, 270];

const HISTORY_LIMIT = 200; // undo steps kept (spec 15)

const stateKey = ({ pieces, paper }) => JSON.stringify([pieces, paper]);

// Units the paper size can be entered and shown in, as points per unit (spec 14).
export const PAPER_UNITS = Object.freeze({ pt: 1, pc: 12, in: 72, cm: 72 / 2.54 });

// The footprint (width × height in pt) of a piece type at a rotation.
export function footprint(type, rotation) {
  return rotation % 180 === 0
    ? { width: type.width, height: type.height }
    : { width: type.height, height: type.width };
}

// Touching edges is fine; only a shared area counts as an overlap.
export function rectsOverlap(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width
    && a.y < b.y + b.height && b.y < a.y + a.height;
}

// Turns an arrangement of pieces 90° (clockwise on the metal, unless `clockwise` is false) within its
// bounding box (w × h). Members are { dx, dy, width, height, rotation, ... } relative to the box's
// top-left; the result is relative to the turned box (h × w). Same mapping as placementTransform().
export function turnArrangement(members, w, h, clockwise = true) {
  return members.map((m) => ({
    ...m,
    dx: clockwise ? h - m.dy - m.height : m.dy,
    dy: clockwise ? m.dx : w - m.dx - m.width,
    width: m.height,
    height: m.width,
    rotation: (m.rotation + (clockwise ? 90 : 270)) % 360,
  }));
}

export function boundingBox(rects) {
  if (rects.length === 0) return null;
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const right = Math.max(...rects.map((r) => r.x + r.width));
  const bottom = Math.max(...rects.map((r) => r.y + r.height));
  return { x, y, width: right - x, height: bottom - y };
}

export class Design {
  constructor(pieceTypes) {
    this.types = new Map(pieceTypes.map((t) => [t.id, t]));
    this.pieces = [];
    // The sheet ({ width, height, x, y, unit }, whole pt, top-left in lockup coordinates), or null.
    this.paper = null;
    this.nextUid = 1;
    this.listeners = new Set();
    // Earlier and undone states ({ pieces, paper }) for undo and redo (spec 15), oldest first.
    this.past = [];
    this.future = [];
  }

  get canUndo() { return this.past.length > 0; }

  get canRedo() { return this.future.length > 0; }

  undo() {
    if (!this.canUndo) return false;
    this.future.push({ pieces: this.pieces, paper: this.paper });
    ({ pieces: this.pieces, paper: this.paper } = this.past.pop());
    this.changed();
    return true;
  }

  redo() {
    if (!this.canRedo) return false;
    this.past.push({ pieces: this.pieces, paper: this.paper });
    ({ pieces: this.pieces, paper: this.paper } = this.future.pop());
    this.changed();
    return true;
  }

  // Every edit goes through here, so it can be undone. An edit that changes nothing isn't a step.
  commit(pieces, paper = this.paper) {
    const before = { pieces: this.pieces, paper: this.paper };
    this.pieces = pieces;
    this.paper = paper;
    if (stateKey(before) !== stateKey(this)) {
      this.past = [...this.past.slice(1 - HISTORY_LIMIT), before];
      this.future = [];
    }
    this.changed();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  get(uid) {
    return this.pieces.find((p) => p.uid === uid) ?? null;
  }

  // The piece type of a placement, or for a text block its geometry (see textType()). A placement
  // without its own `text` (a move of a placed block) uses the placed block's.
  typeOf(piece) {
    if (piece.type !== TEXT_TYPE) return this.types.get(piece.type);
    const text = piece.text ?? this.get(piece.uid)?.text;
    return text ? textType(text) : undefined;
  }

  rectOf(piece) {
    return { x: piece.x, y: piece.y, ...footprint(this.typeOf(piece), piece.rotation) };
  }

  // A known type (or a well-formed text block), on whole points, at one of the four rotations.
  isValidPlacement({ type, x, y, rotation, text }) {
    const known = type === TEXT_TYPE ? isValidText(text) : this.types.has(type);
    return known && Number.isInteger(x) && Number.isInteger(y) && ROTATIONS.includes(rotation);
  }

  // Can a piece ({ type, x, y, rotation }) sit here? `ignoreUid` is the piece being moved, if any.
  canOccupy(candidate, ignoreUid = null) {
    if (!this.isValidPlacement(candidate)) return false;
    const rect = this.rectOf(candidate);
    return this.pieces.every((p) => p.uid === ignoreUid || !rectsOverlap(rect, this.rectOf(p)));
  }

  // The pieces `uids` as an arrangement: their bounding box, and each piece relative to its top-left
  // (the members turnArrangement() takes).
  arrangement(uids) {
    const pieces = [...uids].map((uid) => this.get(uid)).filter(Boolean);
    const box = boundingBox(pieces.map((p) => this.rectOf(p)));
    const members = pieces.map((p) => ({
      uid: p.uid, type: p.type, rotation: p.rotation, ...(p.text && { text: p.text }),
      dx: p.x - box.x, dy: p.y - box.y, ...footprint(this.typeOf(p), p.rotation),
    }));
    return { box, members };
  }

  // Can several pieces move and new ones be added at once? `moves` are { uid, x, y, rotation } and
  // `adds` are { type, x, y, rotation, text? }. Moved and added pieces may not overlap each other or any
  // piece left where it is, and adds must stay within `count` (spec 04). Text has no count.
  canApply({ moves = [], adds = [] }) {
    if (moves.some((m) => !this.get(m.uid))) return false;
    const candidates = [...moves.map((m) => ({ ...this.get(m.uid), ...m })), ...adds];
    if (!candidates.every((c) => this.isValidPlacement(c))) return false;
    for (const typeId of new Set(adds.map((a) => a.type).filter((t) => t !== TEXT_TYPE))) {
      const n = adds.filter((a) => a.type === typeId).length;
      if (this.usedCount(typeId) + n > this.types.get(typeId).count) return false;
    }
    const rects = candidates.map((c) => this.rectOf(c));
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (rectsOverlap(rects[i], rects[j])) return false;
      }
    }
    const movedUids = new Set(moves.map((m) => m.uid));
    const rest = this.pieces.filter((p) => !movedUids.has(p.uid)).map((p) => this.rectOf(p));
    return rects.every((r) => rest.every((s) => !rectsOverlap(r, s)));
  }

  // Applies canApply()'s changes as one step. Returns false (and changes nothing) if they're not allowed.
  applyChanges({ moves = [], adds = [] }) {
    if (!this.canApply({ moves, adds })) return false;
    const moved = new Map(moves.map(({ uid, x, y, rotation }) => [uid, { x, y, rotation }]));
    const added = adds.map((a) => this.newPiece(a));
    this.commit([
      ...this.pieces.map((p) => (moved.has(p.uid) ? Object.freeze({ ...p, ...moved.get(p.uid) }) : p)),
      ...added,
    ]);
    return true;
  }

  usedCount(typeId) {
    return this.pieces.filter((p) => p.type === typeId).length;
  }

  // Hard inventory limit (spec 04): never more placed than `count` owned. Text is unlimited.
  hasSpare(typeId) {
    if (typeId === TEXT_TYPE) return true;
    const type = this.types.get(typeId);
    return type !== undefined && this.usedCount(typeId) < type.count;
  }

  // A stored piece for a placement ({ type, x, y, rotation, text? }), with a new uid.
  newPiece({ type, x, y, rotation, text }) {
    return Object.freeze({ uid: this.nextUid++, type, x, y, rotation, ...(type === TEXT_TYPE && { text: textData(text) }) });
  }

  // Returns the placed piece, or null if none are left or it can't go there. `text` is for a text block.
  place(typeId, x, y, rotation = 0, text = undefined) {
    const candidate = { type: typeId, x, y, rotation, ...(text && { text }) };
    if (!this.hasSpare(typeId) || !this.canOccupy(candidate)) return null;
    const piece = this.newPiece(candidate);
    this.commit([...this.pieces, piece]);
    return piece;
  }

  // Changes a text block's text and size in place (spec 12), keeping its top-left corner. Returns false
  // if it isn't a text block, or the new size would overlap another piece.
  setText(uid, text) {
    if (this.get(uid)?.type !== TEXT_TYPE) return false;
    return this.update(uid, { text: textData(text) });
  }

  // Moves a piece, optionally also setting its rotation (it can be turned while being dragged).
  move(uid, x, y, rotation) {
    return this.update(uid, rotation === undefined ? { x, y } : { x, y, rotation });
  }

  // Turns a piece 90° (clockwise on the metal, unless `clockwise` is false) about its center.
  rotate(uid, clockwise = true) {
    return this.rotateGroup([uid], clockwise);
  }

  // Turns pieces 90° as one block about the center of their bounding box (spec 10). The offset uses
  // Math.trunc, which is symmetric around zero, so turning back undoes it exactly and four turns
  // return to the start.
  rotateGroup(uids, clockwise = true) {
    const { box, members } = this.arrangement(uids);
    if (members.length === 0) return false;
    const x = box.x + Math.trunc((box.width - box.height) / 2);
    const y = box.y + Math.trunc((box.height - box.width) / 2);
    return this.applyChanges({
      moves: turnArrangement(members, box.width, box.height, clockwise)
        .map((m) => ({ uid: m.uid, x: x + m.dx, y: y + m.dy, rotation: m.rotation })),
    });
  }

  // Swaps placed pieces for other types and rotations in place, as one step (spec 16). `changes` are
  // { uid, type, rotation }. Refused (returns false) if a type would go over `count` or a piece would
  // then overlap another.
  replaceMany(changes) {
    if (changes.some((c) => !this.get(c.uid))) return false;
    const changed = new Map(changes.map(({ uid, type, rotation }) => [uid, { type, rotation }]));
    const next = this.pieces.map((p) => (changed.has(p.uid) ? Object.freeze({ ...p, ...changed.get(p.uid) }) : p));
    if (!next.every((p) => this.isValidPlacement(p))) return false;
    for (const typeId of new Set(changes.map((c) => c.type))) {
      const after = next.filter((p) => p.type === typeId).length;
      if (after > this.types.get(typeId).count && after > this.usedCount(typeId)) return false;
    }
    const rects = next.map((p) => this.rectOf(p));
    for (let i = 0; i < next.length; i++) {
      if (!changed.has(next[i].uid)) continue;
      if (rects.some((r, j) => j !== i && rectsOverlap(rects[i], r))) return false;
    }
    this.commit(next);
    return true;
  }

  // Replaces the whole design with saved pieces ({ type, x, y, rotation, text? }), without the overlap and
  // inventory checks: a saved or imported design may break them, and is then shown and flagged
  // (see problems()) rather than refused. Pieces of unknown types can't be drawn; they're skipped
  // and returned.
  load(pieces, paper = null) {
    const known = (p) => p.type === TEXT_TYPE || this.types.has(p.type);
    const skipped = pieces.filter((p) => !known(p));
    this.pieces = pieces.filter(known).map((p) => this.newPiece(p));
    this.paper = paper === null ? null : Object.freeze({ ...paper });
    this.past = []; // a loaded design starts a fresh history (spec 15)
    this.future = [];
    this.changed();
    return skipped;
  }

  // Sets or moves the paper (spec 14), or removes it with null. It never affects the pieces.
  setPaper(paper) {
    this.commit(this.pieces, paper === null ? null : Object.freeze({ ...paper }));
  }

  // Rule breaks that can only come from load(): piece types placed more than `count` times,
  // and pieces that overlap another.
  problems() {
    const overLimit = new Set([...this.types.values()]
      .filter((t) => this.usedCount(t.id) > t.count)
      .map((t) => t.id));
    const overlapping = new Set();
    const rects = this.pieces.map((p) => this.rectOf(p));
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (rectsOverlap(rects[i], rects[j])) {
          overlapping.add(this.pieces[i].uid);
          overlapping.add(this.pieces[j].uid);
        }
      }
    }
    return { overLimit, overlapping };
  }

  remove(uid) {
    if (!this.get(uid)) return false;
    this.commit(this.pieces.filter((p) => p.uid !== uid));
    return true;
  }

  removeMany(uids) {
    const gone = new Set(uids);
    if (!this.pieces.some((p) => gone.has(p.uid))) return false;
    this.commit(this.pieces.filter((p) => !gone.has(p.uid)));
    return true;
  }

  update(uid, changes) {
    const old = this.get(uid);
    if (!old) return false;
    const next = Object.freeze({ ...old, ...changes });
    if (!this.canOccupy(next, uid)) return false;
    this.commit(this.pieces.map((p) => (p.uid === uid ? next : p)));
    return true;
  }

  changed() {
    for (const fn of this.listeners) fn(this);
  }
}
