/**
 * SQL schema for the optional Looms secondary index.
 * The Postgres statements live with the replica migrations so there is one DDL source.
 */
export { POSTGRES_SCHEMA_SQL } from './replica/migrations'

export const SQLITE_TABLES_SQL = `
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
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (run_id, actor_id)
);

CREATE TABLE IF NOT EXISTS looms_run_reviews (
  run_id TEXT NOT NULL,
  review_id TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (run_id, review_id)
);
`.trim()

/** Columns added after the first release. SQLite cannot add a column only if it is missing. */
export const SQLITE_ADDED_ACTOR_COLUMNS = [
  'launched_by_run_id',
  'launched_by_effect_id',
  'correlation_id',
] as const

export const SQLITE_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS looms_run_actors_launched_by ON looms_run_actors (launched_by_run_id);
CREATE INDEX IF NOT EXISTS looms_run_actors_correlation ON looms_run_actors (correlation_id);
`.trim()

/** The full schema for a new database. An existing one needs the added columns first. */
export const SQLITE_SCHEMA_SQL = `${SQLITE_TABLES_SQL}\n\n${SQLITE_INDEXES_SQL}`
