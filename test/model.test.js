import test from 'node:test';
import assert from 'node:assert/strict';
import { lab, me, build, run, rate, PATH_A } from './helpers.js';
import { createGame, stepGame, phaseOf, ranking } from '../src/sim/game.js';
import { applyCommand } from '../src/sim/commands.js';
import { DEVICE_KINDS, START_CREDITS } from '../src/sim/balance.js';
import { key } from '../src/sim/network.js';

// Upgrade cables to 12 pkt/s so the splitting device, not the feeder, is what is tested.
function fast(g, tiles) {
  for (const [x, y] of tiles) for (let i = 0; i < 2; i++) applyCommand(g, { type: 'upgrade', actor: 0, x, y });
}

test('no packets spawn during the Build phase', () => {
  const g = lab({ spawn: 6 });
  build(g, PATH_A);
  run(g, 8); // practice build phase is 9 s
  assert.equal(phaseOf(g), 'build');
  assert.equal(me(g).delivered, 0);
  assert.equal(g.competitors[0].board.source.queue.length, 0);
});

test('packets are dropped when a queue of 5 is full and the drop is counted at the full device', () => {
  const g = lab({ spawn: 12 });
  build(g, PATH_A);
  run(g, 30);
  const first = me(g).board.devices.get(key(1, 2));
  assert.ok(first.queue.length <= 5);
  assert.ok(first.dropped > 0);
});

test('a path longer than 12 hops drops every packet', () => {
  const g = lab({ spawn: 2 });
  const long = [[0, 1], [0, 0], ...[1, 2, 3, 4, 5, 6, 7].map((x) => [x, 0]), [7, 1], [7, 2], [7, 3], [7, 4]];
  build(g, long);
  run(g, 30);
  assert.equal(me(g).delivered, 0);
  assert.ok(me(g).dropped > 0);
});

test('a disconnected network never delivers and does not crash', () => {
  const g = lab({ spawn: 4 });
  build(g, [[1, 2], [2, 2]]);
  run(g, 30);
  assert.equal(me(g).delivered, 0);
});

// Splitting device at (1,2) fed straight from the Source; two branches that never touch.
const BRANCH_1 = [[2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [7, 3], [7, 4]];
const BRANCH_2 = [[1, 3], [1, 4], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5]];

test('a Switch splits traffic between two onward branches (6 pkt/s through two 4 pkt/s paths)', () => {
  const g = lab({ spawn: 6 });
  build(g, [[1, 2]], 'switch');
  build(g, BRANCH_1);
  build(g, BRANCH_2);
  const r = rate(g, 20, 20);
  assert.ok(Math.abs(r - 6) < 0.3, `expected about 6 pkt/s, got ${r}`);
  assert.equal(me(g).dropped, 0);
});

test('adjacent cables merge traffic: side-by-side branches share one cable and cap delivery at 4 pkt/s', () => {
  const g = lab({ spawn: 6 });
  build(g, [[1, 2], [2, 2]]);
  fast(g, [[1, 2], [2, 2]]);
  build(g, [[3, 2]], 'switch');
  build(g, [[4, 2], [5, 2], [6, 2], [7, 2], [7, 3], [7, 4]]);
  build(g, [[3, 3], [4, 3], [5, 3], [6, 3], [6, 4], [6, 5]]);
  const r = rate(g, 20, 20);
  assert.ok(Math.abs(r - 4) < 0.3, `expected about 4 pkt/s, got ${r}`);
});

test('a Router sends packets to the shorter queue', () => {
  const g = lab({ spawn: 6 });
  build(g, [[1, 2]], 'router');
  build(g, BRANCH_1);
  build(g, BRANCH_2);
  const r = rate(g, 20, 20);
  assert.ok(Math.abs(r - 6) < 0.3, `expected about 6 pkt/s, got ${r}`);
});

test('score and credits rise by one per delivered packet', () => {
  const g = lab({ spawn: 2 });
  build(g, PATH_A);
  const credits0 = me(g).credits;
  run(g, 40);
  assert.equal(me(g).score, me(g).delivered);
  assert.equal(me(g).credits, credits0 + me(g).delivered);
});

test('ranking uses score, then fewest drops', () => {
  const g = createGame({ bots: ['easy'], botsActive: false });
  g.competitors[0].score = 10; g.competitors[0].dropped = 5;
  g.competitors[1].score = 10; g.competitors[1].dropped = 2;
  assert.equal(ranking(g)[0].id, 1);
});

test('phases follow the round fractions and the round ends at the last tick', () => {
  const g = createGame({ bots: [], botsActive: false, chaos: false });
  assert.equal(phaseOf(g), 'build');
  g.tick = Math.floor(0.1 * g.totalTicks); assert.equal(phaseOf(g), 'grace');
  g.tick = Math.floor(0.5 * g.totalTicks); assert.equal(phaseOf(g), 'live');
  g.tick = Math.floor(0.95 * g.totalTicks); assert.equal(phaseOf(g), 'rush');
  g.tick = g.totalTicks - 1; stepGame(g);
  assert.equal(g.over, true);
  assert.equal(phaseOf(g), 'over');
});

test('starting credits and the full round length match the spec', () => {
  const g = createGame({ mode: 'full', bots: [], botsActive: false });
  assert.equal(g.totalTicks, 600 * 20);
  assert.equal(g.competitors[0].credits, START_CREDITS);
  assert.equal(DEVICE_KINDS.cable.cost, 10);
});
