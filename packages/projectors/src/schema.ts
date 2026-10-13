/**
 * SQL schema for the optional Looms secondary index.
 */
export const POSTGRES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS looms_run_actors (
  run_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  kind TEXT,
  status TEXT,
  definition_name TEXT,
  parent_actor_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (run_id, actor_id)
);

CREATE TABLE IF NOT EXISTS looms_run_reviews (
  run_id TEXT NOT NULL,
  review_id TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (run_id, review_id)
);
`.trim()

export const SQLITE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS looms_run_actors (
  run_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  kind TEXT,
  status TEXT,
  definition_name TEXT,
  parent_actor_id TEXT,
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
