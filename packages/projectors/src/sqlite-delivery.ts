import { Schema } from 'effect'

import type { SqlBinding, SqliteExec } from '@looms/core/sqlite-store'

import type {
  ProjectorCursorStore,
  ProjectorDeliveryState,
  ProjectorDeliveryStatus,
} from './delivery'
import type { Projector } from './projector'

export const SQLITE_PROJECTOR_DELIVERY_SCHEMA = `
CREATE TABLE IF NOT EXISTS looms_projector_delivery (
  run_id TEXT NOT NULL,
  projector_name TEXT NOT NULL,
  projector_version TEXT NOT NULL,
  cursor INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'idle',
  attempts INTEGER NOT NULL DEFAULT 0,
  failed_seq INTEGER,
  next_retry_at INTEGER,
  last_error TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (run_id, projector_name, projector_version)
);
CREATE INDEX IF NOT EXISTS looms_projector_delivery_retry_idx
  ON looms_projector_delivery (next_retry_at)
`.trim()

const DeliveryRowSchema = Schema.Struct({
  run_id: Schema.String,
  projector_name: Schema.String,
  projector_version: Schema.String,
  cursor: Schema.Finite,
  state: Schema.String,
  attempts: Schema.Finite,
  failed_seq: Schema.NullOr(Schema.Finite),
  next_retry_at: Schema.NullOr(Schema.Finite),
  last_error: Schema.NullOr(Schema.String),
  updated_at: Schema.Finite,
})

type DeliveryRow = Schema.Schema.Type<typeof DeliveryRowSchema>

const decodeDeliveryRow = Schema.decodeUnknownSync(DeliveryRowSchema)

function parseState(value: string): ProjectorDeliveryState {
  switch (value) {
    case 'idle':
    case 'retrying':
    case 'dead-letter':
      return value
    default:
      throw new Error(`Invalid projector delivery state: ${value}`)
  }
}

function deliveryStatus(row: DeliveryRow): ProjectorDeliveryStatus {
  return {
    runId: row.run_id,
    projector: row.projector_name,
    version: row.projector_version,
    cursor: row.cursor,
    state: parseState(row.state),
    attempts: row.attempts,
    failedSeq: row.failed_seq,
    nextRetryAt: row.next_retry_at,
    lastError: row.last_error,
    updatedAt: row.updated_at,
  }
}

function currentTimeMillis(): number {
  return Math.floor(performance.timeOrigin + performance.now())
}

function initialize(exec: SqliteExec): void {
  for (const statement of SQLITE_PROJECTOR_DELIVERY_SCHEMA.split(';')) {
    const sql = statement.trim()

    if (sql.length > 0) {
      exec.run(sql)
    }
  }
}

export function sqliteProjectorCursorStore(exec: SqliteExec): ProjectorCursorStore {
  initialize(exec)

  const find = (runId: string, projector: Projector): ProjectorDeliveryStatus | undefined => {
    const [row] = exec.rows(
      `SELECT run_id, projector_name, projector_version, cursor, state, attempts,
              failed_seq, next_retry_at, last_error, updated_at
       FROM looms_projector_delivery
       WHERE run_id = ? AND projector_name = ? AND projector_version = ?`,
      [runId, projector.name, projector.version],
    )

    return row === undefined ? undefined : deliveryStatus(decodeDeliveryRow(row))
  }

  const ensure = (runId: string, projector: Projector, now: number): ProjectorDeliveryStatus => {
    exec.run(
      `INSERT OR IGNORE INTO looms_projector_delivery
         (run_id, projector_name, projector_version, updated_at)
       VALUES (?, ?, ?, ?)`,
      [runId, projector.name, projector.version, now],
    )

    const status = find(runId, projector)

    if (!status) {
      throw new Error(`Failed to initialize projector cursor for ${runId}`)
    }

    return status
  }

  return {
    get: (runId, projector) => Promise.resolve(ensure(runId, projector, currentTimeMillis())),
    advance: (runId, projector, cursor, now) => {
      ensure(runId, projector, now)

      exec.run(
        `UPDATE looms_projector_delivery
         SET cursor = MAX(cursor, ?), state = 'idle', attempts = 0, failed_seq = NULL,
             next_retry_at = NULL, last_error = NULL, updated_at = ?
         WHERE run_id = ? AND projector_name = ? AND projector_version = ?`,
        [cursor, now, runId, projector.name, projector.version],
      )

      return Promise.resolve()
    },
    fail: (runId, projector, failure) => {
      ensure(runId, projector, failure.now)

      exec.run(
        `UPDATE looms_projector_delivery
         SET state = ?, attempts = ?, failed_seq = ?, next_retry_at = ?,
             last_error = ?, updated_at = ?
         WHERE run_id = ? AND projector_name = ? AND projector_version = ?`,
        [
          failure.nextRetryAt === null ? 'dead-letter' : 'retrying',
          failure.attempts,
          failure.failedSeq,
          failure.nextRetryAt,
          failure.error,
          failure.now,
          runId,
          projector.name,
          projector.version,
        ],
      )

      return Promise.resolve()
    },
    requeue: (runId, projector, now) => {
      ensure(runId, projector, now)

      exec.run(
        `UPDATE looms_projector_delivery
         SET state = 'retrying', attempts = 0, next_retry_at = ?, last_error = NULL,
             updated_at = ?
         WHERE run_id = ? AND projector_name = ? AND projector_version = ?`,
        [now, now, runId, projector.name, projector.version],
      )

      return Promise.resolve()
    },
    list: (runId) => {
      const params: SqlBinding[] = runId === undefined ? [] : [runId]
      const where = runId === undefined ? '' : 'WHERE run_id = ?'

      return Promise.resolve(
        exec
          .rows(
            `SELECT run_id, projector_name, projector_version, cursor, state, attempts,
                  failed_seq, next_retry_at, last_error, updated_at
           FROM looms_projector_delivery ${where}
           ORDER BY run_id, projector_name, projector_version`,
            params,
          )
          .map((row) => decodeDeliveryRow(row))
          .map(deliveryStatus),
      )
    },
  }
}
