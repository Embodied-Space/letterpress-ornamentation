// Saving and loading designs (spec 06): the design file format, localStorage, and JSON export.
// localStorage calls can throw (private mode, quota); callers catch and show a notice.

import { ROTATIONS } from './design.js';

export const FORMAT_VERSION = 1;
export const DEFAULT_NAME = 'Untitled';
const CURRENT_KEY = 'letterpress-ornaments/current';
const SAVED_KEY = 'letterpress-ornaments/designs';

export class DesignFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DesignFormatError';
  }
}

export function serializeDesign(name, design) {
  return {
    version: FORMAT_VERSION,
    name,
    pieces: design.pieces.map(({ type, x, y, rotation }) => ({ type, x, y, rotation })),
  };
}

// Checks the shape of a design file. Rule breaks (overlaps, too many of a piece, unknown piece ids)
// are not format errors: those designs still load, flagged (see Design.load).
export function parseDesign(data) {
  const fail = (msg) => { throw new DesignFormatError(msg); };
  if (data === null || typeof data !== 'object' || Array.isArray(data)) fail('This is not a design file.');
  if (data.version !== FORMAT_VERSION) {
    fail(`Unsupported design version ${JSON.stringify(data.version)} (expected ${FORMAT_VERSION}).`);
  }
  if (typeof data.name !== 'string') fail('The design has no "name".');
  if (!Array.isArray(data.pieces)) fail('The design has no "pieces" list.');
  const pieces = data.pieces.map((p, i) => {
    if (p === null || typeof p !== 'object' || typeof p.type !== 'string'
      || !Number.isInteger(p.x) || !Number.isInteger(p.y) || !ROTATIONS.includes(p.rotation)) {
      fail(`Piece #${i + 1} needs a "type", whole-point "x" and "y", and a "rotation" of 0, 90, 180 or 270.`);
    }
    return { type: p.type, x: p.x, y: p.y, rotation: p.rotation };
  });
  return { version: FORMAT_VERSION, name: data.name, pieces };
}

function readJSON(key) {
  const raw = localStorage.getItem(key);
  return raw === null ? null : JSON.parse(raw);
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// The autosaved current design, or null if there is none.
export function loadCurrent() {
  const data = readJSON(CURRENT_KEY);
  return data === null ? null : parseDesign(data);
}

export function saveCurrent(data) {
  writeJSON(CURRENT_KEY, data);
}

// Named designs, as { name: designData }.
export function listSaved() {
  return readJSON(SAVED_KEY) ?? {};
}

export function saveNamed(data) {
  const all = listSaved();
  all[data.name] = data;
  writeJSON(SAVED_KEY, all);
}

export function deleteNamed(name) {
  const all = listSaved();
  delete all[name];
  writeJSON(SAVED_KEY, all);
}

export function downloadDesign(data) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const fileName = data.name.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'design';
  const link = Object.assign(document.createElement('a'), { href: url, download: `${fileName}.json` });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
