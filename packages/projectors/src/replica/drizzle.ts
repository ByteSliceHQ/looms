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
  type ExtraConfigColumn,
  type PgColumnBuilderBase,
  type PgTextBuilderInitial,
} from 'drizzle-orm/pg-core'

import type { RunAttributeFields } from '@looms/core'

import { resolveReplicaColumns, type NoAdditionalFields } from './columns'

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

/** One text column per declared attribute, keyed by attribute name. */
type AttributeColumnBuilders<Fields extends RunAttributeFields> = {
  [Key in keyof Fields & string]: PgTextBuilderInitial<'', [string, ...string[]]>
}

type RunIndexColumns<Extra extends RunIndexExtras, Fields extends RunAttributeFields> = ReturnType<
  typeof loomsRunIndexColumns
> &
  AttributeColumnBuilders<Fields> &
  Extra

export interface LoomsReplicaTablesOptions<
  Extra extends RunIndexExtras = Record<never, never>,
  Fields extends RunAttributeFields = NoAdditionalFields,
> {
  /** Declared run attributes. Pass the same declaration the replica uses. */
  readonly additionalFields?: Fields
  /** Host-owned columns on `looms_run_index`. Looms never writes these. */
  readonly runIndex?: Extra
}

/**
 * Drizzle tables for the replica. `additionalFields` adds a column per declared attribute,
 * keyed by attribute name, with its index. `runIndex` adds columns the host owns
 * (`input`, `error`, and so on); those are not in Looms migrations.
 */
export function loomsReplicaTables<
  Extra extends RunIndexExtras = Record<never, never>,
  const Fields extends RunAttributeFields = NoAdditionalFields,
>(options?: LoomsReplicaTablesOptions<Extra, Fields>) {
  const attributeColumns = resolveReplicaColumns(options?.additionalFields)

  // SAFETY: resolveReplicaColumns returns one column for each key of Fields, and runIndex is Extra.
  const columns = {
    ...loomsRunIndexColumns(),
    ...Object.fromEntries(attributeColumns.map((column) => [column.key, text(column.name)])),
    ...options?.runIndex,
  } as RunIndexColumns<Extra, Fields>

  const runIndex = pgTable('looms_run_index', columns, (table) => {
    const byKey: { readonly [key: string]: ExtraConfigColumn | undefined } = table

    return [
      index('looms_run_index_parent').on(table.parentRunId),
      index('looms_run_index_status').on(table.status),
      ...attributeColumns.flatMap((column) => {
        const built = byKey[column.key]
        return column.index && built ? [index(`looms_run_index_${column.name}`).on(built)] : []
      }),
    ]
  })

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
