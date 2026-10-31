/**
 * Same tables as the Postgres replica, in SQLite types.
 * Timestamps are epoch milliseconds. JSON is text. Booleans are 0 or 1.
 * A fresh database gets every column from `CREATE TABLE`. SQLite has no
 * `ADD COLUMN IF NOT EXISTS` we want to depend on, so later migrations should
 * add columns the way the index projector does: read `PRAGMA table_info` first.
 */
const SQLITE_REPLICA_SCHEMA_SQL = `
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

CREATE INDEX IF NOT EXISTS looms_run_actors_launched_by ON looms_run_actors (launched_by_run_id);
CREATE INDEX IF NOT EXISTS looms_run_actors_correlation ON looms_run_actors (correlation_id);

CREATE TABLE IF NOT EXISTS looms_run_reviews (
  run_id TEXT NOT NULL,
  review_id TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (run_id, review_id)
);

CREATE TABLE IF NOT EXISTS looms_run_events (
  run_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  event_id TEXT NOT NULL,
  ts INTEGER NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  thread_id TEXT,
  parent_thread_id TEXT,
  causation_id TEXT,
  correlation_id TEXT,
  effect_id TEXT,
  origin TEXT NOT NULL,
  idempotency_key TEXT,
  ephemeral INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (run_id, seq)
);

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
  attributes TEXT NOT NULL DEFAULT '{}',
  tenant TEXT,
  project TEXT,
  org TEXT,
  started_at INTEGER,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  replicated_seq INTEGER NOT NULL DEFAULT 0,
  purged_at INTEGER
);

CREATE INDEX IF NOT EXISTS looms_run_index_tenant ON looms_run_index (tenant);
CREATE INDEX IF NOT EXISTS looms_run_index_project ON looms_run_index (project);
CREATE INDEX IF NOT EXISTS looms_run_index_org ON looms_run_index (org);
CREATE INDEX IF NOT EXISTS looms_run_index_parent ON looms_run_index (parent_run_id);
CREATE INDEX IF NOT EXISTS looms_run_index_status ON looms_run_index (status);

CREATE TABLE IF NOT EXISTS looms_schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL
);
`.trim()

function sqliteReplicaMigration(id: string, sql: string) {
  return {
    id,
    sql: [
      sql,
      `INSERT INTO looms_schema_migrations (id, applied_at) VALUES ('${id}', unixepoch() * 1000) ON CONFLICT (id) DO NOTHING;`,
    ].join('\n\n'),
  }
}

/** Versioned DDL for the SQLite replica, including D1. Looms only creates `looms_*` objects. */
export const SQLITE_REPLICA_MIGRATIONS = [
  sqliteReplicaMigration('0001_replica', SQLITE_REPLICA_SCHEMA_SQL),
]
