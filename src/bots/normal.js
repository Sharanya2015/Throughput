import { PATH_A, PATH_B } from '../sim/map.js';
import { DEVICE_KINDS, CABLE_LEVELS } from '../sim/balance.js';
import { key } from '../sim/network.js';
import { missing, place, demolish, upgrade, lowestCable, leaderOf, canAttack, secs } from './common.js';

const ENDS = [[7, 4], [6, 5]];

// Normal: two paths, a Firewall after its first malware hit, an attack every 25 s.
export default function normal(game, comp) {
  const cmds = [];
  const st = comp.botState;
  const b = comp.board;
  if (comp.malwareHits > 0) st.fwPlan = true;
  const skip = st.fwPlan ? ENDS : [];
  const next = missing(b, PATH_A, skip) || missing(b, PATH_B, skip);
  if (next) {
    if (comp.credits >= DEVICE_KINDS.cable.cost) cmds.push(place(comp, 'cable', next));
  } else if (st.fwPlan && ENDS.some(([x, y]) => b.devices.get(key(x, y))?.kind !== 'firewall')) {
    const tile = ENDS.find(([x, y]) => b.devices.get(key(x, y))?.kind !== 'firewall');
    const d = b.devices.get(key(tile[0], tile[1]));
    if (d) cmds.push(demolish(comp, tile));
    else if (comp.credits >= DEVICE_KINDS.firewall.cost) cmds.push(place(comp, 'firewall', tile));
  } else if (game.tick - (st.lastUpgrade ?? -1e9) >= secs(10)) {
    const c = lowestCable(b, [...PATH_A, ...PATH_B]);
    if (c && comp.credits >= CABLE_LEVELS[c.level + 1].upgradeCost) { cmds.push(upgrade(comp, c)); st.lastUpgrade = game.tick; }
  }
  if (canAttack(game, comp, secs(25))) {
    const target = leaderOf(game, comp);
    const kind = comp.rng.pick(['ddos', 'malware', 'latency', 'swarm', 'hijack']);
    cmds.push({ type: 'attack', actor: comp.id, target: target.id, kind });
    st.lastAttack = game.tick;
  }
  return cmds;
}

