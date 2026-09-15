import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import {
  createEvent,
  makeMemoryEventStore,
  makeMemorySnapshotStore,
  snapshotStoreOf,
  withSnapshotStore,
  type EventEnvelope,
} from '@looms/core'

import type { Projector } from './projector'
import { withProjectors } from './with-projectors'

describe('withProjectors', () => {
  test('forwards appends to projectors', async () => {
    const seen: EventEnvelope[][] = []

    const projector: Projector = {
      name: 'test',
      project: async (events) => {
        seen.push([...events])
      },
    }

    const base = await Effect.runPromise(makeMemoryEventStore)
    const store = withProjectors(base, [projector])

    await Effect.runPromise(
      store.append('run_1', [
        createEvent('run_1', {
          type: 'runtime.run.started',
          payload: { rootThreadId: 'thr_e', kind: 'agent', definitionName: 'echo', input: null },
          threadId: null,
          origin: { type: 'system' },
        }),
      ]),
    )

    expect(seen.length).toBe(1)
  })

  test('preserves an attached snapshot store', async () => {
    const base = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)
    withSnapshotStore(base, snapshots)

    const store = withProjectors(base, [])
    expect(snapshotStoreOf(store)).toBe(snapshots)
  })
})
