import createPostgresClient, { type Sql } from 'postgres'

import {
  createIndexProjector,
  type IndexBackend,
  type IndexOp,
  type IndexProjector,
} from './index-model'
import { POSTGRES_SCHEMA_SQL } from './schema'

export { POSTGRES_SCHEMA_SQL } from './schema'

export type PostgresProjectorOptions = { url: string } | { sql: Sql }

type PostgresActorRow = {
  actor_id: string
  kind: string | null
  status: string | null
  definition_name: string | null
  parent_actor_id: string | null
  updated_at: Date
}

type PostgresReviewRow = {
  review_id: string
  actor_id: string
  status: string
  title: string
  updated_at: Date
}

function ownsClient(options: PostgresProjectorOptions): options is { url: string } {
  return 'url' in options
}

async function applyOp(
  sql: (strings: TemplateStringsArray, ...values: any[]) => PromiseLike<void>,
  op: IndexOp,
): Promise<void> {
  switch (op.type) {
    case 'upsertActor':
      await sql`
        INSERT INTO looms_actors (actor_id, kind, status, definition_name, parent_actor_id, updated_at)
        VALUES (${op.actorId}, ${op.kind}, ${op.status}, ${op.definitionName}, ${op.parentActorId}, ${new Date(op.updatedAt)})
        ON CONFLICT (actor_id) DO UPDATE SET
          kind = EXCLUDED.kind,
          status = EXCLUDED.status,
          definition_name = EXCLUDED.definition_name,
          parent_actor_id = EXCLUDED.parent_actor_id,
          updated_at = EXCLUDED.updated_at
      `

      return
    case 'setActorStatus':
      await sql`
        INSERT INTO looms_actors (actor_id, status, updated_at)
        VALUES (${op.actorId}, ${op.status}, ${new Date(op.updatedAt)})
        ON CONFLICT (actor_id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `

      return
    case 'upsertReview':
      await sql`
        INSERT INTO looms_reviews (review_id, actor_id, status, title, updated_at)
        VALUES (${op.reviewId}, ${op.actorId}, ${op.status}, ${op.title}, ${new Date(op.updatedAt)})
        ON CONFLICT (review_id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `

      return
    case 'setReviewStatus':
      await sql`
        UPDATE looms_reviews SET status = ${op.status}, updated_at = ${new Date(op.updatedAt)}
        WHERE review_id = ${op.reviewId}
      `

      return

    default: {
      const exhaustiveCheck: never = op
      return exhaustiveCheck
    }
  }
}

export function postgres(options: PostgresProjectorOptions): IndexProjector {
  const createdClient = ownsClient(options)
  const sql = createdClient ? createPostgresClient(options.url) : options.sql

  const backend: IndexBackend = {
    init: async () => {
      await sql.unsafe(POSTGRES_SCHEMA_SQL)
    },
    applyOps: async (ops) => {
      await sql.begin(async (tx) => {
        for (const op of ops) {
          await applyOp(tx, op)
        }
      })
    },
    getActor: async (actorId) => {
      const rows = await sql<PostgresActorRow[]>`
        SELECT actor_id, kind, status, definition_name, parent_actor_id, updated_at
        FROM looms_actors WHERE actor_id = ${actorId}
      `

      const row = rows[0]

      if (!row) {
        return null
      }

      return {
        actorId: row.actor_id,
        kind: row.kind,
        status: row.status,
        definitionName: row.definition_name,
        parentActorId: row.parent_actor_id,
        updatedAt: row.updated_at.getTime(),
      }
    },
    listReviews: async (actorId) => {
      const rows = actorId
        ? await sql<PostgresReviewRow[]>`
            SELECT review_id, actor_id, status, title, updated_at
            FROM looms_reviews WHERE actor_id = ${actorId}
          `
        : await sql<PostgresReviewRow[]>`
            SELECT review_id, actor_id, status, title, updated_at FROM looms_reviews
          `

      return rows.map((row) => ({
        reviewId: row.review_id,
        actorId: row.actor_id,
        status: row.status,
        title: row.title,
        updatedAt: row.updated_at.getTime(),
      }))
    },
    dispose: async () => {
      if (createdClient) {
        await sql.end({ timeout: 5 })
      }
    },
  }

  return createIndexProjector('postgres', backend)
}
