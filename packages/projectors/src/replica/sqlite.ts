import { Effect, Predicate, Schema, Stream } from 'effect'

import {
  EventOriginSchema,
  EventStoreError,
  JsonValueSchema,
  foldRun,
  type EventEnvelope,
  type EventStore,
  type FoldRegistry,
  type JsonValue,
  type RunState,
} from '@looms/core'

import { eventLogOps, type EventLogOp } from '../event-log-ops'
import { indexOpsFor, type IndexOp } from '../index-model'
import { ReplicaGapError, type Projector } from '../projector'
import { SQLITE_REPLICA_MIGRATIONS } from './sqlite-migrations'

const REPLICA_NAME = 'sqlite-replica'
const REPLICA_VERSION = '1'
const READ_PAGE = 500
/** D1 batches are capped. Statements are idempotent and the cursor update is last, so a split batch resumes. */
const D1_BATCH = 100

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
  /** Optional attribute filters; all provided keys must match looms_run_index attributes. */
  readonly where?: {
    readonly project?: string
    readonly org?: string
    readonly tenant?: string
  }
}

export interface ReplicaPurgeResult {
  readonly runs: number
}

export type SqliteReplicaMigrate = 'auto' | 'verify'

export type SqlValue = string | number | null

export interface SqlStatement {
  readonly sql: string
  readonly params: readonly SqlValue[]
}

/**
 * Async SQL used by the replica.
 * `bun:sqlite` and Cloudflare D1 both adapt to this. One writer per run is assumed:
 * D1 cannot interleave a read and the following writes in one interactive transaction.
 */
export interface SqliteReplicaDatabase {
  exec(sql: string): Promise<void>
  get<T>(sql: string, params?: readonly SqlValue[]): Promise<T | null>
  all<T>(sql: string, params?: readonly SqlValue[]): Promise<readonly T[]>
  batch(statements: readonly SqlStatement[]): Promise<void>
}

/**
 * Enough of a prepared statement for the replica.
 * Cloudflare's `D1PreparedStatement` satisfies this.
 */
export interface D1BoundStatement {
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- the caller names the row type
  all<T>(): Promise<{ readonly results?: readonly T[] }>
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- the caller names the row type
  first<T>(): Promise<T | null>
}

export type SqliteReplicaOptions = {
  readonly database: SqliteReplicaDatabase
  /**
   * `auto` applies pending migrations on init.
   * `verify` refuses to start when a migration has not been applied, and names
   * `looms replica generate --dialect sqlite` so the host can commit the SQL.
   */
  readonly migrate: SqliteReplicaMigrate
}

type ProgressRow = {
  replicated_seq: number | string | bigint
  purged_at: number | string | bigint | null
}

type EventRow = {
  run_id: string
  seq: number | string | bigint
  event_id: string
  ts: number | string | bigint
  type: string
  payload: string
  thread_id: string | null
  parent_thread_id: string | null
  causation_id: string | null
  correlation_id: string | null
  effect_id: string | null
  origin: string
  idempotency_key: string | null
  ephemeral: number | boolean | string
}

type StartOp = Extract<EventLogOp, { type: 'start' }>
type FinishOp = Extract<EventLogOp, { type: 'finish' }>

interface RunIndexPatch {
  readonly runId: string
  start: StartOp | null
  finish: FinishOp | null
  completedAt: number | null
  updatedAt: number
}

/**
 * Adapts Cloudflare D1.
 * The statement type is inferred from `prepare().bind()` so `D1Database` itself is accepted:
 * D1's `batch` only takes the statements its own `prepare` returns.
 */
export function d1ReplicaDatabase<Statement extends D1BoundStatement>(d1: {
  exec(query: string): Promise<{ readonly count: number; readonly duration: number }>
  prepare(query: string): {
    bind(...values: readonly SqlValue[]): Statement
  }
  batch(statements: readonly Statement[]): Promise<readonly object[]>
}): SqliteReplicaDatabase {
  const bound = (sql: string, params: readonly SqlValue[] = []) => d1.prepare(sql).bind(...params)

  return {
    exec: (sql) => d1.exec(sql).then(() => undefined),
    get: (sql, params) => bound(sql, params).first(),
    all: async <T>(sql: string, params: readonly SqlValue[] = []) => {
      const result = await bound(sql, params).all<T>()
      return result.results ?? []
    },
    batch: async (statements) => {
      for (let index = 0; index < statements.length; index += D1_BATCH) {
        const slice = statements.slice(index, index + D1_BATCH)

        if (slice.length === 0) {
          continue
        }

        await d1.batch(slice.map((statement) => bound(statement.sql, statement.params)))
      }
    },
  }
}

