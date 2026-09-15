import { Effect, Option, Queue, Schema, Stream } from 'effect'

import { EventEnvelopeSchema, fromWireEvent, withAssignedSeq, type EventEnvelope } from './envelope'
import {
  SnapshotStoreError,
  withSnapshotStore,
  type RunSnapshot,
  type SnapshotStore,
} from './snapshot-store'
import type { RunState } from './state'
import {
  EventStoreConflictError,
  EventStoreError,
  EventStoreFencedError,
  type AppendResult,
  type EventStore,
} from './store'

export const SQLITE_EVENT_STORE_SCHEMA = `
CREATE TABLE IF NOT EXISTS looms_streams (
  run_id TEXT PRIMARY KEY,
  head INTEGER NOT NULL DEFAULT 1,
  tail INTEGER NOT NULL DEFAULT 0,
  fence_token TEXT
);

CREATE TABLE IF NOT EXISTS looms_events (
  run_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY (run_id, seq)
);

CREATE TABLE IF NOT EXISTS looms_snapshots (
  run_id TEXT NOT NULL,
  cursor INTEGER NOT NULL,
  state_hash TEXT NOT NULL,
  taken_at INTEGER NOT NULL,
  state TEXT NOT NULL,
  PRIMARY KEY (run_id, cursor)
);
`.trim()

export type SqlBinding = string | number | null

/**
 * Minimal SQL surface used by the embedded event store.
 * Compatible with `bun:sqlite` and Cloudflare Durable Object `ctx.storage.sql`.
 */
export interface SqliteExec {
  run(sql: string, params?: readonly SqlBinding[]): void
  rows(sql: string, params?: readonly SqlBinding[]): readonly unknown[]
  /**
   * Run `fn` atomically. When omitted, `sqliteEventStore` uses `BEGIN IMMEDIATE` /
   * `COMMIT` / `ROLLBACK`. Durable Object SQL must supply this via
   * `storage.transactionSync` — DO SQLite rejects SQL transaction statements.
   */
  transaction?<T>(fn: () => T): T
}

const StreamRowSchema = Schema.Struct({
  run_id: Schema.String,
  head: Schema.Number,
  tail: Schema.Number,
  fence_token: Schema.NullOr(Schema.String),
})

const EventRowSchema = Schema.Struct({
  body: Schema.String,
})

const SnapshotRowSchema = Schema.Struct({
  run_id: Schema.String,
  cursor: Schema.Number,
  state_hash: Schema.String,
  taken_at: Schema.Number,
  state: Schema.String,
})

const RunIdRowSchema = Schema.Struct({
  run_id: Schema.String,
})

const CursorRowSchema = Schema.Struct({
  cursor: Schema.Number,
})

type StreamRow = Schema.Schema.Type<typeof StreamRowSchema>

const decodeEventBody = Schema.decodeUnknownSync(Schema.fromJsonString(EventEnvelopeSchema))
const decodeRunState = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Unknown))
const encodeJson = Schema.encodeSync(Schema.fromJsonString(Schema.Unknown))
const decodeStreamRow = Schema.decodeUnknownSync(StreamRowSchema)
const decodeEventRow = Schema.decodeUnknownSync(EventRowSchema)
const decodeSnapshotRow = Schema.decodeUnknownSync(SnapshotRowSchema)
const decodeRunIdRow = Schema.decodeUnknownSync(RunIdRowSchema)
const decodeCursorRow = Schema.decodeUnknownSync(CursorRowSchema)

export interface SqliteEventStoreOptions {
  readonly exec: SqliteExec
}

/** Adapter for Cloudflare Durable Object `ctx.storage.sql`. */
export function sqlStorageExec(
  sql: {
    exec: (query: string, ...bindings: SqlBinding[]) => Iterable<unknown>
  },
  options?: {
    readonly transaction?: <T>(fn: () => T) => T
  },
): SqliteExec {
  return {
    run(sqlText, params = []) {
      void sql.exec(sqlText, ...params)
    },
    rows(sqlText, params = []) {
      return [...sql.exec(sqlText, ...params)]
    },
    transaction: options?.transaction,
  }
}

function runInTransaction<T>(exec: SqliteExec, fn: () => T): T {
  if (exec.transaction) {
    return exec.transaction(fn)
  }

  exec.run('BEGIN IMMEDIATE')

  try {
    const result = fn()
    exec.run('COMMIT')
    return result
  } catch (cause) {
    try {
      exec.run('ROLLBACK')
    } catch {
      // Ignore rollback failures so the original error surfaces.
    }

    throw cause
  }
}

function initSchema(exec: SqliteExec): void {
  for (const statement of SQLITE_EVENT_STORE_SCHEMA.split(';')) {
    const sql = statement.trim()

    if (sql.length > 0) {
      exec.run(sql)
    }
  }
}

