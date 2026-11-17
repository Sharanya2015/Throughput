import {
  CHAOS_AT, CHAOS_KINDS, CHAOS_SECONDS, CHAOS_LABELS, ATTACKS, ATTACK_COOLDOWN_SECONDS,
  LEADER_DISCOUNT, BLOCK_REWARD, DDOS_FACTOR, TICKS_PER_SECOND as TPS, PHASES, GRANT_CREDITS,
} from './balance.js';
import { key, winSum, neighborsOf } from './network.js';

const fail = (reason) => ({ ok: false, reason });
const log = (game, text) => game.log.push({ tick: game.tick, text });

export function scheduleChaos(game) {
  game.chaos = CHAOS_AT.map((f) => ({
    tick: Math.floor(f * game.totalTicks), kind: game.rng.pick(CHAOS_KINDS), done: false,
  }));
}

// The device with the highest utilization over the last 5 s (ties: closest to the Destination).
function busiest(game, board, onlyCables) {
  let best = null, bestSent = -1, bestDist = 1e9;
  for (const d of board.devices.values()) {
    if (d.kind === 'source' || d.kind === 'dest') continue;
    if (onlyCables && d.kind !== 'cable') continue;
    const sent = winSum(d.sent, game.tick);
    const dist = board.dist.get(key(d.x, d.y)) ?? 99;
    if (sent > bestSent || (sent === bestSent && dist < bestDist)) { best = d; bestSent = sent; bestDist = dist; }
  }
  return best;
}

function applyChaos(game, kind) {
  const t = game.tick;
  if (kind === 'spike') game.effects.spikeUntil = t + CHAOS_SECONDS.spike * TPS;
  if (kind === 'dns') game.effects.dnsUntil = t + CHAOS_SECONDS.dns * TPS;
  if (kind === 'sale') game.effects.saleUntil = t + CHAOS_SECONDS.sale * TPS;
  if (kind === 'glitch') game.effects.glitchUntil = t + CHAOS_SECONDS.glitch * TPS;
  for (const comp of game.competitors) {
    const board = comp.board;
    if (kind === 'grant') comp.credits += GRANT_CREDITS;
    if (kind === 'fiber') {
      const c = busiest(game, board, true);
      if (c) {
        for (const p of c.queue) if (p.kind === 'normal') { comp.dropped++; c.dropped++; }
        board.devices.delete(key(c.x, c.y)); board.count--; board.dirty = true;
      }
    }
    if (kind === 'surge') {
      const list = [...board.devices.values()].filter((d) => d.kind !== 'source' && d.kind !== 'dest')
        .sort((a, b) => (key(a.x, a.y) < key(b.x, b.y) ? -1 : 1));
      if (list.length) { game.rng.pick(list).offlineUntil = t + CHAOS_SECONDS.surge * TPS; board.dirty = true; }
    }
  }
  game.banner = { text: CHAOS_LABELS[kind], until: t + 5 * TPS };
  log(game, CHAOS_LABELS[kind]);
}

export function tickChaos(game) {
  for (const ev of game.chaos) {
    if (!ev.done && game.tick >= ev.tick) { ev.done = true; applyChaos(game, ev.kind); }
  }
}

export const attacksUnlocked = (game) => game.tick >= Math.floor(PHASES.grace * game.totalTicks);

export function attackCost(game, target, kind) {
  const base = ATTACKS[kind].cost;
  const top = Math.max(...game.competitors.map((c) => c.score));
  const leader = top > 0 && target.score === top;
  return leader ? Math.round(base * (1 - LEADER_DISCOUNT)) : base;
}

export function cooldownLeft(game, comp) {
  return Math.max(0, comp.lastAttackTick + ATTACK_COOLDOWN_SECONDS * TPS - game.tick);
}

function hasKind(board, kind) { return [...board.devices.values()].some((d) => d.kind === kind); }
function parallelPaths(board) {
  const src = board.source;
  const sd = board.dist.get(key(src.x, src.y));
  if (sd === undefined) return false;
  return neighborsOf(src.x, src.y).filter(([x, y]) => board.devices.has(key(x, y)) &&
    board.dist.get(key(x, y)) === sd - 1).length >= 2;
}

function pickBusiest(game, list) {
  let best = null, bestSent = -1;
  for (const d of list) {
    const sent = winSum(d.sent, game.tick);
    if (sent > bestSent) { best = d; bestSent = sent; }
  }
  return best;
}

