import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { createEvent } from './envelope'
import { makeMemoryEventStore } from './store'

describe('memory EventStore', () => {
  test('appends and reads by runId', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_store'

    await Effect.runPromise(
      store.append(runId, [
        createEvent(runId, {
          type: 'runtime.run.started',
          payload: { rootThreadId: 'thr_1', kind: 'counter', definitionName: 'c', input: null },
          threadId: null,
          origin: { type: 'system' },
        }),
      ]),
    )

    const events = await Effect.runPromise(store.read(runId))
    expect(events).toHaveLength(1)
    expect(events[0]?.seq).toBe(1)
    expect(events[0]?.runId).toBe(runId)
    const runs = await Effect.runPromise(store.listRuns())
    expect(runs).toEqual([runId])
  })
})
