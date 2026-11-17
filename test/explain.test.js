import test from 'node:test';
import assert from 'node:assert/strict';
import { lab, me, build, run, PATH_A } from './helpers.js';
import { bottleneckMessage, findBottleneck, finalBottleneck } from '../src/sim/explain.js';
import { applyCommand } from '../src/sim/commands.js';

test('no message while nothing is dropped', () => {
  const g = lab({ spawn: 2 });
  build(g, PATH_A);
  run(g, 20);
  assert.equal(findBottleneck(g, me(g)), null);
  assert.equal(bottleneckMessage(g, me(g)), null);
});

test('names the device, its capacity and the arriving rate when packets drop', () => {
  const g = lab({ spawn: 6 });
  build(g, PATH_A);
  run(g, 30);
  const msg = bottleneckMessage(g, me(g));
  assert.match(msg, /Cable at \(1,2\) passes 4 pkt\/s but about [\d.]+ pkt\/s arrive/);
  assert.match(msg, /Upgrade it/);
});

test('upgrading the real bottleneck says so', () => {
  const g = lab({ spawn: 6 });
  build(g, PATH_A);
  run(g, 30);
  const r = applyCommand(g, { type: 'upgrade', actor: 0, x: 1, y: 2 });
  assert.equal(r.wasBottleneck, true);
  assert.match(r.message, /was the bottleneck/);
});

test('upgrading before any drops says nothing changes yet', () => {
  const g = lab({ spawn: 2 });
  build(g, PATH_A);
  run(g, 10);
  const r = applyCommand(g, { type: 'upgrade', actor: 0, x: 2, y: 2 });
  assert.match(r.message, /No packets are being dropped/);
});

test('reports a disconnected network', () => {
  const g = lab({ spawn: 2 });
  build(g, [[1, 2]]);
  run(g, 15);
  assert.match(bottleneckMessage(g, me(g)), /not connected/);
});

test('final bottleneck summary names the device that dropped the most', () => {
  const g = lab({ spawn: 6 });
  build(g, PATH_A);
  run(g, 30);
  assert.match(finalBottleneck(g, me(g)), /Cable at \(1,2\)/);
  const clean = lab({ spawn: 1 });
  build(clean, PATH_A);
  run(clean, 20);
  assert.match(finalBottleneck(clean, me(clean)), /No packets were dropped/);
});

test('final summary reports a disconnected network instead of blaming the Source', () => {
  const g = lab({ spawn: 6 });
  build(g, PATH_A);
  run(g, 10);
  applyCommand(g, { type: 'demolish', actor: 0, x: 4, y: 2 });
  run(g, 20);
  assert.match(finalBottleneck(g, me(g)), /disconnected/);
});
