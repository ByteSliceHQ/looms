import { DateTime, Effect } from 'effect'
import createPostgresClient, { type Sql } from 'postgres'

import {
  createIndexProjector,
  type ActorIndexRow,
  type IndexBackend,
  type IndexOp,
  type IndexProjector,
} from './index-model'
import { runProjectorPromise } from './projector'
import { POSTGRES_SCHEMA_SQL } from './schema'

export { POSTGRES_SCHEMA_SQL } from './schema'
export {
  memoryEventLog,
  postgresEventLog,
  POSTGRES_EVENT_LOG_SCHEMA_SQL,
  type EventLogEntry,
  type EventLogProjector,
  type MemoryEventLog,
  type RunLogRow,
} from './event-log'

export type PostgresProjectorOptions = { url: string } | { sql: Sql }

type PostgresActorRow = {
  run_id: string
  actor_id: string
  kind: string | null
  status: string | null
  definition_name: string | null
  parent_actor_id: string | null
  launched_by_run_id: string | null
  launched_by_effect_id: string | null
  correlation_id: string | null
  updated_at: Date
}

type PostgresReviewRow = {
  run_id: string
  review_id: string
  status: string
  title: string
  updated_at: Date
}

function ownsClient(options: PostgresProjectorOptions): options is { url: string } {
  return 'url' in options
}

function actorFromRow(row: PostgresActorRow): ActorIndexRow {
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
    updatedAt: row.updated_at.getTime(),
  }
}

function applyOp(
  sql: (strings: TemplateStringsArray, ...values: any[]) => PromiseLike<void>,
  op: IndexOp,
): PromiseLike<void> {
  const date = DateTime.toDateUtc(DateTime.makeUnsafe(op.updatedAt))

  switch (op.type) {
    case 'upsertActor':
      return sql`
        INSERT INTO looms_run_actors (
          run_id, actor_id, kind, status, definition_name, parent_actor_id,
          launched_by_run_id, launched_by_effect_id, correlation_id, updated_at
        )
        VALUES (
          ${op.runId}, ${op.actorId}, ${op.kind}, ${op.status}, ${op.definitionName}, ${op.parentActorId},
          ${op.launchedByRunId}, ${op.launchedByEffectId}, ${op.correlationId}, ${date}
        )
        ON CONFLICT (run_id, actor_id) DO UPDATE SET
          kind = EXCLUDED.kind,
          status = EXCLUDED.status,
          definition_name = EXCLUDED.definition_name,
          parent_actor_id = EXCLUDED.parent_actor_id,
          launched_by_run_id = EXCLUDED.launched_by_run_id,
          launched_by_effect_id = EXCLUDED.launched_by_effect_id,
          correlation_id = EXCLUDED.correlation_id,
          updated_at = EXCLUDED.updated_at
      `
    case 'setActorStatus':
      return sql`
        INSERT INTO looms_run_actors (run_id, actor_id, status, updated_at)
        VALUES (${op.runId}, ${op.actorId}, ${op.status}, ${date})
        ON CONFLICT (run_id, actor_id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `
    case 'upsertReview':
      return sql`
        INSERT INTO looms_run_reviews (run_id, review_id, status, title, updated_at)
        VALUES (${op.runId}, ${op.reviewId}, ${op.status}, ${op.title}, ${date})
        ON CONFLICT (run_id, review_id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `
    case 'setReviewStatus':
      return sql`
        UPDATE looms_run_reviews SET status = ${op.status}, updated_at = ${date}
        WHERE run_id = ${op.runId} AND review_id = ${op.reviewId}
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
    getActor: (runId, actorId) =>
      runProjectorPromise(
        'postgres',
        () => sql<PostgresActorRow[]>`
          SELECT * FROM looms_run_actors WHERE run_id = ${runId} AND actor_id = ${actorId}
        `,
      ).then((rows) => {
        const row = rows[0]
        return row ? actorFromRow(row) : null
      }),
    listLaunched: (runId) =>
      runProjectorPromise(
        'postgres',
        () => sql<PostgresActorRow[]>`
          SELECT * FROM looms_run_actors
          WHERE launched_by_run_id = ${runId} AND actor_id = run_id ORDER BY updated_at
        `,
      ).then((rows) => rows.map(actorFromRow)),
    listReviews: (runId) =>
      runProjectorPromise('postgres', () =>
        runId
          ? sql<PostgresReviewRow[]>`
            SELECT run_id, review_id, status, title, updated_at
            FROM looms_run_reviews WHERE run_id = ${runId}
          `
          : sql<PostgresReviewRow[]>`
            SELECT run_id, review_id, status, title, updated_at FROM looms_run_reviews
          `,
      ).then((rows) =>
        rows.map((row) => ({
          runId: row.run_id,
          reviewId: row.review_id,
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
