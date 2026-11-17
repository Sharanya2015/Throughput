import { h, clear } from './dom.js';

export function renderSetup(root, onStart) {
  clear(root);
  const botSelects = [];
  const botsBox = h('div', { class: 'bots' });
  const count = h('select', { id: 'count', 'aria-label': 'Number of bots' },
    ...[1, 2, 3].map((n) => h('option', { value: n, selected: n === 3 }, `${n} bot${n > 1 ? 's' : ''}`)));
  const diffs = ['easy', 'normal', 'hard'];
  const drawBots = () => {
    clear(botsBox); botSelects.length = 0;
    for (let i = 0; i < Number(count.value); i++) {
      const sel = h('select', { 'aria-label': `Bot ${i + 1} difficulty` },
        ...diffs.map((d) => h('option', { value: d, selected: d === diffs[i] }, d[0].toUpperCase() + d.slice(1))));
      botSelects.push(sel);
      botsBox.append(h('label', {}, `Bot ${i + 1} `, sel));
    }
  };
  count.addEventListener('change', drawBots);
  drawBots();
  const seed = h('input', { type: 'number', id: 'seed', value: Math.floor(Math.random() * 9000) + 1000, min: 1, 'aria-label': 'Map seed' });
  const form = h('form', { class: 'card setup', onsubmit: (e) => {
    e.preventDefault();
    onStart({
      mode: form.elements.mode.value, bots: botSelects.map((s) => s.value), seed: Number(seed.value) || 1,
    });
  } },
    h('h2', {}, 'Set up a round'),
    h('fieldset', {}, h('legend', {}, 'Round length'),
      h('label', {}, h('input', { type: 'radio', name: 'mode', value: 'practice', checked: true }), ' Practice, 3 minutes'),
      h('label', {}, h('input', { type: 'radio', name: 'mode', value: 'full' }), ' Full round, 10 minutes')),
    h('fieldset', {}, h('legend', {}, 'Opponents'), count, botsBox),
    h('label', {}, 'Map seed ', seed),
    h('button', { type: 'submit', class: 'primary' }, 'Start round'));

  root.append(
    h('header', { class: 'hero' },
      h('h1', {}, 'Throughput'),
      h('p', {}, 'Link the Source to the Destination, keep packets flowing, and outscore the bots.')),
    h('div', { class: 'cols' },
      form,
      h('section', { class: 'card how' },
        h('h2', {}, 'How to play'),
        h('ol', {},
          h('li', {}, 'Pick a device (or press its letter) and click empty tiles to build a chain of touching devices from SRC to DST.'),
          h('li', {}, 'Each delivered packet is 1 point and 1 credit. Spend credits on devices and upgrades.'),
          h('li', {}, 'A path is only as fast as its slowest device. Watch the queue (q) and percent figures to find the bottleneck.'),
          h('li', {}, 'Upgrading a device that is not the bottleneck changes nothing. Add a second path to share the load.'),
          h('li', {}, 'From the Live phase you can attack bots, and they will attack you.')),
        h('p', { class: 'hint' }, 'Keyboard: arrows move, C S R F L place, U upgrade, X remove, P pause.'))));
}
