import { Database } from 'bun:sqlite'

import {
  createIndexProjector,
  type ActorIndexRow,
  type IndexBackend,
  type IndexOp,
  type IndexProjector,
} from './index-model'
import { runProjectorSync } from './projector'
import { SQLITE_ADDED_ACTOR_COLUMNS, SQLITE_INDEXES_SQL, SQLITE_TABLES_SQL } from './schema'

export { SQLITE_SCHEMA_SQL } from './schema'

export type SqliteProjectorOptions = { path?: string } | { db: Database }

type SqliteActorRow = {
  run_id: string
  actor_id: string
  kind: string | null
  status: string | null
  definition_name: string | null
  parent_actor_id: string | null
  launched_by_run_id: string | null
  launched_by_effect_id: string | null
  correlation_id: string | null
  updated_at: number
}

type SqliteReviewRow = {
  run_id: string
  review_id: string
  status: string
  title: string
  updated_at: number
}

const ACTOR_COLUMNS = `run_id, actor_id, kind, status, definition_name, parent_actor_id,
  launched_by_run_id, launched_by_effect_id, correlation_id, updated_at`

function hasDb(options: SqliteProjectorOptions): options is { db: Database } {
  return 'db' in options
}

function actorFromRow(row: SqliteActorRow): ActorIndexRow {
  return {
    runId: row.run_id,
    actorId: row.actor_id,
    kind: row.kind,
    status: row.status,
    definitionName: row.definition_name,
    parentActorId: row.parent_actor_id,
    launchedByRunId: row.launched_by_run_id,
    launchedByEffectId: row.launched_by_effect_id,
    correlationId: row.correlation_id,
    updatedAt: row.updated_at,
  }
}

/** Creates the tables, adds columns a database from an earlier release lacks, then indexes them. */
function migrate(db: Database): void {
  db.exec(SQLITE_TABLES_SQL)

  const existing = new Set(
    db
      .query<{ name: string }, []>('PRAGMA table_info(looms_run_actors)')
      .all()
      .map((column) => column.name),
  )

  for (const column of SQLITE_ADDED_ACTOR_COLUMNS) {
    if (!existing.has(column)) {
      db.exec(`ALTER TABLE looms_run_actors ADD COLUMN ${column} TEXT`)
    }
  }

  db.exec(SQLITE_INDEXES_SQL)
}

function applyOp(db: Database, op: IndexOp): void {
  switch (op.type) {
    case 'upsertActor':
      db.run(
        `INSERT INTO looms_run_actors (${ACTOR_COLUMNS})
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

      return
    case 'setActorStatus':
      db.run(
        `INSERT INTO looms_run_actors (run_id, actor_id, status, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (run_id, actor_id) DO UPDATE SET
           status = excluded.status,
           updated_at = excluded.updated_at`,
        [op.runId, op.actorId, op.status, op.updatedAt],
      )

      return
    case 'upsertReview':
      db.run(
        `INSERT INTO looms_run_reviews (run_id, review_id, status, title, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (run_id, review_id) DO UPDATE SET
           status = excluded.status,
           updated_at = excluded.updated_at`,
        [op.runId, op.reviewId, op.status, op.title, op.updatedAt],
      )

      return
    case 'setReviewStatus':
      db.run(
        `UPDATE looms_run_reviews SET status = ?, updated_at = ? WHERE run_id = ? AND review_id = ?`,
        [op.status, op.updatedAt, op.runId, op.reviewId],
      )

      return

    default: {
      const exhaustiveCheck: never = op
      return exhaustiveCheck
    }
  }
}

export function sqlite(options: SqliteProjectorOptions = {}): IndexProjector {
  const createdDb = !hasDb(options)
  const db = hasDb(options) ? options.db : new Database(options.path ?? ':memory:')

  const backend: IndexBackend = {
    init: () => runProjectorSync('sqlite', () => migrate(db)),
    applyOps: (ops) =>
      runProjectorSync('sqlite', () => {
        const apply = db.transaction((batch: ReadonlyArray<IndexOp>) => {
          for (const op of batch) {
            applyOp(db, op)
          }
        })

        apply(ops)
      }),
    getActor: (runId, actorId) =>
      runProjectorSync('sqlite', () => {
        const row = db
          .query<SqliteActorRow, [string, string]>(
            `SELECT ${ACTOR_COLUMNS} FROM looms_run_actors WHERE run_id = ? AND actor_id = ?`,
          )
          .get(runId, actorId)

        return row ? actorFromRow(row) : null
      }),
    listLaunched: (runId) =>
      runProjectorSync('sqlite', () =>
        db
          .query<SqliteActorRow, [string]>(
            `SELECT ${ACTOR_COLUMNS} FROM looms_run_actors
             WHERE launched_by_run_id = ? AND actor_id = run_id ORDER BY updated_at`,
          )
          .all(runId)
          .map(actorFromRow),
      ),
    listReviews: (runId) =>
      runProjectorSync('sqlite', () => {
        const rows = runId
          ? db
              .query<SqliteReviewRow, [string]>(
                `SELECT run_id, review_id, status, title, updated_at
                 FROM looms_run_reviews WHERE run_id = ?`,
              )
              .all(runId)
          : db
              .query<SqliteReviewRow, []>(
                `SELECT run_id, review_id, status, title, updated_at FROM looms_run_reviews`,
              )
              .all()

        return rows.map((row) => ({
          runId: row.run_id,
          reviewId: row.review_id,
          status: row.status,
          title: row.title,
          updatedAt: row.updated_at,
        }))
      }),
    dispose: () =>
      runProjectorSync('sqlite', () => {
        if (createdDb) {
          db.close()
        }
      }),
  }

  return createIndexProjector('sqlite', backend)
}
