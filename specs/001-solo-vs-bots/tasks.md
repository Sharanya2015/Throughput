# Tasks: Throughput, Solo vs Bots

**Input**: `specs/001-solo-vs-bots/spec.md` and `plan.md`. Tests are written before the code they check. `[P]` = can run in parallel. `[US#]` = user story.

## Phase 1: Setup

- [x] T001 Create `package.json` (type module, `test` script), `.gitignore`, `index.html`, `styles.css`, folder structure.
- [x] T002 [P] Write `src/sim/balance.js` with every number from the spec.
- [x] T003 [P] Write `src/sim/rng.js` (seeded generator) and a test.

## Phase 2: Foundation (blocks all stories)

- [x] T004 `src/sim/map.js`: grid, Source, Destination, seeded obstacles that never cut all paths. Test it.
- [x] T005 `src/sim/network.js`: device creation, links by adjacency, BFS distances.
- [x] T006 `test/fixtures.test.js`: the three hand-checked fixtures (fail first).
- [x] T007 `src/sim/step.js`: spawn, budget, forwarding rules, queues, drops, 12-hop expiry, delivery. Make fixtures pass.
- [x] T008 `src/sim/commands.js`: place, upgrade, demolish with validation and reasons. Tests.
- [x] T009 `src/sim/game.js`: createGame, phases, tick loop, scoring, tiebreakers, results. Tests.

## Phase 3: US1 Build a path (P1)

- [x] T010 [US1] `src/ui/board.js`: grid of tile buttons, device letters and shapes, focus ring.
- [x] T011 [US1] `src/ui/hud.js`: timer, phase, credits, score, palette, build and upgrade and demolish actions.
- [x] T012 [US1] `src/ui/main.js` and `src/ui/setup.js`: setup screen, game loop with a fixed-step accumulator, pause.

## Phase 4: US2 Understand the bottleneck (P1)

- [x] T013 [US2] `test/explain.test.js` then `src/sim/explain.js`: find the bottleneck, wrong-upgrade detection, messages.
- [x] T014 [US2] Show per-device utilization, queue fill, drops and the message panel in the UI.

## Phase 5: US3 Compete against bots (P1)

- [x] T015 [US3] `src/bots/easy.js`, `normal.js`, `hard.js`, `index.js`. Tests that bots only use commands and obey costs.
- [x] T016 [US3] `src/ui/results.js`: ranked results with bottleneck of each final network.
- [x] T017 [US3] `scripts/bots-vs-bots.mjs`: headless runner printing win rates.

## Phase 6: US4 Chaos and attacks (P2)

- [x] T018 [US4] `test/events.test.js` then `src/sim/events.js`: five chaos events and four attacks with counters, discount, cooldown, blocked reward.
- [x] T019 [US4] Attack bar and chaos banner in the UI; live leaderboard under the board (hidden in Rush Hour); Port scan reveals a bot board.

## Phase 7: US5 Keyboard and accessibility (P2)

- [x] T020 [US5] Arrow-key navigation, letter shortcuts, ARIA labels, text overload labels. Document in `docs/PLAYTEST.md`.

## Phase 8: Polish and evidence

- [x] T021 `test/replay.test.js`: same seed and commands give identical scores.
- [x] T022 Run `node --test`, the bot runner and a browser playthrough. Record passed, failed and untested checks. (Offline run and a second-person playtest are recorded as not done.)
- [x] T023 README with game status, controls, learning outcomes, run and test commands, limitations and credits.
- [ ] T024 Commit the work locally and push (push not done: no GitHub repository created yet).

## Dependencies

Phase 2 blocks everything. T013 needs T007. T015 needs T008 and T009. T018 needs T009. UI tasks need the sim tasks they display.
