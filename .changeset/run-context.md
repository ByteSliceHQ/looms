---
'@swirls/looms': minor
---

Runs accept immutable `attributes` and a `secrets` context. Attributes are recorded on `runtime.run.started`, the run state, and the run summary, and are passed to `authorize` when present. Secrets stay in a side store: they are available to effect handlers and in-process worker dispatch, and they are not written to events, snapshots, or HTTP responses.
