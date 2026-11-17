import { PATH_A, PATH_B } from '../sim/map.js';
import { DEVICE_KINDS, CABLE_LEVELS, ATTACKS } from '../sim/balance.js';
import { key } from '../sim/network.js';
import { findBottleneck } from '../sim/explain.js';
import { missing, place, demolish, upgrade, leaderOf, canAttack, secs } from './common.js';

const ENDS = [[7, 4], [6, 5]];
const BALANCER_TILE = [7, 3];

// Hard: two paths, fixes the bottleneck first, adds Firewalls once it is attacked or rich,
// then a Load Balancer, and scans a target before choosing the attack it has no counter for.
export default function hard(game, comp) {
  const cmds = [];
  const st = comp.botState;
  const b = comp.board;
  const kindAt = ([x, y]) => b.devices.get(key(x, y))?.kind;
  const attacked = game.attacks.some((a) => a.defender === comp.id && a.kind === 'malware');
  if (attacked) st.fwPlan = true;
  const skip = [...(st.fwPlan ? ENDS : []), ...(st.lbPlan ? [BALANCER_TILE] : [])];
  const next = missing(b, PATH_A, skip) || missing(b, PATH_B, skip);
  const fwTile = st.fwPlan ? ENDS.find((t) => kindAt(t) !== 'firewall') : null;

  if (next) {
    if (comp.credits >= DEVICE_KINDS.cable.cost) cmds.push(place(comp, 'cable', next));
  } else if (fwTile) {
    if (kindAt(fwTile) === 'cable') cmds.push(demolish(comp, fwTile));
    else if (!kindAt(fwTile) && comp.credits >= DEVICE_KINDS.firewall.cost) cmds.push(place(comp, 'firewall', fwTile));
  } else if (st.fwPlan && kindAt(BALANCER_TILE) !== 'balancer' && comp.credits >= 150) {
    st.lbPlan = true;
    if (kindAt(BALANCER_TILE) === 'cable') cmds.push(demolish(comp, BALANCER_TILE));
    else if (!kindAt(BALANCER_TILE)) cmds.push(place(comp, 'balancer', BALANCER_TILE));
  } else if (game.tick - (st.lastUpgrade ?? -1e9) >= secs(4)) {
    // Only upgrade a device that is actually dropping packets; spare credits go to attacks.
    const bn = findBottleneck(game, comp);
    const c = bn && bn.kind === 'cable' && bn.level < 2 ? bn : null;
    if (c && comp.credits >= CABLE_LEVELS[c.level + 1].upgradeCost) { cmds.push(upgrade(comp, c)); st.lastUpgrade = game.tick; }
  }

  if (canAttack(game, comp, secs(15))) {
    const target = leaderOf(game, comp);
    const scanned = (comp.scanUntil[target.id] ?? 0) > game.tick;
    let kind = null;
    if (scanned) {
      const kinds = new Set([...target.board.devices.values()].map((d) => d.kind));
      kind = !kinds.has('firewall') ? 'malware' : !kinds.has('balancer') ? 'ddos' : !kinds.has('router') ? 'latency' : 'ddos';
    } else if (comp.credits >= ATTACKS.scan.cost + ATTACKS.malware.cost && (st.sinceScan = (st.sinceScan ?? 0) + 1) >= 3) {
      kind = 'scan'; st.sinceScan = 0; // scan every third attack, then use the knowledge while it lasts
    } else {
      kind = (st.blind = (st.blind ?? -1) + 1) % 2 === 0 ? 'malware' : 'ddos';
    }
    if (kind) {
      cmds.push({ type: 'attack', actor: comp.id, target: target.id, kind });
      st.lastAttack = game.tick;
    }
  }
  return cmds;
}
