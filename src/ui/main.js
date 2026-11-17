import { h, clear } from './dom.js';
import { renderSetup } from './setup.js';
import { createBoard } from './board.js';
import { createHud } from './hud.js';
import { renderResults } from './results.js';
import { createGame, stepGame, issue } from '../sim/game.js';
import { DEVICE_KINDS, DT } from '../sim/balance.js';
import { key } from '../sim/network.js';

const root = document.getElementById('app');
let loop = null;

function showSetup() { stopLoop(); renderSetup(root, startGame); }
function stopLoop() { if (loop) { cancelAnimationFrame(loop); loop = null; } }

function startGame(opts) {
  stopLoop();
  clear(root);
  const game = createGame({ seed: opts.seed, mode: opts.mode, bots: opts.bots, human: true, name: 'You' });
  const human = game.competitors[0];
  const state = { sel: { x: 1, y: 2 }, tool: null, paused: false, speed: 1, feed: [], hints: 0, logs: 0 };
  const say = (text, kind = 'info') => state.feed.push({ text, kind });
  say('Build a chain of touching devices from SRC to DST. Pick Cable (C) and click tiles (1,2), (2,2) and onward. A path needs 9 cables.', 'tip');

  const act = (cmd) => {
    const r = issue(game, { ...cmd, actor: 0 });
    say(r.ok ? r.message : r.reason, !r.ok ? 'bad' : r.wasBottleneck === false ? 'hint' : 'ok');
    return r;
  };
  const ctl = {
    togglePause: () => { state.paused = !state.paused; },
    setSpeed: (n) => { state.speed = n; },
    setTool: (kind) => { state.tool = state.tool === kind ? null : kind; },
    upgrade: () => act({ type: 'upgrade', x: state.sel.x, y: state.sel.y }),
    demolish: () => act({ type: 'demolish', x: state.sel.x, y: state.sel.y }),
    attack: (kind, target) => act({ type: 'attack', kind, target }),
  };

  const left = h('section', { class: 'left' });
  const boardHolder = h('div', { class: 'boardwrap' });
  const hud = createHud(left, game, human, ctl);
  left.append(boardHolder, h('p', { class: 'legend' },
    'Shapes: Cable = pill, Switch = square, Router = circle, Firewall = hexagon, Load Balancer = octagon. C+ and C++ are upgraded cables. q = queue, % = capacity used.'));
  root.append(h('div', { class: 'layout' }, left, hud.side));

  const board = createBoard(boardHolder, game, human, {
    onSelect: (x, y) => { state.sel = { x, y }; },
    onTile: (x, y) => {
      state.sel = { x, y };
      if (state.tool) act({ type: 'place', kind: state.tool, x, y });
    },
    onKey: (e, x, y) => {
      const k = e.key.toLowerCase();
      const arrows = { arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0] };
      if (arrows[k]) { e.preventDefault(); board.move(x, y, ...arrows[k]); return; }
      const kinds = { c: 'cable', s: 'switch', r: 'router', f: 'firewall', l: 'balancer' };
      if (kinds[k] && !e.ctrlKey && !e.metaKey) { state.sel = { x, y }; act({ type: 'place', kind: kinds[k], x, y }); }
      else if (k === 'u') { state.sel = { x, y }; ctl.upgrade(); }
      else if (k === 'x' || k === 'delete' || k === 'backspace') { state.sel = { x, y }; ctl.demolish(); }
      else if (k === 'p') ctl.togglePause();
      else if (k === 'escape') state.tool = null;
    },
  });

  let last = performance.now(), acc = 0;
  const frame = (now) => {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (!state.paused && !game.over) {
      acc += dt * state.speed;
      while (acc >= DT && !game.over) { stepGame(game); acc -= DT; }
    }
    while (state.hints < game.hints.length) say(game.hints[state.hints++].text, 'hint');
    while (state.logs < game.log.length) say(game.log[state.logs++].text, 'event');
    board.update(state.sel, state.tool);
    hud.update(state);
    if (game.over) { renderResults(root, game, () => startGame({ ...opts, seed: opts.seed + 1 }), showSetup); loop = null; return; }
    loop = requestAnimationFrame(frame);
  };
  loop = requestAnimationFrame(frame);
  window.__game = game; // handy for the console and for automated checks
}

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'p' && document.querySelector('.layout') && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLSelectElement) && !e.target.classList?.contains('tile')) {
    document.querySelector('.controls button')?.click();
  }
});

showSetup();
