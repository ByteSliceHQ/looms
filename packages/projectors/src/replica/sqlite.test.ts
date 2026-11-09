import { Database } from 'bun:sqlite'
import { describe, expect, test } from 'bun:test'

import { Effect, Predicate } from 'effect'

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
import { ReplicaGapError, sqliteReplica } from './sqlite'
import { bunSqliteReplicaDatabase } from './sqlite-bun'

const registry: FoldRegistry = { threads: new Map() }

function roundTrip(events: readonly EventEnvelope[]): readonly object[] {
  const value: unknown = JSON.parse(JSON.stringify(events))

  if (!Array.isArray(value)) {
    throw new Error('expected an event list')
  }

  return value.filter((event) => Predicate.isObject(event))
}

function openReplica(migrate: 'auto' | 'verify' = 'auto') {
  const db = new Database(':memory:')
  const replica = sqliteReplica({ database: bunSqliteReplicaDatabase(db), migrate })

  return { db, replica }
}

describe('sqlite replica', () => {
  test('verify refuses to start until migrations exist', async () => {
    const { replica } = openReplica('verify')
    const init = replica.init

    if (init === undefined) {
      throw new Error('replica init is missing')
    }

    let rejected = false

    try {
      await init()
    } catch (cause) {
      rejected = true
      const message = cause instanceof Error ? cause.message : String(cause)
      expect(message).toMatch(/looms replica generate --dialect sqlite/)
      expect(message).toMatch(/0001_replica/)
    }

    expect(rejected).toBe(true)

    const migrated = openReplica('auto')
    await migrated.replica.migrate()
    expect(await migrated.replica.pendingMigrations()).toEqual([])

    await sqliteReplica({
      database: bunSqliteReplicaDatabase(migrated.db),
      migrate: 'verify',
    }).init?.()
  })

  test('copies a run losslessly, including a resolved offloaded payload', async () => {
    const { db, replica: copy } = openReplica()
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

    const review = db
      .query<{ status: string }, [string]>(
        `SELECT status FROM looms_run_reviews WHERE run_id = ? AND review_id = 'apr_1'`,
      )
      .get(parent)

    expect(review?.status).toBe('approved')

    const actors = db
      .query<{ actor_id: string }, [string]>(
        `SELECT actor_id FROM looms_run_actors WHERE run_id = ? ORDER BY actor_id`,
      )
      .all(parent)

    expect(actors.map((actor) => actor.actor_id)).toEqual([parent, 'thr_child'])

    const childActor = db
      .query<{ launched_by_run_id: string | null }, [string, string]>(
        `SELECT launched_by_run_id FROM looms_run_actors WHERE run_id = ? AND actor_id = ?`,
      )
      .get(child, child)

    expect(childActor?.launched_by_run_id).toBe(parent)

    db.exec(`ALTER TABLE looms_run_index ADD COLUMN input TEXT`)

    db.run(`UPDATE looms_run_index SET input = ? WHERE run_id = ?`, [
      JSON.stringify({ kept: true }),
      parent,
    ])

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

    const kept = db
      .query<{ input: string | null }, [string]>(
        `SELECT input FROM looms_run_index WHERE run_id = ?`,
      )
      .get(parent)

    expect(kept?.input).toBe(JSON.stringify({ kept: true }))

    db.run(`DELETE FROM looms_run_events WHERE run_id = ?`, [parent])
    db.run(`UPDATE looms_run_index SET replicated_seq = 0 WHERE run_id = ?`, [parent])
    expect(await copy.rebuild(source)).toBeGreaterThan(0)

    expect(roundTrip(await Effect.runPromise(copy.eventStore().read(parent)))).toEqual(
      roundTrip(sourceEvents),
    )
  })

  test('rejects a hole and then accepts the events that fill it', async () => {
    const { replica: copy } = openReplica()
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
    const { db, replica: copy } = openReplica()
    const source = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_restore'
    const cursors = new Database(':memory:')

    const delivery = createProjectorDelivery(
      source,
      [copy],
      sqliteProjectorCursorStore(bunSqliteExec(cursors)),
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

    db.run(`DELETE FROM looms_run_events WHERE run_id = ? AND seq > 2`, [runId])
    db.run(`UPDATE looms_run_index SET replicated_seq = 2 WHERE run_id = ?`, [runId])
    cursors.run(`UPDATE looms_projector_delivery SET cursor = 4 WHERE run_id = ?`, [runId])

    await Effect.runPromise(delivery.deliver(runId))
    expect(await copy.position(runId)).toBe(4)

    expect(
      (await Effect.runPromise(copy.eventStore().read(runId))).map((event) => event.seq),
    ).toEqual([1, 2, 3, 4])
  })

  test('purge drops the event copy and later deliveries stay dropped', async () => {
    const { replica: copy } = openReplica()
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

  test('purge applies optional project filter', async () => {
    const { replica: copy } = openReplica()
    const source: EventStore = await Effect.runPromise(makeMemoryEventStore)

    const delivery = createProjectorDelivery(
      source,
      [copy],
      sqliteProjectorCursorStore(bunSqliteExec(new Database(':memory:'))),
    )

    const past = Date.parse('2020-06-01T00:00:00.000Z')
    const cutoff = Date.parse('2021-01-01T00:00:00.000Z')

    const seed = async (runId: string, project: string) => {
      await Effect.runPromise(
        source.append(runId, [
          createEvent(runId, {
            type: 'runtime.run.started',
            payload: {
              rootThreadId: 'thr',
              kind: 'workflow',
              definitionName: 'old',
              input: null,
              attributes: { project },
            },
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
    }

    await seed('run_alpha', 'alpha')
    await seed('run_beta', 'beta')

    expect(await copy.purge({ finishedBefore: cutoff, where: { project: 'alpha' } })).toEqual({
      runs: 1,
    })

    expect((await copy.status('run_alpha'))?.purgedAt).not.toBeNull()
    expect((await copy.status('run_beta'))?.purgedAt).toBeNull()
    expect(await Effect.runPromise(copy.eventStore().read('run_beta'))).not.toEqual([])
  })
})
