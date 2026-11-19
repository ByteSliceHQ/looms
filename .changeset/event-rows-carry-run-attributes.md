---
'@swirls/looms': minor
---

Carry declared run attributes on every `looms_run_events` row. `postgresEventLog`, `postgresReplica`, and `sqliteReplica` now give the event table one text column per attribute passed as `additionalFields`, with the same name and `fieldName` rules as `looms_run_index`, so a host can put row-level security on both tables without a join. Each column comes with versioned migrations, `event_column_<name>` (which backfills existing event rows from `looms_run_index`) and, for `index: true`, `event_index_<name>` creating `looms_run_event_<name>`. `loomsRunEvents` from `loomsReplicaTables` and `looms replica generate --config` include them. Nothing changes when no attributes are declared.

Breaking: hosts that declare attributes and run with `migrate: 'verify'` must generate and apply the new migrations before upgrading. Attribute columns may no longer use an event-table column name (`seq`, `event_id`, `ts`, `type`, `payload`, `thread_id`, `parent_thread_id`, `causation_id`, `effect_id`, `origin`, `idempotency_key`, `ephemeral`); set `fieldName` for those.
