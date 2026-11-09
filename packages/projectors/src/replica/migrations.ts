import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { Predicate } from 'effect'
import type { Sql, TransactionSql } from 'postgres'

import type { RunAttributeFields } from '@looms/core'

import {
  columnMigrations,
  sqlStringLiteral,
  type ReplicaMigration,
  type ResolvedReplicaColumn,
} from './columns'
import { sqliteReplicaMigrations } from './sqlite-migrations'

export type { ReplicaMigration }

/**
 * Actors and reviews. Same statements the Postgres index projector has always
 * applied, so a database created by an older Looms keeps working.
 */
export const POSTGRES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS looms_run_actors (
  run_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  kind TEXT,
  status TEXT,
  definition_name TEXT,
  parent_actor_id TEXT,
  launched_by_run_id TEXT,
  launched_by_effect_id TEXT,
  correlation_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (run_id, actor_id)
);

ALTER TABLE looms_run_actors ADD COLUMN IF NOT EXISTS launched_by_run_id TEXT;
ALTER TABLE looms_run_actors ADD COLUMN IF NOT EXISTS launched_by_effect_id TEXT;
ALTER TABLE looms_run_actors ADD COLUMN IF NOT EXISTS correlation_id TEXT;

CREATE INDEX IF NOT EXISTS looms_run_actors_launched_by ON looms_run_actors (launched_by_run_id);
CREATE INDEX IF NOT EXISTS looms_run_actors_correlation ON looms_run_actors (correlation_id);

CREATE TABLE IF NOT EXISTS looms_run_reviews (
  run_id TEXT NOT NULL,
  review_id TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (run_id, review_id)
);
`.trim()

/**
 * The event copy and the run summary. `CREATE TABLE IF NOT EXISTS` does not add
 * columns to a table that already exists, so each new column is also an
 * `ADD COLUMN IF NOT EXISTS`.
 */
export const POSTGRES_EVENT_LOG_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS looms_run_events (
  run_id TEXT NOT NULL,
  seq BIGINT NOT NULL,
  event_id TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  thread_id TEXT,
  parent_thread_id TEXT,
  causation_id TEXT,
  correlation_id TEXT,
  effect_id TEXT,
  origin JSONB NOT NULL,
  idempotency_key TEXT,
  ephemeral BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (run_id, seq)
);

ALTER TABLE looms_run_events ADD COLUMN IF NOT EXISTS ephemeral BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS looms_run_events_type_ts ON looms_run_events (type, ts);

CREATE TABLE IF NOT EXISTS looms_run_index (
  run_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  kind TEXT,
  definition_name TEXT,
  definition_version TEXT,
  root_thread_id TEXT,
  parent_run_id TEXT,
  launched_by_effect_id TEXT,
  correlation_id TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  replicated_seq BIGINT NOT NULL DEFAULT 0,
  purged_at TIMESTAMPTZ
);

ALTER TABLE looms_run_index ADD COLUMN IF NOT EXISTS replicated_seq BIGINT NOT NULL DEFAULT 0;
ALTER TABLE looms_run_index ADD COLUMN IF NOT EXISTS purged_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS looms_run_index_parent ON looms_run_index (parent_run_id);
CREATE INDEX IF NOT EXISTS looms_run_index_status ON looms_run_index (status);
`.trim()

/** Tracks applied Looms migrations, including attribute column migrations. */
export const POSTGRES_SCHEMA_MIGRATIONS_SQL = `
CREATE TABLE IF NOT EXISTS looms_schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`.trim()

function replicaMigration(id: string, statements: readonly string[]): ReplicaMigration {
  return {
    id,
    sql: [
      ...statements,
      `INSERT INTO looms_schema_migrations (id) VALUES ('${id}') ON CONFLICT (id) DO NOTHING;`,
    ].join('\n\n'),
  }
}

/**
 * Adds one attribute column and copies it from `attributes` for runs already in the table.
 * Safe to repeat: the backfill only touches rows that have the attribute and an empty column.
 */
