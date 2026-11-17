import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/sim/game.js';
import { applyCommand } from '../src/sim/commands.js';
import { DEVICE_LIMIT } from '../src/sim/balance.js';

const fresh = () => createGame({ bots: [], botsActive: false, chaos: false, seed: 5 });
const place = (g, kind, x, y) => applyCommand(g, { type: 'place', actor: 0, kind, x, y });

test('placing a Cable costs 10 credits', () => {
  const g = fresh();
  const r = place(g, 'cable', 1, 2);
  assert.equal(r.ok, true);
  assert.equal(g.competitors[0].credits, 140);
});

test('rejects obstacles, the Source, the Destination, occupied tiles and off-grid tiles with reasons', () => {
  const g = fresh();
  const obstacle = [...g.map.obstacles][0].split(',').map(Number);
  assert.match(place(g, 'cable', ...obstacle).reason, /obstacle/);
  assert.match(place(g, 'cable', 0, 2).reason, /already used/);
  assert.match(place(g, 'cable', 7, 5).reason, /already used/);
  place(g, 'cable', 1, 2);
  assert.match(place(g, 'cable', 1, 2).reason, /already used/);
  assert.match(place(g, 'cable', 9, 9).reason, /outside/);
  assert.equal(g.competitors[0].credits, 140);
});

test('rejects a purchase without enough credits and leaves credits unchanged', () => {
  const g = fresh();
  g.competitors[0].credits = 20;
  const r = place(g, 'router', 1, 2);
  assert.equal(r.ok, false);
  assert.match(r.reason, /Not enough credits/);
  assert.equal(g.competitors[0].credits, 20);
});

test('enforces the 20 device limit', () => {
  const g = fresh();
  g.map.obstacles.clear();
  g.competitors[0].credits = 10000;
  let placed = 0;
  for (let y = 0; y < 8 && placed < DEVICE_LIMIT + 3; y++) for (let x = 1; x < 7 && placed < DEVICE_LIMIT + 3; x++) {
    if (y === 2 && x === 0) continue;
    const r = place(g, 'cable', x, y);
    if (r.ok) placed++;
  }
  assert.equal(g.competitors[0].board.count, DEVICE_LIMIT);
});

test('upgrading costs 25 then 50, stops at maximum, and demolish refunds 50%', () => {
  const g = fresh();
  place(g, 'cable', 1, 2);
  const c0 = g.competitors[0].credits;
  assert.equal(applyCommand(g, { type: 'upgrade', actor: 0, x: 1, y: 2 }).ok, true);
  assert.equal(g.competitors[0].credits, c0 - 25);
  assert.equal(applyCommand(g, { type: 'upgrade', actor: 0, x: 1, y: 2 }).ok, true);
  assert.equal(g.competitors[0].credits, c0 - 75);
  const again = applyCommand(g, { type: 'upgrade', actor: 0, x: 1, y: 2 });
  assert.equal(again.ok, false);
  assert.match(again.reason, /maximum/);
  assert.equal(g.competitors[0].credits, c0 - 75);
  applyCommand(g, { type: 'demolish', actor: 0, x: 1, y: 2 });
  assert.equal(g.competitors[0].credits, c0 - 75 + 5);
});

test('only cables can be upgraded; the Source cannot be demolished', () => {
  const g = fresh();
  place(g, 'switch', 1, 2);
  assert.equal(applyCommand(g, { type: 'upgrade', actor: 0, x: 1, y: 2 }).ok, false);
  assert.equal(applyCommand(g, { type: 'demolish', actor: 0, x: 0, y: 2 }).ok, false);
});
