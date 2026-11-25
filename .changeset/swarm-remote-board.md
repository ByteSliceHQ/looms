---
'@swirls/looms': minor
---

Swarms can now run where the board lives in another process.

- `remoteBoard` and `boardHandler` (with `answerBoardCall`) serve a `MessageBoard` over HTTP and use it from a host that can only reach it over the network, such as a run in a Durable Object. The pair passes `boardConformance`.
- Members get three more tools: `board_renew_task`, `board_reopen_task` and `board_cancel_task`.
- A swarm member can set `restMs`, the least time between its activations. Board activity that arrives while it rests wakes it once when the rest ends.
- `mcpTools` in the agent module turns the tools of an MCP server into agent tools, with per-run headers and bound arguments.
- `BoardErrorCodeSchema` is exported, and `BoardErrorCode` is derived from it.
