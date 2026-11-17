import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/sim/rng.js';
import { createMap, PATH_A, PATH_B } from '../src/sim/map.js';
import { key } from '../src/sim/network.js';

test('rng is deterministic for a seed', () => {
  const a = makeRng(5), b = makeRng(5);
  for (let i = 0; i < 20; i++) assert.equal(a.next(), b.next());
});

test('maps have 6 obstacles that never block the Source, Destination or the two guaranteed paths', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const m = createMap(makeRng(seed));
    assert.equal(m.obstacles.size, 6);
    for (const [x, y] of [...PATH_A, ...PATH_B, [0, 2], [7, 5]]) assert.ok(!m.obstacles.has(key(x, y)), `seed ${seed} blocks ${x},${y}`);
  }
});
