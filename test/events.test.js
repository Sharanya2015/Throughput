import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame } from '../src/sim/game.js';
import { applyCommand } from '../src/sim/commands.js';
import { attackCost } from '../src/sim/events.js';
import { spawnRate } from '../src/sim/step.js';
import { PATH_A, PATH_B } from '../src/sim/map.js';
import { key } from '../src/sim/network.js';

function duel(opts = {}) {
  const g = createGame({ bots: ['easy'], botsActive: false, chaos: false, credits: 100000, spawnOverride: 3, ...opts });
  g.map.obstacles.clear();
  return g;
}
const build = (g, id, tiles, kind = 'cable') =>
  tiles.forEach(([x, y]) => assert.equal(applyCommand(g, { type: 'place', actor: id, kind, x, y }).ok, true));
const run = (g, s) => { for (let i = 0; i < s * 20; i++) stepGame(g); };
const attack = (g, kind, from = 0, to = 1) => applyCommand(g, { type: 'attack', actor: from, target: to, kind });

test('attacks are locked before the Live phase', () => {
  const g = duel();
  const r = attack(g, 'ddos');
  assert.equal(r.ok, false);
  assert.match(r.reason, /unlock/);
});

test('an attack costs credits, starts a 15 s cooldown, and blocks another attack until it ends', () => {
  const g = duel();
  g.tick = 0.3 * g.totalTicks;
  const c0 = g.competitors[0].credits;
  const r = attack(g, 'latency');
  assert.equal(r.ok, true);
  assert.equal(g.competitors[0].credits, c0 - 25);
  assert.match(attack(g, 'latency').reason, /cooldown/);
  g.tick += 15 * 20;
  assert.equal(attack(g, 'latency').ok, true);
});

test('attacking the score leader costs 20% less', () => {
  const g = duel();
  g.competitors[1].score = 50;
  assert.equal(attackCost(g, g.competitors[1], 'ddos'), 32);
  assert.equal(attackCost(g, g.competitors[0], 'ddos'), 40);
});

test('malware that reaches the Destination costs the victim 3 points each; a Firewall blocks it and pays the defender 10', () => {
  const open = duel();
  build(open, 1, PATH_A);
  run(open, 12);
  open.tick = 0.3 * open.totalTicks;
  attack(open, 'malware');
  run(open, 70);
  const hit = open.competitors[1];
  assert.ok(hit.malwareHits > 0);
  assert.equal(hit.score, hit.delivered - 3 * hit.malwareHits);

  const guarded = duel();
  build(guarded, 1, PATH_A);
  applyCommand(guarded, { type: 'demolish', actor: 1, x: 4, y: 2 });
  build(guarded, 1, [[4, 2]], 'firewall');
  run(guarded, 12);
  guarded.tick = 0.3 * guarded.totalTicks;
  const credits = guarded.competitors[1].credits;
  attack(guarded, 'malware');
  run(guarded, 70);
  assert.equal(guarded.competitors[1].malwareHits, 0);
  assert.equal(guarded.competitors[1].attacksBlocked, 1);
  assert.ok(guarded.competitors[1].credits >= credits + 10);
});

test('a DDoS burst causes drops; a Load Balancer and parallel paths reduce them', () => {
  const dropsAfterDdos = (setup) => {
    const g = duel({ spawnOverride: 2 });
    setup(g);
    run(g, 12);
    g.tick = Math.max(g.tick, 0.3 * g.totalTicks);
    const before = g.competitors[1].dropped;
    attack(g, 'ddos');
    run(g, 12);
    return g.competitors[1].dropped - before;
  };
  const single = dropsAfterDdos((g) => build(g, 1, PATH_A));
  const double = dropsAfterDdos((g) => build(g, 1, [...PATH_A, ...PATH_B]));
  assert.ok(single > 0, 'single path should drop under DDoS');
  assert.ok(double <= single, `two paths (${double}) should not drop more than one (${single})`);
});

test('a Latency spike halves capacity; a Router is the counter', () => {
  const g = duel({ spawnOverride: 3 });
  build(g, 1, PATH_A);
  run(g, 12);
  g.tick = 0.3 * g.totalTicks;
  attack(g, 'latency');
  const before = g.competitors[1].delivered;
  run(g, 8);
  const slowed = (g.competitors[1].delivered - before) / 8;
  assert.ok(slowed < 2.7, `delivery should fall below the 3 pkt/s arrival, got ${slowed}`);

  const r = duel({ spawnOverride: 3 });
  build(r, 1, PATH_A);
  applyCommand(r, { type: 'demolish', actor: 1, x: 4, y: 2 });
  build(r, 1, [[4, 2]], 'router');
  assert.equal(r.competitors[1].board.latencyUntil, 0);
  r.tick = 0.3 * r.totalTicks;
  attack(r, 'latency');
  assert.equal(r.competitors[1].board.latencyUntil, 0);
});

