/**
 * SQL schema for the optional Looms secondary index.
 */
export const POSTGRES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS looms_actors (
  actor_id TEXT PRIMARY KEY,
  kind TEXT,
  status TEXT,
  definition_name TEXT,
  parent_actor_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS looms_reviews (
  review_id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS looms_reviews_actor_id_idx ON looms_reviews (actor_id);
`.trim()

export const SQLITE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS looms_actors (
  actor_id TEXT PRIMARY KEY,
  kind TEXT,
  status TEXT,
  definition_name TEXT,
  parent_actor_id TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS looms_reviews (
  review_id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS looms_reviews_actor_id_idx ON looms_reviews (actor_id);
`.trim()
