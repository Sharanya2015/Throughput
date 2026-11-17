import { h } from './dom.js';
import { DEVICE_KINDS, GRID } from '../sim/balance.js';
import { key, specOf, capacityOf, queueMax, utilization, winSum } from '../sim/network.js';

const SHAPES = { cable: 'Cable', switch: 'Switch', router: 'Router', firewall: 'Firewall', balancer: 'Load Balancer' };

export function createBoard(container, game, human, handlers) {
  const buttons = new Map();
  const grid = h('div', { class: 'grid', id: 'board', role: 'group', 'aria-label': 'Network board, 8 by 8 tiles. Use arrow keys to move.' });
  let focused = { x: 1, y: 2 };

  for (let y = 0; y < GRID.h; y++) {
    for (let x = 0; x < GRID.w; x++) {
      const b = h('button', { type: 'button', class: 'tile', 'data-x': x, 'data-y': y, tabindex: x === focused.x && y === focused.y ? 0 : -1,
        onclick: () => handlers.onTile(x, y),
        onfocus: () => { focused = { x, y }; handlers.onSelect(x, y); },
        onkeydown: (e) => handlers.onKey(e, x, y) });
      buttons.set(key(x, y), { el: b, last: '' });
      grid.append(b);
    }
  }
  container.append(grid);

  function move(x, y, dx, dy) {
    const nx = Math.min(GRID.w - 1, Math.max(0, x + dx)), ny = Math.min(GRID.h - 1, Math.max(0, y + dy));
    focusTile(nx, ny);
  }
  function focusTile(x, y) {
    for (const { el } of buttons.values()) el.tabIndex = -1;
    const t = buttons.get(key(x, y)).el;
    t.tabIndex = 0; t.focus();
  }

  function describe(x, y) {
    const k = key(x, y);
    const dev = human.board.devices.get(k);
    const pos = `Row ${y + 1}, column ${x + 1}`;
    if (game.map.obstacles.has(k)) return { cls: 'obstacle', body: ['BLOCK'], label: `${pos}: obstacle` };
    if (!dev) return { cls: 'empty', body: [''], label: `${pos}: empty` };
    const t = game.tick;
    if (dev.kind === 'source' || dev.kind === 'dest') {
      const name = dev.kind === 'source' ? 'SRC' : 'DST';
      const q = dev.kind === 'source' ? `q${dev.queue.length}/${queueMax(dev)}` : `${human.delivered} in`;
      return { cls: `endpoint ${dev.kind}`, body: [name, q], label: `${pos}: ${specOf(dev).label}, ${q}` };
    }
    const util = Math.round(utilization(dev, t) * 100);
    const drops = winSum(dev.dropW, t);
    const full = dev.queue.length >= queueMax(dev);
    const off = dev.offlineUntil > t;
    const state = off ? 'OFF' : drops > 0 ? 'DROP' : full ? 'FULL' : '';
    const tag = dev.kind === 'cable' ? `C${'+'.repeat(dev.level)}` : DEVICE_KINDS[dev.kind].letter;
    const q = `q${dev.queue.length}/${queueMax(dev)}`;
    return {
      cls: `device k-${dev.kind} ${state ? 'warn' : ''} ${util >= 90 ? 'hot' : ''}`,
      body: [tag, q, `${util}%`, state],
      util,
      label: `${pos}: ${SHAPES[dev.kind]}, ${capacityOf(dev)} packets per second, queue ${dev.queue.length} of ${queueMax(dev)}, ${util} percent used${state ? ', ' + state : ''}`,
    };
  }

  function update(sel, tool) {
    for (let y = 0; y < GRID.h; y++) {
      for (let x = 0; x < GRID.w; x++) {
        const rec = buttons.get(key(x, y));
        const d = describe(x, y);
        const selected = sel && sel.x === x && sel.y === y;
        const sig = d.label + selected + tool + d.cls;
        if (sig === rec.last) continue;
        rec.last = sig;
        rec.el.className = `tile ${d.cls} ${selected ? 'selected' : ''}`;
        rec.el.style.setProperty('--u', `${d.util || 0}%`);
        rec.el.setAttribute('aria-label', d.label);
        rec.el.replaceChildren(...d.body.map((t, i) => h('span', { class: `l${i}` }, t)));
      }
    }
  }
  return { update, focusTile, move };
}