test('a Port scan reveals the target unless a Firewall sits next to the Source', () => {
  const g = duel();
  g.tick = 0.3 * g.totalTicks;
  attack(g, 'scan');
  assert.ok(g.competitors[0].scanUntil[1] > g.tick);

  const f = duel();
  build(f, 1, [[1, 2]], 'firewall');
  f.tick = 0.3 * f.totalTicks;
  attack(f, 'scan');
  assert.equal(f.competitors[0].scanUntil[1] ?? 0, 0);
});

test('chaos events hit every competitor at the same time and a Fiber cut destroys the busiest cable', () => {
  const g = createGame({ bots: ['easy'], botsActive: false, chaos: true, credits: 100000, spawnOverride: 3 });
  g.map.obstacles.clear();
  g.chaos = [{ tick: 400, kind: 'fiber', done: false }];
  build(g, 0, PATH_A); build(g, 1, PATH_A);
  run(g, 25);
  assert.equal(g.chaos[0].done, true);
  for (const c of g.competitors) assert.equal(c.board.count, PATH_A.length - 1);
  assert.ok(g.banner && /Fiber/.test(g.banner.text));
});

function chaosGame(kind, at) {
  const g = createGame({ bots: [], botsActive: false, chaos: false, credits: 100000, spawnOverride: 2 });
  g.map.obstacles.clear();
  build(g, 0, PATH_A);
  g.chaos = [{ tick: at, kind, done: false }];
  return g;
}

test('Traffic spike doubles the spawn rate for 20 s', () => {
  const g = chaosGame('spike', 300);
  g.spawnOverride = null;
  run(g, 14); // tick 280, the base rate applies
  const base = spawnRate(g);
  run(g, 2);
  assert.equal(g.effects.spikeUntil, 300 + 400);
  assert.equal(spawnRate(g), base * 2);
});

test('DNS outage stops delivery for 5 s, then it resumes', () => {
  const g = chaosGame('dns', 400);
  run(g, 20);
  const frozen = g.competitors[0].delivered;
  run(g, 4);
  assert.equal(g.competitors[0].delivered, frozen);
  run(g, 6);
  assert.ok(g.competitors[0].delivered > frozen);
});

test('Power surge takes exactly one device per network offline for 15 s', () => {
  const g = chaosGame('surge', 400);
  run(g, 21);
  const offline = [...g.competitors[0].board.devices.values()].filter((d) => d.offlineUntil > g.tick);
  assert.equal(offline.length, 1);
  const frozen = g.competitors[0].delivered;
  run(g, 5);
  assert.ok(g.competitors[0].delivered - frozen <= 12);
  run(g, 14);
  assert.equal([...g.competitors[0].board.devices.values()].filter((d) => d.offlineUntil > 0).length, 0);
});

test('Bandwidth sale halves upgrade prices for 30 s', () => {
  const g = chaosGame('sale', 100);
  run(g, 6);
  const before = g.competitors[0].credits;
  applyCommand(g, { type: 'upgrade', actor: 0, x: 1, y: 2 });
  assert.equal(before - g.competitors[0].credits, 13);
  run(g, 31);
  const later = g.competitors[0].credits;
  applyCommand(g, { type: 'upgrade', actor: 0, x: 2, y: 2 });
  assert.equal(later - g.competitors[0].credits, 25);
});

// ---- Sponsor grant, Routing glitch, Botnet swarm and Route hijack ----

test('Sponsor grant gives every network 50 credits', () => {
  const g = duel({ credits: 100 });
  g.chaos = [{ tick: 100, kind: 'grant', done: false }];
  run(g, 6);
  for (const c of g.competitors) assert.equal(c.credits, 150);
  assert.match(g.banner.text, /Sponsor grant/);
});

test('Routing glitch halves Routers, Switches and Load Balancers for 15 s but not Cables', () => {
  const g = duel({ spawnOverride: 8 });
  build(g, 0, PATH_A);
  for (const [x, y] of PATH_A) for (let i = 0; i < 2; i++) applyCommand(g, { type: 'upgrade', actor: 0, x, y });
  applyCommand(g, { type: 'demolish', actor: 0, x: 4, y: 2 });
  build(g, 0, [[4, 2]], 'router');
  g.chaos = [{ tick: 600, kind: 'glitch', done: false }];
  const rate = (s) => { const before = g.competitors[0].delivered; run(g, s); return (g.competitors[0].delivered - before) / s; };
  run(g, 20); // settle, tick 400
  assert.ok(Math.abs(rate(8) - 8) < 0.5, 'before the glitch the Router passes 8 pkt/s');
  run(g, 5); // tick 760, glitch active (starts at 600, ends at 900)
  const during = rate(5);
  assert.ok(during < 6.5, `during the glitch delivery is capped near 6 pkt/s, got ${during}`);
  run(g, 10);
  assert.ok(Math.abs(rate(8) - 8) < 0.7, 'after the glitch delivery recovers');
});

