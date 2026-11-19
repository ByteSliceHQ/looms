import type { RunAttributeFields, RunAttributes } from '@looms/core'

/** Declared attributes with no fields. */
// oxlint-disable-next-line typescript/no-generated-empty-object-type -- an empty record is the intended default: no extra fields
export type NoAdditionalFields = Record<never, never>

export interface ReplicaPurgeOptions<Fields extends RunAttributeFields = RunAttributeFields> {
  /** Delete event copies for runs that finished before this epoch millisecond. */
  readonly finishedBefore: number
  /** Keep the run summary row. Defaults to true. */
  readonly keepIndex?: boolean
  /** Only purge runs whose declared attributes equal these values. */
  readonly where?: { readonly [Key in keyof Fields & string]?: string }
}

/** A declared attribute and the column that stores it on `looms_run_index` and `looms_run_events`. */
export interface ResolvedReplicaColumn {
  /** Attribute name, and the property name on the Drizzle table. */
  readonly key: string
  /** SQL column name. */
  readonly name: string
  readonly index: boolean
}

/** Postgres caps identifiers at 63 bytes, and index names add `looms_run_index_` or `looms_run_event_`. */
const COLUMN_NAME = /^[a-z_][a-z0-9_]{0,46}$/

const LOOMS_COLUMNS = new Set([
  'run_id',
  'status',
  'kind',
  'definition_name',
  'definition_version',
  'root_thread_id',
  'parent_run_id',
  'launched_by_effect_id',
  'correlation_id',
  'attributes',
  'started_at',
  'updated_at',
  'completed_at',
  'replicated_seq',
  'purged_at',
  'seq',
  'event_id',
  'ts',
  'type',
  'payload',
  'thread_id',
  'parent_thread_id',
  'causation_id',
  'effect_id',
  'origin',
  'idempotency_key',
  'ephemeral',
])

function snakeCase(key: string): string {
  return key
    .replaceAll(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replaceAll(/[^A-Za-z0-9_]/g, '_')
    .toLowerCase()
}

export function resolveReplicaColumns(
  fields: RunAttributeFields | undefined,
): readonly ResolvedReplicaColumn[] {
  const names = new Map<string, string>()

  return Object.entries(fields ?? {}).map(([key, field]) => {
    const name = field.fieldName ?? snakeCase(key)

    if (!COLUMN_NAME.test(name)) {
      throw new Error(
        `Attribute "${key}" maps to column "${name}". Column names are lowercase snake_case, start with a letter or underscore, and are at most 47 characters; set fieldName.`,
      )
    }

    if (LOOMS_COLUMNS.has(name)) {
      throw new Error(
        `Attribute "${key}" maps to column "${name}", which Looms owns. Set fieldName.`,
      )
    }

    const clash = names.get(name)

    if (clash !== undefined) {
      throw new Error(`Attributes "${clash}" and "${key}" both map to column "${name}".`)
    }

    names.set(name, key)
    return { key, name, index: field.index === true }
  })
}

/** The `where` entries that are set, as columns, in declaration order. Undeclared keys are refused. */
export function purgeFilters(
  columns: readonly ResolvedReplicaColumn[],
  where: { readonly [key: string]: string | undefined } | undefined,
): readonly { readonly column: string; readonly value: string }[] {
  if (where === undefined) {
    return []
  }

  const declared = new Set(columns.map((column) => column.key))

  for (const key of Object.keys(where)) {
    if (!declared.has(key)) {
      throw new Error(`purge where.${key} is not a declared attribute.`)
    }
  }

  return columns.flatMap((column) => {
    const value = where[column.key]
    return value === undefined ? [] : [{ column: column.name, value }]
  })
}

/** Value for each declared column from a run's attributes, or null when the run lacks it. */
export function columnValues(
  columns: readonly ResolvedReplicaColumn[],
  attributes: RunAttributes | undefined,
): readonly (string | null)[] {
  return columns.map((column) => attributes?.[column.key] ?? null)
}

export function sqlStringLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

export interface ReplicaMigration {
  readonly id: string
  readonly sql: string
}

export interface ColumnMigrationSql {
  readonly runIndexColumn: (column: ResolvedReplicaColumn) => string
  readonly runIndexIndex: (column: ResolvedReplicaColumn) => string
  readonly eventColumn: (column: ResolvedReplicaColumn) => string
  readonly eventIndex: (column: ResolvedReplicaColumn) => string
}

/**
 * Migrations for declared attribute columns, after the Looms tables.
 * Each column and each index is its own migration, so declaring one later only adds those files.
 * The `looms_run_index` column comes first; the `looms_run_events` column backfills from that table.
 */
export function columnMigrations(
  fields: RunAttributeFields | undefined,
  migration: (id: string, sql: string) => ReplicaMigration,
  sql: ColumnMigrationSql,
): readonly ReplicaMigration[] {
  return resolveReplicaColumns(fields).flatMap((column) => [
    migration(`column_${column.name}`, sql.runIndexColumn(column)),
    ...(column.index ? [migration(`index_${column.name}`, sql.runIndexIndex(column))] : []),
    migration(`event_column_${column.name}`, sql.eventColumn(column)),
    ...(column.index ? [migration(`event_index_${column.name}`, sql.eventIndex(column))] : []),
  ])
}
