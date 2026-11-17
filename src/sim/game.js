import {
  ROUND_SECONDS, PHASES, START_CREDITS, TICKS_PER_SECOND as TPS, BOT_THINK_TICKS,
} from './balance.js';
import { makeRng } from './rng.js';
import { createMap } from './map.js';
import { makeBoard } from './network.js';
import { stepBoard } from './step.js';
import { applyCommand } from './commands.js';
import { scheduleChaos, tickChaos, tickAttacks } from './events.js';
import { bottleneckMessage, finalBottleneck } from './explain.js';
import { decide } from '../bots/index.js';

// Reaction time in ticks: harder bots react faster.
const THINK = { easy: 20, normal: 10, hard: 5 };
const BOT_NAMES = ['Ada', 'Bit', 'Cora'];
const cap1 = (s) => s[0].toUpperCase() + s.slice(1);

export function createGame(opts = {}) {
  const { seed = 1, mode = 'practice', bots = ['easy'], human = true, name = 'You',
    botsActive = true, credits = START_CREDITS, spawnOverride = null, chaos = true } = opts;
  const rng = makeRng(seed);
  const map = createMap(rng);
  const totalTicks = ROUND_SECONDS[mode] * TPS;
  const competitors = [];
  const add = (comp) => competitors.push({
    id: competitors.length, credits, score: 0, delivered: 0, dropped: 0, malwareHits: 0,
    attacksBlocked: 0, lastAttackTick: -100000, scanUntil: {}, botState: {}, board: makeBoard(map), ...comp,
  });
  if (human) add({ name, kind: 'human' });
  bots.forEach((difficulty, i) => add({
    name: `${BOT_NAMES[i % 3]} (${cap1(difficulty)})`, kind: 'bot', difficulty,
    rng: makeRng(seed * 31 + i + 7),
  }));
  const game = {
    seed, mode, rng, map, totalTicks, tick: 0, over: false, botsActive, spawnOverride,
    buildTicks: Math.floor(PHASES.build * totalTicks),
    competitors, chaos: [], effects: { spikeUntil: 0, dnsUntil: 0, saleUntil: 0 },
    attacks: [], log: [], commandLog: [], banner: null, hints: [],
  };
  if (chaos) scheduleChaos(game);
  return game;
}

export function phaseOf(game) {
  if (game.over) return 'over';
  const f = game.tick / game.totalTicks;
  if (f < PHASES.build) return 'build';
  if (f < PHASES.grace) return 'grace';
  if (f < PHASES.rush) return 'live';
  return 'rush';
}

export function issue(game, cmd) {
  game.commandLog.push({ tick: game.tick, cmd });
  return applyCommand(game, cmd);
}

export function stepGame(game, cmds = []) {
  if (game.over) return [];
  const results = [];
  for (const cmd of cmds) results.push(issue(game, cmd));
  if (game.botsActive) {
    for (const comp of game.competitors) {
      if (comp.kind !== 'bot' || game.tick % (THINK[comp.difficulty] ?? BOT_THINK_TICKS) !== 0) continue;
      for (const cmd of decide(game, comp)) issue(game, cmd);
    }
  }
  tickChaos(game);
  for (const comp of game.competitors) stepBoard(game, comp);
  tickAttacks(game);
  game.tick++;
  if (game.tick % (10 * TPS) === 0) {
    const human = game.competitors.find((c) => c.kind === 'human');
    if (human) {
      const msg = bottleneckMessage(game, human);
      if (msg) game.hints.push({ tick: game.tick, text: msg });
    }
  }
  if (game.tick >= game.totalTicks) game.over = true;
  return results;
}

export function ranking(game) {
  return [...game.competitors].sort((a, b) => b.score - a.score || a.dropped - b.dropped || a.id - b.id);
}

export function results(game) {
  return ranking(game).map((c, i) => ({
    place: i + 1, name: c.name, kind: c.kind, score: c.score, delivered: c.delivered,
    dropped: c.dropped, malwareHits: c.malwareHits, attacksBlocked: c.attacksBlocked,
    bottleneck: finalBottleneck(game, c),
  }));
}