export function launchAttack(game, attacker, target, kind) {
  const spec = ATTACKS[kind];
  if (!spec) return fail('Unknown attack.');
  if (!target || target === attacker) return fail('Pick another player as the target.');
  if (!attacksUnlocked(game)) return fail('Attacks unlock when the Live phase starts.');
  if (cooldownLeft(game, attacker) > 0) return fail('Attack cooldown: wait a few seconds.');
  const cost = attackCost(game, target, kind);
  if (attacker.credits < cost) return fail(`Not enough credits: ${spec.label} costs ${cost}.`);
  attacker.credits -= cost;
  attacker.lastAttackTick = game.tick;
  const t = game.tick;
  const board = target.board;
  const rec = { kind, attacker: attacker.id, defender: target.id, counter: false, resolveAt: null, done: false };

  if (kind === 'ddos') {
    const b = busiest(game, board, false) || board.source;
    const factor = hasKind(board, 'balancer') ? DDOS_FACTOR.balancer : (parallelPaths(board) ? DDOS_FACTOR.parallel : 1);
    rec.counter = factor < 1;
    board.ddos = { until: t + spec.seconds * TPS, key: key(b.x, b.y), acc: 0, factor };
    rec.resolveAt = board.ddos.until;
  } else if (kind === 'malware') {
    Object.assign(rec, { injected: 0, blocked: 0, reached: 0, dropped: 0, total: spec.count, counter: hasKind(board, 'firewall'), resolveAt: t + 60 * TPS });
    board.malwareJobs = board.malwareJobs || [];
    board.malwareJobs.push({ rec, left: spec.count });
  } else if (kind === 'latency') {
    rec.counter = hasKind(board, 'router');
    if (!rec.counter) board.latencyUntil = t + spec.seconds * TPS;
    rec.resolveAt = t + spec.seconds * TPS;
  } else if (kind === 'swarm') {
    // Needs a Firewall AND a Load Balancer together: the flood and the malware are separate problems.
    const fw = hasKind(board, 'firewall'), lb = hasKind(board, 'balancer');
    Object.assign(rec, { injected: 0, blocked: 0, reached: 0, dropped: 0, total: spec.count, counter: fw && lb });
    rec.resolveAt = t + spec.seconds * TPS;
    if (!rec.counter) {
      const b = busiest(game, board, false) || board.source;
      const factor = lb ? DDOS_FACTOR.balancer : (parallelPaths(board) ? DDOS_FACTOR.parallel : 1);
      board.ddos = { until: t + spec.seconds * TPS, key: key(b.x, b.y), acc: 0, factor };
      if (!fw) {
        board.malwareJobs = board.malwareJobs || [];
        board.malwareJobs.push({ rec, left: spec.count, after: t + spec.seconds * TPS });
      }
    }
  } else if (kind === 'hijack') {
    // Needs a Router AND a second path together: the Router re-routes, the spare path carries the load.
    const router = hasKind(board, 'router'), spare = parallelPaths(board);
    rec.counter = router && spare;
    rec.resolveAt = t + spec.seconds * TPS;
    if (!rec.counter) {
      const all = [...board.devices.values()].filter((d) => d.kind !== 'source' && d.kind !== 'dest');
      const splitters = all.filter((d) => ['router', 'switch', 'balancer'].includes(d.kind));
      const victim = pickBusiest(game, splitters.length ? splitters : all);
      if (victim) {
        const seconds = (router || spare) ? spec.seconds / 2 : spec.seconds;
        victim.offlineUntil = t + seconds * TPS;
        board.dirty = true;
      }
    }
  } else if (kind === 'scan') {
    const sn = neighborsOf(board.source.x, board.source.y).some(([x, y]) => board.devices.get(key(x, y))?.kind === 'firewall');
    rec.counter = sn;
    if (!sn) attacker.scanUntil[target.id] = t + spec.seconds * TPS;
    rec.resolveAt = t + spec.seconds * TPS;
  }
  game.attacks.push(rec);
  log(game, `${attacker.name} launched ${spec.label} at ${target.name}.`);
  return { ok: true, message: `${spec.label} launched at ${target.name} for ${cost} credits.`, cost };
}

export function tickAttacks(game) {
  for (const rec of game.attacks) {
    if (rec.done) continue;
    const defender = game.competitors[rec.defender];
    if (rec.kind === 'malware') {
      const finished = rec.injected >= rec.total && rec.blocked + rec.reached + rec.dropped >= rec.total;
      if (!finished && game.tick < rec.resolveAt) continue;
      rec.done = true;
      if (rec.reached === 0 && rec.injected > 0) reward(game, defender, rec);
    } else if (game.tick >= rec.resolveAt) {
      rec.done = true;
      if (rec.counter) reward(game, defender, rec);
    }
  }
}

function reward(game, defender, rec) {
  defender.credits += BLOCK_REWARD;
  defender.attacksBlocked++;
  log(game, `${defender.name} blocked ${ATTACKS[rec.kind].label} and gained ${BLOCK_REWARD} credits.`);
}
