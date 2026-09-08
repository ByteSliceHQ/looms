import { Database } from 'bun:sqlite'
import {
  createIndexProjector,
  type IndexBackend,
  type IndexOp,
  type IndexProjector,
} from './index-model'
import { SQLITE_SCHEMA_SQL } from './schema'

export { SQLITE_SCHEMA_SQL } from './schema'

export type SqliteProjectorOptions = { path?: string } | { db: Database }

type SqliteActorRow = {
  actor_id: string
  kind: string | null
  status: string | null
  definition_name: string | null
  parent_actor_id: string | null
  updated_at: number
}

type SqliteReviewRow = {
  review_id: string
  actor_id: string
  status: string
  title: string
  updated_at: number
}

function hasDb(options: SqliteProjectorOptions): options is { db: Database } {
  return 'db' in options
}

function applyOp(db: Database, op: IndexOp): void {
  switch (op.type) {
    case 'upsertActor':
      db.run(
        `INSERT INTO looms_actors (actor_id, kind, status, definition_name, parent_actor_id, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (actor_id) DO UPDATE SET
           kind = excluded.kind,
           status = excluded.status,
           definition_name = excluded.definition_name,
           parent_actor_id = excluded.parent_actor_id,
           updated_at = excluded.updated_at`,
        [op.actorId, op.kind, op.status, op.definitionName, op.parentActorId, op.updatedAt],
      )
      return
    case 'setActorStatus':
      db.run(
        `INSERT INTO looms_actors (actor_id, status, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT (actor_id) DO UPDATE SET
           status = excluded.status,
           updated_at = excluded.updated_at`,
        [op.actorId, op.status, op.updatedAt],
      )
      return
    case 'upsertReview':
      db.run(
        `INSERT INTO looms_reviews (review_id, actor_id, status, title, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (review_id) DO UPDATE SET
           status = excluded.status,
           updated_at = excluded.updated_at`,
        [op.reviewId, op.actorId, op.status, op.title, op.updatedAt],
      )
      return
    case 'setReviewStatus':
      db.run(`UPDATE looms_reviews SET status = ?, updated_at = ? WHERE review_id = ?`, [
        op.status,
        op.updatedAt,
        op.reviewId,
      ])
      return
    default: {
      const _exhaustive: never = op
      return _exhaustive
    }
  }
}

export function sqlite(options: SqliteProjectorOptions = {}): IndexProjector {
  const createdDb = !hasDb(options)
  const db = hasDb(options) ? options.db : new Database(options.path ?? ':memory:')

  const backend: IndexBackend = {
    init: async () => {
      db.exec(SQLITE_SCHEMA_SQL)
    },
    applyOps: async (ops) => {
      const apply = db.transaction((batch: ReadonlyArray<IndexOp>) => {
        for (const op of batch) applyOp(db, op)
      })
      apply(ops)
    },
    getActor: async (actorId) => {
      const row = db
        .query<SqliteActorRow, [string]>(
          `SELECT actor_id, kind, status, definition_name, parent_actor_id, updated_at
           FROM looms_actors WHERE actor_id = ?`,
        )
        .get(actorId)
      if (!row) return null
      return {
        actorId: row.actor_id,
        kind: row.kind,
        status: row.status,
        definitionName: row.definition_name,
        parentActorId: row.parent_actor_id,
        updatedAt: row.updated_at,
      }
    },
    listReviews: async (actorId) => {
      const rows = actorId
        ? db
            .query<SqliteReviewRow, [string]>(
              `SELECT review_id, actor_id, status, title, updated_at
               FROM looms_reviews WHERE actor_id = ?`,
            )
            .all(actorId)
        : db
            .query<SqliteReviewRow, []>(
              `SELECT review_id, actor_id, status, title, updated_at FROM looms_reviews`,
            )
            .all()
      return rows.map((row) => ({
        reviewId: row.review_id,
        actorId: row.actor_id,
        status: row.status,
        title: row.title,
        updatedAt: row.updated_at,
      }))
    },
    dispose: async () => {
      if (createdDb) db.close()
    },
  }

  return createIndexProjector('sqlite', backend)
}
