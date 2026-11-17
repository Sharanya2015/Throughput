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
        h('p', {}, h('strong', {}, 'Goal: '), 'deliver more packets to the Destination (DST) than the bots before the timer ends. Each delivered packet is 1 point and 1 credit.'),

        h('h3', {}, 'Your first minute'),
        h('ol', {},
          h('li', {}, 'Click Cable (or click a tile and press C), then click tiles to build a chain from SRC to DST. Devices must touch edge to edge.'),
          h('li', {}, 'A path that works: tiles (1,2) to (7,2) along the third row, then (7,3) and (7,4). That is 9 cables and 90 of your 150 credits.'),
          h('li', {}, 'Watch the numbers on each device: q is the queue (5 waiting packets at most) and % is how much of its speed is used.')),

        h('h3', {}, 'The idea to learn'),
        h('ul', {},
          h('li', {}, 'A path is only as fast as its slowest device. That device is the bottleneck. The game names it when packets are dropped.'),
          h('li', {}, 'Upgrading a device that is not the bottleneck changes nothing.'),
          h('li', {}, 'Two paths that do not touch share the load. Cables that touch merge their traffic, so keep parallel paths apart.')),

        h('h3', {}, 'Devices'),
        h('table', {},
          h('thead', {}, h('tr', {}, ...['Device', 'Key', 'Cost', 'Speed', 'What it does'].map((x) => h('th', { scope: 'col' }, x)))),
          h('tbody', {},
            ...[
              ['Cable', 'C', '10', '4 pkt/s', 'Carries packets. Upgrade to 8, then 12 pkt/s (25 and 50 credits).'],
              ['Switch', 'S', '30', '10 pkt/s', 'Splits packets across up to 3 ways.'],
              ['Router', 'R', '50', '12 pkt/s', 'Sends packets to the shortest queue.'],
              ['Firewall', 'F', '40', '6 pkt/s', 'Removes malware. Slow, so do not use it on a busy single path.'],
              ['Load Balancer', 'L', '60', '12 pkt/s', 'Splits across up to 4 ways and holds 25 packets.'],
            ].map((r) => h('tr', {}, h('th', { scope: 'row' }, r[0]), ...r.slice(1).map((c) => h('td', {}, c)))))),
        h('p', { class: 'hint' }, 'Removing a device refunds half its cost. You can have 20 devices. Dark tiles marked BLOCK cannot be built on.'),

        h('h3', {}, 'How a round runs'),
        h('ul', {},
          h('li', {}, h('strong', {}, 'Build'), ' (first 5%): no packets yet. Lay your first path.'),
          h('li', {}, h('strong', {}, 'Grace'), ' (to 20%): packets flow, attacks are locked.'),
          h('li', {}, h('strong', {}, 'Live'), ' (to 90%): chaos events hit everyone, and you can attack bots while they attack you.'),
          h('li', {}, h('strong', {}, 'Rush Hour'), ' (last 10%): packets double and the leaderboard is hidden, so the final sprint is a blind finish.')),
        h('p', {}, 'Chaos events hit everyone at once. Bad: a cable is cut, traffic spikes, the Destination goes quiet, a device loses power, or a routing glitch halves your Switches, Routers and Load Balancers. Good: a sponsor grant gives 50 credits, or upgrades go on sale.'),
        h('p', {}, 'Attacks. Single counters: DDoS burst (Load Balancer or two paths), Malware (Firewall), Latency spike (a Router), Port scan (Firewall next to the Source). Combination counters: Botnet swarm needs a Firewall and a Load Balancer together, and Route hijack needs a Router and a second path together. One half of a combination only reduces the damage.'),

        h('h3', {}, 'Controls'),
        h('p', { class: 'hint' }, 'Click a tile once to focus the board. Arrow keys move. C S R F L place a device. U upgrades a cable. X removes a device. P pauses. Esc clears the chosen device. Everything also works with the mouse.'))));
}
