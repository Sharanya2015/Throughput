// Plays N headless rounds of Easy vs Normal vs Hard and prints win rates.
import { createGame, stepGame, results } from '../src/sim/game.js';

const rounds = Number(process.argv[2] || 100);
const mode = process.argv[3] || 'practice';
const wins = { Easy: 0, Normal: 0, Hard: 0 };
const total = { Easy: 0, Normal: 0, Hard: 0 };
for (let seed = 1; seed <= rounds; seed++) {
  const g = createGame({ seed, mode, human: false, bots: ['easy', 'normal', 'hard'] });
  while (!g.over) stepGame(g);
  const r = results(g);
  wins[r[0].name.match(/\((\w+)\)/)[1]]++;
  for (const row of r) total[row.name.match(/\((\w+)\)/)[1]] += row.score;
}
console.log(`${rounds} ${mode} rounds`);
for (const k of Object.keys(wins)) {
  console.log(`${k.padEnd(7)} wins ${String(wins[k]).padStart(4)} (${(100 * wins[k] / rounds).toFixed(0)}%)  average score ${(total[k] / rounds).toFixed(0)}`);
}