function swarmTarget(devices) {
  const g = duel({ spawnOverride: 2 });
  build(g, 1, PATH_A);
  if (devices.firewall) { applyCommand(g, { type: 'demolish', actor: 1, x: 4, y: 2 }); build(g, 1, [[4, 2]], 'firewall'); }
  if (devices.balancer) { applyCommand(g, { type: 'demolish', actor: 1, x: 7, y: 3 }); build(g, 1, [[7, 3]], 'balancer'); }
  run(g, 12);
  g.tick = Math.max(g.tick, 0.3 * g.totalTicks);
  return g;
}

test('Botnet swarm needs a Firewall AND a Load Balancer together to be blocked', () => {
  const none = swarmTarget({});
  assert.equal(attack(none, 'swarm').ok, true);
  run(none, 20);
  assert.ok(none.competitors[1].malwareHits > 0, 'no defenses: malware reaches the Destination');
  assert.ok(none.competitors[1].dropped > 0, 'no defenses: the flood drops packets');

  const onlyFirewall = swarmTarget({ firewall: true });
  attack(onlyFirewall, 'swarm');
  assert.ok(onlyFirewall.competitors[1].board.ddos, 'a Firewall alone does not stop the flood');
  run(onlyFirewall, 20);
  assert.equal(onlyFirewall.competitors[1].malwareHits, 0, 'the Firewall does stop the malware part');
  assert.equal(onlyFirewall.competitors[1].attacksBlocked, 0, 'half a defense earns no reward');

  const onlyBalancer = swarmTarget({ balancer: true });
  attack(onlyBalancer, 'swarm');
  run(onlyBalancer, 20);
  assert.ok(onlyBalancer.competitors[1].malwareHits > 0, 'a Load Balancer alone does not stop the malware');
  assert.equal(onlyBalancer.competitors[1].attacksBlocked, 0);

  const both = swarmTarget({ firewall: true, balancer: true });
  const credits = both.competitors[1].credits;
  attack(both, 'swarm');
  assert.equal(both.competitors[1].board.ddos, null, 'both defenses: no flood');
  run(both, 10);
  assert.equal(both.competitors[1].malwareHits, 0);
  assert.equal(both.competitors[1].attacksBlocked, 1);
  assert.ok(both.competitors[1].credits >= credits + 10, 'blocked attack pays the defender');
});

function hijackTarget({ router, spare }) {
  const g = duel({ spawnOverride: 2 });
  build(g, 1, spare ? [...PATH_A, ...PATH_B] : PATH_A);
  if (router) { applyCommand(g, { type: 'demolish', actor: 1, x: 4, y: 2 }); build(g, 1, [[4, 2]], 'router'); }
  run(g, 12);
  g.tick = Math.max(g.tick, 0.3 * g.totalTicks);
  return g;
}
const offline = (g) => [...g.competitors[1].board.devices.values()].filter((d) => d.offlineUntil > g.tick);

test('Route hijack needs a Router AND a second path together to be blocked', () => {
  const bare = hijackTarget({});
  attack(bare, 'hijack');
  const [victim] = offline(bare);
  assert.ok(victim, 'with no defenses a device goes offline');
  assert.equal(victim.offlineUntil - bare.tick, 12 * 20, 'full 12 s outage');

  const routerOnly = hijackTarget({ router: true });
  attack(routerOnly, 'hijack');
  assert.equal(offline(routerOnly)[0].offlineUntil - routerOnly.tick, 6 * 20, 'one defense halves the outage');

  const spareOnly = hijackTarget({ spare: true });
  attack(spareOnly, 'hijack');
  assert.equal(offline(spareOnly)[0].offlineUntil - spareOnly.tick, 6 * 20);

  const both = hijackTarget({ router: true, spare: true });
  const before = both.competitors[1].credits;
  attack(both, 'hijack');
  assert.equal(offline(both).length, 0, 'both defenses: nothing goes offline');
  run(both, 14);
  assert.equal(both.competitors[1].attacksBlocked, 1);
  assert.ok(both.competitors[1].credits >= before + 10);
});

test('the two new attacks cost 55 and 45 credits and respect the cooldown', () => {
  const g = duel();
  g.tick = 0.3 * g.totalTicks;
  const c0 = g.competitors[0].credits;
  assert.equal(attack(g, 'swarm').ok, true);
  assert.equal(g.competitors[0].credits, c0 - 55);
  assert.match(attack(g, 'hijack').reason, /cooldown/);
  g.tick += 300;
  const c1 = g.competitors[0].credits;
  assert.equal(attack(g, 'hijack').ok, true);
  assert.equal(g.competitors[0].credits, c1 - 45);
});
