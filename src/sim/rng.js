// Small seeded generator (mulberry32). State is a single integer so it can be replayed.
export function makeRng(seed) {
  const rng = { s: seed >>> 0 };
  rng.next = () => {
    rng.s = (rng.s + 0x6d2b79f5) >>> 0;
    let t = rng.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.int = (n) => Math.floor(rng.next() * n);
  rng.pick = (arr) => arr[rng.int(arr.length)];
  return rng;
}
