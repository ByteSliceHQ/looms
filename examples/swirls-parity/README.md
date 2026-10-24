# Swirls-shaped Looms conformance suite

Hand-written scenarios that mirror representative Swirls cookbook recipes without importing Swirls code. Runs in-process against `@swirls/looms` (memory stores, in-memory queues).

```sh
cd examples && bun test swirls-parity
```

## Coverage

| Scenario                                                                | File                               |
| ----------------------------------------------------------------------- | ---------------------------------- |
| 64-wide fanout of child runs                                            | `fanout-loops.test.ts`             |
| Map and while loops over child runs                                     | `fanout-loops.test.ts`             |
| Approval timeout and rejection                                          | `approval-blob-secrets.test.ts`    |
| 1.5 MB node output via blob offload                                     | `approval-blob-secrets.test.ts`    |
| Secret context never appears in events, snapshots, projections, or HTTP | `approval-blob-secrets.test.ts`    |
| Worker killed mid-flight resumes from heartbeat details                 | `worker-queue.test.ts`             |
| Queue duplicate delivery, crash-before-started, long attempt            | `worker-queue.test.ts`             |
| Non-retryable failure with fallback                                     | `worker-queue.test.ts`             |
| Agent structured output                                                 | `agent-schedule-projector.test.ts` |
| Agent session: 500 turns, steering, stop, compaction                    | `agent-schedule-projector.test.ts` |
| Cron across a daylight-saving transition                                | `agent-schedule-projector.test.ts` |
| Event-log projector rebuilt from cursor 0                               | `agent-schedule-projector.test.ts` |

Staging load, chaos, and cost checks on a real Cloudflare account are out of scope for this package suite; they belong to the Swirls cutover sign-off.
