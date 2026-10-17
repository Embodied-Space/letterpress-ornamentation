// Loads and validates the ornament piece types from data/pieces.json (spec 01).
// Sizes and counts live only in the JSON; nothing here should hard-code them.

export const EDGES = ['top', 'right', 'bottom', 'left'];

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class PieceDataError extends Error {
  constructor(problems) {
    super(`Invalid piece data:\n- ${problems.join('\n- ')}`);
    this.name = 'PieceDataError';
    this.problems = problems;
  }
}

export async function loadPieces(url = 'data/pieces.json') {
  let response;
  try {
    response = await fetch(url, { cache: 'no-cache' });
  } catch (err) {
    throw new PieceDataError([`could not fetch ${url}: ${err.message}`]);
  }
  if (!response.ok) {
    throw new PieceDataError([`could not fetch ${url}: HTTP ${response.status}`]);
  }
  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new PieceDataError([`${url} is not valid JSON: ${err.message}`]);
  }
  return validatePieces(data);
}

// Returns a frozen copy of the piece types, or throws PieceDataError listing every problem found.
export function validatePieces(data) {
  if (!Array.isArray(data)) {
    throw new PieceDataError(['the top level must be an array of piece types']);
  }

  const problems = [];
  const seenIds = new Set();

  data.forEach((piece, i) => {
    const where = typeof piece?.id === 'string' ? `piece "${piece.id}"` : `piece #${i + 1}`;
    const fail = (msg) => problems.push(`${where}: ${msg}`);

    if (piece === null || typeof piece !== 'object' || Array.isArray(piece)) {
      fail('must be an object');
      return;
    }

    if (typeof piece.id !== 'string' || !ID_PATTERN.test(piece.id)) {
      fail('"id" must be a kebab-case string');
    } else if (seenIds.has(piece.id)) {
      fail('"id" is used more than once');
    } else {
      seenIds.add(piece.id);
    }

    if (typeof piece.name !== 'string' || piece.name.trim() === '') {
      fail('"name" must be a non-empty string');
    }

    // Whole points only: the canvas grid is 1 pt, so footprints must land on it.
    for (const key of ['width', 'height']) {
      if (!Number.isInteger(piece[key]) || piece[key] <= 0) {
        fail(`"${key}" must be a positive whole number of points`);
      }
    }

    if (!Number.isInteger(piece.count) || piece.count < 0) {
      fail('"count" must be a whole number, 0 or more');
    }

    if (typeof piece.lines !== 'string' || piece.lines.trim() === '') {
      fail('"lines" must be a non-empty SVG path string');
    }

    if (!Array.isArray(piece.connectors)) {
      fail('"connectors" must be an array');
    } else {
      piece.connectors.forEach((c, j) => {
        if (c === null || typeof c !== 'object' || !EDGES.includes(c.edge)) {
          fail(`connector #${j + 1}: "edge" must be one of ${EDGES.join(', ')}`);
          return;
        }
        // Offset is measured from the edge's start: the left end of top/bottom, the top end of left/right.
        const edgeLength = c.edge === 'top' || c.edge === 'bottom' ? piece.width : piece.height;
        if (typeof c.offset !== 'number' || !Number.isFinite(c.offset)) {
          fail(`connector #${j + 1}: "offset" must be a number`);
        } else if (Number.isFinite(edgeLength) && (c.offset < 0 || c.offset > edgeLength)) {
          fail(`connector #${j + 1}: "offset" ${c.offset} is outside the ${c.edge} edge (0–${edgeLength})`);
        }
      });
    }

    if (typeof piece.placeholder !== 'boolean') {
      fail('"placeholder" must be true or false');
    }
  });

  if (problems.length > 0) throw new PieceDataError(problems);

  return Object.freeze(data.map((piece) => Object.freeze({
    id: piece.id,
    name: piece.name,
    width: piece.width,
    height: piece.height,
    count: piece.count,
    lines: piece.lines,
    connectors: Object.freeze(piece.connectors.map((c) => Object.freeze({ edge: c.edge, offset: c.offset }))),
    placeholder: piece.placeholder,
  })));
}

export function pieceById(pieces, id) {
  return pieces.find((p) => p.id === id);
}
