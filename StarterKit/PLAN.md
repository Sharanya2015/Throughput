# Throughput Plan (input for /speckit-plan)

## Stack

- Plain HTML, CSS and JavaScript ES modules. No framework, no bundler, no dependencies.
- Rendering with an HTML grid of focusable buttons for tiles (keyboard and screen reader friendly) plus text readouts. No canvas for v1.
- Tests with Node's built-in `node --test` (Node 22 is installed).

## Layout

```
index.html
styles.css
src/
  sim/
    balance.js     all numbers
    rng.js         seeded generator
    map.js         grid, obstacles, source, destination
    network.js     devices, links, shortest-path distances
    step.js        one tick: spawn, forward, drop, deliver, economy
    commands.js    place, upgrade, demolish, attack (validation)
    events.js      chaos events and attacks
    explain.js     bottleneck finder and plain-language messages
    game.js        createGame(options), step, results
  bots/            easy.js, normal.js, hard.js (emit commands only)
  ui/              main.js, board.js, hud.js, setup.js, results.js
test/
  fixtures.test.js model.test.js bots.test.js replay.test.js explain.test.js
```

## Verification

- `node --test` must pass: the three hand-checked fixtures, queue and drop rules, expiry, router and switch routing, chaos and attack effects and counters, replay determinism, bottleneck explanation.
- A headless runner `node scripts/bots-vs-bots.mjs` plays N rounds and prints bot win rates, to check Hard beats Normal beats Easy.
- Manual playtest checklist in `docs/PLAYTEST.md`: wrong upgrade, repeat actions, keyboard-only play, reload.

## Preview

`python3 -m http.server 8000 --bind 127.0.0.1` from the repository root, then open http://127.0.0.1:8000.

## Build order

1. Sim core and the three fixtures. 2. Economy and scoring. 3. Chaos and attacks. 4. Bots. 5. UI for one full round against one Easy bot. 6. Explanations. 7. Setup screen for 1 to 3 bots. 8. Playtest fixes and README.
