import { DEVICE_KINDS, DEVICE_LIMIT, REFUND_RATE, CABLE_LEVELS } from './balance.js';
import { key, makeDevice, capacityOf } from './network.js';
import { findBottleneck, upgradeMessage } from './explain.js';
import { launchAttack } from './events.js';

const fail = (reason) => ({ ok: false, reason });

export function applyCommand(game, cmd) {
  if (game.over) return fail('The round is over.');
  const comp = game.competitors[cmd.actor];
  if (!comp) return fail('Unknown player.');
  const board = comp.board;
  const k = key(cmd.x, cmd.y);

  if (cmd.type === 'place') {
    const spec = DEVICE_KINDS[cmd.kind];
    if (!spec) return fail('Unknown device.');
    if (!(cmd.x >= 0 && cmd.y >= 0 && cmd.x < game.map.w && cmd.y < game.map.h)) return fail('That tile is outside the grid.');
    if (game.map.obstacles.has(k)) return fail('That tile is blocked by an obstacle.');
    if (board.devices.has(k)) return fail('That tile is already used.');
    if (board.count >= DEVICE_LIMIT) return fail(`Device limit reached (${DEVICE_LIMIT}).`);
    if (comp.credits < spec.cost) return fail(`Not enough credits: ${spec.label} costs ${spec.cost}.`);
    comp.credits -= spec.cost;
    board.devices.set(k, makeDevice(cmd.kind, cmd.x, cmd.y));
    board.count++;
    board.dirty = true;
    return { ok: true, message: `Placed ${spec.label} at (${cmd.x},${cmd.y}).` };
  }

  if (cmd.type === 'upgrade') {
    const dev = board.devices.get(k);
    if (!dev || dev.kind !== 'cable') return fail('Only Cables can be upgraded.');
    if (dev.level >= CABLE_LEVELS.length - 1) return fail('Already at maximum capacity.');
    let cost = CABLE_LEVELS[dev.level + 1].upgradeCost;
    if (game.tick < game.effects.saleUntil) cost = Math.round(cost / 2);
    if (comp.credits < cost) return fail(`Not enough credits: this upgrade costs ${cost}.`);
    const bottleneck = findBottleneck(game, comp);
    comp.credits -= cost;
    dev.level++;
    return { ok: true, wasBottleneck: bottleneck === dev, message: upgradeMessage(bottleneck, dev, capacityOf(dev)) };
  }

  if (cmd.type === 'demolish') {
    const dev = board.devices.get(k);
    if (!dev || dev.kind === 'source' || dev.kind === 'dest') return fail('Nothing to demolish there.');
    comp.credits += Math.floor(DEVICE_KINDS[dev.kind].cost * REFUND_RATE);
    for (const p of dev.queue) if (p.kind === 'normal') { comp.dropped++; dev.dropped++; }
    board.devices.delete(k);
    board.count--;
    board.dirty = true;
    return { ok: true, message: `Demolished ${DEVICE_KINDS[dev.kind].label} at (${cmd.x},${cmd.y}).` };
  }

  if (cmd.type === 'attack') return launchAttack(game, comp, game.competitors[cmd.target], cmd.kind);
  return fail('Unknown command.');
}
