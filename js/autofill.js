// Straight auto-fill (spec 11): the runs of straight rule laid behind pieces pulled away from the
// piece they're joined to. No DOM code here.

import { worldConnectors } from './connectors.js';

// Straights, longest first: pieces with exactly one connector on each end (left and right) at the
// same offset. Worked out from pieces.json so no lengths live in code.
export function straightTypes(types) {
  return [...types.values()]
    .filter(({ connectors: c }) => c.length === 2
      && c.some((k) => k.edge === 'left') && c.some((k) => k.edge === 'right')
      && c[0].offset === c[1].offset)
    .sort((a, b) => b.width - a.width);
}

// The straights for `runs` runs of equal length, each at most `distance` pt: as many of the longest
// as fit, then shorter ones, longest first. Only straights still in stock are used, shared between
// the runs. Returns the type ids for one run, its length, and whether stock cut it short.
export function fillRun(design, straights, distance, runs) {
  const pick = (spare) => {
    const ids = [];
    let length = 0;
    for (const type of straights) {
      const n = Math.min(spare(type), Math.floor((distance - length) / type.width));
      for (let i = 0; i < n; i++) ids.push(type.id);
      length += n * type.width;
    }
    return { ids, length };
  };
  const inStock = pick((t) => Math.floor((t.count - design.usedCount(t.id)) / runs));
  const unlimited = pick(() => Infinity);
  return { ...inStock, limited: inStock.length < unlimited.length };
}

// Placements for the straights `ids`, end to end from `start` (a connector point) going in direction
// `dir` ({ x, y }, a unit axis vector). Each is turned to run along `dir` and placed so its back
// connector meets the previous one's front. Returns the placements and the run's far end.
export function layRun(design, ids, start, dir) {
  const rotation = dir.x !== 0 ? 0 : 90;
  const placements = [];
  let end = start;
  for (const id of ids) {
    const conns = worldConnectors(design.types.get(id), 0, 0, rotation);
    const back = conns.find((c) => c.nx === -dir.x && c.ny === -dir.y);
    const front = conns.find((c) => c.nx === dir.x && c.ny === dir.y);
    const x = end.x - back.x;
    const y = end.y - back.y;
    placements.push({ type: id, x, y, rotation });
    end = { x: x + front.x, y: y + front.y };
  }
  return { placements, end };
}
