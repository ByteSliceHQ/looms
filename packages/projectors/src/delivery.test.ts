import { Database } from 'bun:sqlite'
import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { createEvent, makeMemoryEventStore, type EventEnvelope } from '@looms/core'
import { bunSqliteExec } from '@looms/core/bun-sqlite'

import { createProjectorDelivery } from './delivery'
import type { Projector } from './projector'
import { sqliteProjectorCursorStore } from './sqlite-delivery'

function event(runId: string, value: number) {
  return createEvent(runId, {
    type: 'test.projector.event',
    payload: { value },
    threadId: null,
    origin: { type: 'system' },
  })
}

describe('projector delivery', () => {
  test('recovers events appended before projection starts', async () => {
    const source = await Effect.runPromise(makeMemoryEventStore)
    await Effect.runPromise(source.append('run_1', [event('run_1', 1)]))

    const seen: number[] = []

    const projector: Projector = {
      name: 'search',
      version: '1',
      project: async (events) => {
        seen.push(...events.map((item) => item.seq))
      },
    }

    const delivery = createProjectorDelivery(
      source,
      [projector],
      sqliteProjectorCursorStore(bunSqliteExec(new Database(':memory:'))),
    )

    await Effect.runPromise(delivery.deliver('run_1'))

    expect(seen).toEqual([1])
    expect((await Effect.runPromise(delivery.status('run_1')))[0]?.cursor).toBe(1)
  })

  test('durably retries and recovers without advancing on failure', async () => {
    const source = await Effect.runPromise(makeMemoryEventStore)
    await Effect.runPromise(source.append('run_1', [event('run_1', 1), event('run_1', 2)]))

    let time = 1_000
    let failures = 1
    const seen: number[] = []

    const projector: Projector = {
      name: 'search',
      version: '1',
      project: async (events: readonly EventEnvelope[]) => {
        if (failures-- > 0) {
          throw new Error('temporary outage')
        }

        seen.push(...events.map((item) => item.seq))
      },
    }

    const delivery = createProjectorDelivery(
      source,
      [projector],
      sqliteProjectorCursorStore(bunSqliteExec(new Database(':memory:'))),
      { now: () => time, initialRetryMs: 100 },
    )

    await Effect.runPromise(delivery.deliver('run_1'))

    expect((await Effect.runPromise(delivery.status('run_1')))[0]).toMatchObject({
      cursor: 0,
      state: 'retrying',
      attempts: 1,
      nextRetryAt: 1_100,
    })

    await Effect.runPromise(delivery.deliver('run_1'))
    expect(seen).toEqual([])

    time = 1_100
    await Effect.runPromise(delivery.deliver('run_1'))
    expect(seen).toEqual([1, 2])

    expect((await Effect.runPromise(delivery.status('run_1')))[0]).toMatchObject({
      cursor: 2,
      state: 'idle',
      attempts: 0,
    })
  })

  test('initializes once and does not redeliver an advanced cursor', async () => {
    const source = await Effect.runPromise(makeMemoryEventStore)
    await Effect.runPromise(source.append('run_1', [event('run_1', 1)]))

    let initCalls = 0
    let projectCalls = 0

    const projector: Projector = {
      name: 'search',
      version: '1',
      init: async () => {
        initCalls += 1
      },
      project: async () => {
        projectCalls += 1
      },
    }

    const delivery = createProjectorDelivery(
      source,
      [projector],
      sqliteProjectorCursorStore(bunSqliteExec(new Database(':memory:'))),
    )

    await Effect.runPromise(delivery.deliver('run_1'))
    await Effect.runPromise(delivery.deliver('run_1'))

    expect(initCalls).toBe(1)
    expect(projectCalls).toBe(1)
  })

  test('projects each page in one call', async () => {
    const source = await Effect.runPromise(makeMemoryEventStore)

    await Effect.runPromise(
      source.append('run_1', [event('run_1', 1), event('run_1', 2), event('run_1', 3)]),
    )

    const batches: number[][] = []

    const projector: Projector = {
      name: 'search',
      version: '1',
      project: async (events) => {
        batches.push(events.map((item) => item.seq))
      },
    }

    const delivery = createProjectorDelivery(
      source,
      [projector],
      sqliteProjectorCursorStore(bunSqliteExec(new Database(':memory:'))),
      { batchSize: 2 },
    )

    await Effect.runPromise(delivery.deliver('run_1'))

    expect(batches).toEqual([[1, 2], [3]])
  })

  test('retries init after it rejects', async () => {
    const source = await Effect.runPromise(makeMemoryEventStore)
    await Effect.runPromise(source.append('run_1', [event('run_1', 1)]))

    let initCalls = 0
    const seen: number[] = []

    const projector: Projector = {
      name: 'search',
      version: '1',
      init: async () => {
        initCalls += 1

        if (initCalls === 1) {
          throw new Error('cold start')
        }
      },
      project: async (events) => {
        seen.push(...events.map((item) => item.seq))
      },
    }

    const delivery = createProjectorDelivery(
      source,
      [projector],
      sqliteProjectorCursorStore(bunSqliteExec(new Database(':memory:'))),
    )

    await Effect.runPromise(delivery.deliver('run_1'))
    expect((await Effect.runPromise(delivery.status('run_1')))[0]?.state).toBe('retrying')

    await Effect.runPromise(delivery.deliver('run_1', { force: true }))

    expect(initCalls).toBe(2)
    expect(seen).toEqual([1])
  })

  test('ignores a stale failure behind an advanced cursor', async () => {
    const cursors = sqliteProjectorCursorStore(bunSqliteExec(new Database(':memory:')))
    const projector: Projector = { name: 'search', version: '1', project: async () => {} }

    await Effect.runPromise(cursors.advance('run_1', projector, 10, 1))

    await Effect.runPromise(
      cursors.fail('run_1', projector, {
        attempts: 1,
        failedSeq: 5,
        nextRetryAt: 100,
        error: 'late',
        now: 2,
      }),
    )

    expect(await Effect.runPromise(cursors.get('run_1', projector))).toMatchObject({
      cursor: 10,
      state: 'idle',
      attempts: 0,
    })
  })

  test('requeues a dead-lettered event', async () => {
    const source = await Effect.runPromise(makeMemoryEventStore)
    await Effect.runPromise(source.append('run_1', [event('run_1', 1)]))

    let failing = true
    const seen: number[] = []

    const projector: Projector = {
      name: 'search',
      version: '2',
      project: async ([item]) => {
        if (failing) {
          throw new Error('poison')
        }

        seen.push(item!.seq)
      },
    }

    const delivery = createProjectorDelivery(
      source,
      [projector],
      sqliteProjectorCursorStore(bunSqliteExec(new Database(':memory:'))),
      { maxAttempts: 1 },
    )

    await Effect.runPromise(delivery.deliver('run_1'))
    expect((await Effect.runPromise(delivery.status('run_1')))[0]?.state).toBe('dead-letter')

    failing = false
    await Effect.runPromise(delivery.requeue('run_1', 'search', '2'))

    expect(seen).toEqual([1])

    expect((await Effect.runPromise(delivery.status('run_1')))[0]).toMatchObject({
      cursor: 1,
      state: 'idle',
    })
  })

  test('re-registers a future retry deadline after reconstruction', async () => {
    const source = await Effect.runPromise(makeMemoryEventStore)
    await Effect.runPromise(source.append('run_recover', [event('run_recover', 1)]))
    const database = new Database(':memory:')
    const cursors = sqliteProjectorCursorStore(bunSqliteExec(database))
    let time = 5_000

    const projector: Projector = {
      name: 'recoverable',
      version: '1',
      project: async () => {
        throw new Error('outage')
      },
    }

    const first = createProjectorDelivery(source, [projector], cursors, {
      now: () => time,
      initialRetryMs: 250,
    })

    await Effect.runPromise(first.deliver('run_recover'))

    const scheduled: number[] = []

    const reconstructed = createProjectorDelivery(source, [projector], cursors, {
      now: () => time,
      scheduleRetry: (at) =>
        Effect.sync(() => {
          scheduled.push(at)
        }),
    })

    expect(await Effect.runPromise(reconstructed.recover('run_recover'))).toBe(1)
    expect(scheduled).toEqual([5_250])

    time = 5_250
    await Effect.runPromise(reconstructed.recover('run_recover'))
    expect((await Effect.runPromise(reconstructed.status('run_recover')))[0]?.attempts).toBe(2)
  })

  test('delivers independent projectors concurrently', async () => {
    const source = await Effect.runPromise(makeMemoryEventStore)
    await Effect.runPromise(source.append('run_parallel', [event('run_parallel', 1)]))

    const releaseSlow = Promise.withResolvers<void>()
    const started: string[] = []

    const slow: Projector = {
      name: 'slow',
      version: '1',
      project: async () => {
        started.push('slow')
        await releaseSlow.promise
      },
    }

    const fast: Projector = {
      name: 'fast',
      version: '1',
      project: async () => {
        started.push('fast')
      },
    }

    const delivery = createProjectorDelivery(
      source,
      [slow, fast],
      sqliteProjectorCursorStore(bunSqliteExec(new Database(':memory:'))),
    )

    const pending = Effect.runPromise(delivery.deliver('run_parallel'))
    await Bun.sleep(10)

    expect(started).toEqual(['slow', 'fast'])

    releaseSlow.resolve()
    await pending
  })
})
