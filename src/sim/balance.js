// Every number in the game lives here (constitution principle III).
export const TICKS_PER_SECOND = 20;
export const DT = 1 / TICKS_PER_SECOND;

export const GRID = {
  w: 8,
  h: 8,
  source: { x: 0, y: 2 },
  dest: { x: 7, y: 5 },
  obstacles: 6,
};

export const DEVICE_KINDS = {
  cable: { label: 'Cable', letter: 'C', cost: 10, cap: 4, queue: 5, rule: 'first', fan: 1 },
  switch: { label: 'Switch', letter: 'S', cost: 30, cap: 10, queue: 5, rule: 'spread', fan: 3 },
  router: { label: 'Router', letter: 'R', cost: 50, cap: 12, queue: 5, rule: 'shortest', fan: 8 },
  firewall: { label: 'Firewall', letter: 'F', cost: 40, cap: 6, queue: 5, rule: 'first', fan: 1 },
  balancer: { label: 'Load Balancer', letter: 'L', cost: 60, cap: 12, queue: 25, rule: 'spread', fan: 4 },
};
export const SOURCE = { label: 'Source', letter: 'SRC', cap: 12, queue: 5, rule: 'spread', fan: 3 };
export const DEST = { label: 'Destination', letter: 'DST', cap: 1000, queue: 5, rule: 'first', fan: 1 };

export const CABLE_LEVELS = [
  { cap: 4, upgradeCost: 0 },
  { cap: 8, upgradeCost: 25 },
  { cap: 12, upgradeCost: 50 },
];

export const START_CREDITS = 150;
export const DEVICE_LIMIT = 20;
export const REFUND_RATE = 0.5;
export const MAX_HOPS = 12;
export const MALWARE_PENALTY = 3;

export const SPAWN = { base: 2, stepPerLevel: 1, levelEvery: 0.2, rushMultiplier: 2 };

export const ROUND_SECONDS = { full: 600, practice: 180 };
// Fractions of the round.
export const PHASES = { build: 0.05, grace: 0.2, rush: 0.9 };
export const CHAOS_AT = [0.2, 0.35, 0.5, 0.65, 0.8];
export const CHAOS_KINDS = ['fiber', 'spike', 'dns', 'surge', 'sale', 'grant', 'glitch'];
export const CHAOS_SECONDS = { spike: 20, dns: 5, surge: 15, sale: 30, glitch: 15 };
export const GRANT_CREDITS = 50;
// Every random event and every attack is announced this many seconds before it lands.
export const WARNING_SECONDS = 5;
export const ATTACK_DELAY_SECONDS = 5;
export const CHAOS_NAMES = {
  fiber: 'Fiber cut', spike: 'Traffic spike', dns: 'DNS outage', surge: 'Power surge',
  sale: 'Bandwidth sale', grant: 'Sponsor grant', glitch: 'Routing glitch',
};
export const CHAOS_GOOD = ['sale', 'grant'];
export const GLITCH_KINDS = ['switch', 'router', 'balancer'];
export const CHAOS_LABELS = {
  fiber: 'Fiber cut: your busiest cable was destroyed',
  spike: 'Traffic spike: packet arrivals doubled for 20 s',
  dns: 'DNS outage: the Destination stops accepting packets for 5 s',
  surge: 'Power surge: one device per network is offline for 15 s',
  sale: 'Bandwidth sale: upgrades cost half price for 30 s',
  grant: 'Sponsor grant: every network receives 50 credits',
  glitch: 'Routing glitch: Switches, Routers and Load Balancers run at half speed for 15 s',
};

export const ATTACKS = {
  ddos: { label: 'DDoS burst', cost: 40, seconds: 8, perSecond: 20, counter: 'Load Balancer, or two parallel paths' },
  malware: { label: 'Malware packet', cost: 30, count: 10, perSecond: 5, counter: 'Firewall on the path' },
  latency: { label: 'Latency spike', cost: 25, seconds: 10, counter: 'Router in the network' },
  scan: { label: 'Port scan', cost: 20, seconds: 20, counter: 'Firewall next to the Source' },
  swarm: { label: 'Botnet swarm', cost: 55, seconds: 8, count: 8, counter: 'Firewall and Load Balancer together' },
  hijack: { label: 'Route hijack', cost: 45, seconds: 12, counter: 'Router and a second path together' },
};
export const ATTACK_COOLDOWN_SECONDS = 15;
export const LEADER_DISCOUNT = 0.2;
export const BLOCK_REWARD = 10;
export const DDOS_FACTOR = { balancer: 0.25, parallel: 0.5 };

export const UTIL_WINDOW = 5;
export const DROP_WINDOW = 10;
export const BOT_THINK_TICKS = 10;