const decodeJson = Schema.decodeUnknownSync(JsonValueSchema)
const decodeOrigin = Schema.decodeUnknownSync(EventOriginSchema)

function asNumber(value: number | string | bigint): number {
  if (Predicate.isNumber(value)) {
    return value
  }

  if (Predicate.isString(value)) {
    return Number(value)
  }

  return Number(value)
}

function jsonText(value: JsonValue): string {
  return JSON.stringify(value) ?? 'null'
}

function parseJson(text: string): JsonValue {
  // SAFETY: payload and origin columns are JSON text written by jsonText.
  const parsed: unknown = JSON.parse(text)
  return decodeJson(parsed)
}

function isEphemeral(value: number | boolean | string): boolean {
  if (Predicate.isBoolean(value)) {
    return value
  }

  if (Predicate.isNumber(value)) {
    return value !== 0
  }

  return value === '1'
}

function epochOrNull(value: number | string | bigint | null): number | null {
  if (value === null) {
    return null
  }

  return asNumber(value)
}

function envelope(row: EventRow): EventEnvelope {
  const event: EventEnvelope = {
    id: row.event_id,
    runId: row.run_id,
    seq: asNumber(row.seq),
    ts: asNumber(row.ts),
    type: row.type,
    payload: parseJson(row.payload),
    threadId: row.thread_id,
    parentThreadId: row.parent_thread_id,
    origin: decodeOrigin(parseJson(row.origin)),
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

  if (isEphemeral(row.ephemeral)) {
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

function sqlStatement(sql: string, params: readonly SqlValue[]): SqlStatement {
  return { sql, params }
}

function insertEvents(events: readonly EventEnvelope[]): SqlStatement[] {
  return events.map((event) =>
    sqlStatement(
      `INSERT INTO looms_run_events (
         run_id, seq, event_id, ts, type, payload, thread_id, parent_thread_id,
         causation_id, correlation_id, effect_id, origin, idempotency_key, ephemeral
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (run_id, seq) DO NOTHING`,
      [
        event.runId,
        event.seq,
        event.id,
        event.ts,
        event.type,
        jsonText(event.payload),
        event.threadId,
        event.parentThreadId ?? null,
        event.causationId ?? null,
        event.correlationId ?? null,
        event.effectId ?? null,
        jsonText(event.origin),
        event.idempotencyKey ?? null,
        event.ephemeral === true ? 1 : 0,
      ],
    ),
  )
}

function runIndexPatches(ops: readonly EventLogOp[]): RunIndexPatch[] {
  const patches = new Map<string, RunIndexPatch>()

  for (const op of ops) {
    if (op.type === 'insert') {
      continue
    }

    const patch = patches.get(op.runId) ?? {
      runId: op.runId,
      start: null,
      finish: null,
      completedAt: null,
      updatedAt: op.at,
    }

    patch.updatedAt = Math.max(patch.updatedAt, op.at)

    if (op.type === 'start') {
      patch.start ??= op
    }

    if (op.type === 'finish') {
      patch.finish = op
      patch.completedAt ??= op.at
    }

    patches.set(op.runId, patch)
  }

  return [...patches.values()]
}

function upsertRun(patch: RunIndexPatch): SqlStatement {
  const start = patch.start

  return sqlStatement(
    `INSERT INTO looms_run_index (
       run_id, status, kind, definition_name, definition_version, root_thread_id,
       parent_run_id, launched_by_effect_id, correlation_id, attributes,
       tenant, project, org, started_at, updated_at, completed_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (run_id) DO UPDATE SET
       status = CASE
         WHEN excluded.completed_at IS NOT NULL THEN excluded.status
         WHEN looms_run_index.status IN ('completed', 'failed', 'cancelled') THEN looms_run_index.status
         ELSE excluded.status
       END,
       kind = COALESCE(looms_run_index.kind, excluded.kind),
       definition_name = COALESCE(looms_run_index.definition_name, excluded.definition_name),
       definition_version = COALESCE(looms_run_index.definition_version, excluded.definition_version),
       root_thread_id = COALESCE(looms_run_index.root_thread_id, excluded.root_thread_id),
       parent_run_id = COALESCE(looms_run_index.parent_run_id, excluded.parent_run_id),
       launched_by_effect_id = COALESCE(looms_run_index.launched_by_effect_id, excluded.launched_by_effect_id),
       correlation_id = COALESCE(looms_run_index.correlation_id, excluded.correlation_id),
       attributes = CASE
         WHEN looms_run_index.attributes = '{}' THEN excluded.attributes
         ELSE looms_run_index.attributes
       END,
       tenant = COALESCE(looms_run_index.tenant, excluded.tenant),
       project = COALESCE(looms_run_index.project, excluded.project),
       org = COALESCE(looms_run_index.org, excluded.org),
       started_at = COALESCE(looms_run_index.started_at, excluded.started_at),
       updated_at = MAX(looms_run_index.updated_at, excluded.updated_at),
       completed_at = COALESCE(looms_run_index.completed_at, excluded.completed_at)`,
    [
      patch.runId,
      patch.finish?.status ?? 'running',
      start?.kind ?? null,
      start?.definitionName ?? null,
      start?.definitionVersion ?? null,
      start?.rootThreadId ?? null,
      start?.parentRunId ?? null,
      start?.launchedByEffectId ?? null,
      start?.correlationId ?? null,
      jsonText(start?.attributes ?? {}),
      start?.tenant ?? null,
      start?.project ?? null,
      start?.org ?? null,
      start ? start.at : null,
      patch.updatedAt,
      patch.completedAt,
    ],
  )
}

function runIndexStatements(ops: readonly EventLogOp[]): SqlStatement[] {
  const statements: SqlStatement[] = []

  for (const patch of runIndexPatches(ops)) {
    if (patch.start || patch.finish) {
      statements.push(upsertRun(patch))
      continue
    }

    statements.push(
      sqlStatement(`UPDATE looms_run_index SET updated_at = MAX(updated_at, ?) WHERE run_id = ?`, [
        patch.updatedAt,
        patch.runId,
      ]),
    )
  }

  return statements
}

function indexStatements(ops: readonly IndexOp[]): SqlStatement[] {
  return ops.map((op) => {
    switch (op.type) {
      case 'upsertActor':
        return sqlStatement(
          `INSERT INTO looms_run_actors (
             run_id, actor_id, kind, status, definition_name, parent_actor_id,
             launched_by_run_id, launched_by_effect_id, correlation_id, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (run_id, actor_id) DO UPDATE SET
             kind = excluded.kind,
             status = excluded.status,
             definition_name = excluded.definition_name,
             parent_actor_id = excluded.parent_actor_id,
             launched_by_run_id = excluded.launched_by_run_id,
             launched_by_effect_id = excluded.launched_by_effect_id,
             correlation_id = excluded.correlation_id,
             updated_at = excluded.updated_at`,
          [
            op.runId,
            op.actorId,
            op.kind,
            op.status,
            op.definitionName,
            op.parentActorId,
            op.launchedByRunId,
            op.launchedByEffectId,
            op.correlationId,
            op.updatedAt,
          ],
        )
      case 'setActorStatus':
        return sqlStatement(
          `INSERT INTO looms_run_actors (run_id, actor_id, status, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (run_id, actor_id) DO UPDATE SET
             status = excluded.status,
             updated_at = excluded.updated_at`,
          [op.runId, op.actorId, op.status, op.updatedAt],
        )
      case 'upsertReview':
        return sqlStatement(
          `INSERT INTO looms_run_reviews (run_id, review_id, status, title, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (run_id, review_id) DO UPDATE SET
             status = excluded.status,
             updated_at = excluded.updated_at`,
          [op.runId, op.reviewId, op.status, op.title, op.updatedAt],
        )
      case 'setReviewStatus':
        return sqlStatement(
          `UPDATE looms_run_reviews SET status = ?, updated_at = ? WHERE run_id = ? AND review_id = ?`,
          [op.status, op.updatedAt, op.runId, op.reviewId],
        )

      default: {
        const unexpected: never = op

        return unexpected
      }
    }
  })
}

/**
 * A complete, gap-checked copy of every run, plus the run summary folded in the same batch.
 * Reading an event back returns the envelope the source returned.
 * Targets a shared SQLite database or D1, not the per-run actor store.
 */
export interface SqliteReplica extends Projector {
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

export function sqliteReplica(options: SqliteReplicaOptions): SqliteReplica {
  const database = options.database
  let ready: Promise<void> | undefined

  const appliedMigrationIds = async (): Promise<Set<string>> => {
    const table = await database.get<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'looms_schema_migrations'`,
    )

    if (!table) {
      return new Set()
    }

    const rows = await database.all<{ id: string }>(`SELECT id FROM looms_schema_migrations`)
    return new Set(rows.map((row) => row.id))
  }

  const pendingMigrations = async (): Promise<readonly string[]> => {
    const applied = await appliedMigrationIds()

    return SQLITE_REPLICA_MIGRATIONS.filter((migration) => !applied.has(migration.id)).map(
      (migration) => migration.id,
    )
  }

  const migrate = async (): Promise<void> => {
    const applied = await appliedMigrationIds()

    for (const migration of SQLITE_REPLICA_MIGRATIONS) {
      if (!applied.has(migration.id)) {
        await database.exec(migration.sql)
      }
    }
  }

  const verify = async (): Promise<void> => {
    const pending = await pendingMigrations()

    if (pending.length > 0) {
      throw new Error(
        `Looms replica is missing migrations: ${pending.join(', ')}. Generate them with \`looms replica generate --dialect sqlite\` and apply the files before starting.`,
      )
    }
  }

  const init = (): Promise<void> => {
    ready ??= (options.migrate === 'verify' ? verify() : migrate()).catch((cause: unknown) => {
      ready = undefined
      throw cause
    })

    return ready
  }

  const project = async (events: readonly EventEnvelope[]): Promise<void> => {
    await init()

    if (events.length === 0) {
      return
    }

    const statements: SqlStatement[] = []

    for (const [runId, batch] of groups(events)) {
      const progress = await database.get<ProgressRow>(
        `SELECT replicated_seq, purged_at FROM looms_run_index WHERE run_id = ?`,
        [runId],
      )

      if (progress?.purged_at != null) {
        continue
      }

      const replicatedSeq = progress ? asNumber(progress.replicated_seq) : 0
      const next = contiguousSeq(runId, replicatedSeq, batch)
      const durable = batch.filter((event) => !event.ephemeral)
      const last = batch.at(-1)

      statements.push(...insertEvents(batch))
      statements.push(...runIndexStatements(durable.flatMap((event) => eventLogOps(event))))
      statements.push(...indexStatements(durable.flatMap(indexOpsFor)))

      if (next === replicatedSeq || !last) {
        continue
      }

      statements.push(
        sqlStatement(
          `INSERT INTO looms_run_index (run_id, status, updated_at, replicated_seq)
           VALUES (?, 'running', ?, ?)
           ON CONFLICT (run_id) DO UPDATE SET
             replicated_seq = MAX(looms_run_index.replicated_seq, excluded.replicated_seq)
           WHERE looms_run_index.purged_at IS NULL`,
          [runId, last.ts, next],
        ),
      )
    }

    await database.batch(statements)
  }

  const position = async (runId: string): Promise<number | null> => {
    const row = await database.get<ProgressRow>(
      `SELECT replicated_seq, purged_at FROM looms_run_index WHERE run_id = ?`,
      [runId],
    )

    if (!row) {
      return 0
    }

    if (row.purged_at != null) {
      return null
    }

    return asNumber(row.replicated_seq)
  }

  const readPage = async (
    runId: string,
    fromSeq: number,
    limit: number,
  ): Promise<EventEnvelope[]> => {
    const rows = await database.all<EventRow>(
      `SELECT run_id, seq, event_id, ts, type, payload, thread_id, parent_thread_id,
              causation_id, correlation_id, effect_id, origin, idempotency_key, ephemeral
       FROM looms_run_events
       WHERE run_id = ? AND seq >= ?
       ORDER BY seq
       LIMIT ?`,
      [runId, fromSeq, limit],
    )

    return rows.map(envelope)
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
          const page = await readPage(runId, cursor, take)
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
    append: () => Effect.fail(new EventStoreError('The SQLite replica is read-only')),
    read: readEvents,
    readStream: (runId, readOptions) => Stream.fromIterableEffect(readEvents(runId, readOptions)),
    tail: (runId) =>
      Effect.tryPromise({
        try: async () => {
          const row = await database.get<{ replicated_seq: number | string | bigint }>(
            `SELECT replicated_seq FROM looms_run_index WHERE run_id = ?`,
            [runId],
          )

          return row ? asNumber(row.replicated_seq) : 0
        },
        catch: (cause) => new EventStoreError('Replica tail failed', cause),
      }),
    bounds: (runId) =>
      Effect.tryPromise({
        try: async () => {
          const row = await database.get<{
            replicated_seq: number | string | bigint
            head: number | string | bigint | null
          }>(
            `SELECT replicated_seq,
                    (SELECT MIN(seq) FROM looms_run_events event WHERE event.run_id = run.run_id) AS head
             FROM looms_run_index run
             WHERE run.run_id = ?`,
            [runId],
          )

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
        const rows = await database.all<{ run_id: string }>(
          `SELECT run_id FROM looms_run_index WHERE purged_at IS NULL ORDER BY run_id`,
        )

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
    const row = await database.get<{
      replicated_seq: number | string | bigint
      status: string
      purged_at: number | string | bigint | null
      max_seq: number | string | bigint | null
    }>(
      `SELECT run.replicated_seq,
              run.status,
              run.purged_at,
              (SELECT MAX(seq) FROM looms_run_events event WHERE event.run_id = run.run_id) AS max_seq
       FROM looms_run_index run
       WHERE run.run_id = ?`,
      [runId],
    )

    if (!row) {
      return null
    }

    const replicatedSeq = asNumber(row.replicated_seq)
    const finished = terminalStatuses.has(row.status)
    const purgedAt = epochOrNull(row.purged_at)
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
    const keepIndex = purgeOptions.keepIndex !== false
    const where = purgeOptions.where
    const filterSql = [
      where?.project ? 'AND project = ?' : '',
      where?.org ? 'AND org = ?' : '',
      where?.tenant ? 'AND tenant = ?' : '',
    ].join(' ')
    const filterParams: SqlValue[] = []

    if (where?.project) {
      filterParams.push(where.project)
    }

    if (where?.org) {
      filterParams.push(where.org)
    }

    if (where?.tenant) {
      filterParams.push(where.tenant)
    }

    const doomed = await database.all<{ run_id: string }>(
      `SELECT run_id FROM looms_run_index
       WHERE purged_at IS NULL
         AND status IN ('completed', 'failed', 'cancelled')
         AND completed_at IS NOT NULL
         AND completed_at < ?
         ${filterSql}`,
      [purgeOptions.finishedBefore, ...filterParams],
    )

    if (doomed.length === 0) {
      return { runs: 0 }
    }

    const purgedAt = Date.now()
    const statements: SqlStatement[] = []

    for (const row of doomed) {
      statements.push(
        sqlStatement(
          `UPDATE looms_run_index SET purged_at = ? WHERE run_id = ? AND purged_at IS NULL`,
          [purgedAt, row.run_id],
        ),
        sqlStatement(`DELETE FROM looms_run_events WHERE run_id = ?`, [row.run_id]),
      )

      if (!keepIndex) {
        statements.push(
          sqlStatement(`DELETE FROM looms_run_actors WHERE run_id = ?`, [row.run_id]),
          sqlStatement(`DELETE FROM looms_run_reviews WHERE run_id = ?`, [row.run_id]),
          sqlStatement(`DELETE FROM looms_run_index WHERE run_id = ?`, [row.run_id]),
        )
      }
    }

    await database.batch(statements)
    return { runs: doomed.length }
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
  }
}

export { ReplicaGapError }
