import { h, clear, mmss } from './dom.js';
import { DEVICE_KINDS, ATTACKS, GRID, TICKS_PER_SECOND as TPS } from '../sim/balance.js';
import { key, specOf, capacityOf, queueMax, utilization, winSum } from '../sim/network.js';
import { phaseOf } from '../sim/game.js';
import { attackCost, attacksUnlocked, cooldownLeft } from '../sim/events.js';
import { bottleneckMessage } from '../sim/explain.js';

const PHASE_TEXT = {
  build: 'Build: no packets yet. Link SRC to DST with touching devices.',
  grace: 'Grace: packets are flowing. Attacks unlock soon.',
  live: 'Live: attacks and chaos events are active.',
  rush: 'Rush Hour: packets double. Last push, watch the leaderboard!',
  over: 'Round over.',
};

export function createHud(root, game, human, ctl) {
  const stat = (label) => { const v = h('strong', {}, '0'); return { v, el: h('div', { class: 'stat' }, h('span', {}, label), v) }; };
  const time = stat('Time left'), credits = stat('Credits'), score = stat('Score'), delivered = stat('Delivered'), dropped = stat('Dropped');
  const phase = h('p', { class: 'phase', 'aria-live': 'polite' });
  const banner = h('p', { class: 'banner', role: 'status' });
  const pause = h('button', { type: 'button', onclick: ctl.togglePause }, 'Pause (P)');
  const speed = h('select', { 'aria-label': 'Game speed', onchange: (e) => ctl.setSpeed(Number(e.target.value)) },
    ...[1, 2, 4].map((n) => h('option', { value: n }, `${n}x speed`)));

  const toolButtons = new Map();
  const palette = h('div', { class: 'palette', role: 'group', 'aria-label': 'Devices' });
  for (const [kind, spec] of Object.entries(DEVICE_KINDS)) {
    const b = h('button', { type: 'button', class: `tool shape-${kind}`, 'aria-pressed': 'false', onclick: () => ctl.setTool(kind) },
      h('b', {}, `${spec.letter} ${spec.label}`), h('span', {}, `${spec.cost} credits, ${spec.cap} pkt/s`));
    toolButtons.set(kind, b);
    palette.append(b);
  }

  const selTitle = h('h3', {}, 'Selected tile');
  const selBody = h('p', { class: 'sel' }, 'Select a tile.');
  const upgradeBtn = h('button', { type: 'button', onclick: ctl.upgrade }, 'Upgrade (U)');
  const demolishBtn = h('button', { type: 'button', onclick: ctl.demolish }, 'Demolish (X)');

  const target = h('select', { 'aria-label': 'Attack target' });
  const attackStatus = h('p', { class: 'hint' });
  const attackBtns = new Map();
  const attackBox = h('div', { class: 'attacks' });
  for (const [kind, a] of Object.entries(ATTACKS)) {
    const b = h('button', { type: 'button', onclick: () => ctl.attack(kind, Number(target.value)) }, `${a.label}`, h('small', {}, ''));
    attackBtns.set(kind, b);
    attackBox.append(b);
  }
  for (const c of game.competitors.slice(1)) target.append(h('option', { value: c.id }, c.name));

  const feed = h('ul', { class: 'feed', role: 'log', 'aria-label': 'Messages' });
  const board = h('div', { class: 'scoreboard' });
  const scanCard = h('section', { class: 'card', hidden: true }, h('h3', {}, 'Port scan results'), board);
  let boardSig = '', feedSig = '';

  root.append(
    h('div', { class: 'stats' }, time.el, credits.el, score.el, delivered.el, dropped.el),
    phase, banner,
    h('div', { class: 'controls' }, pause, h('label', {}, 'Speed ', speed)));
  const side = h('div', { class: 'side' },
    h('section', { class: 'card' }, h('h3', {}, 'Devices'), palette,
      h('p', { class: 'hint' }, 'Pick a device, then click tiles. Or focus a tile and press its letter. Esc clears.')),
    h('section', { class: 'card' }, selTitle, selBody, h('div', { class: 'row' }, upgradeBtn, demolishBtn)),
    h('section', { class: 'card' }, h('h3', {}, 'Attacks'), h('label', {}, 'Target ', target), attackBox, attackStatus),
    h('section', { class: 'card' }, h('h3', {}, 'What is happening'), feed),
    scanCard);

  function miniBoard(c) {
    const rows = [];
    for (let y = 0; y < GRID.h; y++) {
      let line = '';
      for (let x = 0; x < GRID.w; x++) {
        const k = key(x, y);
        const d = c.board.devices.get(k);
        line += d ? (d.kind === 'source' ? 'S' : d.kind === 'dest' ? 'D' : d.kind === 'cable' ? 'c' : specOf(d).letter) : game.map.obstacles.has(k) ? '#' : '.';
      }
      rows.push(line);
    }
    return rows.join('\n');
  }

  function update(state) {
    const t = game.tick;
    const left = (game.totalTicks - t) / TPS;
    time.v.textContent = mmss(left);
    credits.v.textContent = human.credits;
    score.v.textContent = human.score;
    delivered.v.textContent = human.delivered;
    dropped.v.textContent = human.dropped;
    const ph = phaseOf(game);
    phase.textContent = state.paused ? 'Paused.' : PHASE_TEXT[ph];
    banner.textContent = game.banner && game.banner.until > t ? game.banner.text : '';
    pause.textContent = state.paused ? 'Resume (P)' : 'Pause (P)';
    for (const [kind, b] of toolButtons) b.setAttribute('aria-pressed', String(state.tool === kind));

    const d = human.board.devices.get(key(state.sel.x, state.sel.y));
    const pos = `(${state.sel.x},${state.sel.y})`;
    let text = `Tile ${pos}: empty.`;
    if (game.map.obstacles.has(key(state.sel.x, state.sel.y))) text = `Tile ${pos}: obstacle.`;
    if (d) {
      const sent = winSum(d.sent, t) / 5;
      text = `${specOf(d).label} at ${pos}. Passes ${capacityOf(d)} pkt/s, using ${Math.round(utilization(d, t) * 100)}%. Queue ${d.queue.length}/${queueMax(d)}. Dropped ${d.dropped} in total (${winSum(d.dropW, t)} in the last 10 s). Sending ${sent.toFixed(1)} pkt/s.`;
    }
    selBody.textContent = text;
    upgradeBtn.disabled = !(d && d.kind === 'cable');
    demolishBtn.disabled = !(d && d.kind !== 'source' && d.kind !== 'dest');

    const unlocked = attacksUnlocked(game);
    const cd = cooldownLeft(game, human);
    const tgt = game.competitors[Number(target.value)];
    for (const [kind, b] of attackBtns) {
      const cost = tgt ? attackCost(game, tgt, kind) : ATTACKS[kind].cost;
      b.querySelector('small').textContent = ` ${cost} credits. Counter: ${ATTACKS[kind].counter}`;
      b.disabled = !unlocked || cd > 0 || ph === 'over';
    }
    attackStatus.textContent = !unlocked ? 'Attacks unlock in the Live phase.' : cd > 0 ? `Cooldown: ${Math.ceil(cd / TPS)} s` : 'Ready to attack.';

    const fsig = state.feed.length + ':' + (state.feed[state.feed.length - 1]?.text ?? '');
    if (fsig !== feedSig) {
      feedSig = fsig;
      clear(feed);
      for (const m of state.feed.slice(-8).reverse()) feed.append(h('li', { class: m.kind }, m.text));
    }

    const scans = game.competitors.filter((c) => c !== human && (human.scanUntil[c.id] ?? 0) > t);
    const sig = scans.map((c) => `${c.id}:${c.board.count}:${c.score}`).join('|');
    if (sig !== boardSig) {
      boardSig = sig;
      clear(board);
      scanCard.hidden = scans.length === 0;
      for (const c of scans) {
        board.append(h('details', { open: true }, h('summary', {}, `Port scan of ${c.name}`), h('pre', { 'aria-label': `Layout of ${c.name}` }, miniBoard(c))));
      }
    }
  }
  return { side, update };
}
