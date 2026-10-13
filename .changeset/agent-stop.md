---
'@swirls/looms': minor
---

`stopAgentTurn()` builds an `agent.turn.stopped` signal that ends the turn in progress without ending the run. A conversational agent aborts its in-flight model call or tool, cancels child threads its tool calls started, answers open tool calls with a stopped result, and waits for the next message. An agent session cancels its active turn and stays open. The debugger chat shows a Stop button while a turn is running.

An interrupting `steer` now ends the turn the same way before it starts the next one, so it no longer leaves tool calls unanswered or tool children running.

Cancelling a thread now cancels every live thread below it, and a signal interrupt also aborts in-flight work in the named thread's descendants.

The new `turnActivity` projection reports whether the root agent thread has a turn in progress.
