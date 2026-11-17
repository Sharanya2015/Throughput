import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame, results } from '../src/sim/game.js';
import { applyCommand } from '../src/sim/commands.js';

const scores = (g) => results(g).map((r) => `${r.name}:${r.score}:${r.dropped}`).join('|');

test('same seed and same commands give identical results (replay)', () => {
  const a = createGame({ seed: 42, bots: ['easy', 'normal', 'hard'], human: true });
  while (!a.over) stepGame(a, a.tick === 5 ? [{ type: 'place', actor: 0, kind: 'cable', x: 1, y: 2 }] : []);
  const b = createGame({ seed: 42, bots: ['easy', 'normal', 'hard'], human: true, botsActive: false });
  const byTick = new Map();
  for (const { tick, cmd } of a.commandLog) byTick.set(tick, [...(byTick.get(tick) || []), cmd]);
  while (!b.over) {
    // Apply the recorded commands for this tick exactly as the first run did.
    const cmds = byTick.get(b.tick) || [];
    for (const c of cmds) applyCommand(b, c);
    b.commandLog.length = 0;
    stepGame(b);
  }
  assert.equal(scores(b), scores(a));
});

test('different seeds give different maps', () => {
  const a = createGame({ seed: 1, bots: [] });
  const b = createGame({ seed: 2, bots: [] });
  assert.notDeepEqual([...a.map.obstacles].sort(), [...b.map.obstacles].sort());
});

test('the same seed gives the same map and chaos schedule', () => {
  const a = createGame({ seed: 9, bots: [] });
  const b = createGame({ seed: 9, bots: [] });
  assert.deepEqual([...a.map.obstacles].sort(), [...b.map.obstacles].sort());
  assert.deepEqual(a.chaos.map((c) => c.kind), b.chaos.map((c) => c.kind));
});
