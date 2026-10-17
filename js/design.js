// The design state: which pieces are placed where (spec 03). No DOM code here.
// Every change goes through canOccupy(), so an invalid layout is never stored.

export const ROTATIONS = [0, 90, 180, 270];

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
    this.nextUid = 1;
    this.listeners = new Set();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  get(uid) {
    return this.pieces.find((p) => p.uid === uid) ?? null;
  }

  rectOf(piece) {
    return { x: piece.x, y: piece.y, ...footprint(this.types.get(piece.type), piece.rotation) };
  }

  // Can a piece ({ type, x, y, rotation }) sit here? `ignoreUid` is the piece being moved, if any.
  canOccupy(candidate, ignoreUid = null) {
    if (!this.types.has(candidate.type)) return false;
    if (!Number.isInteger(candidate.x) || !Number.isInteger(candidate.y)) return false;
    if (!ROTATIONS.includes(candidate.rotation)) return false;
    const rect = this.rectOf(candidate);
    return this.pieces.every((p) => p.uid === ignoreUid || !rectsOverlap(rect, this.rectOf(p)));
  }

  usedCount(typeId) {
    return this.pieces.filter((p) => p.type === typeId).length;
  }

  // Hard inventory limit (spec 04): never more placed than `count` owned.
  hasSpare(typeId) {
    const type = this.types.get(typeId);
    return type !== undefined && this.usedCount(typeId) < type.count;
  }

  // Returns the placed piece, or null if none are left or it can't go there.
  place(typeId, x, y, rotation = 0) {
    const candidate = { type: typeId, x, y, rotation };
    if (!this.hasSpare(typeId) || !this.canOccupy(candidate)) return null;
    const piece = Object.freeze({ uid: this.nextUid++, ...candidate });
    this.pieces = [...this.pieces, piece];
    this.changed();
    return piece;
  }

  // Moves a piece, optionally also setting its rotation (it can be turned while being dragged).
  move(uid, x, y, rotation) {
    return this.update(uid, rotation === undefined ? { x, y } : { x, y, rotation });
  }

  // Turns a piece 90° clockwise about its center. The offset uses Math.trunc, which is symmetric
  // around zero, so turning back undoes it exactly and four turns return to the start.
  rotate(uid) {
    const piece = this.get(uid);
    if (!piece) return false;
    const { width, height } = this.rectOf(piece);
    return this.update(uid, {
      rotation: (piece.rotation + 90) % 360,
      x: piece.x + Math.trunc((width - height) / 2),
      y: piece.y + Math.trunc((height - width) / 2),
    });
  }

  remove(uid) {
    if (!this.get(uid)) return false;
    this.pieces = this.pieces.filter((p) => p.uid !== uid);
    this.changed();
    return true;
  }

  update(uid, changes) {
    const old = this.get(uid);
    if (!old) return false;
    const next = Object.freeze({ ...old, ...changes });
    if (!this.canOccupy(next, uid)) return false;
    this.pieces = this.pieces.map((p) => (p.uid === uid ? next : p));
    this.changed();
    return true;
  }

  changed() {
    for (const fn of this.listeners) fn(this);
  }
}
