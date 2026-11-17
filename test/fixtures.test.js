import test from 'node:test';
import assert from 'node:assert/strict';
import { lab, me, build, run, rate, PATH_A, PATH_B } from './helpers.js';
import { applyCommand } from '../src/sim/commands.js';
import { bottleneckMessage } from '../src/sim/explain.js';

const near = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: got ${actual}, expected ${expected} +/- ${tol}`);

test('Fixture 1 (correct case): a chain of nine 4 pkt/s cables carries 2 pkt/s with no drops', () => {
  const g = lab({ spawn: 2 });
  build(g, PATH_A);
  near(rate(g, 20, 20), 2, 0.15, 'delivered rate');
  assert.equal(me(g).dropped, 0);
});

test('Fixture 2 (wrong choice): at 6 pkt/s the chain delivers 4 pkt/s and upgrading one cable changes nothing', () => {
  const g = lab({ spawn: 6 });
  build(g, PATH_A);
  near(rate(g, 20, 20), 4, 0.3, 'delivered rate before upgrade');
  assert.ok(me(g).dropped > 0);
  const msg = bottleneckMessage(g, me(g));
  assert.match(msg, /Cable at \(1,2\)/);

  const mid = applyCommand(g, { type: 'upgrade', actor: 0, x: 4, y: 2 });
  assert.equal(mid.ok, true);
  assert.equal(mid.wasBottleneck, false);
  assert.match(mid.message, /not the bottleneck/);
  near(rate(g, 20, 20), 4, 0.3, 'delivered rate after upgrading the middle cable only');
});

test('Fixture 2b: upgrading every cable lifts delivery to the 6 pkt/s arriving', () => {
  const g = lab({ spawn: 6 });
  build(g, PATH_A);
  for (const [x, y] of PATH_A) applyCommand(g, { type: 'upgrade', actor: 0, x, y });
  near(rate(g, 20, 20), 6, 0.3, 'delivered rate after upgrading all');
});

test('Fixture 3 (edge case): two equal parallel paths carry 6 pkt/s; the Source splits traffic', () => {
  const g = lab({ spawn: 6 });
  build(g, [...PATH_A, ...PATH_B]);
  near(rate(g, 20, 20), 6, 0.2, 'delivered rate on two paths');
  assert.equal(me(g).dropped, 0);
});

test('Fixture 3b: a Firewall (6 pkt/s) in a fast chain caps delivery at 6 pkt/s', () => {
  const g = lab({ spawn: 8 });
  build(g, PATH_A);
  for (const [x, y] of PATH_A) { applyCommand(g, { type: 'upgrade', actor: 0, x, y }); applyCommand(g, { type: 'upgrade', actor: 0, x, y }); }
  applyCommand(g, { type: 'demolish', actor: 0, x: 4, y: 2 });
  build(g, [[4, 2]], 'firewall');
  near(rate(g, 20, 20), 6, 0.3, 'delivered rate through a firewall');
  assert.match(bottleneckMessage(g, me(g)), /Firewall at \(4,2\)/);
});
