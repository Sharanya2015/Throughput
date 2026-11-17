import { winSum, capacityOf, specOf, key } from './network.js';

const where = (d) => `${specOf(d).label} at (${d.x},${d.y})`;

// The device that dropped the most packets in the last 10 seconds.
export function findBottleneck(game, comp) {
  const t = game.tick;
  let best = null, bestDrops = 0;
  for (const d of comp.board.order.concat([comp.board.source])) {
    const drops = winSum(d.dropW, t);
    if (drops > bestDrops || (drops === bestDrops && best && drops > 0 &&
        comp.board.dist.get(key(d.x, d.y)) < comp.board.dist.get(key(best.x, best.y)))) {
      best = d; bestDrops = drops;
    }
  }
  return bestDrops > 0 ? best : null;
}

export function bottleneckMessage(game, comp) {
  const board = comp.board;
  if (game.tick >= game.buildTicks && board.dist.size && !board.dist.has(key(board.source.x, board.source.y)) &&
      board.source.queue.length > 0) {
    return 'Your Source is not connected to the Destination. Link them with adjacent devices.';
  }
  const b = findBottleneck(game, comp);
  if (!b) return null;
  const arriving = (winSum(b.recv, game.tick) / 5).toFixed(1);
  const drops = winSum(b.dropW, game.tick);
  const cap = capacityOf(b);
  let advice = 'Add a parallel path or replace it with a faster device.';
  if (b.kind === 'cable' && b.level < 2) advice = 'Upgrade it, or add a parallel path.';
  else if (b.kind === 'firewall') advice = 'Firewalls pass only 6 pkt/s. Add a second path so each carries less.';
  else if (b.kind === 'source') advice = 'More packets are arriving than the Source can pass. Add a second path out of the Source.';
  return `${where(b)} passes ${cap} pkt/s but about ${arriving} pkt/s arrive, so ${drops} packets were dropped in the last 10 s. ${advice}`;
}

export function upgradeMessage(bottleneck, dev, newCap) {
  if (!bottleneck) {
    return `Upgraded ${where(dev)} to ${newCap} pkt/s. No packets are being dropped right now, so nothing changes until load rises.`;
  }
  if (bottleneck === dev) {
    return `Good: ${where(dev)} was the bottleneck. It now passes ${newCap} pkt/s. Watch for the next slowest device.`;
  }
  return `That link was not the bottleneck. Traffic is limited by the ${where(bottleneck)} (${capacityOf(bottleneck)} pkt/s). Upgrading anything else does not raise delivery.`;
}

export function finalBottleneck(game, comp) {
  const board = comp.board;
  if (!board.dist.has(key(board.source.x, board.source.y))) {
    return 'The network was disconnected at the end: a link was destroyed or removed, so no packets could reach the Destination. Rebuild the missing device.';
  }
  let worst = null;
  for (const d of comp.board.devices.values()) if (d.dropped > (worst ? worst.dropped : 0)) worst = d;
  if (!worst) return 'No packets were dropped. Your network kept up with the load.';
  return `${where(worst)} dropped the most packets (${worst.dropped}). It passes ${capacityOf(worst)} pkt/s.`;
}
