import { PATH_A } from '../sim/map.js';
import { DEVICE_KINDS, CABLE_LEVELS } from '../sim/balance.js';
import { missing, place, upgrade, lowestCable, opponents, canAttack, secs } from './common.js';

// Easy: one path, slow upgrades, an attack every 45 s, never defends.
export default function easy(game, comp) {
  const cmds = [];
  const st = comp.botState;
  const b = comp.board;
  const next = missing(b, PATH_A);
  if (next) {
    if (comp.credits >= DEVICE_KINDS.cable.cost) cmds.push(place(comp, 'cable', next));
  } else if (game.tick - (st.lastUpgrade ?? -1e9) >= secs(25)) {
    const c = lowestCable(b, PATH_A);
    if (c && comp.credits >= CABLE_LEVELS[c.level + 1].upgradeCost) { cmds.push(upgrade(comp, c)); st.lastUpgrade = game.tick; }
  }
  if (canAttack(game, comp, secs(45))) {
    const target = comp.rng.pick(opponents(game, comp));
    const kind = comp.rng.pick(['ddos', 'malware', 'latency', 'hijack']);
    cmds.push({ type: 'attack', actor: comp.id, target: target.id, kind });
    st.lastAttack = game.tick;
  }
  return cmds;
}
