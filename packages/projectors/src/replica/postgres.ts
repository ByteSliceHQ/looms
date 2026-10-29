import { DateTime, Effect, Predicate, Stream } from 'effect'
import createPostgresClient, { type Sql, type TransactionSql } from 'postgres'

import {
  EventStoreError,
  foldRun,
  type EventEnvelope,
  type EventOrigin,
  type EventStore,
  type FoldRegistry,
  type JsonValue,
  type RunState,
} from '@looms/core'

import { applyRunIndexOps, eventLogOps, insertRunEvents } from '../event-log'
import { indexOpsFor } from '../index-model'
import { applyIndexOps } from '../postgres'
import { ReplicaGapError, type Projector } from '../projector'
import { POSTGRES_REPLICA_MIGRATIONS } from './migrations'

const REPLICA_NAME = 'postgres-replica'
const REPLICA_VERSION = '1'
const ADVISORY_LOCK_KEY = 814_764
const READ_PAGE = 500

const terminalStatuses = new Set(['completed', 'failed', 'cancelled'])

export interface ReplicaStatus {
  /** Highest sequence copied with no hole in front of it. */
  readonly replicatedSeq: number
  /** The run summary says the run has finished. */
  readonly finished: boolean
  /** Finished, and every event through that finish has been copied. */
  readonly complete: boolean
  /** Set once retention has deleted the event copy. */
  readonly purgedAt: number | null
}

export interface ReplicaPurgeOptions {
  /** Delete event copies for runs that finished before this epoch millisecond. */
  readonly finishedBefore: number
  /** Keep the run summary row. Defaults to true. */
  readonly keepIndex?: boolean
}

export interface ReplicaPurgeResult {
  readonly runs: number
}

export type PostgresReplicaMigrate = 'auto' | 'verify'

export type PostgresReplicaOptions = ({ readonly url: string } | { readonly sql: Sql }) & {
  /**
   * `auto` applies pending migrations on init.
   * `verify` refuses to start when a migration has not been applied, and names
   * `looms replica generate` so the host can commit the SQL.
   */
  readonly migrate: PostgresReplicaMigrate
}

type RunProgressRow = {
  replicated_seq: string | number
  purged_at: Date | string | null
}

type EventRow = {
  run_id: string
  seq: string | number
  event_id: string
  ts: Date | string
  type: string
  payload: JsonValue
  thread_id: string | null
  parent_thread_id: string | null
  causation_id: string | null
  correlation_id: string | null
  effect_id: string | null
  origin: EventOrigin
  idempotency_key: string | null
  ephemeral: boolean
}

function replicaClient(options: PostgresReplicaOptions) {
  if ('sql' in options) {
    return { sql: options.sql, owned: false }
  }

  return { sql: createPostgresClient(options.url), owned: true }
}

function utcDate(millis: number): Date {
  return DateTime.toDateUtc(DateTime.makeUnsafe(millis))
}

function asNumber(value: string | number): number {
  if (Predicate.isNumber(value)) {
    return value
  }

  return Number(value)
}

function epoch(value: Date | string | number): number {
  if (Predicate.isDate(value)) {
    return value.getTime()
  }

  if (Predicate.isNumber(value)) {
    return value
  }

  return new Date(value).getTime()
}

function envelope(row: EventRow): EventEnvelope {
  const event: EventEnvelope = {
    id: row.event_id,
    runId: row.run_id,
    seq: asNumber(row.seq),
    ts: epoch(row.ts),
    type: row.type,
    payload: row.payload,
    threadId: row.thread_id,
    parentThreadId: row.parent_thread_id,
    origin: row.origin,
    idempotencyKey: row.idempotency_key,
  }

  if (row.causation_id !== null) {
    event.causationId = row.causation_id
  }

  if (row.correlation_id !== null) {
    event.correlationId = row.correlation_id
  }

  if (row.effect_id !== null) {
    event.effectId = row.effect_id
  }

  if (row.ephemeral) {
    event.ephemeral = true
  }

  return event
}

