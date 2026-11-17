import { GRID } from './balance.js';
import { key } from './network.js';

// Two guaranteed equal-length paths (10 hops each). Obstacles never touch them.
export const PATH_A = [[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [7, 3], [7, 4]];
export const PATH_B = [[0, 3], [0, 4], [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5]];

export function createMap(rng) {
  const protectedTiles = new Set();
  protectedTiles.add(key(GRID.source.x, GRID.source.y));
  protectedTiles.add(key(GRID.dest.x, GRID.dest.y));
  for (const [x, y] of [...PATH_A, ...PATH_B]) protectedTiles.add(key(x, y));
  const free = [];
  for (let y = 0; y < GRID.h; y++) {
    for (let x = 0; x < GRID.w; x++) if (!protectedTiles.has(key(x, y))) free.push([x, y]);
  }
  const obstacles = new Set();
  while (obstacles.size < GRID.obstacles) {
    const i = rng.int(free.length);
    const [x, y] = free.splice(i, 1)[0];
    obstacles.add(key(x, y));
  }
  return { w: GRID.w, h: GRID.h, source: { ...GRID.source }, dest: { ...GRID.dest }, obstacles };
}
