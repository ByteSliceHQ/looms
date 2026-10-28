---
'@swirls/looms': patch
---

Fix a wake-loop spin that failed a run with `MaxWakeIterationsError` whenever a workflow node finished while a sibling node was still busy (an effect in `retry_wait`, a sleep, or a child wait) and nothing else was runnable. The workflow scheduler legitimately returned no events in that situation, but the local executor recorded the empty result as a failed attempt (`empty-outcome`), and because an untagged effect takes its id from the event that caused it, the failure event re-derived an identical scheduler effect under a new id, over and over. An effect handler that returns no events is now recorded as `runtime.effect.completed`, matching the worker path, and the fold no longer re-issues an untagged effect that the completion event itself would reproduce unchanged; any later event for the thread still re-derives it with a fresh id. Parallel root nodes no longer need to be serialised into a dependency chain to survive a retry.
