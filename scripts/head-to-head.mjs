// Duels for SC-005: in one-on-one rounds, how often does the stronger bot outscore the weaker one?
import { createGame, stepGame } from '../src/sim/game.js';
const rounds = Number(process.argv[2] || 100), mode = process.argv[3] || 'practice';
const duels = [['normal', 'easy'], ['hard', 'normal'], ['hard', 'easy']];
console.log(`${rounds} ${mode} duels (one bot of each difficulty, no human):`);
for (const [a, b] of duels) {
  let wins = 0;
  for (let seed = 1; seed <= rounds; seed++) {
    const g = createGame({ seed, mode, human: false, bots: [a, b] });
    while (!g.over) stepGame(g);
    if (g.competitors[0].score > g.competitors[1].score) wins++;
  }
  console.log(`${a} beats ${b}: ${(100 * wins / rounds).toFixed(0)}%`);
}
