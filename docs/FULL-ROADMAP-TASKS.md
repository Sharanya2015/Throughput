# Throughput Tasks

Ordered by dependency. `[P]` marks tasks that can run in parallel with others in the same phase. Each task is small enough to finish and test in one sitting. FR numbers refer to `spec.md`.

## Phase 0: Setup

- [ ] T001 Create the pnpm monorepo with `packages/sim`, `packages/bots`, `packages/protocol`, `apps/client`, `apps/server`, TypeScript, Vitest and ESLint.
- [ ] T002 [P] Add a CI workflow that runs lint, type check and tests on every push.
- [ ] T003 [P] Move `constitution.md`, `spec.md`, `plan.md` and `tasks.md` into `docs/`.

## Phase 1: Simulation core (`packages/sim`)

- [ ] T010 Write `balance.ts` with every number from the spec (FR-4 to FR-21).
- [ ] T011 Define core types: `State`, `Network`, `Device`, `Packet`, `Command`, `Event`.
- [ ] T012 [P] Implement the seeded RNG and a test that the same seed gives the same sequence.
- [ ] T013 Implement map generation from a seed: grid size per mode, Source, Destination and 6 obstacles (FR-1 to FR-3).
- [ ] T014 Implement `PlaceDevice` and `Connect` with validation: empty tile, enough credits, device limit (FR-4, FR-5, FR-9).
- [ ] T015 Implement `Demolish` with 50% refund and `Upgrade` for cables (FR-10, FR-12).
- [ ] T016 Implement packet spawning, including the time-based rate increase (FR-13).
- [ ] T017 Implement packet movement along links, device throughput budgets and queues of 5 (FR-10, FR-14).
- [ ] T018 Implement packet expiry after 12 tiles (FR-15).
- [ ] T019 Implement Switch, Load Balancer and Router routing rules, including the Router's 5-second cooldown (FR-11).
- [ ] T020 Implement Firewall scanning for malware packets (FR-11).
- [ ] T021 Implement delivery: +1 point and +1 credit per packet (FR-16) and scoring with tiebreakers (FR-22, FR-23).
- [ ] T022 Implement the round timeline and phases: Build, grace, Live, Rush Hour, end of round (FR-6 to FR-8).
- [ ] T023 Write a replay test: fixed seed plus a fixed command list reproduces an exact final score.
- [ ] T024 Reach 90% line coverage on `sim` (constitution rule 6).

## Phase 2: Chaos, attacks and bots

- [ ] T030 Implement the five chaos events and the seeded draw at the five scheduled times (FR-17).
- [ ] T031 [P] Implement `LaunchAttack` with the four attacks, costs, effects and the 15-second limit (FR-18, FR-19).
- [ ] T032 Implement attack counters: load balancer or second path, firewall on path, router priority route, firewall at Source (FR-18).
- [ ] T033 Implement the 20% leader discount and the 10-credit reward for a fully blocked attack (FR-20, FR-21).
- [ ] T034 Define the bot interface `decide(view, tick) -> Command[]` and the limited `view` a bot can see (FR-27).
- [ ] T035 [P] Implement the Easy bot (FR-24).
- [ ] T036 [P] Implement the Normal bot (FR-25).
- [ ] T037 Implement the Hard bot (FR-26).
- [ ] T038 Build a headless runner that plays N rounds between bots and prints win rates. Use it to check Hard beats Normal beats Easy.

## Phase 3: Client and Solo mode

