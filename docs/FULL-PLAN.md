# Throughput Implementation Plan

How we build what `spec.md` describes while following `constitution.md`.

## Tech choices

| Area | Choice | Why |
| --- | --- | --- |
| Language | TypeScript everywhere | One language for sim, client and server, shared types |
| Repo | pnpm workspaces monorepo | Share the simulation between client and server |
| Simulation | Pure TS package, no dependencies | Deterministic, easy to test, runs in browser and Node |
| Client | Vite + Canvas 2D (no game engine) | The game is a grid with simple sprites, so a canvas is enough and loads fast |
| UI shell | Plain TS + small DOM components | Menus, lobby and HUD are simple. Avoid a framework for v1 |
| Server | Node 20 + `ws` WebSocket library | Small, well known, easy to run the sim in-process |
| Tests | Vitest | Fast, works for sim and client logic |
| Hosting | One Node service (server + static client) | Single deploy, in-memory lobbies, no database |

## Repo layout

```
throughput/
  packages/
    sim/            # pure game rules (the core)
      src/
        balance.ts      # every number, from the spec
        types.ts        # State, Device, Packet, Command, Event
        rng.ts          # seeded RNG
        map.ts          # grid, obstacles, seed -> map
        step.ts         # step(state, commands) -> state, one tick
        devices.ts      # device behavior and throughput
        flow.ts         # packet movement, queues, drops
        economy.ts      # credits, costs, refunds
        chaos.ts        # chaos event pool and effects
        attacks.ts      # attacks and counters
        scoring.ts      # score, tiebreakers, ratings
        roles.ts        # co-op roles and abilities
      test/
    bots/           # bot brains, they only emit Commands
      src/ easy.ts normal.ts hard.ts superbot.ts
    protocol/       # message types shared by client and server
  apps/
    client/         # Vite app: menu, lobby, game canvas, HUD, results
    server/         # Node: lobbies, rooms, tick loop, WebSocket
  docs/
    constitution.md spec.md plan.md tasks.md
```

## Core design

### Simulation
- State is a plain serializable object: grid, each network's devices and links, packets in flight, credits, scores, cooldowns, a command log and the RNG state.
- `step(state, commands)` advances exactly one tick (50 ms) and returns the new state plus a list of events (packet delivered, packet dropped, attack launched, chaos started). It never reads a clock.
- A "network" is one player's or bot's board. In Versus and Solo each competitor has one. In Co-op the team has one shared network and the Super Bot has another.
- Packets move per tick along links. Each device has a per-second throughput budget refilled each tick, a queue of 5 (20 extra for a load balancer), and a routing rule.
- Commands are the only input: `PlaceDevice`, `Connect`, `Upgrade`, `Demolish`, `SetPriorityRoute`, `LaunchAttack`, `UseAbility`, `SetRole`. Each carries a player id and is validated by the simulation (enough credits, valid tile, cooldown ready).
- The command log plus the seed fully reproduces a round, which gives us replay tests and easy debugging.

### Bots
- A bot is a function `decide(view, tick) -> Command[]`, where `view` is only what that bot could see.
- Easy, Normal and Hard follow the behavior tables in the spec. The Super Bot uses a search over a small set of build templates and counters attacks it detects.
- Bots run inside the same loop as humans, one `decide` call every 500 ms.

### Online architecture
- The server holds a `Room` per lobby: code, host, players, mode, seed and the simulation state.
- The server runs `step` at 20 ticks per second. Clients send commands. The server validates, stamps the tick they apply on, and applies them.
- The server sends a full snapshot on join and compact deltas about 10 times per second. Clients render the latest state and interpolate packet positions for smooth motion.
- Co-op shared building works because there is one network: any human's valid command applies to it, and everyone sees the same state.

### Lobby protocol (WebSocket messages)
| Message | Direction | Purpose |
| --- | --- | --- |
| `create_lobby` | client to server | Host creates a lobby, server replies with the 5-character code |
| `join_lobby {code, nickname}` | client to server | Join, or `error: not_found` |
| `lobby_state` | server to clients | Players, host, mode, seed, ready flags |
| `set_mode`, `set_seed`, `set_role`, `ready` | client to server | Lobby settings |
| `start_countdown` / `round_start` | server to clients | 10-second countdown then round begins |
| `command` | client to server | A game command |
| `snapshot` / `delta` | server to clients | Game state |
| `round_end {results}` | server to clients | Final scores and ratings |
| `rejoin {code, playerId}` | client to server | Reconnect within 60 seconds |

### Client
- Screens: Main menu (Solo, Versus, Co-op), Solo setup, Lobby, Game, Results.
- Game screen: grid canvas, device palette, credits and timer, packet flow animation, queue and drop indicators, attack bar, chaos event banner, scoreboard (hidden in Rush Hour).
- Input: click or tap to place, drag to connect, long-press or right-click to demolish or upgrade.
- Solo mode imports `sim` and `bots` directly and runs the tick loop in a `requestAnimationFrame` accumulator, so it works offline.

## Risks and how we handle them

| Risk | Plan |
| --- | --- |
| The Super Bot is too strong or too weak | Keep all its numbers in `balance.ts`. Run 1,000 headless simulated rounds per change and report the win rate |
| Rules feel unbalanced | Same headless runner compares bot difficulties against each other |
| Online latency makes building feel laggy | Show a local "ghost" device immediately and reconcile when the server confirms |
| Too many rules for a first-time player | Add a 60-second guided first round in Solo and a rules-at-a-glance panel |
| Disconnect handling bugs | Keep players' state in the room, not the socket, and test rejoin explicitly |

## Delivery phases

1. **Simulation core.** Map, devices, packet flow, economy, scoring. Fully tested, no UI.
2. **Chaos, attacks, bots.** Complete the rules and all bot levels, headless.
3. **Client and Solo mode.** First playable build. Fun gate: playtest before going online.
4. **Server, lobbies and Versus.** Lobby codes, ready-up, rejoin, 2 to 4 players.
5. **Co-op and the Super Bot.** Shared network, roles, Super Bot, ratings.
6. **Polish and ship.** Tutorial, balance pass, accessibility, deploy.

## Definition of done
- Every functional requirement in `spec.md` has a passing test or a documented manual check.
- A recorded replay for each mode reproduces its final score exactly.
- A new player can start a Solo round and deliver a packet in under 60 seconds.
- A 4-person Co-op lobby plays a full 10-minute round without desync.
