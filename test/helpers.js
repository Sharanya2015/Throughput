import { createGame, stepGame } from '../src/sim/game.js';
import { applyCommand } from '../src/sim/commands.js';
import { PATH_A, PATH_B } from '../src/sim/map.js';

export function lab({ spawn, bots = [], seed = 1 } = {}) {
  const game = createGame({ seed, mode: 'practice', bots, human: true, credits: 100000, spawnOverride: spawn, chaos: false, botsActive: false });
  game.map.obstacles.clear();
  return game;
}
export const me = (g) => g.competitors[0];
export function build(g, tiles, kind = 'cable', actor = 0) {
  for (const [x, y] of tiles) {
    const r = applyCommand(g, { type: 'place', actor, kind, x, y });
    if (!r.ok) throw new Error(`place failed at ${x},${y}: ${r.reason}`);
  }
}
export function run(g, seconds) { for (let i = 0; i < seconds * 20; i++) stepGame(g); }
// Delivered packets per second over a steady-state window.
export function rate(g, warmup, window) {
  run(g, warmup);
  const before = me(g).delivered;
  run(g, window);
  return (me(g).delivered - before) / window;
}
export { PATH_A, PATH_B };
