---
'@swirls/looms': minor
---

`stopAgentTurn()` builds an `agent.turn.stopped` signal that ends the turn in progress without ending the run. A conversational agent aborts its in-flight model call or tool, cancels child threads its tool calls started, answers open tool calls with a stopped result, and waits for the next message. An agent session cancels its active turn and stays open. The debugger chat shows a Stop button while a turn is running.

Signal interrupt rules now receive the run state as a second argument, so a module can interrupt a thread other than the one the signal targets.
