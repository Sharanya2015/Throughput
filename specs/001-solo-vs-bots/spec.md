# Feature Specification: Throughput, Solo vs Bots

**Feature Branch**: `001-solo-vs-bots`

**Created**: 2026-11-17

**Status**: Implemented (first playable). See `analysis.md` for the decisions made while building.

**Input**: User description: "Read StarterKit/SPEC.md. Specify the first playable version of Throughput: a static browser game where one player builds a packet network on an 8 x 8 grid and competes against 1 to 3 bots over a timed round, learning to find bandwidth bottlenecks and balance load across parallel paths."

## Clarifications

### Session 2026-11-17

- Q: Should the player need a visible wiring step, or is adjacency enough? → A: Adjacency is enough. Two devices are linked when their tiles share an edge. This keeps the first round fast and makes bottlenecks visible as a chain of tiles.
- Q: Is a 3-minute practice round acceptable as the default for the first demo? → A: Yes. The setup screen offers Practice (3:00, all phases scaled to 30%) and Full (10:00). Practice is preselected. Official scoring rules are the same in both.
- Q: How does the player choose an attack target? → A: A target dropdown lists the bots; the default target is the current score leader other than the player.
- Q: Can the round be paused? → A: Yes, with a Pause button and the P key, in Solo only.
- Q: What does Port scan reveal in a game where all boards are visible? → A: Boards of bots are hidden by default and shown as a score and a one-line status. Port scan reveals a bot's board and queues for 20 s, so scanning has a purpose.
- Q: What happens to packets whose next hop does not exist (disconnected network)? → A: They wait in the queue; when the queue is full, new packets are dropped. The bottleneck message then says the path is not connected.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build a path and deliver packets (Priority: P1)

A learner opens the page, starts a Practice round against one Easy bot, places devices on the grid to link the Source to the Destination, and watches packets get delivered, queued and dropped.

**Why this priority**: This is the core teaching loop. Without it nothing else matters.

**Independent Test**: Start a round, place cables from Source to Destination in row 3, and confirm delivered count rises and a utilization readout appears on each device.

**Acceptance Scenarios**:

1. **Given** the build phase and 150 credits, **When** the player places a Cable on an empty tile, **Then** credits fall by 10 and the tile shows a Cable with its capacity.
2. **Given** an unbroken chain of devices from Source to Destination, **When** the packets phase starts, **Then** packets are delivered and the delivered count and credits rise by 1 each.
3. **Given** a packet arrives at a full queue (5 packets), **When** the tick runs, **Then** the packet is dropped and the device's drop counter rises.

---

### User Story 2 - Understand the bottleneck (Priority: P1)

After a period of heavy loss, the game names the slowest device on the busiest path and says what would help. If the player upgrades something that is not the bottleneck, the game says so.

**Why this priority**: This is the learning outcome, so it ships with the first round.

**Independent Test**: Build a chain of nine Cables with spawn 6 pkt/s, upgrade the middle one, and confirm the delivered rate stays 4 pkt/s and the game shows the "not the bottleneck" message.

**Acceptance Scenarios**:

1. **Given** a chain of 9 Cables at 4 pkt/s and 6 pkt/s arriving, **When** drops occur, **Then** the message names the first Cable at the front of the longest queue and states its capacity versus the arrival rate.
2. **Given** the same chain, **When** the player upgrades a Cable that has a free queue and utilization below 100%, **Then** a message says it was not the bottleneck and names the device that is.
3. **Given** a Firewall (6 pkt/s) in the chain with capacity elsewhere of 12 pkt/s, **When** 8 pkt/s arrive, **Then** the message names the Firewall.

---

### User Story 3 - Compete against 1 to 3 bots (Priority: P1)

The player picks 1 to 3 bots and a difficulty for each, plays the round, and sees a ranked results screen.

**Why this priority**: The game mode itself.

