import { Database } from 'bun:sqlite'
import { describe, expect, test } from 'bun:test'

import { Effect, Stream } from 'effect'

import { bunSqliteEventStore, bunSqliteExec } from './bun-sqlite'
import { createEvent } from './envelope'
import { snapshotStoreOf } from './snapshot-store'
import { sqliteEventStore } from './sqlite-store'
import { EventStoreFencedError, readEventStream } from './store'

describe('sqlite EventStore', () => {
  test('appends and reads by runId', async () => {
    const store = bunSqliteEventStore()
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

  test('supports readStream and subscribe', async () => {
    const store = bunSqliteEventStore()
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
    const store = bunSqliteEventStore()
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
    const store = bunSqliteEventStore()
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
  })

  test('expectedTail mismatch is a conflict', async () => {
    const store = bunSqliteEventStore()
    const runId = 'run_conflict'

    await Effect.runPromise(
      store.append(runId, [
        createEvent(runId, { type: 'a', payload: {}, threadId: null, origin: { type: 'system' } }),
      ]),
    )

    let caught: unknown

    try {
      await Effect.runPromise(
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
          { expectedTail: 0 },
        ),
      )
    } catch (err) {
      caught = err
    }

    expect(caught).toBeDefined()
  })

  test('claims an idempotency key atomically with append', async () => {
    const store = bunSqliteEventStore()
    const runId = 'run_idempotent_append'

    const event = createEvent(runId, {
      type: 'test.signal',
      payload: { value: 1 },
      threadId: null,
      origin: { type: 'external' },
    })

    const first = await Effect.runPromise(
      store.append(runId, [event], {
        expectedTail: 0,
        idempotency: { key: 'signal:request-1' },
      }),
    )

    const duplicate = await Effect.runPromise(
      store.append(runId, [event], {
        expectedTail: 0,
        idempotency: { key: 'signal:request-1' },
      }),
    )

    expect(first).toEqual({ sequences: [1], tail: 1 })
    expect(duplicate).toEqual({ sequences: [], tail: 1, deduplicated: true })
    expect(await Effect.runPromise(store.read(runId))).toHaveLength(1)
  })

  test('attaches a snapshot store in the same database', async () => {
    const store = bunSqliteEventStore()
    const snapshots = snapshotStoreOf(store)
    expect(snapshots).toBeDefined()

    await Effect.runPromise(
      snapshots!.save({
        runId: 'run_s',
        cursor: 10,
        stateHash: 'h10',
        takenAt: 1,
        state: {
          runId: 'run_s',
          status: 'running',
          rootThreadId: null,
          threads: {},
          waits: {},
          outstandingEffects: [],
        },
      }),
    )

    await Effect.runPromise(
      snapshots!.save({
        runId: 'run_s',
        cursor: 20,
        stateHash: 'h20',
        takenAt: 2,
        state: {
          runId: 'run_s',
          status: 'running',
          rootThreadId: null,
          threads: {},
          waits: {},
          outstandingEffects: [],
        },
      }),
    )

    const latest = await Effect.runPromise(snapshots!.loadLatest('run_s'))
    expect(latest._tag).toBe('Some')

    if (latest._tag === 'Some') {
      expect(latest.value.cursor).toBe(20)
    }

    expect(await Effect.runPromise(snapshots!.listCursors!('run_s'))).toEqual([10, 20])
    await Effect.runPromise(snapshots!.prune!('run_s', 1))
    expect(await Effect.runPromise(snapshots!.listCursors!('run_s'))).toEqual([20])
  })

  test('custom transaction hook avoids SQL BEGIN (Durable Object style)', async () => {
    const db = new Database(':memory:')
    const base = bunSqliteExec(db)
    let txnCalls = 0

    const store = sqliteEventStore({
      exec: {
        run(sql, params = []) {
          if (/^\s*(BEGIN|COMMIT|ROLLBACK)\b/i.test(sql)) {
            throw new Error(`SQL transactions are not supported: ${sql}`)
          }

          base.run(sql, params)
        },
        rows(sql, params = []) {
          if (/^\s*(BEGIN|COMMIT|ROLLBACK)\b/i.test(sql)) {
            throw new Error(`SQL transactions are not supported: ${sql}`)
          }

          return base.rows(sql, params)
        },
        transaction: (fn) => {
          txnCalls += 1
          return fn()
        },
      },
    })

    const runId = 'run_do_txn'

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

    expect(txnCalls).toBe(1)
    const events = await Effect.runPromise(store.read(runId))
    expect(events).toHaveLength(1)
  })
})