function groups(events: readonly EventEnvelope[]): Map<string, EventEnvelope[]> {
  const byRun = new Map<string, EventEnvelope[]>()

  for (const event of events) {
    const batch = byRun.get(event.runId)

    if (batch) {
      batch.push(event)
    } else {
      byRun.set(event.runId, [event])
    }
  }

  for (const batch of byRun.values()) {
    batch.sort((left, right) => left.seq - right.seq)
  }

  return byRun
}

/** Sequence through which `events` extends `replicatedSeq` with no hole. Redelivered seqs are ignored. */
function contiguousSeq(
  runId: string,
  replicatedSeq: number,
  events: readonly EventEnvelope[],
): number {
  let cursor = replicatedSeq

  for (const event of events) {
    if (event.seq <= cursor) {
      continue
    }

    if (event.seq !== cursor + 1) {
      throw new ReplicaGapError({ runId, replicatedSeq, batchFrom: event.seq })
    }

    cursor = event.seq
  }

  return cursor
}

async function appliedMigrationIds(sql: Sql | TransactionSql): Promise<Set<string>> {
  const [table] = await sql<{ name: string | null }[]>`
    SELECT to_regclass('public.looms_schema_migrations') AS name
  `

  if (!table?.name) {
    return new Set()
  }

  const rows = await sql<{ id: string }[]>`SELECT id FROM looms_schema_migrations`
  return new Set(rows.map((row) => row.id))
}

async function readPage(
  sql: Sql,
  runId: string,
  fromSeq: number,
  limit: number,
): Promise<EventEnvelope[]> {
  const rows = await sql<EventRow[]>`
    SELECT run_id, seq, event_id, ts, type, payload, thread_id, parent_thread_id,
           causation_id, correlation_id, effect_id, origin, idempotency_key, ephemeral
    FROM looms_run_events
    WHERE run_id = ${runId} AND seq >= ${fromSeq}
    ORDER BY seq
    LIMIT ${limit}
  `

  return rows.map(envelope)
}

/**
 * A complete, gap-checked copy of every run, plus the run summary folded in the same transaction.
 * Reading an event back returns the envelope the source returned.
 */
export interface PostgresReplica extends Projector {
  readonly position: (runId: string) => Promise<number | null>
  /** Apply pending migrations. `init` does this only when `migrate` is `auto`. */
  readonly migrate: () => Promise<void>
  readonly pendingMigrations: () => Promise<readonly string[]>
  /** Read-only view of the event copy. Folds and replay run against it unchanged. */
  readonly eventStore: () => EventStore
  /** Fold the copied events with the same registry the runtime used. */
  readonly loadRun: (runId: string, registry: FoldRegistry) => Promise<RunState>
  /** How far the copy has got, and whether it is safe to treat as complete. */
  readonly status: (runId: string) => Promise<ReplicaStatus | null>
  /** Delete event copies for finished runs. Later deliveries for those runs are skipped. */
  readonly purge: (options: ReplicaPurgeOptions) => Promise<ReplicaPurgeResult>
  /** Copy every run in `source`. Purged runs are left alone. */
  readonly rebuild: (source: EventStore) => Promise<number>
}

