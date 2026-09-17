import { describe, expect, test } from 'bun:test'

import { Effect, Stream } from 'effect'

import { createEvent } from './envelope'
import { makeMemorySnapshotStore, snapshotStoreOf, withSnapshotStore } from './snapshot-store'
import {
  EventStoreConflictError,
  EventStoreFencedError,
  EventStoreTrimmedError,
  EventStoreTruncationError,
  isEventStoreError,
  makeMemoryEventStore,
  paginatePages,
  readEventStream,
} from './store'

function snapshot(cursor: number) {
  return {
    runId: 'run_s',
    cursor,
    stateHash: `h${cursor}`,
    takenAt: cursor,
    state: {
      runId: 'run_s',
      status: 'running' as const,
      rootThreadId: null,
      threads: {},
      waits: {},
      outstandingEffects: [],
    },
  }
}

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
    const runs = await Effect.runPromise(store.listRuns)
    expect(runs).toEqual([runId])
  })

  test('supports readStream and readEventStream utility', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_stream'

    await Effect.runPromise(
      store.append(runId, [
        createEvent(runId, {
          type: 'runtime.run.started',
          payload: { rootThreadId: 'thr_1', kind: 'counter', definitionName: 'c', input: null },
          threadId: null,
          origin: { type: 'system' },
        }),
        createEvent(runId, {
          type: 'runtime.thread.started',
          payload: { threadId: 'thr_1', kind: 'counter', definitionName: 'c', input: null },
          threadId: 'thr_1',
          origin: { type: 'system' },
        }),
      ]),
    )

    const stream = readEventStream(store, runId, { fromSeq: 2 })
    const events = await Effect.runPromise(Stream.runCollect(stream))
    expect(events).toHaveLength(1)
    expect(events[0]?.seq).toBe(2)
  })

  test('bounds, trim, and stable tail after trim', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_trim'

    await Effect.runPromise(
      store.append(runId, [
        createEvent(runId, { type: 'a', payload: {}, threadId: null, origin: { type: 'system' } }),
        createEvent(runId, { type: 'b', payload: {}, threadId: null, origin: { type: 'system' } }),
        createEvent(runId, { type: 'c', payload: {}, threadId: null, origin: { type: 'system' } }),
      ]),
    )

    expect(await Effect.runPromise(store.bounds!(runId))).toEqual({ head: 1, tail: 3 })
    await Effect.runPromise(store.trim!(runId, 3))
    expect(await Effect.runPromise(store.bounds!(runId))).toEqual({ head: 3, tail: 3 })

    const events = await Effect.runPromise(store.read(runId))
    expect(events).toHaveLength(1)
    expect(events[0]?.seq).toBe(3)

    const more = await Effect.runPromise(
      store.append(runId, [
        createEvent(runId, { type: 'd', payload: {}, threadId: null, origin: { type: 'system' } }),
      ]),
    )

    expect(more.sequences).toEqual([4])
    expect(more.tail).toBe(4)
  })

  test('fence occupies a seq and fencingToken mismatch fails', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_fence'

    const first = await Effect.runPromise(
      store.append(
        runId,
        [
          createEvent(runId, {
            type: 'a',
            payload: {},
            threadId: null,
            origin: { type: 'system' },
          }),
        ],
        { fence: 'tok-a' },
      ),
    )

    expect(first.sequences).toEqual([2])
    expect(first.tail).toBe(2)
    expect(await Effect.runPromise(store.bounds!(runId))).toEqual({ head: 1, tail: 2 })

    const ok = await Effect.runPromise(
      store.append(
        runId,
        [
          createEvent(runId, {
            type: 'b',
            payload: {},
            threadId: null,
            origin: { type: 'system' },
          }),
        ],
        { fencingToken: 'tok-a' },
      ),
    )

    expect(ok.sequences).toEqual([3])

    let caught: EventStoreFencedError | undefined

    try {
      await Effect.runPromise(
        store.append(
          runId,
          [
            createEvent(runId, {
              type: 'c',
              payload: {},
              threadId: null,
              origin: { type: 'system' },
            }),
          ],
          { fencingToken: 'tok-b' },
        ),
      )
    } catch (err) {
      caught = err instanceof EventStoreFencedError ? err : undefined
    }

    expect(caught).toBeInstanceOf(EventStoreFencedError)
    expect(caught?._tag).toBe('EventStoreFencedError')
  })
})

