import { h, clear } from './dom.js';
import { results } from '../sim/game.js';
import { bottleneckMessage } from '../sim/explain.js';

export function renderResults(root, game, onAgain, onSetup) {
  clear(root);
  const rows = results(game);
  const me = rows.find((r) => r.kind === 'human');
  const winner = rows[0];
  root.append(
    h('header', { class: 'hero' },
      h('h1', {}, winner.kind === 'human' ? 'You won!' : `${winner.name} won`),
      h('p', {}, `You finished in place ${me.place} of ${rows.length} with a score of ${me.score}.`)),
    h('section', { class: 'card' },
      h('h2', {}, 'Final ranking'),
      h('table', {},
        h('thead', {}, h('tr', {}, ...['Place', 'Player', 'Score', 'Delivered', 'Dropped', 'Malware hits', 'Attacks blocked', 'Bottleneck of the final network'].map((x) => h('th', { scope: 'col' }, x)))),
        h('tbody', {}, ...rows.map((r) => h('tr', { class: r.kind === 'human' ? 'me' : '' },
          h('td', {}, r.place), h('th', { scope: 'row' }, r.name), h('td', {}, r.score), h('td', {}, r.delivered),
          h('td', {}, r.dropped), h('td', {}, r.malwareHits), h('td', {}, r.attacksBlocked), h('td', {}, r.bottleneck)))))),
    h('section', { class: 'card' },
      h('h2', {}, 'What to take away'),
      h('p', {}, me.bottleneck),
      h('p', {}, 'A path is only as fast as its slowest device. Find the device that drops packets, fix that one, then look for the next. Parallel paths that do not touch share load; touching cables merge traffic.')),
    h('div', { class: 'row' },
      h('button', { type: 'button', class: 'primary', onclick: onAgain }, 'Play again with a new map'),
      h('button', { type: 'button', onclick: onSetup }, 'Change setup')));
  root.querySelector('h1').setAttribute('tabindex', '-1');
  root.querySelector('h1').focus();
}