**Independent Test**: Run a round with three bots (Easy, Normal, Hard) and confirm all four scores appear and the ranking is sorted by score with the tiebreaker rule.

**Acceptance Scenarios**:

1. **Given** the setup screen, **When** the player chooses 3 bots and Start, **Then** the round begins with four networks on identical maps.
2. **Given** the round ends, **When** results show, **Then** each competitor's score, delivered, dropped and final bottleneck appear, ranked by score then fewest drops.
3. **Given** the same seeds, **When** the headless duel runner plays one-on-one rounds, **Then** Hard outscores Normal, and Normal outscores Easy, in more than half of the rounds.

---

### User Story 4 - Survive chaos and attacks (Priority: P2)

From 2:00 (0:36 in Practice) chaos events and attacks hit, and the player responds with counters.

**Why this priority**: Adds competition and teaches load balancing and defense, but the round works without it.

**Independent Test**: Launch a DDoS at a bot with and without a Load Balancer on its busiest path and confirm drops differ.

**Acceptance Scenarios**:

1. **Given** the Live phase and enough credits, **When** the player launches an attack, **Then** credits fall by its cost, a 15-second cooldown starts and the effect is applied to the target.
2. **Given** a Firewall on the path, **When** malware packets arrive, **Then** they are removed and the defender gains 10 credits when every malware packet was blocked.
3. **Given** a chaos event time, **When** it fires, **Then** it applies to all competitors at once and a banner names it.

---

### User Story 5 - Play with keyboard and read the board (Priority: P2)

A player who cannot use a mouse can place, upgrade, demolish and attack with the keyboard, and every device shows a shape or label as well as colour.

**Why this priority**: Constitution principle VII.

**Independent Test**: Complete placing a path using only Tab, arrow keys, Enter and letter shortcuts.

**Acceptance Scenarios**:

1. **Given** the board has focus, **When** the player uses arrow keys, **Then** a visible focus ring moves between tiles.
2. **Given** a tile has focus, **When** the player presses C, S, R, F or L, **Then** the matching device is placed if affordable.
3. **Given** colour is ignored, **When** reading the board, **Then** each device is identifiable by its letter and shape, and overload is shown by a text label.

### Edge Cases

