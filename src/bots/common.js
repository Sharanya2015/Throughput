import { key } from '../sim/network.js';
import { findBottleneck } from '../sim/explain.js';
import { attacksUnlocked, cooldownLeft } from '../sim/events.js';
import { TICKS_PER_SECOND as TPS } from '../sim/balance.js';

export const has = (board, x, y) => board.devices.has(key(x, y));
// First tile of a plan with no device, ignoring tiles reserved for something else (such as a Firewall).
export const missing = (board, tiles, skip = []) =>
  tiles.find(([x, y]) => !has(board, x, y) && !skip.some(([sx, sy]) => sx === x && sy === y));
export const place = (comp, kind, [x, y]) => ({ type: 'place', actor: comp.id, kind, x, y });
export const demolish = (comp, [x, y]) => ({ type: 'demolish', actor: comp.id, x, y });
export const upgrade = (comp, d) => ({ type: 'upgrade', actor: comp.id, x: d.x, y: d.y });

// Lowest-level Cable on the given tiles, in plan order.
export function lowestCable(board, tiles) {
  let best = null;
  for (const [x, y] of tiles) {
    const d = board.devices.get(key(x, y));
    if (d && d.kind === 'cable' && d.level < 2 && (!best || d.level < best.level)) best = d;
  }
  return best;
}

// Normal and Hard bots fix the device that drops packets first; Easy bots never look.
export function upgradeTarget(game, comp, tiles) {
  const b = findBottleneck(game, comp);
  if (b && b.kind === 'cable' && b.level < 2) return b;
  return lowestCable(comp.board, tiles);
}

export function opponents(game, comp) { return game.competitors.filter((c) => c.id !== comp.id); }
export function leaderOf(game, comp) {
  const others = opponents(game, comp);
  return others.reduce((a, b) => (b.score > a.score ? b : a), others[0]);
}
export function canAttack(game, comp, everyTicks) {
  return attacksUnlocked(game) && cooldownLeft(game, comp) === 0 &&
    game.tick - (comp.botState.lastAttack ?? -1e9) >= everyTicks * 1;
}
export const secs = (n) => n * TPS;
