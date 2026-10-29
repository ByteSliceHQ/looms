import { Database } from 'bun:sqlite'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { Effect, Predicate } from 'effect'
import createPostgresClient, { type Sql } from 'postgres'

import {
  createEvent,
  foldRun,
  makeMemoryEventStore,
  memoryBlobStore,
  withBlobOffload,
  type EventEnvelope,
  type EventStore,
  type FoldRegistry,
} from '@looms/core'
import { bunSqliteExec } from '@looms/core/bun-sqlite'

import { createProjectorDelivery } from '../delivery'
import { sqliteProjectorCursorStore } from '../sqlite-delivery'
import {
  loomsRunActors,
  loomsRunEvents,
  loomsRunIndex,
  loomsRunReviews,
  loomsSchemaMigrations,
} from './drizzle'
import { postgresReplica, ReplicaGapError, type PostgresReplica } from './postgres'

const PORT = 54_330
const SETUP_TIMEOUT_MS = 60_000
const registry: FoldRegistry = { threads: new Map() }

let db: PGlite | undefined
let server: PGLiteSocketServer | undefined
let sql: Sql | undefined
let replica: PostgresReplica | undefined

function requireSql(): Sql {
  if (!sql) {
    throw new Error('postgres client was not started')
  }

  return sql
}

function requireReplica(): PostgresReplica {
  if (!replica) {
    throw new Error('replica was not started')
  }

  return replica
}

function roundTrip(events: readonly EventEnvelope[]): readonly object[] {
  const value: unknown = JSON.parse(JSON.stringify(events))

  if (!Array.isArray(value)) {
    throw new Error('expected an event list')
  }

  return value.filter((event) => Predicate.isObject(event))
}

