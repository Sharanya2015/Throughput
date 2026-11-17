# Throughput Constitution (input for /speckit-constitution)

Scope of this constitution: the first playable version, **Solo vs Bots**, a static browser game. Versus and Co-op online modes are deferred. Their principles from the full-game constitution (`docs/FULL-*.md`) are kept as future rules and are not weakened.

**The learner and the skill.** The player is a network engineer who repeatedly builds and repairs a chain of links and devices to carry packets, and gets better at finding bandwidth bottlenecks and balancing load across parallel paths because the game shows per-device utilization, queue fill and drops after every decision.

## Principles

1. **Accuracy of the traffic model.** All game rules live in one pure JavaScript module (`src/sim`) with no DOM, clock or randomness except a seeded generator. The traffic model (capacity per device, queues of 5, forwarding rule, drops) is written down in `SPEC.md`. Every rule has a unit test run with `node --test`. Hand-checked fixtures (one correct case, one plausible wrong choice, one edge case) MUST pass before any visual polish.
2. **Every decision gets an explanation.** After each round and after each drop-heavy moment the game MUST name the bottleneck device and say why traffic was lost, in plain language. A wrong choice (for example upgrading a link that is not the bottleneck) MUST explain the specific misconception.
3. **One source for numbers.** Costs, capacities, timings and bonuses live in `src/sim/balance.js`. No magic numbers elsewhere.
4. **Bots play by the same rules.** Bots act only by issuing the same commands a human issues, with the same costs. They never read hidden state.
5. **Deterministic and replayable.** The same seed plus the same command list MUST give the same final scores. A replay test locks this in.
6. **Static, simple and offline.** The game is plain HTML, CSS and JavaScript modules with no build step, no accounts and no network calls after load. It MUST run with `python3 -m http.server 8000 --bind 127.0.0.1`.
7. **Playable by everyone.** Core interactions work with the keyboard and show visible focus. Colour is never the only signal; every device and state also has a shape, icon or label. A first-time player MUST deliver a packet within 60 seconds.
8. **Scope discipline.** One mechanic first (build and repair a path), one full round before extra content, and cut animation and extras before cutting correctness or feedback.

## Honesty about verification

Reports MUST separate checks that passed, failed and were not run. A completion message is not evidence.

## Governance

Changes to this constitution need a written reason and a version bump. If a spec, plan or task conflicts with it, the constitution wins and the other document is corrected.
