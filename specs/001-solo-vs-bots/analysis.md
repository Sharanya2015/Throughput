# Analysis Report: spec, plan and tasks (manual run of speckit-analyze)

Date: 2026-11-17. Run by reading `spec.md`, `plan.md`, `tasks.md` and the constitution. Note: the Spec Kit commands were not available as slash commands in this session, so the analysis was done by hand following the skill's checks.

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| A1 | Medium | The Source's forwarding capacity (12 pkt/s) appears in `StarterKit/SPEC.md` but not in the feature spec, so a tester could not derive fixture results. | Added to FR-004. |
| A2 | Medium | "Busiest link" for DDoS and Fiber cut was undefined. | Defined as the device with the highest utilization over the last 5 seconds, ties broken by closeness to the Destination. Added to FR-011 and FR-010. |
| A3 | Low | Practice mode scales phase times but the spec did not say whether effect durations (20 s, 8 s, 15 s, and so on) scale. | They do not scale. Added to FR-009. |
| A4 | Low | The 15-second attack cooldown was real seconds in both modes; confirmed and stated. | Added to FR-011. |
| A5 | Low | Tasks did not include a no-network check for FR-017. | Added to T022 notes. |
| A6 | Info | The StarterKit input still lists TypeScript monorepo items from the full game only in `docs/`, so no conflict with this feature. | None needed. |

Constitution check: no principle is weakened. Coverage: every FR has at least one task and one check in the plan's verification map. Unmapped tasks: none.

Blocking issues remaining: none.

## Addendum: findings while implementing

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| B1 | High | With the Source at (0,3) and the Destination at (7,3) on the same row, only one shortest path exists, so parallel paths and load balancing could not work. | Moved to Source (0,2) and Destination (7,5), which allows two non-touching equal-length paths. Spec, StarterKit and tests updated. |
| B2 | Medium | The "first neighbour" rule makes cables that touch merge traffic. A fixture with side-by-side branches was capped at 4 pkt/s. | Kept as a feature, documented in the spec and README, and covered by a test. |
| B3 | Medium | A DDoS did nothing because upstream packets always took each freed queue slot before the flood. | The flood now arrives right after the target device forwards. Documented in FR-011. |
| B4 | Medium | Reported "arriving" rate counted only accepted packets, understating overload. | The arrival window now counts offered packets, accepted or dropped. |
| B5 | Medium | The final summary blamed the Source when a Fiber cut disconnected the network. | Reports the disconnection instead. Unit test added. |
| B6 | Medium | Normal and Hard bots rebuilt a plain cable where they had just demolished one to place a Firewall or Load Balancer. | Reserved tiles are skipped by the build plan. |
| B7 | Low | SC-005 as written (three-way rounds) was not stable because the leader draws everyone's discounted attacks. | SC-005 now measures one-on-one duels; three-way results are reported only. |
| B8 | Low | Spawn-rate steps "every 2 minutes" did not fit a 3-minute Practice round. | Steps happen at each 20% of the round. |