function parseEvent(body: string): EventEnvelope {
  return fromWireEvent(decodeEventBody(body))
}

function toSnapshot(row: Schema.Schema.Type<typeof SnapshotRowSchema>): RunSnapshot {
  // SAFETY: snapshot state is a JSON-encoded RunState written by this store.
  const state = decodeRunState(row.state) as RunState

  return {
    runId: row.run_id,
    cursor: row.cursor,
    stateHash: row.state_hash,
    takenAt: row.taken_at,
    state,
  }
}

function createSqliteSnapshotStore(exec: SqliteExec): SnapshotStore {
  return {
    loadLatest: (runId) =>
      Effect.try({
        try: () => {
          const [row] = exec.rows(
            'SELECT run_id, cursor, state_hash, taken_at, state FROM looms_snapshots WHERE run_id = ? ORDER BY cursor DESC LIMIT 1',
            [runId],
          )

          return row === undefined ? Option.none() : Option.some(toSnapshot(decodeSnapshotRow(row)))
        },
        catch: (cause) => new SnapshotStoreError(`Failed to load snapshot for ${runId}`, cause),
      }),

    save: (snapshot) =>
      Effect.try({
        try: () => {
          exec.run(
            `INSERT INTO looms_snapshots (run_id, cursor, state_hash, taken_at, state)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT (run_id, cursor) DO UPDATE SET
               state_hash = excluded.state_hash,
               taken_at = excluded.taken_at,
               state = excluded.state`,
            [
              snapshot.runId,
              snapshot.cursor,
              snapshot.stateHash,
              snapshot.takenAt,
              encodeJson(snapshot.state),
            ],
          )
        },
        catch: (cause) =>
          new SnapshotStoreError(`Failed to save snapshot for ${snapshot.runId}`, cause),
      }),

    listCursors: (runId) =>
      Effect.try({
        try: () =>
          exec
            .rows('SELECT cursor FROM looms_snapshots WHERE run_id = ? ORDER BY cursor ASC', [
              runId,
            ])
            .map((row) => decodeCursorRow(row).cursor),
        catch: (cause) => new SnapshotStoreError(`Failed to list snapshots for ${runId}`, cause),
      }),

    prune: (runId, keepLatest) =>
      Effect.try({
        try: () => {
          const cursors = exec
            .rows('SELECT cursor FROM looms_snapshots WHERE run_id = ? ORDER BY cursor DESC', [
              runId,
            ])
            .map((row) => decodeCursorRow(row).cursor)

          const drop = cursors.slice(Math.max(0, keepLatest))

          for (const cursor of drop) {
            exec.run('DELETE FROM looms_snapshots WHERE run_id = ? AND cursor = ?', [runId, cursor])
          }
        },
        catch: (cause) => new SnapshotStoreError(`Failed to prune snapshots for ${runId}`, cause),
      }),
  }
}

