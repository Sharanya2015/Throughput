# Implementation Plan: Throughput, Solo vs Bots

**Branch**: `001-solo-vs-bots` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification plus `StarterKit/PLAN.md`

## Summary

A static browser game. A pure JavaScript simulation (`src/sim`) models the traffic rules; bots (`src/bots`) emit the same commands as the player; a small DOM UI (`src/ui`) renders the grid as focusable buttons with text readouts. Tests run with `node --test`. No build step.

## Technical Context

**Language/Version**: JavaScript (ES2022 modules), Node 22 for tests only
**Primary Dependencies**: none
**Storage**: none (no saved state)
**Testing**: `node --test` (built in)
**Target Platform**: desktop browsers, served over HTTP
**Project Type**: single static web project
**Performance Goals**: 20 sim ticks per second with 4 boards of up to 20 devices at 60 fps rendering
**Constraints**: offline after load; no build step; keyboard operable
**Scale/Scope**: 4 boards, 10-minute round, about 30 source files

## Constitution Check

| Principle | How the plan satisfies it |
| --- | --- |
| I Accuracy | `src/sim` is pure and tested; fixtures are the first tests |
| II Explanation | `src/sim/explain.js` finds the bottleneck from queues and utilization; UI shows its messages |
| III One source for numbers | `src/sim/balance.js` holds every constant |
| IV Same rules for bots | Bots return `Command[]` and the game applies them through the same `applyCommand` |
| V Deterministic | Seeded RNG in `rng.js`; replay test |
| VI Static | No build or network; preview with `python3 -m http.server` |
| VII Accessible | Tiles are `<button>`s in a grid with `aria-label`s; letters and shapes; focus ring |
| VIII Scope | Online modes and Super Bot excluded |

No violations. Complexity tracking: none.

## Project Structure

```
index.html  styles.css
src/sim/   balance.js rng.js map.js network.js step.js commands.js events.js explain.js game.js
src/bots/  index.js easy.js normal.js hard.js
src/ui/    main.js setup.js board.js hud.js results.js
test/      fixtures.test.js model.test.js commands.test.js events.test.js bots.test.js replay.test.js explain.test.js
scripts/   bots-vs-bots.mjs
docs/      PLAYTEST.md
specs/001-solo-vs-bots/  spec.md plan.md tasks.md analysis.md
```

## Data Model

- `Game`: `{ seed, mode, totalTicks, tick, rng, competitors[], chaosSchedule[], effects[], log[] }`
- `Competitor`: `{ id, name, kind: 'human'|'bot', difficulty, credits, score, delivered, dropped, malwareHits, attacksBlocked, lastAttackTick, board }`
- `Board`: `{ tiles: Map<'x,y', Device>, deviceCount, packets spawned counter, spawnAcc }`
- `Device`: `{ kind, level, x, y, queue: Packet[], budget, sentWindow, recvWindow, dropped, offlineUntil, rrIndex }`
- `Packet`: `{ kind, hops }`
- `Command`: `{ type: 'place'|'upgrade'|'demolish'|'attack', actor, ... }`

## Traffic Model Implementation

Per tick, per board:
1. Rebuild distance map by breadth first search from the Destination over devices that are online (cached; rebuilt when the board changes).
2. Spawn: accumulate rate × 0.05, create whole packets into the Source queue or drop.
3. For each device (Source included) in a fixed order sorted by distance descending (closest to the Destination first so packets move at most one hop per tick): add `capacity × 0.05` to its budget (capped at capacity × 0.05 + 1), then while budget ≥ 1 and the queue has packets and a next hop exists, forward the front packet using the tie rule; if the next queue is full the packet is dropped; if the packet has more than 12 hops it is dropped. The Destination counts delivered packets (malware packets subtract score).
4. Firewall removes malware packets it forwards.
5. Record per-device utilization over a rolling 5-second window.

## Bots

`decide(view, tick, rng)` returns `Command[]`, called every 10 ticks. `view` contains the bot's own board, credits, scores of everyone and which attacks hit it. Easy, Normal and Hard follow the spec.

## Preview and Verification

- Preview: `python3 -m http.server 8000 --bind 127.0.0.1`, open http://127.0.0.1:8000
- Tests: `node --test`
- Bot balance: `node scripts/head-to-head.mjs 100 practice` (duels, SC-005) and `node scripts/bots-vs-bots.mjs 100` (three-way rounds)
- Manual: `docs/PLAYTEST.md`

## Verification Map

| Requirement | Check |
| --- | --- |
| FR-001, FR-002, FR-003 | `commands.test.js`, `model.test.js` |
| FR-004, FR-005, FR-006, FR-007 | `fixtures.test.js`, `model.test.js` |
| FR-008, FR-009 | `model.test.js` |
| FR-010, FR-011 | `events.test.js` |
| FR-012 | `explain.test.js` and playtest |
| FR-013, FR-014 | `bots.test.js`, `scripts/bots-vs-bots.mjs` |
| FR-015 | `replay.test.js` |
| FR-016 | playtest checklist |
| FR-017 | playtest with network disabled |