describe('postgres replica', () => {
  beforeAll(async () => {
    db = await PGlite.create()
    server = new PGLiteSocketServer({ db, port: PORT, host: '127.0.0.1' })
    await server.start()

    sql = createPostgresClient({
      host: '127.0.0.1',
      port: PORT,
      max: 1,
      onnotice: () => undefined,
    })

    const unverified = postgresReplica({ sql, migrate: 'verify' })
    const init = unverified.init

    if (init === undefined) {
      throw new Error('replica init is missing')
    }

    let rejected = false

    try {
      await init()
    } catch (cause) {
      rejected = true
      const message = cause instanceof Error ? cause.message : String(cause)
      expect(message).toMatch(/looms replica generate/)
      expect(message).toMatch(/0001_replica/)
    }

    expect(rejected).toBe(true)

    replica = postgresReplica({ sql, migrate: 'auto' })
    await replica.migrate()
    expect(await replica.pendingMigrations()).toEqual([])
    await postgresReplica({ sql, migrate: 'verify' }).init?.()

    for (const table of [
      loomsRunEvents,
      loomsRunIndex,
      loomsRunActors,
      loomsRunReviews,
      loomsSchemaMigrations,
    ]) {
      const config = getTableConfig(table)

      const columns = await sql<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${config.name}
      `

      expect(new Set(columns.map((column) => column.column_name))).toEqual(
        new Set(config.columns.map((column) => column.name)),
      )

      const indexes = await sql<{ indexname: string }[]>`
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = ${config.name}
      `

      const names = new Set(indexes.map((index) => index.indexname))

      for (const index of config.indexes) {
        expect(names.has(index.config.name)).toBe(true)
      }
    }
  }, SETUP_TIMEOUT_MS)

  afterAll(async () => {
    await replica?.dispose?.()
    await sql?.end({ timeout: 1 })
    await server?.stop()
    await db?.close()
  }, SETUP_TIMEOUT_MS)

  test('copies a run losslessly, including a resolved offloaded payload', async () => {
    const client = requireSql()
    const copy = requireReplica()
    const source = withBlobOffload(await Effect.runPromise(makeMemoryEventStore), memoryBlobStore())
    const parent = 'run_parent'
    const child = 'run_child'

    const delivery = createProjectorDelivery(
      source,
      [copy],
      sqliteProjectorCursorStore(bunSqliteExec(new Database(':memory:'))),
    )

    await Effect.runPromise(
      source.append(parent, [
        createEvent(parent, {
          type: 'runtime.run.started',
          payload: {
            rootThreadId: 'thr_1',
            kind: 'workflow',
            definitionName: 'checkout',
            definitionVersion: 'v1',
            input: { text: 'start' },
          },
          threadId: null,
          origin: { type: 'system' },
        }),
        createEvent(parent, {
          type: 'runtime.thread.started',
          payload: {
            threadId: 'thr_child',
            kind: 'workflow',
            definitionName: 'fanout',
            parentThreadId: 'thr_1',
          },
          threadId: 'thr_child',
          parentThreadId: 'thr_1',
          origin: { type: 'system' },
        }),
        createEvent(parent, {
          type: 'approval.requested',
          payload: { approvalId: 'apr_1', title: 'Ship it?' },
          threadId: 'thr_1',
          origin: { type: 'system' },
        }),
        createEvent(parent, {
          type: 'approval.decided',
          payload: { approvalId: 'apr_1', outcome: 'approve' },
          threadId: 'thr_1',
          origin: { type: 'system' },
        }),
        createEvent(parent, {
          type: 'workflow.node.completed',
          payload: { body: 'x'.repeat(70_000) },
          threadId: 'thr_1',
          origin: { type: 'system' },
        }),
        createEvent(parent, {
          type: 'runtime.run.completed',
          payload: { output: { ok: true }, error: null },
          threadId: null,
          origin: { type: 'system' },
        }),
      ]),
    )

    await Effect.runPromise(
      source.append(child, [
        createEvent(child, {
          type: 'runtime.run.started',
          payload: {
            rootThreadId: 'thr_child_root',
            kind: 'workflow',
            definitionName: 'child',
            definitionVersion: 'v1',
            input: null,
            launchedBy: {
              runId: parent,
              threadId: 'thr_1',
              effectId: 'eff_child',
              causationId: 'evt_parent',
              causationSeq: 2,
            },
          },
          correlationId: parent,
          threadId: null,
          origin: { type: 'system' },
        }),
      ]),
    )

    await Effect.runPromise(delivery.deliver(parent))
    await Effect.runPromise(delivery.deliver(child))

    const sourceEvents = await Effect.runPromise(source.read(parent))
    const copiedEvents = await Effect.runPromise(copy.eventStore().read(parent))
    expect(roundTrip(copiedEvents)).toEqual(roundTrip(sourceEvents))
    expect(copiedEvents.some((event) => event.type === 'workflow.node.completed')).toBe(true)
    expect(JSON.stringify(copiedEvents).length).toBeGreaterThan(70_000)

    expect(await copy.loadRun(parent, registry)).toEqual(
      foldRun(sourceEvents, registry, { runId: parent }),
    )

    const freshness = await copy.status(parent)

    expect(freshness).toMatchObject({
      replicatedSeq: sourceEvents.at(-1)?.seq,
      finished: true,
      complete: true,
      purgedAt: null,
    })

    expect(await Effect.runPromise(copy.eventStore().tail(parent))).toBe(freshness?.replicatedSeq)

    const [review] = await client<{ status: string }[]>`
      SELECT status FROM looms_run_reviews WHERE run_id = ${parent} AND review_id = 'apr_1'
    `

    expect(review?.status).toBe('approved')

    const actors = await client<{ actor_id: string }[]>`
      SELECT actor_id FROM looms_run_actors WHERE run_id = ${parent} ORDER BY actor_id
    `

    expect(actors.map((actor) => actor.actor_id)).toEqual([parent, 'thr_child'])

    const [childActor] = await client<{ launched_by_run_id: string | null }[]>`
      SELECT launched_by_run_id FROM looms_run_actors WHERE run_id = ${child} AND actor_id = ${child}
    `

    expect(childActor?.launched_by_run_id).toBe(parent)

    await client`ALTER TABLE looms_run_index ADD COLUMN IF NOT EXISTS input jsonb`
    await client`UPDATE looms_run_index SET input = ${client.json({ kept: true })} WHERE run_id = ${parent}`

    await copy.project([
      createEvent(
        parent,
        {
          type: 'workflow.node.completed',
          payload: { again: true },
          threadId: 'thr_1',
          origin: { type: 'system' },
        },
        { seq: (sourceEvents.at(-1)?.seq ?? 0) + 1 },
      ),
    ])

    const [kept] = await client<{ input: { kept?: boolean } | null }[]>`
      SELECT input FROM looms_run_index WHERE run_id = ${parent}
    `

    expect(kept?.input).toEqual({ kept: true })

    await client`DELETE FROM looms_run_events WHERE run_id = ${parent}`
    await client`UPDATE looms_run_index SET replicated_seq = 0 WHERE run_id = ${parent}`
    expect(await copy.rebuild(source)).toBeGreaterThan(0)

    expect(roundTrip(await Effect.runPromise(copy.eventStore().read(parent)))).toEqual(
      roundTrip(sourceEvents),
    )
  })

  test('rejects a hole and then accepts the events that fill it', async () => {
    const copy = requireReplica()
    const runId = 'run_gap'

    const started = createEvent(
      runId,
      {
        type: 'runtime.run.started',
        payload: { rootThreadId: 'thr', kind: 'workflow', definitionName: 'gap', input: null },
        threadId: null,
        origin: { type: 'system' },
      },
      { seq: 1 },
    )

    const missing = createEvent(
      runId,
      {
        type: 'workflow.node.completed',
        payload: { step: 2 },
        threadId: 'thr',
        origin: { type: 'system' },
      },
      { seq: 2 },
    )

    const later = createEvent(
      runId,
      {
        type: 'workflow.node.completed',
        payload: { step: 3 },
        threadId: 'thr',
        origin: { type: 'system' },
      },
      { seq: 3 },
    )

    await copy.project([started])

    let gap: Error | undefined

    try {
      await copy.project([later])
    } catch (cause) {
      gap = cause instanceof Error ? cause : new Error(String(cause))
    }

    expect(gap).toBeInstanceOf(ReplicaGapError)
    expect(await copy.position(runId)).toBe(1)

    await copy.project([missing, later])
    expect(await copy.position(runId)).toBe(3)

    expect(
      (await Effect.runPromise(copy.eventStore().read(runId))).map((event) => event.seq),
    ).toEqual([1, 2, 3])
  })

  test('catches up through position when the saved cursor is ahead of the copy', async () => {
    const copy = requireReplica()
    const source = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_restore'
    const database = new Database(':memory:')

    const delivery = createProjectorDelivery(
      source,
      [copy],
      sqliteProjectorCursorStore(bunSqliteExec(database)),
    )

    await Effect.runPromise(
      source.append(
        runId,
        [1, 2, 3, 4].map((step) =>
          createEvent(runId, {
            type: step === 1 ? 'runtime.run.started' : 'workflow.node.completed',
            payload:
              step === 1
                ? { rootThreadId: 'thr', kind: 'workflow', definitionName: 'restore', input: null }
                : { step },
            threadId: step === 1 ? null : 'thr',
            origin: { type: 'system' },
          }),
        ),
      ),
    )

    await Effect.runPromise(delivery.deliver(runId))
    expect(await copy.position(runId)).toBe(4)

    await requireSql()`
      DELETE FROM looms_run_events WHERE run_id = ${runId} AND seq > 2
    `

    await requireSql()`
      UPDATE looms_run_index SET replicated_seq = 2 WHERE run_id = ${runId}
    `

    database.run(`UPDATE looms_projector_delivery SET cursor = 4 WHERE run_id = '${runId}'`)

    await Effect.runPromise(delivery.deliver(runId))
    expect(await copy.position(runId)).toBe(4)

    expect(
      (await Effect.runPromise(copy.eventStore().read(runId))).map((event) => event.seq),
    ).toEqual([1, 2, 3, 4])
  })

  test('purge drops the event copy and later deliveries stay dropped', async () => {
    const copy = requireReplica()
    const source: EventStore = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_purge'

    const delivery = createProjectorDelivery(
      source,
      [copy],
      sqliteProjectorCursorStore(bunSqliteExec(new Database(':memory:'))),
    )

    const past = Date.parse('2020-06-01T00:00:00.000Z')

    await Effect.runPromise(
      source.append(runId, [
        createEvent(runId, {
          type: 'runtime.run.started',
          payload: { rootThreadId: 'thr', kind: 'workflow', definitionName: 'old', input: null },
          threadId: null,
          origin: { type: 'system' },
          ts: past,
        }),
        createEvent(runId, {
          type: 'runtime.run.completed',
          payload: { output: null, error: null },
          threadId: null,
          origin: { type: 'system' },
          ts: past + 1_000,
        }),
      ]),
    )

    await Effect.runPromise(delivery.deliver(runId))

    expect(await copy.purge({ finishedBefore: Date.parse('2021-01-01T00:00:00.000Z') })).toEqual({
      runs: 1,
    })

    const freshness = await copy.status(runId)
    expect(freshness?.purgedAt).not.toBeNull()
    expect(await copy.position(runId)).toBeNull()
    expect(freshness?.finished).toBe(true)
    expect(await Effect.runPromise(copy.eventStore().read(runId))).toEqual([])
    const bounds = await Effect.runPromise(copy.eventStore().bounds!(runId))
    expect(bounds.head).toBe(bounds.tail + 1)
    expect(await Effect.runPromise(copy.eventStore().listRuns)).not.toContain(runId)

    await Effect.runPromise(
      source.append(runId, [
        createEvent(runId, {
          type: 'workflow.node.completed',
          payload: { late: true },
          threadId: 'thr',
          origin: { type: 'system' },
        }),
      ]),
    )

    await Effect.runPromise(delivery.deliver(runId))
    expect(await Effect.runPromise(copy.eventStore().read(runId))).toEqual([])
    expect((await copy.status(runId))?.purgedAt).not.toBeNull()
  })
})
