---
'@swirls/looms': minor
---

The swarm debugger can show a swarm's whole board, read live from the board itself.

- New `createSwarmDebugger(options)` at `@swirls/looms/swarm/debugger`. Pass `board: (boardId) => reader` to read each swarm's board directly, and `pollMs` (default 2000) for how long to wait once the board has nothing new. A reader is anything with the board's `events` method (`BoardReader`, which `remoteBoard` satisfies as is). `swarmDebugger` is `createSwarmDebugger()` and behaves as before.
- With a reader, the Threads, Tasks and Timeline panes show every event on the board, including posts from before the run, and follow it while the page is visible. A `cursor_unknown` refusal reads the board again from the start. While the reader fails, the panes fall back to the board as the run pulled it and the header shows the error. Members still comes from the run's events.
- The header says which board is showing: "whole board · live" or "as this run pulled it".
- Also exported: `useLiveBoard` and `followBoard` for reading a board outside the plugin, and `applyEvents`, the reducer the `swarmBoard` fold and the live reader share.
