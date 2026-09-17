import { DateTime, Effect } from 'effect'
import createPostgresClient, { type Sql } from 'postgres'

import {
  createIndexProjector,
  type IndexBackend,
  type IndexOp,
  type IndexProjector,
} from './index-model'
import { runProjectorPromise } from './projector'
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

function applyOp(
  sql: (strings: TemplateStringsArray, ...values: any[]) => PromiseLike<void>,
  op: IndexOp,
): PromiseLike<void> {
  const date = DateTime.toDateUtc(DateTime.makeUnsafe(op.updatedAt))

  switch (op.type) {
    case 'upsertActor':
      return sql`
        INSERT INTO looms_actors (actor_id, kind, status, definition_name, parent_actor_id, updated_at)
        VALUES (${op.actorId}, ${op.kind}, ${op.status}, ${op.definitionName}, ${op.parentActorId}, ${date})
        ON CONFLICT (actor_id) DO UPDATE SET
          kind = EXCLUDED.kind,
          status = EXCLUDED.status,
          definition_name = EXCLUDED.definition_name,
          parent_actor_id = EXCLUDED.parent_actor_id,
          updated_at = EXCLUDED.updated_at
      `
    case 'setActorStatus':
      return sql`
        INSERT INTO looms_actors (actor_id, status, updated_at)
        VALUES (${op.actorId}, ${op.status}, ${date})
        ON CONFLICT (actor_id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `
    case 'upsertReview':
      return sql`
        INSERT INTO looms_reviews (review_id, actor_id, status, title, updated_at)
        VALUES (${op.reviewId}, ${op.actorId}, ${op.status}, ${op.title}, ${date})
        ON CONFLICT (review_id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `
    case 'setReviewStatus':
      return sql`
        UPDATE looms_reviews SET status = ${op.status}, updated_at = ${date}
        WHERE review_id = ${op.reviewId}
      `

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
    init: () =>
      runProjectorPromise('postgres', () => sql.unsafe(POSTGRES_SCHEMA_SQL)).then(() => undefined),
    applyOps: (ops) =>
      runProjectorPromise('postgres', () =>
        sql.begin((tx) =>
          Effect.runPromise(
            Effect.forEach(ops, (op) => Effect.promise(() => Promise.resolve(applyOp(tx, op))), {
              discard: true,
            }),
          ),
        ),
      ).then(() => undefined),
    getActor: (actorId) =>
      runProjectorPromise(
        'postgres',
        () => sql<PostgresActorRow[]>`
          SELECT actor_id, kind, status, definition_name, parent_actor_id, updated_at
          FROM looms_actors WHERE actor_id = ${actorId}
        `,
      ).then((rows) => {
        const row = rows[0]
        return row
          ? {
              actorId: row.actor_id,
              kind: row.kind,
              status: row.status,
              definitionName: row.definition_name,
              parentActorId: row.parent_actor_id,
              updatedAt: row.updated_at.getTime(),
            }
          : null
      }),
    listReviews: (actorId) =>
      runProjectorPromise('postgres', () =>
        actorId
          ? sql<PostgresReviewRow[]>`
            SELECT review_id, actor_id, status, title, updated_at
            FROM looms_reviews WHERE actor_id = ${actorId}
          `
          : sql<PostgresReviewRow[]>`
            SELECT review_id, actor_id, status, title, updated_at FROM looms_reviews
          `,
      ).then((rows) =>
        rows.map((row) => ({
          reviewId: row.review_id,
          actorId: row.actor_id,
          status: row.status,
          title: row.title,
          updatedAt: row.updated_at.getTime(),
        })),
      ),
    dispose: () =>
      createdClient
        ? runProjectorPromise('postgres', () => sql.end({ timeout: 5 })).then(() => undefined)
        : Promise.resolve(),
  }

  return createIndexProjector('postgres', backend)
}
