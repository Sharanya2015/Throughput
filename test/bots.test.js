import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame, results } from '../src/sim/game.js';

function play(bots, seed, mode = 'practice') {
  const g = createGame({ bots, human: false, seed, mode });
  while (!g.over) stepGame(g);
  return g;
}

test('bots only act through commands, never overspend, and respect the device limit', () => {
  const g = play(['easy', 'normal', 'hard'], 7);
  for (const c of g.competitors) {
    assert.ok(c.credits >= 0, `${c.name} credits ${c.credits}`);
    assert.ok(c.board.count <= 20);
  }
  for (const { cmd } of g.commandLog) assert.ok(['place', 'upgrade', 'demolish', 'attack'].includes(cmd.type));
});

test('every bot builds a working path and delivers packets', () => {
  const g = play(['easy', 'normal', 'hard'], 11);
  for (const c of g.competitors) assert.ok(c.delivered > 50, `${c.name} delivered ${c.delivered}`);
});

test('Hard beats Easy on average over several seeds', () => {
  let hard = 0, easy = 0;
  for (let seed = 1; seed <= 6; seed++) {
    const g = play(['easy', 'hard'], seed);
    const r = results(g);
    const sc = (name) => r.find((x) => x.name.includes(name)).score;
    hard += sc('Hard'); easy += sc('Easy');
  }
  assert.ok(hard > easy, `hard ${hard} vs easy ${easy}`);
});
