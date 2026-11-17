# Playtest checklist and observed results

Run on 2026-11-17 by the build agent in the built-in browser pane (Chromium-based) at 1280 x 900, served with `python3 -m http.server 8000` and opened at `http://localhost:8000/`. One person (the agent) played; **no second human playtested yet**, so the "watch a teammate hesitate" step of the lab is still open.

| # | Check | Result |
| --- | --- | --- |
| 1 | Setup screen shows, Practice preselected, 3 bots Easy/Normal/Hard | Passed |
| 2 | Start a round; grid, SRC, DST and obstacles render | Passed |
| 3 | Build a full 9-cable path using only the keyboard (click a tile once to focus, then C and arrow keys) | Passed. Packets were delivered, credits and score rose |
| 4 | Visible focus ring on the focused/selected tile | Passed in screenshots (blue outline) |
| 5 | Overload the chain (spawn forced to 6/s from the console), then upgrade a middle cable with U | Passed. Message: "That link was not the bottleneck. Traffic is limited by the Cable at (1,2) (4 pkt/s)..." |
| 6 | Bottleneck hint appears on its own while packets drop | Passed (feed: "Cable at (1,2) passes 4 pkt/s but about N pkt/s arrive...") |
| 7 | Chaos events and bot attacks show in the "What is happening" feed | Passed (Traffic spike, Bandwidth sale, DDoS and Malware launches seen) |
| 8 | Attack buttons stay locked until the Live phase, then unlock | Passed (status text and disabled state) |
| 9 | Round ends and the results screen ranks all four players with each final bottleneck | Passed (round fast-forwarded with the console) |
| 10 | Results message for a network cut by a Fiber cut and never rebuilt | Found a misleading message ("Source dropped the most"), fixed to say the network was disconnected, covered by a unit test. Not re-checked in the browser |
| 11 | Reload during a round returns to the setup screen (no saved state, by design) | Passed (page reload showed setup) |
| 12 | Repeat the same upgrade at maximum capacity | Covered by a unit test ("already at maximum"); not clicked in the browser |
| 13 | Pause and speed buttons | Speed 4x used and worked. Pause key P not tried |
| 14 | Play with the network disconnected | Not run. `grep` finds no `fetch`, `XMLHttpRequest` or `WebSocket` in `src/` or `index.html`, so the game should not need the network after load |
| 15 | Screen reader pass (labels read aloud) | Not run. Tiles have descriptive `aria-label`s and the feed is `role="log"` |
| 16 | Phone or tablet layout | Not run (out of scope for v1) |

## Added later (2026-11-17)

| Check | Result |
| --- | --- |
| Leaderboard under the board lists 1st to 4th with the leader on top, and re-orders as scores change | Passed. Sampled six moments in one round and the order changed from You on top to Ada, Cora, then Cora on top, each time sorted by score |
| Botnet swarm and Route hijack buttons appear in the Attacks panel | Passed (screenshot). A bot used Botnet swarm in the same round |
| Sponsor grant and Routing glitch events | Covered by unit tests only. Not seen firing in the browser |
| Leaderboard hides in Rush Hour and shows a note instead | Covered by a unit test of the visibility rule. Not checked in the browser |
| Row sliding animation | Not judged by eye; only the final positions were checked |
| Reduced-motion setting | Not run |

## Rough edges seen

- The game opens with focus nowhere; the first Tab goes to the skip link. Click a tile once to focus the board.
- During Rush Hour with a single path the Source queue can fill and the message names the Source; adding a second path from the Source is the fix.
