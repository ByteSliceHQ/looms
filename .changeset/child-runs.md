---
'@swirls/looms': minor
---

feat(runtime)!: launch workflow children as their own runs

A workflow can set `childExecution: 'run'` so spawn, map, fanout, and loop start a child run instead of a thread. The child run id is stable across retries. When the child finishes it signals `runtime.child.settled`, which completes the parent's wait. `childClose` is `terminate` or `wait`. The default remains in-process threads.

BREAKING CHANGE: `RunLauncher` implementations must provide `signal` and `cancel`.