describe('EventStore typed errors', () => {
  test('EventStoreConflictError has distinct tag and is catchable with catchTag', async () => {
    const err = new EventStoreConflictError('run_1', 10, 5)
    expect(err._tag).toBe('EventStoreConflictError')
    expect(err.conflict).toBe(true)
    expect(err.expectedTail).toBe(10)
    expect(err.actualTail).toBe(5)
    expect(err instanceof EventStoreConflictError).toBe(true)
    expect(isEventStoreError(err)).toBe(true)

    const caught = await Effect.runPromise(
      Effect.fail(err).pipe(
        Effect.catchTag('EventStoreConflictError', (e) =>
          Effect.succeed({ expected: e.expectedTail, actual: e.actualTail }),
        ),
      ),
    )

    expect(caught).toEqual({ expected: 10, actual: 5 })
  })

  test('EventStoreTruncationError has distinct tag and is catchable with catchTag', async () => {
    const err = new EventStoreTruncationError('run_2', 1000, 1500)
    expect(err._tag).toBe('EventStoreTruncationError')
    expect(err.runId).toBe('run_2')
    expect(err.readCount).toBe(1000)
    expect(err.tail).toBe(1500)
    expect(err instanceof EventStoreTruncationError).toBe(true)
    expect(isEventStoreError(err)).toBe(true)

    const caught = await Effect.runPromise(
      Effect.fail(err).pipe(
        Effect.catchTag('EventStoreTruncationError', (e) =>
          Effect.succeed({ runId: e.runId, readCount: e.readCount, tail: e.tail }),
        ),
      ),
    )

    expect(caught).toEqual({ runId: 'run_2', readCount: 1000, tail: 1500 })
  })

  test('EventStoreTrimmedError and EventStoreFencedError are catchable with catchTag', async () => {
    const trimmed = new EventStoreTrimmedError('run_t', 50, 1)
    expect(trimmed._tag).toBe('EventStoreTrimmedError')
    expect(isEventStoreError(trimmed)).toBe(true)

    const fenced = new EventStoreFencedError('run_f', 'tok')
    expect(fenced._tag).toBe('EventStoreFencedError')
    expect(isEventStoreError(fenced)).toBe(true)

    const caught = await Effect.runPromise(
      Effect.fail(fenced).pipe(
        Effect.catchTag('EventStoreFencedError', (e) => Effect.succeed(e.token)),
      ),
    )

    expect(caught).toBe('tok')
  })
})

describe('memory SnapshotStore', () => {
  test('saves, loads latest, lists cursors, and prunes', async () => {
    const store = await Effect.runPromise(makeMemorySnapshotStore)

    await Effect.runPromise(store.save(snapshot(10)))
    await Effect.runPromise(store.save(snapshot(20)))
    const latest = await Effect.runPromise(store.loadLatest('run_s'))
    expect(latest._tag).toBe('Some')

    if (latest._tag === 'Some') {
      expect(latest.value.cursor).toBe(20)
    }

    expect(await Effect.runPromise(store.listCursors!('run_s'))).toEqual([10, 20])
    await Effect.runPromise(store.prune!('run_s', 1))
    expect(await Effect.runPromise(store.listCursors!('run_s'))).toEqual([20])
  })

  test('withSnapshotStore attaches a store that snapshotStoreOf can read', async () => {
    const events = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)
    expect(snapshotStoreOf(events)).toBeUndefined()
    withSnapshotStore(events, snapshots)
    expect(snapshotStoreOf(events)).toBe(snapshots)
  })
})

describe('paginatePages primitive', () => {
  test('paginates lazily until nextCursor is null', async () => {
    let fetches = 0

    const stream = paginatePages({ initialCursor: 0 }, (cursor) =>
      Effect.sync(() => {
        fetches += 1

        if (cursor >= 3) {
          return null
        }

        return {
          records: [cursor * 10, cursor * 10 + 1],
          nextCursor: cursor + 1 < 3 ? cursor + 1 : null,
        }
      }),
    )

    const collected = await Effect.runPromise(Stream.runCollect(stream))
    expect(collected).toEqual([0, 1, 10, 11, 20, 21])
    expect(fetches).toBe(3)
  })

  test('honors limit without fetching extraneous pages', async () => {
    let fetches = 0

    const stream = paginatePages({ initialCursor: 0, limit: 3 }, (cursor) =>
      Effect.sync(() => {
        fetches += 1
        return {
          records: [cursor * 10, cursor * 10 + 1],
          nextCursor: cursor + 1,
        }
      }),
    )

    const collected = await Effect.runPromise(Stream.runCollect(stream))
    expect(collected).toEqual([0, 1, 10])
    expect(fetches).toBe(2)
  })
})