function createSqliteEventStore(exec: SqliteExec): EventStore {
  const waiters = new Map<string, Array<(event: EventEnvelope) => void>>()

  const getStream = (runId: string): StreamRow => {
    const [existingRow] = exec.rows(
      'SELECT run_id, head, tail, fence_token FROM looms_streams WHERE run_id = ?',
      [runId],
    )

    const existing = existingRow === undefined ? undefined : decodeStreamRow(existingRow)

    if (existing) {
      return existing
    }

    return { run_id: runId, head: 1, tail: 0, fence_token: null }
  }

  const ensureStream = (runId: string): StreamRow => {
    const existing = getStream(runId)

    const [listedRow] = exec.rows('SELECT run_id FROM looms_streams WHERE run_id = ?', [runId])
    const listed = listedRow === undefined ? undefined : decodeRunIdRow(listedRow)

    if (existing.tail > 0 || listed) {
      return existing
    }

    exec.run('INSERT OR IGNORE INTO looms_streams (run_id, head, tail) VALUES (?, 1, 0)', [runId])

    return getStream(runId)
  }

  const notify = (runId: string, events: readonly EventEnvelope[]) => {
    const listeners = waiters.get(runId)

    if (!listeners) {
      return
    }

    for (const event of events) {
      for (const waiter of listeners) {
        waiter(event)
      }
    }
  }

  const service: EventStore = {
    append: (runId, events, options) =>
      Effect.try({
        try: (): AppendResult => {
          if (events.length === 0 && options?.fence === undefined) {
            return { sequences: [], tail: getStream(runId).tail }
          }

          return runInTransaction(exec, () => {
            const log = ensureStream(runId)

            if (options?.expectedTail !== undefined && log.tail !== options.expectedTail) {
              throw new EventStoreConflictError(runId, options.expectedTail, log.tail)
            }

            if (
              options?.fencingToken !== undefined &&
              (log.fence_token ?? undefined) !== options.fencingToken
            ) {
              throw new EventStoreFencedError(runId, options.fencingToken)
            }

            let nextTail = log.tail
            let fenceToken = log.fence_token

            if (options?.fence !== undefined) {
              nextTail += 1
              fenceToken = options.fence === '' ? null : options.fence
            }

            const sequences: number[] = []
            const appended: EventEnvelope[] = []

            for (const partial of events) {
              const seq = nextTail + appended.length + 1
              const event = withAssignedSeq(partial, runId, seq)
              appended.push(event)
              sequences.push(seq)

              exec.run('INSERT INTO looms_events (run_id, seq, body) VALUES (?, ?, ?)', [
                runId,
                seq,
                encodeJson(event),
              ])
            }

            nextTail += appended.length

            exec.run(
              `INSERT INTO looms_streams (run_id, head, tail, fence_token)
               VALUES (?, ?, ?, ?)
               ON CONFLICT (run_id) DO UPDATE SET
                 tail = excluded.tail,
                 fence_token = excluded.fence_token`,
              [runId, log.head, nextTail, fenceToken],
            )

            notify(runId, appended)

            return { sequences, tail: nextTail }
          })
        },
        catch: (cause) =>
          cause instanceof EventStoreConflictError ||
          cause instanceof EventStoreFencedError ||
          cause instanceof EventStoreError
            ? cause
            : new EventStoreError(`append failed for ${runId}`, cause),
      }),

    read: (runId, options) =>
      Effect.try({
        try: () => {
          const fromSeq = options?.fromSeq ?? 1
          const limit = options?.limit

          const sql =
            limit === undefined
              ? 'SELECT body FROM looms_events WHERE run_id = ? AND seq >= ? ORDER BY seq ASC'
              : 'SELECT body FROM looms_events WHERE run_id = ? AND seq >= ? ORDER BY seq ASC LIMIT ?'

          const params: SqlBinding[] =
            limit === undefined ? [runId, fromSeq] : [runId, fromSeq, limit]

          return exec.rows(sql, params).map((row) => parseEvent(decodeEventRow(row).body))
        },
        catch: (cause) => new EventStoreError(`read failed for ${runId}`, cause),
      }),

    readStream: (runId, options) => Stream.fromIterableEffect(service.read(runId, options)),

    tail: (runId) =>
      Effect.try({
        try: () => getStream(runId).tail,
        catch: (cause) => new EventStoreError(`tail failed for ${runId}`, cause),
      }),

    bounds: (runId) =>
      Effect.try({
        try: () => {
          const log = getStream(runId)

          return { head: log.head, tail: log.tail }
        },
        catch: (cause) => new EventStoreError(`bounds failed for ${runId}`, cause),
      }),

    trim: (runId, beforeSeq) =>
      Effect.try({
        try: () => {
          exec.run('DELETE FROM looms_events WHERE run_id = ? AND seq < ?', [runId, beforeSeq])

          exec.run('UPDATE looms_streams SET head = MAX(head, ?) WHERE run_id = ?', [
            beforeSeq,
            runId,
          ])
        },
        catch: (cause) => new EventStoreError(`trim failed for ${runId}`, cause),
      }),

    subscribe: (runId, options) =>
      Stream.callback<EventEnvelope, EventStoreError>((queue) =>
        Effect.gen(function* () {
          const fromSeq = options?.fromSeq ?? 1

          const existing = exec
            .rows('SELECT body FROM looms_events WHERE run_id = ? AND seq >= ? ORDER BY seq ASC', [
              runId,
              fromSeq,
            ])
            .map((row) => parseEvent(decodeEventRow(row).body))

          for (const event of existing) {
            Queue.offerUnsafe(queue, event)
          }

          const waiter = (event: EventEnvelope) => {
            if (event.seq >= fromSeq) {
              Queue.offerUnsafe(queue, event)
            }
          }

          const listeners = waiters.get(runId) ?? []
          listeners.push(waiter)
          waiters.set(runId, listeners)

          yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
              const current = waiters.get(runId)

              if (!current) {
                return
              }

              const idx = current.indexOf(waiter)

              if (idx >= 0) {
                current.splice(idx, 1)
              }

              if (current.length === 0) {
                waiters.delete(runId)
              }
            }),
          )
        }),
      ),

    listRuns: () =>
      Effect.try({
        try: () =>
          exec
            .rows('SELECT run_id FROM looms_streams ORDER BY run_id ASC')
            .map((row) => decodeRunIdRow(row).run_id),
        catch: (cause) => new EventStoreError('listRuns failed', cause),
      }),
  }

  return service
}

/**
 * Embedded SQLite EventStore for actor-local execution.
 * Snapshots live in the same database and are attached automatically.
 */
export function sqliteEventStore(options: SqliteEventStoreOptions): EventStore {
  const exec = options.exec
  initSchema(exec)

  return withSnapshotStore(createSqliteEventStore(exec), createSqliteSnapshotStore(exec))
}