export function postgresColumnSql(column: ResolvedReplicaColumn): string {
  const name = `"${column.name}"`
  const attribute = sqlStringLiteral(column.key)

  return `
ALTER TABLE looms_run_index ADD COLUMN IF NOT EXISTS ${name} TEXT;

UPDATE looms_run_index SET ${name} = attributes ->> ${attribute}
WHERE ${name} IS NULL AND attributes ? ${attribute};
`.trim()
}

export function postgresColumnIndexSql(column: ResolvedReplicaColumn): string {
  return `CREATE INDEX IF NOT EXISTS looms_run_index_${column.name} ON looms_run_index ("${column.name}");`
}

/**
 * Attribute column and index migrations for Postgres.
 * Each runs once when recorded in `looms_schema_migrations`, including the backfill UPDATE.
 */
export function postgresAttributeMigrations(
  additionalFields?: RunAttributeFields,
): readonly ReplicaMigration[] {
  return columnMigrations(
    additionalFields,
    (id, sql) => replicaMigration(id, [sql]),
    postgresColumnSql,
    postgresColumnIndexSql,
  )
}

/** Serializes Looms migrations across processes that share one database. */
const MIGRATION_LOCK_KEY = 814_764

/** Ids recorded in `looms_schema_migrations`, or none when the table does not exist yet. */
export async function appliedPostgresMigrationIds(
  sql: Sql | TransactionSql,
): Promise<ReadonlySet<string>> {
  const [table] = await sql<{ name: string | null }[]>`
    SELECT to_regclass('public.looms_schema_migrations') AS name
  `

  if (!table?.name) {
    return new Set()
  }

  const rows = await sql<{ id: string }[]>`SELECT id FROM looms_schema_migrations`
  return new Set(rows.map((row) => row.id))
}

