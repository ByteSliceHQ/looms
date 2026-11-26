---
'@swirls/looms': minor
---

New `swarmDebugger` plugin at `@swirls/looms/swarm/debugger`, and the hosted debugger app includes it.

- A swarm run opens on a workspace with four panes: **Members** (status, activations, last outcome, and a link to each member's latest run), **Threads** (messages by channel, each root followed by its replies, with labels and mentions), **Tasks** (grouped waiting, ready, claimed, blocked, completed, failed, canceled, with holder, lease, assignee, needs and note) and **Timeline** (the board's events in order, followed live).
- The board is read only from the run's own `swarm.board.pulled` events through the new `swarmBoard` live fold, so it needs nothing beyond the standard run API. It skips pages the swarm ignored and starts over when the board log was reset or the swarm moved to another board.
- Every `swarm.` event has a summary in the event stream.
- `DebuggerShell` fills in the kind and name of a run opened by id alone, such as a member run followed from another view, so the workspace shows that run's own view instead of the run type picker.
- `agentDebugger` opens every agent run as a transcript, including agents whose input is not one message, such as swarm members. With no run selected, such an agent starts from its input form.
- `StatusBadge` and `StatusDot` colour module statuses such as `active`, `claimed`, `blocked`, `paused`, `stopping` and `halted` instead of showing them grey.
