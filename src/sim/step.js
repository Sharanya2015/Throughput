import {
  DT, MAX_HOPS, MALWARE_PENALTY, SPAWN, PHASES,
} from './balance.js';
import {
  key, neighborsOf, winAdd, capacityOf, queueMax, specOf, rebuild,
} from './network.js';

export function spawnRate(game) {
  if (game.spawnOverride != null) return game.spawnOverride;
  const frac = game.tick / game.totalTicks;
  const level = Math.min(4, Math.floor(frac / SPAWN.levelEvery));
  let rate = SPAWN.base + level * SPAWN.stepPerLevel;
  if (frac >= PHASES.rush) rate *= SPAWN.rushMultiplier;
  if (game.tick < game.effects.spikeUntil) rate *= 2;
  return rate;
}

export function dropPacket(game, comp, dev, pkt) {
  if (pkt.kind === 'junk') return;
  if (pkt.kind === 'malware') { if (pkt.rec) pkt.rec.dropped++; return; }
  comp.dropped++;
  dev.dropped++;
  winAdd(dev.dropW, game.tick);
}

export function enqueue(game, comp, dev, pkt) {
  winAdd(dev.recv, game.tick); // offered load: counts packets that arrive, accepted or not
  if (dev.queue.length >= queueMax(dev)) { dropPacket(game, comp, dev, pkt); return false; }
  dev.queue.push(pkt);
  return true;
}

function effectiveCap(game, comp, dev) {
  let cap = capacityOf(dev);
  if (comp.board.latencyUntil > game.tick && dev.kind !== 'router') cap *= 0.5;
  return cap;
}

function pickNext(game, board, dev) {
  const d = board.dist.get(key(dev.x, dev.y));
  const cand = [];
  for (const [nx, ny] of neighborsOf(dev.x, dev.y)) {
    const nd = board.devices.get(key(nx, ny));
    if (!nd || nd.offlineUntil > game.tick) continue;
    if (board.dist.get(key(nx, ny)) === d - 1) cand.push(nd);
  }
  if (!cand.length) return null;
  const spec = specOf(dev);
  if (spec.rule === 'first') return cand[0];
  if (spec.rule === 'shortest') {
    return cand.reduce((best, c) => (c.queue.length < best.queue.length ? c : best), cand[0]);
  }
  const n = Math.min(spec.fan, cand.length);
  return cand[dev.rr++ % n];
}

function deliver(game, comp, pkt) {
  if (pkt.kind === 'normal') {
    comp.delivered++;
    comp.credits++;
  } else if (pkt.kind === 'malware') {
    comp.malwareHits++;
    if (pkt.rec) pkt.rec.reached++;
  }
  comp.score = comp.delivered - MALWARE_PENALTY * comp.malwareHits;
}

export function stepBoard(game, comp) {
  const t = game.tick;
  const board = comp.board;
  for (const d of board.devices.values()) {
    if (d.offlineUntil && d.offlineUntil <= t) { d.offlineUntil = 0; board.dirty = true; }
  }
  if (board.dirty) rebuild(board, t);

  if (t >= game.buildTicks) {
    board.spawnAcc += spawnRate(game) * DT;
    while (board.spawnAcc >= 1) {
      board.spawnAcc -= 1;
      enqueue(game, comp, board.source, { kind: 'normal', hops: 0 });
    }
  }
  if (board.malwareJobs && board.malwareJobs.length) {
    board.malwareAcc += 5 * DT;
    while (board.malwareAcc >= 1 && board.malwareJobs.length) {
      board.malwareAcc -= 1;
      const job = board.malwareJobs[0];
      job.rec.injected++;
      enqueue(game, comp, board.source, { kind: 'malware', hops: 0, rec: job.rec });
      if (--job.left <= 0) board.malwareJobs.shift();
    }
  }
  let junkPending = !!(board.ddos && t < board.ddos.until);
  if (junkPending) board.ddos.acc += 20 * board.ddos.factor * DT;
  const injectJunk = () => {
    if (!junkPending) return;
    junkPending = false;
    const target = board.devices.get(board.ddos.key) || board.source;
    while (board.ddos.acc >= 1) {
      board.ddos.acc -= 1;
      enqueue(game, comp, target, { kind: 'junk', hops: 0 });
    }
  };
  const junkTarget = junkPending ? (board.devices.get(board.ddos.key) || board.source) : null;

  for (const dev of board.order) {
    const cap = effectiveCap(game, comp, dev);
    dev.budget = Math.min(dev.budget + cap * DT, 1 + cap * DT);
    if (dev.offlineUntil > t) continue;
    while (dev.budget >= 1 && dev.queue.length) {
      const next = pickNext(game, board, dev);
      if (!next) break;
      if (next.kind === 'dest' && game.effects.dnsUntil > t) break;
      const pkt = dev.queue.shift();
      dev.budget -= 1;
      pkt.hops++;
      winAdd(dev.sent, t);
      if (dev.kind === 'firewall' && pkt.kind === 'malware') {
        if (pkt.rec) pkt.rec.blocked++;
        continue;
      }
      if (pkt.hops > MAX_HOPS) { dropPacket(game, comp, dev, pkt); continue; }
      if (next.kind === 'dest') deliver(game, comp, pkt);
      else enqueue(game, comp, next, pkt);
    }
    // A flood arrives right after the target forwards, so it wins the freed queue slot.
    if (dev === junkTarget) injectJunk();
  }
  injectJunk();
}
