import { h } from './dom.js';
import { ranking, phaseOf } from '../sim/game.js';

const PLACES = ['1st', '2nd', '3rd', '4th'];

// The leaderboard is hidden during Rush Hour, the last 10% of the round.
export const leaderboardHidden = (game) => phaseOf(game) === 'rush';

// A live leaderboard: the winning player is always on top, followed by 2nd, 3rd and 4th.
// Rows slide to their new position when the order changes.
// It stays hidden in Rush Hour, so the final sprint is a blind finish.
export function createLeaderboard(game, human) {
  const list = h('ol', { class: 'leaderboard', 'aria-label': 'Leaderboard, leader first' });
  const rows = new Map();
  for (const c of game.competitors) {
    const fill = h('i');
    const li = h('li', { class: `lrow${c === human ? ' me' : ''}` },
      h('span', { class: 'place' }, ''),
      h('span', { class: 'lname' }, c.name + (c === human ? ' (you)' : '')),
      h('span', { class: 'bar', 'aria-hidden': 'true' }, fill),
      h('span', { class: 'lscore' }, '0'),
      h('span', { class: 'lstats' }, ''));
    rows.set(c.id, { li, fill, last: '', rank: 0, flash: 0 });
    list.append(li);
  }
  const hiddenNote = h('p', { class: 'hint', hidden: true }, 'Leaderboard hidden during Rush Hour. Keep delivering, the final result is a surprise.');
  const el = h('section', { class: 'card leaderboard-card' }, h('h3', {}, 'Leaderboard'), list, hiddenNote);

  function update() {
    const hide = leaderboardHidden(game);
    list.hidden = hide;
    hiddenNote.hidden = !hide;
    if (hide) return;
    const order = ranking(game);
    const top = Math.max(1, order[0].score);
    const wanted = order.map((c) => rows.get(c.id).li);
    const changed = wanted.some((li, i) => li !== list.children[i]);
    const before = new Map();
    if (changed) for (const c of order) before.set(c.id, rows.get(c.id).li.getBoundingClientRect().top);
    if (changed) wanted.forEach((li) => list.append(li));

    order.forEach((c, i) => {
      const r = rows.get(c.id);
      const place = PLACES[i] ?? `${i + 1}th`;
      const sig = `${i}|${c.score}|${c.delivered}|${c.dropped}|${c.malwareHits}`;
      if (sig !== r.last) {
        r.last = sig;
        r.li.dataset.rank = String(i + 1);
        r.li.children[0].textContent = place;
        r.li.children[3].textContent = String(c.score);
        r.li.children[4].textContent = `${c.delivered} delivered, ${c.dropped} dropped${c.malwareHits ? `, ${c.malwareHits} malware` : ''}`;
        r.fill.style.width = `${Math.max(0, Math.round((100 * c.score) / top))}%`;
        r.li.setAttribute('aria-label', `${place} place: ${c.name}${c === human ? ' (you)' : ''}, score ${c.score}`);
      }
      if (r.rank && r.rank !== i + 1) {
        r.li.classList.toggle('rise', i + 1 < r.rank);
        r.li.classList.toggle('fall', i + 1 > r.rank);
        r.flash = 40; // ticks of UI frames the highlight stays
      }
      r.rank = i + 1;
      if (r.flash > 0 && --r.flash === 0) r.li.classList.remove('rise', 'fall');
    });

    if (changed) {
      for (const c of order) {
        const li = rows.get(c.id).li;
        const dy = before.get(c.id) - li.getBoundingClientRect().top;
        if (!dy) continue;
        li.style.transition = 'none';
        li.style.transform = `translateY(${dy}px)`;
        void li.offsetHeight; // force layout, then slide to the new place
        li.style.transition = '';
        li.style.transform = '';
      }
    }
  }
  return { el, update };
}