- [ ] T040 Create the Vite client with a main menu: Solo, Versus, Co-op.
- [ ] T041 Render the grid, obstacles, Source and Destination on a canvas.
- [ ] T042 Add the device palette and placement by click or tap, with a ghost preview.
- [ ] T043 Add connecting devices by dragging, plus upgrade and demolish actions.
- [ ] T044 Animate packets along links and show queue fill and drops on each device.
- [ ] T045 Add the HUD: timer, credits, score, phase label and chaos event banner.
- [ ] T046 [P] Add the attack bar with costs, cooldown and a target picker.
- [ ] T047 [P] Add the scoreboard, hidden during Rush Hour (FR-7).
- [ ] T048 Build the Solo setup screen: choose 1 to 3 bots and their difficulty.
- [ ] T049 Wire Solo mode: run `sim` and `bots` in the browser with a fixed-step loop, working offline (US1).
- [ ] T050 Build the results screen with ranking, scores and tiebreakers.
- [ ] T051 Add a short guided first round for new players.
- [ ] T052 **Fun gate:** playtest Solo with at least 5 people. Fix confusing rules before building online.

## Phase 4: Server, lobbies and Versus

- [ ] T060 Define message types in `packages/protocol` (see the table in `plan.md`).
- [ ] T061 Create the Node server with `ws`, in-memory `Room` objects and a generator for 5-character codes without look-alike characters (FR-32).
- [ ] T062 Implement `create_lobby`, `join_lobby`, `lobby_state`, the 4-player cap and "Lobby not found" (FR-33, FR-35).
- [ ] T063 Implement mode and seed selection, roles, ready flags and the 10-second countdown.
- [ ] T064 Run the simulation at 20 ticks per second inside the room and apply validated commands.
- [ ] T065 Send snapshots on join and deltas about 10 times per second.
- [ ] T066 Build the client lobby screen: create, enter code, player list, ready button.
- [ ] T067 Connect the game screen to the server: send commands, render snapshots, interpolate packets.
- [ ] T068 Add local ghost devices and reconciliation so building feels instant.
- [ ] T069 Implement spectating for late joiners (FR-33).
- [ ] T070 Implement disconnect handling: keep state, 60-second rejoin, host handover (FR-34).
- [ ] T071 Implement rematch: keep the lobby open and reuse the code.
- [ ] T072 Add lobby expiry after 30 minutes (FR-32).
- [ ] T073 Test a full 4-player Versus round with simulated clients, including a mid-round drop and rejoin.

## Phase 5: Co-op and the Super Bot

- [ ] T080 Add Co-op map rules: 10 × 10 grid, device limit of 20 plus 5 per extra human, spawn rate bonus (FR-1, FR-5, FR-13).
- [ ] T081 Implement the shared team network and credit pool, where any human's valid command applies to it.
- [ ] T082 Implement roles, the 20% discount and the four abilities (FR-31).
- [ ] T083 Implement the Super Bot brain: build templates, 25% income bonus, attacks every 20 seconds, two at once from 6:00 (FR-28, FR-29).
- [ ] T084 Let the team attack the Super Bot with shared credits (FR-29).
- [ ] T085 Implement team win logic and the Win, Silver and Gold ratings (FR-30).
- [ ] T086 Show live cursors and who placed what so teammates can coordinate.
- [ ] T087 Add a Co-op results screen with team score, Super Bot score, margin and rating.
- [ ] T088 Use the headless runner to tune the Super Bot so a strong 4-person scripted team wins about half the time on Normal difficulty.

## Phase 6: Polish and ship

- [ ] T090 Colour-blind pass: add shapes and icons for every device and state (NFR-5).
- [ ] T091 Touch controls and phone layout check.
- [ ] T092 [P] Add sound effects for delivery, drop, attack, chaos and countdown.
- [ ] T093 [P] Add the rules-at-a-glance panel and tooltips.
- [ ] T094 Balance pass using the headless runner: starting credits, attack discount, packet expiry, chaos timing.
- [ ] T095 Load test: 50 simultaneous lobbies on one server (NFR-3).
- [ ] T096 Deploy the server and static client as one Node service.
- [ ] T097 Final check against the definition of done in `plan.md`.

## Suggested first sprint
T001, T010 to T016. By the end you can run a headless test that spawns packets and moves them across a hand-built network.
