-- looms-migration: 0001_replica

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
  tenant TEXT,
  project TEXT,
  org TEXT,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  replicated_seq BIGINT NOT NULL DEFAULT 0,
  purged_at TIMESTAMPTZ
);

ALTER TABLE looms_run_index ADD COLUMN IF NOT EXISTS replicated_seq BIGINT NOT NULL DEFAULT 0;
ALTER TABLE looms_run_index ADD COLUMN IF NOT EXISTS purged_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS looms_run_index_tenant ON looms_run_index (tenant);
CREATE INDEX IF NOT EXISTS looms_run_index_project ON looms_run_index (project);
CREATE INDEX IF NOT EXISTS looms_run_index_org ON looms_run_index (org);
CREATE INDEX IF NOT EXISTS looms_run_index_parent ON looms_run_index (parent_run_id);
CREATE INDEX IF NOT EXISTS looms_run_index_status ON looms_run_index (status);

CREATE TABLE IF NOT EXISTS looms_schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO looms_schema_migrations (id) VALUES ('0001_replica') ON CONFLICT (id) DO NOTHING;
