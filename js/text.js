// Text placeholders (spec 12): FPO blocks that stand in for type. No DOM code here.
// A placed block is a piece with `type: TEXT_TYPE` and a `text` object:
//   { content, size, sizing, style?, width, height }
// where `sizing` says where the size came from ('text', 'width' or 'box'), and width and height are the
// resolved whole-point footprint, so a saved design never moves when type-styles.json changes.

export const TEXT_TYPE = 'text';
export const SIZINGS = ['text', 'width', 'box'];

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class TypeStyleError extends Error {
  constructor(problems) {
    super(`Invalid type styles:\n- ${problems.join('\n- ')}`);
    this.name = 'TypeStyleError';
  }
}

export async function loadTypeStyles(url = 'data/type-styles.json') {
  let response;
  try {
    response = await fetch(url, { cache: 'no-cache' });
  } catch (err) {
    throw new TypeStyleError([`could not fetch ${url}: ${err.message}`]);
  }
  if (!response.ok) throw new TypeStyleError([`could not fetch ${url}: HTTP ${response.status}`]);
  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new TypeStyleError([`${url} is not valid JSON: ${err.message}`]);
  }
  return validateTypeStyles(data);
}

// Returns a frozen copy of the styles, or throws TypeStyleError listing every problem found.
export function validateTypeStyles(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new TypeStyleError(['the top level must be a non-empty array of type styles']);
  }
  const problems = [];
  const seen = new Set();
  data.forEach((s, i) => {
    const where = typeof s?.id === 'string' ? `style "${s.id}"` : `style #${i + 1}`;
    if (s === null || typeof s !== 'object' || Array.isArray(s)) {
      problems.push(`${where}: must be an object`);
      return;
    }
    if (typeof s.id !== 'string' || !ID_PATTERN.test(s.id)) problems.push(`${where}: "id" must be a kebab-case string`);
    else if (seen.has(s.id)) problems.push(`${where}: "id" is used more than once`);
    else seen.add(s.id);
    if (typeof s.name !== 'string' || s.name.trim() === '') problems.push(`${where}: "name" must be a non-empty string`);
    if (typeof s.charWidth !== 'number' || !(s.charWidth > 0) || !Number.isFinite(s.charWidth)) {
      problems.push(`${where}: "charWidth" must be a number more than 0`);
    }
  });
  if (problems.length > 0) throw new TypeStyleError(problems);
  return Object.freeze(data.map(({ id, name, charWidth }) => Object.freeze({ id, name, charWidth })));
}

// Rounds a width up to a whole quarter em of `size`, then up to a whole point. The small tolerance keeps
// an exact multiple (144 / 4.5) from being pushed up by floating-point error.
export function snapWidth(width, size) {
  const quarter = size / 4;
  return Math.ceil(Math.ceil(width / quarter - 1e-9) * quarter - 1e-9);
}

// The resolved block for form settings ({ content, size, sizing, style, width, height }), with whole-point
// width and height. Returns { block } or { error } with a message for the form.
export function resolveText({ content = '', size, sizing, style, width, height }, styles) {
  if (!(size > 0) || !Number.isFinite(size)) return { error: 'Give a font size in points.' };
  const base = { content, size, sizing };
  if (sizing === 'text') {
    const found = styles.find((s) => s.id === style);
    if (!found) return { error: 'Choose a type style.' };
    const chars = [...content].length;
    if (chars === 0) return { error: 'Type the text, or choose a line width instead.' };
    return { block: { ...base, style, width: snapWidth(chars * found.charWidth * size, size), height: Math.ceil(size) } };
  }
  if (!(width > 0) || !Number.isFinite(width)) return { error: 'Give a width in points.' };
  if (sizing === 'width') {
    return { block: { ...base, width: snapWidth(width, size), height: Math.ceil(size) } };
  }
  if (sizing === 'box') {
    if (!(height > 0) || !Number.isFinite(height)) return { error: 'Give a height in points.' };
    return { block: { ...base, width: Math.ceil(width - 1e-9), height: Math.ceil(height - 1e-9) } };
  }
  return { error: 'Choose how the size is set.' };
}

// Is this a well-formed resolved block (as saved, or as resolveText() returns)?
export function isValidText(t) {
  return t !== null && typeof t === 'object'
    && typeof t.content === 'string'
    && typeof t.size === 'number' && t.size > 0 && Number.isFinite(t.size)
    && SIZINGS.includes(t.sizing)
    && (t.style === undefined || typeof t.style === 'string')
    && Number.isInteger(t.width) && t.width > 0
    && Number.isInteger(t.height) && t.height > 0;
}

// A copy with only the known fields, frozen.
export function textData({ content, size, sizing, style, width, height }) {
  return Object.freeze({ content, size, sizing, ...(style !== undefined && { style }), width, height });
}

// The piece-type-like geometry of a block, so footprints, transforms and connector lookups work on it.
export function textType(t) {
  return {
    id: TEXT_TYPE, name: 'Text', width: t.width, height: t.height, connectors: [], text: t,
  };
}

// "18 pt · 144 × 18"
export const textLabel = (t) => `${t.size} pt · ${t.width} × ${t.height}`;
