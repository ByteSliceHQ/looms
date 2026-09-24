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
import { projectEvents, withProjectors } from './with-projectors'

function blockingProjectors(
  started: string[],
  release: Promise<void>,
): readonly [Projector, Projector] {
  return [
    {
      name: 'slow',
      version: '1',
      project: async () => {
        started.push('slow')
        await release
      },
    },
    {
      name: 'fast',
      version: '1',
      project: async () => {
        started.push('fast')
      },
    },
  ]
}

function testEvent(): EventEnvelope {
  return createEvent('run_parallel', {
    type: 'runtime.run.started',
    payload: { rootThreadId: 'thread', kind: 'agent', definitionName: 'echo', input: null },
    threadId: null,
    origin: { type: 'system' },
  })
}

describe('withProjectors', () => {
  test('forwards appends to projectors', async () => {
    const seen: EventEnvelope[][] = []

    const projector: Projector = {
      name: 'test',
      version: '1',
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

  test('never fails a committed append when projection fails', async () => {
    const base = await Effect.runPromise(makeMemoryEventStore)
    const reported: string[] = []

    const store = withProjectors(
      base,
      [
        {
          name: 'failing',
          version: '1',
          project: async () => {
            throw new Error('projection unavailable')
          },
        },
      ],
      { onError: (error) => reported.push(error.message) },
    )

    const result = await Effect.runPromise(
      Effect.exit(
        store.append('run_1', [
          createEvent('run_1', {
            type: 'runtime.run.started',
            payload: {
              rootThreadId: 'thr_e',
              kind: 'agent',
              definitionName: 'echo',
              input: null,
            },
            threadId: null,
            origin: { type: 'system' },
          }),
        ]),
      ),
    )

    expect(result._tag).toBe('Success')
    expect(reported).toHaveLength(1)
    expect(await Effect.runPromise(base.tail('run_1'))).toBe(1)
  })

  test('projects independent append handlers concurrently', async () => {
    const base = await Effect.runPromise(makeMemoryEventStore)
    const release = Promise.withResolvers<void>()
    const started: string[] = []
    const store = withProjectors(base, blockingProjectors(started, release.promise))

    const pending = Effect.runPromise(store.append('run_parallel', [testEvent()]))
    await Bun.sleep(10)

    expect(started).toEqual(['slow', 'fast'])

    release.resolve()
    await pending
  })

  test('projects independent explicit handlers concurrently', async () => {
    const release = Promise.withResolvers<void>()
    const started: string[] = []

    const pending = projectEvents(blockingProjectors(started, release.promise), [testEvent()])
    await Bun.sleep(10)

    expect(started).toEqual(['slow', 'fast'])

    release.resolve()
    await pending
  })
})
