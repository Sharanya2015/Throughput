import { DEVICE_KINDS, SOURCE, DEST, CABLE_LEVELS, GRID } from './balance.js';

export const key = (x, y) => x + ',' + y;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // up, right, down, left

export function neighborsOf(x, y) {
  const out = [];
  for (const [dx, dy] of DIRS) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < GRID.w && ny < GRID.h) out.push([nx, ny]);
  }
  return out;
}

// Rolling window with one bucket per second.
export function makeWindow(n) { return { n, b: new Array(n).fill(0), sec: 0 }; }
function roll(w, tick) {
  const s = Math.floor(tick / 20);
  if (s - w.sec >= w.n) { w.b.fill(0); w.sec = s; return; }
  while (w.sec < s) { w.sec++; w.b[w.sec % w.n] = 0; }
}
export function winAdd(w, tick, v = 1) { roll(w, tick); w.b[w.sec % w.n] += v; }
export function winSum(w, tick) { roll(w, tick); return w.b.reduce((a, c) => a + c, 0); }

export function specOf(dev) {
  if (dev.kind === 'source') return SOURCE;
  if (dev.kind === 'dest') return DEST;
  return DEVICE_KINDS[dev.kind];
}
export function capacityOf(dev) {
  return dev.kind === 'cable' ? CABLE_LEVELS[dev.level].cap : specOf(dev).cap;
}
export function queueMax(dev) { return specOf(dev).queue; }

export function makeDevice(kind, x, y) {
  return {
    kind, x, y, level: 0, queue: [], budget: 0, rr: 0, offlineUntil: 0, dropped: 0,
    sent: makeWindow(5), recv: makeWindow(5), dropW: makeWindow(10),
  };
}

export function makeBoard(map) {
  const board = { devices: new Map(), dirty: true, dist: new Map(), order: [], spawnAcc: 0,
    malwareAcc: 0, malwareToInject: 0, ddos: null, latencyUntil: 0, count: 0, malwareRec: null };
  board.devices.set(key(map.source.x, map.source.y), makeDevice('source', map.source.x, map.source.y));
  board.devices.set(key(map.dest.x, map.dest.y), makeDevice('dest', map.dest.x, map.dest.y));
  board.source = board.devices.get(key(map.source.x, map.source.y));
  board.dest = board.devices.get(key(map.dest.x, map.dest.y));
  return board;
}

// Breadth-first distances from the Destination across online devices.
export function rebuild(board, tick) {
  const dist = new Map();
  const start = key(board.dest.x, board.dest.y);
  dist.set(start, 0);
  let frontier = [start];
  while (frontier.length) {
    const next = [];
    for (const k of frontier) {
      const d = board.devices.get(k);
      for (const [nx, ny] of neighborsOf(d.x, d.y)) {
        const nk = key(nx, ny);
        const nd = board.devices.get(nk);
        if (!nd || dist.has(nk) || nd.offlineUntil > tick) continue;
        dist.set(nk, dist.get(k) + 1);
        next.push(nk);
      }
    }
    frontier = next;
  }
  board.dist = dist;
  board.order = [...dist.keys()].filter((k) => k !== start)
    .sort((a, b) => dist.get(a) - dist.get(b) || (a < b ? -1 : 1))
    .map((k) => board.devices.get(k));
  board.dirty = false;
}

export function utilization(dev, tick) {
  const cap = capacityOf(dev);
  return Math.min(1, winSum(dev.sent, tick) / (cap * 5));
}
