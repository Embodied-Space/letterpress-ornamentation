// Connector geometry in canvas space, and line snapping (spec 09). No DOM code here.

const NORMALS = {
  top: [0, -1],
  right: [1, 0],
  bottom: [0, 1],
  left: [-1, 0],
};

// Maps a point in the unrotated piece (w × h) to its offset from the rotated footprint's top-left.
// Must match placementTransform() in svg.js.
function rotatePoint(type, rotation, px, py) {
  switch (rotation) {
    case 90: return [type.height - py, px];
    case 180: return [type.width - px, type.height - py];
    case 270: return [py, type.width - px];
    default: return [px, py];
  }
}

function rotateNormal(rotation, nx, ny) {
  switch (rotation) {
    case 90: return [-ny, nx];
    case 180: return [-nx, -ny];
    case 270: return [ny, -nx];
    default: return [nx, ny];
  }
}

// Each connector of a piece placed at (x, y, rotation), as a point on its edge plus an outward normal.
export function worldConnectors(type, x, y, rotation) {
  return type.connectors.map(({ edge, offset }) => {
    const local = {
      top: [offset, 0],
      right: [type.width, offset],
      bottom: [offset, type.height],
      left: [0, offset],
    }[edge];
    const [px, py] = rotatePoint(type, rotation, ...local);
    const [nx, ny] = rotateNormal(rotation, ...NORMALS[edge]);
    return { x: x + px, y: y + py, nx, ny };
  });
}

const connectorKey = (cs) => cs.map((c) => `${c.x},${c.y},${c.nx},${c.ny}`).sort().join(' ');

// The rotation at which `toType` is the left-right mirror image (as seen on screen, in the same
// footprint) of `fromType` placed at `rotation`, judged by connectors (spec 16). `preferred` lists the
// rotations to try first when several match. Returns null if none does.
export function mirroredRotation(fromType, rotation, toType, preferred) {
  const from = worldConnectors(fromType, 0, 0, rotation);
  const width = rotation % 180 === 0 ? fromType.width : fromType.height;
  const height = rotation % 180 === 0 ? fromType.height : fromType.width;
  const flipped = connectorKey(from.map((c) => ({ ...c, x: width - c.x, nx: c.nx === 0 ? 0 : -c.nx })));
  return preferred.find((r) => {
    const [w, h] = r % 180 === 0 ? [toType.width, toType.height] : [toType.height, toType.width];
    return w === width && h === height && connectorKey(worldConnectors(toType, 0, 0, r)) === flipped;
  }) ?? null;
}

const piecesConnectors = (design, placements) => placements.flatMap(
  (p) => worldConnectors(design.types.get(p.type), p.x, p.y, p.rotation),
);

// Looks for a nearby connector on a placed piece (other than `ignoreUids`) that faces one of the
// candidates' connectors. `candidates` are placements ({ type, x, y, rotation }) dragged together.
// Returns the closest valid shift { dx, dy, point } within `radius` pt, or null. A snap is only
// offered on whole points, and when `isFree(dx, dy)` says the shifted candidates overlap nothing.
export function findSnap(design, candidates, ignoreUids, radius, isFree) {
  const mine = piecesConnectors(design, candidates);
  let best = null;
  for (const other of design.pieces) {
    if (ignoreUids.has(other.uid)) continue;
    const theirs = worldConnectors(design.types.get(other.type), other.x, other.y, other.rotation);
    for (const t of theirs) {
      for (const c of mine) {
        if (c.nx !== -t.nx || c.ny !== -t.ny) continue;
        const dx = t.x - c.x;
        const dy = t.y - c.y;
        if (!Number.isInteger(dx) || !Number.isInteger(dy)) continue;
        const dist = Math.hypot(dx, dy);
        if (dist > radius || (best && dist >= best.dist)) continue;
        if (!isFree(dx, dy)) continue;
        best = { dx, dy, dist, point: { x: t.x, y: t.y } };
      }
    }
  }
  return best;
}

// Where the pieces `uids` are joined to pieces outside them: each connector of theirs that touches a
// facing connector of another piece, as { x, y, nx, ny } with the normal pointing out of `uids`.
export function outsideJoins(design, uids) {
  const mine = piecesConnectors(design, design.pieces.filter((p) => uids.has(p.uid)));
  const theirs = piecesConnectors(design, design.pieces.filter((p) => !uids.has(p.uid)));
  return mine.filter((c) => theirs.some((t) => t.x === c.x && t.y === c.y && t.nx === -c.nx && t.ny === -c.ny));
}
