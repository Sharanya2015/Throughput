# Throughput Constitution

## Core Principles

### I. Accuracy of the Traffic Model (NON-NEGOTIABLE)
All game rules MUST live in one pure JavaScript module (`src/sim`) with no DOM access, no wall-clock reads
and no randomness except a seeded generator. The traffic model (per-device capacity, queues of 5, the
forwarding rule, drops, 12-hop expiry) MUST be written in the spec, and every rule MUST have a unit test run
with `node --test`. Hand-checked fixtures (one correct case, one plausible wrong choice, one edge case) MUST
pass before any visual polish begins. Rationale: the game teaches networking, so a wrong answer is worse than
a plain screen.

### II. Every Decision Gets an Explanation
After a drop-heavy period and at the end of a round the game MUST name the bottleneck device and say in plain
language why packets were lost. A wrong choice, such as upgrading a link that is not the bottleneck, MUST
explain the specific misconception. Rationale: feedback is the teaching mechanism.

### III. One Source for Numbers
Costs, capacities, timings and bonuses MUST live in `src/sim/balance.js`. No magic numbers elsewhere.
Rationale: balance changes must never touch logic.

### IV. Bots Play by the Same Rules
Bots MUST act only by issuing the same commands a human issues, at the same costs, and MUST NOT read state a
human could not see. Rationale: a fair opponent makes the score meaningful.

### V. Deterministic and Replayable
The same seed plus the same command list MUST produce the same final scores, locked in by a replay test.
Rationale: reproducible bugs and trustworthy tests.

### VI. Static, Simple and Offline
The game MUST be plain HTML, CSS and JavaScript modules with no build step, no accounts and no network
calls after load, and MUST run with `python3 -m http.server 8000 --bind 127.0.0.1`. Rationale: anyone can run
it and check it.

### VII. Playable by Everyone
Core interactions MUST work with the keyboard and show visible focus. Colour MUST NOT be the only signal;
every device and state MUST also have a shape, icon or label. A first-time player MUST be able to deliver a
packet within 60 seconds. Rationale: accessibility and a fast first win.

### VIII. Scope Discipline
Build one mechanic first (build and repair a path), one full round before extra content, and cut animation
and extras before cutting correctness or feedback. Online modes (Versus, Co-op vs Super Bot) are deferred;
their rules stay in `docs/FULL-SPEC.md` and are not weakened by this scope. Rationale: protect the teaching
loop.

## Verification Honesty

Reports MUST separate checks that passed, failed and were not run. A completion message is not evidence.

## Governance

This constitution supersedes other practices. Amendments need a written reason in the change that makes them
and a version bump (MAJOR for removed or redefined principles, MINOR for added or expanded ones, PATCH for
wording). Every task list and review MUST check compliance with these principles. If a spec, plan or task
conflicts with this document, this document wins and the other is corrected.

**Version**: 1.0.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-17
