# Throughput Spec (input for /speckit-specify)

Game: **Throughput**. First playable version: **Solo vs Bots** only, as a static browser game. The online modes (Versus, Co-op vs Super Bot) are out of scope and tracked in `docs/FULL-SPEC.md`.

## Learner and goal

- **Who:** someone learning how networks carry traffic, such as a student or junior engineer.
- **What they do:** place devices on an 8 × 8 grid to link a Source to a Destination, spend credits, upgrade, and respond to chaos events and bot attacks during a timed round.
- **What they learn:** (1) a path is only as fast as its slowest device (the bottleneck), (2) upgrading a link that is not the bottleneck does nothing, (3) parallel paths with a splitting device raise total throughput, (4) queues overflow and drop packets when load exceeds capacity.
- **Success:** after a round, the player can name the bottleneck in their network and say which change would raise delivered packets.

## The traffic model (this is what the game teaches and what tests check)

- Time advances in ticks of 0.05 s (20 per second).
- The grid is 8 × 8. The **Source** is tile (0,2) and the **Destination** is tile (7,5). Obstacle tiles are placed from the seed.
- A **network** is the set of devices a competitor has placed, plus the Source and Destination. Two devices are **linked** when their tiles share an edge (up, down, left, right). There is no separate wiring step.
- Every device has a **capacity** in packets per second (pkt/s) and a **queue** that holds 5 waiting packets (a Load Balancer holds 25).
- A packet moves one tile at a time. In one second a device forwards at most its capacity. A packet that arrives at a full queue is **dropped**.
- Each device forwards a packet to a linked neighbour that is one step closer to the Destination (shortest path through placed devices). If several neighbours qualify:
  - Cable and Firewall use the first one in the order up, right, down, left.
  - Switch spreads packets evenly across up to 3 of them, in turn.
  - Load Balancer spreads evenly across up to 4, in turn.
  - Router picks the one whose queue is shortest.
- A packet that has moved more than 12 times is dropped. A packet at the Destination is **delivered**.
- The Source spawns 2 packets per second, rising by 1 every 2 minutes, doubling in Rush Hour. A packet that cannot enter the Source's queue is dropped.

| Device | Cost (credits) | Capacity (pkt/s) | Notes |
| --- | --- | --- | --- |
| Cable | 10 | 4 | Upgrade to 8 for 25, then 12 for 50 |
| Switch | 30 | 10 | Splits across up to 3 links |
| Router | 50 | 12 | Picks the least congested link |
| Firewall | 40 | 6 | Removes every malware packet it forwards |
| Load Balancer | 60 | 12 | Splits across up to 4 links, queue of 25 |

The Source forwards up to 12 pkt/s. The Destination accepts any number.

## Round

- A round is 10:00. 0:00 to 0:30 Build (no packets). 0:30 to 2:00 grace (no attacks). 2:00 to 9:00 Live (attacks and chaos). 9:00 to 10:00 Rush Hour (spawn rate doubles, scoreboard hidden).
- Players start with 150 credits. Each delivered packet gives +1 credit and +1 point. Demolishing a device refunds 50% of its cost. The limit is 20 devices per network.
- **Score** is packets delivered minus 3 per malware packet that reaches the Destination. The highest score at 10:00 wins. Ties go to the fewest dropped packets.
- A quick **practice round** of 3:00 with the same phases scaled down exists so people can learn fast. Official scoring uses the full 10:00 round.

## Chaos events and attacks

- Chaos events happen at 2:00, 3:30, 5:00, 6:30 and 8:00 (scaled in practice mode): Fiber cut (busiest cable destroyed), Traffic spike (spawn doubles for 20 s), DNS outage (Destination stops accepting for 5 s), Power surge (one random device offline 15 s), Bandwidth sale (upgrades half price for 30 s). They hit all competitors at once.
- Attacks (from 2:00, one per attacker every 15 s): DDoS burst 40 credits (20 junk packets per second on the target's busiest link for 8 s, countered by a Load Balancer or a second path); Malware packet 30 credits (10 malware packets, each reaching the Destination costs 3 points, countered by a Firewall); Latency spike 25 credits (the target's devices run at half capacity for 10 s); Port scan 20 credits (reveals the target's layout and queues for 20 s).
- Attacks on the points leader cost 20% less. A fully blocked attack gives the defender 10 credits.

## Bots

- Easy: builds one path along a row, upgrades slowly, attacks every 45 s, no defenses.
- Normal: builds two paths, adds a Firewall after its first malware hit, attacks every 25 s.
- Hard: builds two paths, upgrades early, adds Firewalls on both paths and a Load Balancer, scans before attacking the score leader every 15 s.
- Bots use the same commands and costs as the player.

## Feedback the game must give

- Live: each device shows utilization (percent of capacity used), queue fill and a drop counter.
- After a drop-heavy period: a message naming the bottleneck device and what to do ("Cable at (4,3) passes 4 pkt/s but 6 pkt/s arrive. Upgrade it or add a parallel path.").
- Wrong-choice message when an upgrade does not change the result: "That link was not the bottleneck. Traffic is limited by the Firewall at (5,3)."
- End screen: ranking, scores, delivered, dropped, and the bottleneck of the final network.

## Hand-checked fixtures (become the first tests)

1. **Correct case.** Source, a chain of nine Cables ((1,2) to (7,2), then (7,3) and (7,4)), Destination, spawn rate 2 pkt/s. Every device has capacity 4, so all packets are delivered. Delivered = spawned.
2. **Plausible wrong choice.** Same chain with spawn rate 6 pkt/s. Delivered rate is 4 pkt/s (the slowest Cable). Upgrading the middle Cable to 8 pkt/s changes nothing, because the other Cables still pass 4 pkt/s. Upgrading all nine raises delivery to 6 pkt/s.
3. **Edge case.** Spawn rate 6 pkt/s with two equal-length parallel paths that never touch (path A along row 2 then down column 7, path B down column 0 then along row 5). The Source splits traffic, so each path carries 3 pkt/s and all 6 pkt/s are delivered. A Firewall (6 pkt/s) in an otherwise fast chain caps delivery at 6 pkt/s.

## Acceptance criteria

- AC1 A player can finish a full round against 1 to 3 bots from a fresh page load with no network after load.
- AC2 The three fixtures above pass as automated tests.
- AC3 A wrong upgrade produces the "not the bottleneck" explanation.
- AC4 Every device and state has a shape or label as well as colour, and placement, upgrade, demolish and attack work with the keyboard with visible focus.
- AC5 Same seed plus same commands gives the same final scores (replay test).
- AC6 The README lists the run and test commands, and marks any check not run.

## Non-goals

- Online play, lobby codes, accounts, leaderboards, sound, themed maps, phones-first layout, Super Bot.

## Open questions for clarify

- Answered in clarify: Practice (3:00) is the default; adjacency is enough, no wiring step.
