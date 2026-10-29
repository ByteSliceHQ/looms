import type { BuildColumns } from 'drizzle-orm/column-builder'
import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  type PgColumnBuilderBase,
  type PgTableWithColumns,
} from 'drizzle-orm/pg-core'

/** Column builders for `looms_run_index`. Call again for each table; do not reuse the result. */
export function loomsRunIndexColumns() {
  return {
    runId: text('run_id').primaryKey(),
    status: text('status').notNull(),
    kind: text('kind'),
    definitionName: text('definition_name'),
    definitionVersion: text('definition_version'),
    rootThreadId: text('root_thread_id'),
    parentRunId: text('parent_run_id'),
    launchedByEffectId: text('launched_by_effect_id'),
    correlationId: text('correlation_id'),
    attributes: jsonb('attributes')
      .$type<Record<string, string>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    tenant: text('tenant'),
    project: text('project'),
    org: text('org'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    replicatedSeq: bigint('replicated_seq', { mode: 'number' }).notNull().default(0),
    purgedAt: timestamp('purged_at', { withTimezone: true }),
  }
}

/** Column builders for `looms_run_events`. */
export function loomsRunEventsColumns() {
  return {
    runId: text('run_id').notNull(),
    seq: bigint('seq', { mode: 'number' }).notNull(),
    eventId: text('event_id').notNull(),
    ts: timestamp('ts', { withTimezone: true }).notNull(),
    type: text('type').notNull(),
    payload: jsonb('payload').notNull(),
    threadId: text('thread_id'),
    parentThreadId: text('parent_thread_id'),
    causationId: text('causation_id'),
    correlationId: text('correlation_id'),
    effectId: text('effect_id'),
    origin: jsonb('origin').notNull(),
    idempotencyKey: text('idempotency_key'),
    ephemeral: boolean('ephemeral').notNull().default(false),
  }
}

/** Column builders for `looms_run_actors`. */
export function loomsRunActorsColumns() {
  return {
    runId: text('run_id').notNull(),
    actorId: text('actor_id').notNull(),
    kind: text('kind'),
    status: text('status'),
    definitionName: text('definition_name'),
    parentActorId: text('parent_actor_id'),
    launchedByRunId: text('launched_by_run_id'),
    launchedByEffectId: text('launched_by_effect_id'),
    correlationId: text('correlation_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
}

/** Column builders for `looms_run_reviews`. */
export function loomsRunReviewsColumns() {
  return {
    runId: text('run_id').notNull(),
    reviewId: text('review_id').notNull(),
    status: text('status').notNull(),
    title: text('title').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
}

export const loomsSchemaMigrations = pgTable('looms_schema_migrations', {
  id: text('id').primaryKey(),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
})

type RunIndexExtras = Record<string, PgColumnBuilderBase>

type RunIndexColumns<Extra extends RunIndexExtras> = ReturnType<typeof loomsRunIndexColumns> & Extra

type RunIndexTable<Extra extends RunIndexExtras> = PgTableWithColumns<{
  name: 'looms_run_index'
  schema: undefined
  dialect: 'pg'
  columns: BuildColumns<'looms_run_index', RunIndexColumns<Extra>, 'pg'>
}>

export interface LoomsReplicaTablesOptions<Extra extends RunIndexExtras = Record<never, never>> {
  /** Host-owned columns on `looms_run_index`. Looms never writes these. */
  readonly runIndex?: Extra
}

/**
 * Drizzle tables for the replica. Pass `runIndex` to add columns the host owns
 * (`input`, `error`, and so on). Those columns are not in Looms migrations.
 */
export function loomsReplicaTables<Extra extends RunIndexExtras = Record<never, never>>(
  options?: LoomsReplicaTablesOptions<Extra>,
) {
  const columns = {
    ...loomsRunIndexColumns(),
    ...(options?.runIndex),
  }

  const loomsRunIndex = pgTable(
    'looms_run_index',
    columns,
    (table) => [
      index('looms_run_index_tenant').on(table.tenant),
      index('looms_run_index_project').on(table.project),
      index('looms_run_index_org').on(table.org),
      index('looms_run_index_parent').on(table.parentRunId),
      index('looms_run_index_status').on(table.status),
    ],
  )

  // SAFETY: BuildColumns maps the same builder object, including host columns, to Postgres columns.
  const runIndex: RunIndexTable<Extra> = loomsRunIndex as RunIndexTable<Extra>

  const loomsRunEvents = pgTable('looms_run_events', loomsRunEventsColumns(), (table) => [
    primaryKey({ columns: [table.runId, table.seq] }),
    index('looms_run_events_type_ts').on(table.type, table.ts),
  ])

  const loomsRunActors = pgTable('looms_run_actors', loomsRunActorsColumns(), (table) => [
    primaryKey({ columns: [table.runId, table.actorId] }),
    index('looms_run_actors_launched_by').on(table.launchedByRunId),
    index('looms_run_actors_correlation').on(table.correlationId),
  ])

  const loomsRunReviews = pgTable('looms_run_reviews', loomsRunReviewsColumns(), (table) => [
    primaryKey({ columns: [table.runId, table.reviewId] }),
  ])

  return {
    loomsRunIndex: runIndex,
    loomsRunEvents,
    loomsRunActors,
    loomsRunReviews,
    loomsSchemaMigrations,
  }
}

const defaultTables = loomsReplicaTables()

export const loomsRunIndex = defaultTables.loomsRunIndex
export const loomsRunEvents = defaultTables.loomsRunEvents
export const loomsRunActors = defaultTables.loomsRunActors
export const loomsRunReviews = defaultTables.loomsRunReviews
