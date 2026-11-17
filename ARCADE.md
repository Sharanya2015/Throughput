---
arcade_version: 1

game:
  title: Throughput
  slug: throughput
  tagline: "Find the bottleneck, share the load, and outscore three bots."
  summary: "Throughput is a short browser game where you build a chain of network devices that carries packets from a Source to a Destination while three bots compete and attack. Seven random events and six attacks are announced with a five-second countdown, two of the attacks need a combination of equipment to stop, and a live leaderboard tracks the race. After each decision it names the bottleneck, teaching that a path is only as fast as its slowest device and that parallel paths share load."
  topics: [bandwidth, bottleneck, load-balancing, queues, firewalls, ddos]
  category: network-fundamentals
  skill_level: beginner
  play_minutes: 3
  levels: 2
  card_image: assets/card.jpg
  card_image_alt: "Throughput title card with the tagline 'Find the bottleneck. Share the load. Outscore the bots.' beside a colourful 8 by 8 network board of cables, a switch, a router, a firewall and a load balancer."
  repo: https://github.com/Sharanya2015/Throughput
  repo_path: .
  license: unknown

creator:
  name: Sharanya
  github: Sharanya2015
  location: Arizona
  organization: Lumen
  links: unknown
  first_spec_project: true
  workshop: NAF AC6
  consent_to_publish: true

build:
  started: "2026-11-17"
  finished: "2026-11-17"
  wall_time: unknown
  spec_driven:
    framework: GitHub Spec Kit
    framework_version: 1.4.2.dev0
    artifacts:
      - .specify/memory/constitution.md
      - specs/001-solo-vs-bots/spec.md
      - specs/001-solo-vs-bots/plan.md
      - specs/001-solo-vs-bots/tasks.md
      - specs/001-solo-vs-bots/analysis.md
      - StarterKit/CONSTITUTION.md
      - StarterKit/SPEC.md
      - StarterKit/PLAN.md
    task_count: 25
    loops_or_phases: "Seven workshop steps run by hand, one at a time. No Ralph loop."
  model: claude-sonnet-5-5
  helper_models: "unknown (one fetch subagent read the Arcade page; its model was not recorded)"
  harness: "Claude Code in the Claude desktop app (Code tab)"
  harness_version: unknown
  mcp_servers:
    - "Claude Docs connector (wrote the rules document)"
    - "Claude built-in browser (playtesting and the card image)"
    - "Terminal panel (git push, run by the human)"
  rag_and_sources:
    - "GitHub Spec Kit bundled templates and skill files, version 1.4.2.dev0"
    - "The workshop lab guide, pasted by the human"
    - "https://automateyournetwork.com/arcade/ (submission page and ARCADE.md template)"
  skills_and_plugins:
    - "Spec Kit skill files in .claude/skills (read and followed by hand, not invoked as commands)"
  other_tools: [uv, specify-cli, node 22 (node --test), python3 (http.server), git, gh (GitHub CLI), GitHub Pages]
  human_prompts: unknown
  usage:
    input_tokens: unknown
    output_tokens: unknown
    cost_note: unknown
  ai_generated_assets: "All code, tests, documentation, spec artifacts and interface text were written by the AI agent. No images or audio were generated. The card image (assets/card.jpg) and README screenshot (assets/screenshot.jpg) are screenshots of the running game, and the card adds a title and tagline overlay made in the browser."

runtime:
  kind: static-web
  stack: "HTML, CSS and JavaScript ES modules. No build step. Node is only used for tests."
  start: "python3 -m http.server 8000 --bind 127.0.0.1"
  url_after_start: "http://localhost:8000"
  hosted_url: "https://sharanya2015.github.io/Throughput/"
  static_root: .
  requires_install: false
  requires_network: false
  requires_api_key: false
  uses_ai_at_runtime: false
  browsers: "Played in the Claude built-in browser pane (Chromium based) only. Other browsers were not tried."
  accessibility: "Board tiles are buttons with descriptive labels, arrow-key movement, letter shortcuts, visible focus, and text labels in addition to colour. Countdown warnings sit in a polite live region. A screen reader was not tested."
  save_state: "none. Reloading returns to the setup screen."

verification:
  tests: "node --test (60 unit tests), node scripts/head-to-head.mjs and node scripts/bots-vs-bots.mjs (bot balance), a manual browser playthrough recorded in docs/PLAYTEST.md, and a check that the hosted GitHub Pages site loads and runs a round"
  tests_passing: "60 of 60 on 2026-11-17"
  facts_sourced_from: "The game's own traffic model, defined in specs/001-solo-vs-bots/spec.md. It was not checked against an external networking source or by an independent reviewer."
  known_limits:
    - "Solo vs Bots only. Versus and Co-op are designed in docs/ but not built."
    - "No second person has playtested without coaching."
    - "Offline play was not tested, though the code makes no network calls."
    - "The hosted Pages site was checked once, in one browser, by loading it and running a round with scripted commands. It was not clicked through by hand."
    - "Desktop only. Phone layout and screen readers were not tested."
    - "Sponsor grant and Routing glitch were covered by unit tests but not seen firing in the browser."
    - "Bots do not react to the five-second attack warnings; only the human player can use them."
    - "In three-way bot rounds the Normal bot often beats Hard because the leader draws everyone's attacks. One-on-one duels order the bots as expected."
    - "No licence file yet."
---

## In one paragraph

Throughput puts you in charge of a tiny network. You place cables, switches, routers, firewalls and load balancers on an 8 by 8 grid so packets can flow from a Source to a Destination, and every delivered packet scores a point. Three bots play the same map and attack you, random events and attacks are announced with a five-second countdown so you can react, and a leaderboard under your board ranks everyone until the last 10 percent of the round hides it. The game shows how full each queue is, names the bottleneck when packets drop, and tells you if you upgraded the wrong link. A round takes 3 minutes in Practice or 10 minutes in the full version.

## How it was built

The game followed the seven workshop steps with GitHub Spec Kit: constitution, specification, clarification, plan, tasks, analysis and implementation. The Spec Kit slash commands were not available as commands during the session, so the agent followed each command's instruction file by hand and wrote the same artifacts. The simulation was written first as plain JavaScript with no browser code, and three hand-worked cases were turned into tests before the interface existed: a correct case, a wrong upgrade and parallel paths. Building the game exposed design faults that the written spec had missed. A Source and Destination on the same row allowed only one shortest path, which made load balancing impossible, so both were moved. A flood attack did nothing until the order of queue updates was changed. Bots rebuilt cables where they had just removed one to fit a firewall. The interface was played through in the built-in browser using the keyboard only. Later requests added a colour pass, two more random events, two attacks that need two kinds of equipment to stop, a live leaderboard and a five-second warning before every event and attack, each with new tests. The warning meant attacks no longer land instantly. The static site was published on GitHub Pages and checked there. The online modes in the original design were left out to keep the first version small and static.

## What we'd tell the next builder

- Work out your fixtures by hand first and check the geometry of your map, because one rule about which neighbour a packet takes decided whether a whole game mechanic could work.
- Test the bots against each other early. Three of the bugs found were in bot behaviour, not in the rules.
- Keep every number in one file so tuning balance never means touching logic.