/** Applies each migration that is not recorded yet, in order, under one advisory lock. */
export async function applyPostgresMigrations(
  sql: Sql,
  migrations: readonly ReplicaMigration[],
): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`
    const applied = await appliedPostgresMigrationIds(tx)

    for (const migration of migrations) {
      if (!applied.has(migration.id)) {
        await tx.unsafe(migration.sql)
      }
    }
  })
}

/** Versioned DDL for the Postgres replica with no attribute columns. Looms only creates and alters `looms_*` objects. */
export const POSTGRES_REPLICA_MIGRATIONS: readonly ReplicaMigration[] = [
  replicaMigration('0001_replica', [
    POSTGRES_SCHEMA_SQL,
    POSTGRES_EVENT_LOG_SCHEMA_SQL,
    POSTGRES_SCHEMA_MIGRATIONS_SQL,
  ]),
]

export function postgresReplicaMigrations(
  additionalFields?: RunAttributeFields,
): readonly ReplicaMigration[] {
  return [...POSTGRES_REPLICA_MIGRATIONS, ...postgresAttributeMigrations(additionalFields)]
}

const MIGRATION_HEADER = /^-- looms-migration:\s+(\S+)/m

export type ReplicaDialect = 'postgres' | 'sqlite'

export interface GenerateReplicaMigrationsOptions {
  /** Directory of SQL migrations the host already applies. */
  readonly out: string
  /** Append a Drizzle `_journal.json` entry for each file written. Postgres only. */
  readonly journal?: 'drizzle'
  /** Report pending migrations and write nothing. */
  readonly check?: boolean
  /** Which replica DDL to write. Defaults to Postgres. */
  readonly dialect?: ReplicaDialect
  /** Declared run attributes. Pass the same declaration the replica uses. */
  readonly additionalFields?: RunAttributeFields
}

export interface GenerateReplicaMigrationsResult {
  readonly written: readonly string[]
  readonly pending: readonly string[]
}

async function recordedMigrationIds(directory: string): Promise<Set<string>> {
  let names: string[]

  try {
    names = await readdir(directory)
  } catch (cause) {
    if (cause instanceof Error && 'code' in cause && cause.code === 'ENOENT') {
      return new Set()
    }

    throw cause
  }

  const ids = new Set<string>()

  for (const name of names) {
    if (!name.endsWith('.sql')) {
      continue
    }

    const header = MIGRATION_HEADER.exec(await readFile(join(directory, name), 'utf8'))

    if (header?.[1]) {
      ids.add(header[1])
    }
  }

  return ids
}

function nextMigrationNumber(names: readonly string[]): number {
  let max = -1

  for (const name of names) {
    const match = /^(\d{4})_/.exec(name)

    if (match?.[1]) {
      max = Math.max(max, Number(match[1]))
    }
  }

  return max + 1
}

interface DrizzleJournal {
  version: string
  dialect: string
  entries: Array<{
    idx: number
    version: string
    when: number
    tag: string
    breakpoints: boolean
  }>
}

function isDrizzleJournal(value: unknown): value is DrizzleJournal {
  if (!Predicate.isObject(value)) {
    return false
  }

  if (!('entries' in value) || !Array.isArray(value.entries)) {
    return false
  }

  if (!('version' in value) || value.version !== '7') {
    return false
  }

  return 'dialect' in value && value.dialect === 'postgresql'
}

async function appendDrizzleJournal(directory: string, tags: readonly string[]): Promise<void> {
  if (tags.length === 0) {
    return
  }

  const journalPath = join(directory, 'meta', '_journal.json')
  let journal: DrizzleJournal

  try {
    const parsed: unknown = JSON.parse(await readFile(journalPath, 'utf8'))

    if (!isDrizzleJournal(parsed)) {
      throw new Error(`Drizzle journal at ${journalPath} is not the expected shape`)
    }

    journal = parsed
  } catch (cause) {
    if (!(cause instanceof Error) || !('code' in cause) || cause.code !== 'ENOENT') {
      throw cause
    }

    journal = { version: '7', dialect: 'postgresql', entries: [] }
  }

  const when = Date.now()

  for (const tag of tags) {
    journal.entries.push({
      idx: journal.entries.length,
      version: '7',
      when,
      tag,
      breakpoints: true,
    })
  }

  await mkdir(join(directory, 'meta'), { recursive: true })
  await writeFile(journalPath, `${JSON.stringify(journal, null, 2)}\n`)
}

/**
 * Writes each migration the host does not already have.
 * A file counts as applied when it contains `-- looms-migration: <id>`.
 * The numeric prefix continues after the highest `NNNN_` file already in `out`.
 */
function migrationsFor(
  dialect: ReplicaDialect,
  additionalFields: RunAttributeFields | undefined,
): readonly ReplicaMigration[] {
  switch (dialect) {
    case 'postgres':
      return postgresReplicaMigrations(additionalFields)
    case 'sqlite':
      return sqliteReplicaMigrations(additionalFields)

    default: {
      const unexpected: never = dialect

      return unexpected
    }
  }
}

export async function generateReplicaMigrations(
  options: GenerateReplicaMigrationsOptions,
): Promise<GenerateReplicaMigrationsResult> {
  const dialect = options.dialect ?? 'postgres'

  if (dialect === 'sqlite' && options.journal === 'drizzle') {
    throw new Error('Drizzle journal output is only supported for the Postgres replica.')
  }

  const recorded = await recordedMigrationIds(options.out)

  const pending = migrationsFor(dialect, options.additionalFields).filter(
    (migration) => !recorded.has(migration.id),
  )

  if (options.check || pending.length === 0) {
    return { written: [], pending: pending.map((migration) => migration.id) }
  }

  await mkdir(options.out, { recursive: true })

  let names: string[]

  try {
    names = await readdir(options.out)
  } catch {
    names = []
  }

  let number = nextMigrationNumber(names)
  const written: string[] = []

  for (const migration of pending) {
    const tag = `${String(number).padStart(4, '0')}_looms_${migration.id}`
    const filename = `${tag}.sql`

    await writeFile(
      join(options.out, filename),
      `-- looms-migration: ${migration.id}\n\n${migration.sql.trim()}\n`,
    )

    written.push(filename)
    number += 1
  }

  if (options.journal === 'drizzle') {
    await appendDrizzleJournal(
      options.out,
      written.map((filename) => filename.replace(/\.sql$/, '')),
    )
  }

  return { written, pending: pending.map((migration) => migration.id) }
}