- Placing a device on an obstacle, the Source, the Destination or an occupied tile is rejected with a reason.
- Placing a device with too few credits is rejected with a reason and no credit change.
- Placing beyond the 20-device limit is rejected.
- Demolishing refunds 50% of the cost and removes pending packets in that device (counted as dropped).
- Repeated clicks or key presses on Upgrade at max level do nothing and show "already maximum".
- A disconnected network never crashes the sim; packets wait, then drop. The messages say the network is disconnected rather than blaming a device.
- Cables that touch outside the intended path merge traffic, so two side-by-side branches share one cable and are limited by it.
- Reloading the page restarts the setup screen; no round state is saved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST present an 8 × 8 grid with a Source at (0,2), a Destination at (7,5) and 6 seed-placed obstacles that never block the two guaranteed 10-hop paths.
- **FR-002**: Players MUST be able to place Cable, Switch, Router, Firewall and Load Balancer on empty tiles, upgrade Cables twice, and demolish devices for a 50% refund, within a 20-device limit.
- **FR-003**: Two devices MUST be linked when their tiles share an edge.
- **FR-004**: The simulation MUST advance in 0.05 s ticks and every device MUST forward at most its capacity per second, with queues of 5 (25 for Load Balancer) and drops on overflow. The Source forwards at most 12 pkt/s and the Destination accepts any number.
- **FR-005**: Each device MUST forward packets to neighbours that are one step closer to the Destination, using the tie rules in the traffic model (Cable and Firewall first in order up, right, down, left; Switch round-robin over up to 3; Load Balancer round-robin over up to 4; Router shortest queue; the Source behaves like a Switch). Because only equal-length shortest routes are used, parallel paths must be the same length, and cables that touch merge traffic.
- **FR-006**: Packets that move more than 12 times MUST be dropped.
- **FR-007**: The Source MUST spawn 2 packets per second, +1 per second at each 20% of the round (every 2 minutes in a Full round), doubled in Rush Hour; a packet that cannot enter the Source queue MUST be dropped.
- **FR-008**: Each delivered packet MUST add 1 point and 1 credit. Malware packets reaching the Destination MUST subtract 3 points. Score ties MUST go to fewest dropped packets.
- **FR-009**: A round MUST follow the phases Build (no packets), Grace (no attacks), Live and Rush Hour (spawn doubles, scoreboard hidden), with the Full round at 10:00 and Practice at 3:00 (all phase times scaled to 30%; effect durations such as 20 s or 8 s are not scaled).
- **FR-010**: Five chaos events (Fiber cut, Traffic spike, DNS outage, Power surge, Bandwidth sale) MUST fire at 20%, 35%, 50%, 65% and 80% of the round, drawn from the seed, and MUST affect all competitors.
- **FR-011**: Players and bots MUST be able to launch DDoS burst, Malware packet, Latency spike and Port scan with the stated costs, effects, counters, 15-real-second limit, 20% leader discount and 10-credit blocked-attack reward. Counters: a Load Balancer in the network cuts DDoS junk to 25% and two parallel paths from the Source cut it to 50%; a Firewall on the path removes malware; a Router anywhere in the network makes it immune to Latency spike; a Firewall next to the Source blocks Port scan. A DDoS flood arrives right after the target device forwards, so it takes freed queue slots before upstream packets. The "busiest link" for DDoS burst and Fiber cut is the device with the highest utilization over the last 5 seconds, ties broken by closeness to the Destination.
- **FR-012**: The game MUST show per-device utilization, queue fill and drops, and MUST give the bottleneck and wrong-upgrade messages described in the user stories.
- **FR-013**: The player MUST be able to play against 1 to 3 bots chosen as Easy, Normal or Hard, with behaviours as described in `StarterKit/SPEC.md`.
- **FR-014**: Bots MUST act only through the same commands and costs as the player.
- **FR-015**: The same seed and command list MUST produce identical results.
- **FR-016**: All interactions MUST work by keyboard, with visible focus and non-colour cues.
- **FR-017**: The game MUST run from static files with no network access after load.

### Key Entities

- **Game**: seed, mode (Practice or Full), tick, phase, list of competitors, chaos schedule, active effects.
- **Competitor**: a human or bot with a board, credits, score, delivered, dropped, cooldowns and attack history.
- **Board**: the grid, devices placed, queues and packets in flight.
- **Device**: kind, level, tile, capacity, queue, utilization window, drop counter, offline timer.
- **Packet**: kind (normal, malware, junk), hop count.
- **Command**: place, upgrade, demolish, attack, with an actor and a tick.
- **Event**: delivered, dropped, chaos, attack, blocked, used by the explanation and log.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time player delivers their first packet within 60 seconds of starting.
- **SC-002**: All three hand-checked fixtures pass as automated tests.
- **SC-003**: After a wrong upgrade, the game shows the "not the bottleneck" message every time.
- **SC-004**: A full round against 3 bots completes without errors and the replay test reproduces its final scores exactly.
- **SC-005**: In one-on-one headless duels, Hard outscores Normal and Normal outscores Easy in more than half of rounds. (In three-way rounds the score leader draws everyone's discounted attacks, so the order there can differ; this is reported, not required.)
- **SC-006**: All core actions are completable with the keyboard alone.

## Assumptions

- Desktop browsers with ES modules; phone layout is out of scope for v1.
- One human player per game; the page holds no saved state.
- Obstacles never block every path from Source to Destination (generation checks this).
- Online modes and the Super Bot are deferred to a later feature.
- Node 22 is available to run `node --test`; no other tooling is required.
