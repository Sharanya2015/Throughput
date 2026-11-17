# Throughput Specification

Source of truth for gameplay: the "Throughput: Rules" document (https://claude.ai/artifact/7WkEyVq5Zj8KqhRUesQrPx). This spec turns those rules into testable requirements. All numbers below are defaults stored in `balance.ts`.

## Summary

Throughput is a browser game where players build a small computer network on a grid and deliver packets from a Source to a Destination before a 10-minute timer ends. It has three modes:

| Mode | Players | Where | Win condition |
| --- | --- | --- | --- |
| Solo vs Bots | 1 human + 1 to 3 bots | Offline, in the browser | Highest score |
| Versus | 2 to 4 humans | Online, joined with a lobby code | Highest score |
| Co-op vs Super Bot | 1 to 4 humans on one team | Online, joined with a lobby code | Team score beats the Super Bot's |

## User stories and acceptance criteria

### US1. Play solo against bots (priority 1)
As a player, I want to play offline against up to 3 bots so I can learn and enjoy the game alone.
- Given I choose Solo, I can pick 1 to 3 bots, each Easy, Normal or Hard, and start without any network.
- Given a round ends, I see a results screen ranking me and each bot by score.
- The game works with the network disconnected after the page has loaded.

### US2. Build and defend a network (priority 1)
As a player, I want to place devices and connect them so packets reach the Internet.
- I can place Cable, Switch, Router, Firewall and Load Balancer on empty tiles, spending credits.
- Packets flow from Source to Destination along my connections, limited by device throughput.
- I can upgrade cables and demolish devices for a 50% refund.
- I can see queues, drops and congestion on each device while the round runs.

### US3. Play Versus with friends (priority 2)
As a host, I want to create a lobby and share a code so friends can join and compete.
- Creating a lobby returns a 5-character code. Joining with a valid code puts me in the lobby with a nickname.
- A lobby holds up to 4 humans. The host chooses the mode and the map seed.
- When everyone is ready, a 10-second countdown starts the round on identical maps.
- Players can attack each other from 2:00, following the attack table.

### US4. Play Co-op against the Super Bot (priority 2)
As a team, we want to build one shared network and beat a very strong bot.
- All human players edit one shared network and one credit pool at the same time.
- The Super Bot runs its own network on the same map and attacks the team.
- The team wins if its combined score at 10:00 beats the Super Bot's, and earns a Win, Silver or Gold rating by margin.
- Players may pick a role (Architect, Dispatcher, Gatekeeper, Responder) for a 20% device discount and a special ability.

### US5. Handle disconnects and rematches (priority 3)
- A disconnected player's devices keep running, and they can rejoin with the same code within 60 seconds.
- If the host leaves, the longest-present player becomes host.
- After a round the lobby stays open and the same code can start another round.

## Functional requirements

### Map and setup
- **FR-1** The grid is 8 × 8 in Solo and Versus and 10 × 10 in Co-op.
- **FR-2** The Source is a fixed tile on the left edge and the Destination a fixed tile on the right edge.
- **FR-3** 6 obstacle tiles are placed by the seed, identically for every player in a Versus or Solo round.
- **FR-4** Players start with 150 credits.
- **FR-5** Device limit is 20 per network. In Co-op it is 20 plus 5 per extra player.

### Round timeline
- **FR-6** A round lasts 10:00. 0:00 to 0:30 is Build with no packets. 0:30 to 2:00 is the grace period with no attacks. 2:00 to 9:00 is Live Play. 9:00 to 10:00 is Rush Hour.
- **FR-7** In Rush Hour the packet spawn rate doubles and the live scoreboard is hidden.
- **FR-8** Packets still in transit at 10:00 do not count.

### Devices
- **FR-9** Devices and costs: Cable 10, Switch 30, Router 50, Firewall 40, Load Balancer 60 credits.
- **FR-10** Throughput per second: Cable 4 (upgrades to 8 for 25 credits, then 12 for 50), Switch 10, Router 12, Firewall 6, Load Balancer 12.
- **FR-11** Switch splits flow evenly across up to 3 outputs. Load Balancer splits across up to 4 outputs and queues 20 extra packets. Router sends packets down the least congested path, and changing its priority route has a 5-second cooldown. Firewall blocks every malware packet it scans, and packets above 6 per second pass unscanned.
- **FR-12** Demolishing a device refunds 50% of its cost.

### Packets, queues and economy
- **FR-13** Packets spawn at 2 per second, rising by 1 every 2 minutes. In Co-op, add 0.5 per second for each human beyond the first.
- **FR-14** Each device holds up to 5 waiting packets. Packets beyond that are dropped.
- **FR-15** A packet that crosses more than 12 tiles is dropped.
- **FR-16** Each delivered packet gives 1 point and 1 credit.

### Chaos events
- **FR-17** Chaos events fire at 2:00, 3:30, 5:00, 6:30 and 8:00, drawn from the pool below using the shared seed, and hit all players and bots at once:
  - Fiber cut: each network's busiest cable is destroyed until rebuilt.
  - Traffic spike: spawn rate doubles for 20 seconds.
  - DNS outage: the Destination stops accepting packets for 5 seconds.
  - Power surge: one random device per network goes offline for 15 seconds.
  - Bandwidth sale: upgrades cost half price for 30 seconds.

### Attacks
- **FR-18** From 2:00, a player or bot can spend credits on an attack against one rival:
  - DDoS burst, 40 credits: 20 junk packets per second on the target's busiest link for 8 seconds. Countered by a load balancer or a second path.
  - Malware packet, 30 credits: 10 malware packets, each reaching the Destination costs the victim 3 points. Countered by a firewall on the path.
  - Latency spike, 25 credits: halves packet speed for 10 seconds. Countered by a router with a priority route set.
  - Port scan, 20 credits: reveals the target's layout and queues for 20 seconds. Countered by a firewall at the Source.
- **FR-19** Each attacker may launch one attack every 15 seconds.
- **FR-20** Attacks on the current points leader cost 20% less (Versus and Solo).
- **FR-21** A fully blocked attack gives the defender 10 credits.

### Scoring
- **FR-22** Score is packets delivered minus 3 for each malware packet that reaches the Destination.
- **FR-23** Tiebreakers in order: fewest dropped packets, most attacks blocked, fewest unspent credits.

### Bots
- **FR-24** Easy bots build one path, upgrade slowly, attack every 45 seconds and never build defenses.
- **FR-25** Normal bots build two paths, add a firewall after their first malware hit and attack every 25 seconds.
- **FR-26** Hard bots build three paths with a load balancer, counter each attack with its counter and attack the score leader every 15 seconds.
- **FR-27** All bots use the same command interface and costs as humans.

### Co-op specifics
- **FR-28** The Super Bot has its own network on the same map, spawn rate and device limit as the team, with near-optimal build orders and 25% extra credits per delivered packet.
- **FR-29** From 2:00 the Super Bot attacks the team every 20 seconds, aiming at the least defended path, and from 6:00 it can fire two attacks at once. The team can spend shared credits on attacks against the Super Bot.
- **FR-30** Rating: Win for any higher score, Silver for at least 10% higher, Gold for at least 25% higher.
- **FR-31** Role discounts are 20%: Architect on cables and upgrades, Dispatcher on routers, switches and load balancers, Gatekeeper on firewalls, Responder on repairs and restarts. Abilities: Architect rebuilds a cable instantly every 30 seconds, Dispatcher reroutes traffic around a tile for 10 seconds, Gatekeeper cleans all malware every 45 seconds, Responder restores an offline device every 20 seconds.

### Lobbies
- **FR-32** A lobby code is 5 characters from an alphabet without look-alikes (no 0, O, 1, I, L). Codes expire 30 minutes after creation and are unique among live lobbies.
- **FR-33** Up to 4 humans per lobby. A player who joins after the round starts spectates.
- **FR-34** A disconnected player may rejoin within 60 seconds with the same code. If the host leaves, the longest-present player becomes host.
- **FR-35** An invalid or expired code shows "Lobby not found" and lets the player retry.

## Non-functional requirements
- **NFR-1** The simulation tick is 20 per second. Client rendering targets 60 fps.
- **NFR-2** Online latency: commands should show on all clients within 150 ms on a normal connection.
- **NFR-3** One server instance supports at least 50 simultaneous lobbies.
- **NFR-4** No account, email or personal data is collected.
- **NFR-5** Colour-blind safe: every state uses shape or icon as well as colour.

## Out of scope for v1
- Accounts, friends lists and persistent profiles.
- Public matchmaking and global leaderboards.
- Daily challenge and themed maps. These are listed as optional ideas in the rules.
- Native mobile apps. The web client only needs to work on phones.

## Open questions
1. Should empty seats in a Versus lobby be fillable with bots? The rules currently say no.
2. Should the scoreboard be hidden for the whole round in Versus? Current rule: visible until 9:00.
3. Exact Super Bot skill target. It needs playtesting so a strong 4-person team wins about half the time on Normal difficulty.