export function postgresReplica(options: PostgresReplicaOptions): PostgresReplica {
  const { sql, owned } = replicaClient(options)
  let ready: Promise<void> | undefined

  const pendingMigrations = async (): Promise<readonly string[]> => {
    const applied = await appliedMigrationIds(sql)

    return POSTGRES_REPLICA_MIGRATIONS.filter((migration) => !applied.has(migration.id)).map(
      (migration) => migration.id,
    )
  }

  const migrate = async (): Promise<void> => {
    await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(${ADVISORY_LOCK_KEY})`
      const applied = await appliedMigrationIds(tx)

      for (const migration of POSTGRES_REPLICA_MIGRATIONS) {
        if (!applied.has(migration.id)) {
          await tx.unsafe(migration.sql)
        }
      }
    })
  }

  const init = (): Promise<void> => {
    ready ??= (options.migrate === 'verify' ? verify() : migrate()).catch((cause: unknown) => {
      ready = undefined
      throw cause
    })

    return ready
  }

  const verify = async (): Promise<void> => {
    const pending = await pendingMigrations()

    if (pending.length > 0) {
      throw new Error(
        `Looms replica is missing migrations: ${pending.join(', ')}. Generate them with \`looms replica generate\` and apply the files before starting.`,
      )
    }
  }

  const project = async (events: readonly EventEnvelope[]): Promise<void> => {
    await init()

    if (events.length === 0) {
      return
    }

    await sql.begin(async (tx) => {
      for (const [runId, batch] of groups(events)) {
        const [progress] = await tx<RunProgressRow[]>`
          SELECT replicated_seq, purged_at
          FROM looms_run_index
          WHERE run_id = ${runId}
          FOR UPDATE
        `

        if (progress?.purged_at) {
          continue
        }

        const replicatedSeq = progress ? asNumber(progress.replicated_seq) : 0
        const next = contiguousSeq(runId, replicatedSeq, batch)
        const durable = batch.filter((event) => !event.ephemeral)
        const last = batch.at(-1)

        await insertRunEvents(tx, batch)

        await applyRunIndexOps(
          tx,
          durable.flatMap((event) => eventLogOps(event)),
        )

        await applyIndexOps(tx, durable.flatMap(indexOpsFor))

        if (next === replicatedSeq || !last) {
          continue
        }

        await tx`
          INSERT INTO looms_run_index (run_id, status, updated_at, replicated_seq)
          VALUES (${runId}, 'running', ${utcDate(last.ts)}, ${next})
          ON CONFLICT (run_id) DO UPDATE SET
            replicated_seq = GREATEST(looms_run_index.replicated_seq, EXCLUDED.replicated_seq)
          WHERE looms_run_index.purged_at IS NULL
        `
      }
    })
  }

  const position = async (runId: string): Promise<number | null> => {
    const [row] = await sql<RunProgressRow[]>`
      SELECT replicated_seq, purged_at
      FROM looms_run_index
      WHERE run_id = ${runId}
    `

    if (!row) {
      return 0
    }

    if (row.purged_at) {
      return null
    }

    return asNumber(row.replicated_seq)
  }

  const readEvents = (
    runId: string,
    readOptions?: { fromSeq?: number; limit?: number },
  ): Effect.Effect<EventEnvelope[], EventStoreError> =>
    Effect.tryPromise({
      try: async () => {
        const fromSeq = readOptions?.fromSeq ?? 1
        const events: EventEnvelope[] = []
        let cursor = fromSeq
        let remaining = readOptions?.limit

        while (remaining === undefined || remaining > 0) {
          const take = remaining === undefined ? READ_PAGE : Math.min(READ_PAGE, remaining)
          const page = await readPage(sql, runId, cursor, take)
          events.push(...page)

          if (remaining !== undefined) {
            remaining -= page.length
          }

          const last = page.at(-1)

          if (!last || page.length < take) {
            break
          }

          cursor = last.seq + 1
        }

        return events
      },
      catch: (cause) => new EventStoreError('Replica read failed', cause),
    })

  const store: EventStore = {
    append: () => Effect.fail(new EventStoreError('The Postgres replica is read-only')),
    read: readEvents,
    readStream: (runId, readOptions) => Stream.fromIterableEffect(readEvents(runId, readOptions)),
    tail: (runId) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await sql<{ replicated_seq: string | number }[]>`
            SELECT replicated_seq FROM looms_run_index WHERE run_id = ${runId}
          `

          return row ? asNumber(row.replicated_seq) : 0
        },
        catch: (cause) => new EventStoreError('Replica tail failed', cause),
      }),
    bounds: (runId) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await sql<
            { replicated_seq: string | number; head: string | number | null }[]
          >`
            SELECT replicated_seq,
                   (SELECT MIN(seq) FROM looms_run_events event WHERE event.run_id = run.run_id) AS head
            FROM looms_run_index run
            WHERE run.run_id = ${runId}
          `

          if (!row) {
            return { head: 1, tail: 0 }
          }

          const tail = asNumber(row.replicated_seq)
          const head = row.head === null ? tail + 1 : asNumber(row.head)
          return { head, tail }
        },
        catch: (cause) => new EventStoreError('Replica bounds failed', cause),
      }),
    trim: () => Effect.fail(new EventStoreError('Trim a replica with purge()')),
    subscribe: (runId, readOptions) => Stream.fromIterableEffect(readEvents(runId, readOptions)),
    listRuns: Effect.tryPromise({
      try: async () => {
        const rows = await sql<{ run_id: string }[]>`
          SELECT run_id FROM looms_run_index
          WHERE purged_at IS NULL
          ORDER BY run_id
        `

        return rows.map((row) => row.run_id)
      },
      catch: (cause) => new EventStoreError('Replica listRuns failed', cause),
    }),
  }

  const loadRun = async (runId: string, registry: FoldRegistry): Promise<RunState> => {
    const events = await Effect.runPromise(readEvents(runId))
    return foldRun(events, registry, { runId })
  }

  const status = async (runId: string): Promise<ReplicaStatus | null> => {
    const [row] = await sql<
      {
        replicated_seq: string | number
        status: string
        purged_at: Date | string | null
        max_seq: string | number | null
      }[]
    >`
      SELECT run.replicated_seq,
             run.status,
             run.purged_at,
             (SELECT MAX(seq) FROM looms_run_events event WHERE event.run_id = run.run_id) AS max_seq
      FROM looms_run_index run
      WHERE run.run_id = ${runId}
    `

    if (!row) {
      return null
    }

    const replicatedSeq = asNumber(row.replicated_seq)
    const finished = terminalStatuses.has(row.status)
    const purgedAt = row.purged_at === null ? null : epoch(row.purged_at)
    const maxSeq = row.max_seq === null ? null : asNumber(row.max_seq)

    const copiedThroughFinish =
      purgedAt !== null || (maxSeq !== null && maxSeq === replicatedSeq && replicatedSeq > 0)

    return {
      replicatedSeq,
      finished,
      complete: finished && copiedThroughFinish,
      purgedAt,
    }
  }

  const purge = async (purgeOptions: ReplicaPurgeOptions): Promise<ReplicaPurgeResult> => {
    const cutoff = utcDate(purgeOptions.finishedBefore)
    const keepIndex = purgeOptions.keepIndex !== false

    return sql.begin(async (tx) => {
      const doomed = await tx<{ run_id: string }[]>`
        UPDATE looms_run_index
        SET purged_at = NOW()
        WHERE purged_at IS NULL
          AND status IN ('completed', 'failed', 'cancelled')
          AND completed_at IS NOT NULL
          AND completed_at < ${cutoff}
        RETURNING run_id
      `

      const ids = doomed.map((row) => row.run_id)

      if (ids.length === 0) {
        return { runs: 0 }
      }

      await tx`DELETE FROM looms_run_events WHERE run_id IN ${tx(ids)}`

      if (!keepIndex) {
        await tx`DELETE FROM looms_run_actors WHERE run_id IN ${tx(ids)}`
        await tx`DELETE FROM looms_run_reviews WHERE run_id IN ${tx(ids)}`
        await tx`DELETE FROM looms_run_index WHERE run_id IN ${tx(ids)}`
      }

      return { runs: ids.length }
    })
  }

  const rebuild = async (source: EventStore): Promise<number> => {
    await init()
    const runIds = await Effect.runPromise(source.listRuns)
    let copied = 0

    for (const runId of runIds) {
      let fromSeq = 1

      while (true) {
        const events = await Effect.runPromise(source.read(runId, { fromSeq, limit: READ_PAGE }))

        if (events.length === 0) {
          break
        }

        await project(events)
        copied += events.length
        const last = events.at(-1)

        if (!last || events.length < READ_PAGE) {
          break
        }

        fromSeq = last.seq + 1
      }
    }

    return copied
  }

  return {
    name: REPLICA_NAME,
    version: REPLICA_VERSION,
    init,
    position,
    project,
    migrate,
    pendingMigrations,
    eventStore: () => store,
    loadRun,
    status,
    purge,
    rebuild,
    dispose: owned ? () => sql.end() : undefined,
  }
}

export { ReplicaGapError }
