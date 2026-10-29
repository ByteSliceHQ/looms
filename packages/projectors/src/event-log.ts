import { DateTime, Effect, Option, Predicate, Schema } from 'effect'
import createPostgresClient, { type Sql, type TransactionSql } from 'postgres'

import {
  completedRunStatus,
  isJsonObject,
  readRunLaunchSource,
  type EventEnvelope,
  type EventOrigin,
  type EventStore,
  type EventStoreError,
  type JsonValue,
  type RunStatus,
} from '@looms/core'

import type { Projector } from './projector'
import { runProjectorPromise } from './projector'
import { POSTGRES_EVENT_LOG_SCHEMA_SQL } from './replica/migrations'

export { POSTGRES_EVENT_LOG_SCHEMA_SQL }

const decodeAttributes = Schema.decodeUnknownOption(Schema.Record(Schema.String, Schema.String))

export interface EventLogEntry {
  readonly runId: string
  readonly seq: number
  readonly eventId: string
  readonly ts: number
  readonly type: string
  readonly payload: JsonValue
  readonly threadId: string | null
  readonly parentThreadId: string | null
  readonly causationId: string | null
  readonly correlationId: string | null
  readonly effectId: string | null
  readonly origin: EventOrigin
  readonly idempotencyKey: string | null
}

export interface RunLogRow {
  readonly runId: string
  readonly status: RunStatus
  readonly kind: string | null
  readonly definitionName: string | null
  readonly definitionVersion: string | null
  readonly rootThreadId: string | null
  readonly parentRunId: string | null
  readonly launchedByEffectId: string | null
  readonly correlationId: string | null
  readonly attributes: { readonly [key: string]: string }
  readonly tenant: string | null
  readonly project: string | null
  readonly org: string | null
  readonly startedAt: number | null
  readonly updatedAt: number
  readonly completedAt: number | null
}

export type EventLogOp =
  | { readonly type: 'insert'; readonly entry: EventLogEntry }
  | {
      readonly type: 'start'
      readonly runId: string
      readonly kind: string | null
      readonly definitionName: string | null
      readonly definitionVersion: string | null
      readonly rootThreadId: string | null
      readonly parentRunId: string | null
      readonly launchedByEffectId: string | null
      readonly correlationId: string | null
      readonly attributes: { readonly [key: string]: string }
      readonly tenant: string | null
      readonly project: string | null
      readonly org: string | null
      readonly at: number
    }
  | {
      readonly type: 'finish'
      readonly runId: string
      readonly status: 'completed' | 'failed' | 'cancelled'
      readonly at: number
    }
  | { readonly type: 'touch'; readonly runId: string; readonly at: number }

export interface EventLogProjector extends Projector {
  /** Replays the source log into this sink. Safe to repeat; do not run it beside live delivery. */
  rebuild(
    source: EventStore,
    options?: { readonly runId?: string; readonly batchSize?: number },
  ): Promise<number>
}

export interface MemoryEventLog extends EventLogProjector {
  events(runId: string): readonly EventLogEntry[]
  run(runId: string): RunLogRow | null
}

interface RunRecord {
  runId: string
  status: RunStatus
  kind: string | null
  definitionName: string | null
  definitionVersion: string | null
  rootThreadId: string | null
  parentRunId: string | null
  launchedByEffectId: string | null
  correlationId: string | null
  attributes: { [key: string]: string }
  tenant: string | null
  project: string | null
  org: string | null
  startedAt: number | null
  updatedAt: number
  completedAt: number | null
}

const terminal = new Set<RunStatus>(['completed', 'failed', 'cancelled'])

export function eventLogOps(event: EventEnvelope): readonly EventLogOp[] {
  if (event.ephemeral) {
    return []
  }

  const entry: EventLogEntry = {
    runId: event.runId,
    seq: event.seq,
    eventId: event.id,
    ts: event.ts,
    type: event.type,
    payload: event.payload,
    threadId: event.threadId,
    parentThreadId: event.parentThreadId ?? null,
    causationId: event.causationId ?? null,
    correlationId: event.correlationId ?? null,
    effectId: event.effectId ?? null,
    origin: event.origin,
    idempotencyKey: event.idempotencyKey ?? null,
  }

  const payload = isJsonObject(event.payload) ? event.payload : {}

  switch (event.type) {
    case 'runtime.run.started':
      return [{ type: 'insert', entry }, startOp(event, payload)]
    case 'runtime.run.completed':
      return [
        { type: 'insert', entry },
        {
          type: 'finish',
          runId: event.runId,
          status: completedRunStatus(event.payload),
          at: event.ts,
        },
      ]
    case 'runtime.run.cancelled':
      return [
        { type: 'insert', entry },
        { type: 'finish', runId: event.runId, status: 'cancelled', at: event.ts },
      ]
    default:
      return [
        { type: 'insert', entry },
        { type: 'touch', runId: event.runId, at: event.ts },
      ]
  }
}

export function memoryEventLog(): MemoryEventLog {
  const events = new Map<string, EventLogEntry>()
  const runs = new Map<string, RunRecord>()

  const projector = createEventLogProjector('memory-event-log', {
    init: () => Promise.resolve(),
    apply: (batch) => {
      for (const event of batch) {
        for (const op of eventLogOps(event)) {
          applyMemoryOp(events, runs, op)
        }
      }

      return Promise.resolve()
    },
  })

  return {
    ...projector,
    events: (runId) =>
      [...events.values()]
        .filter((entry) => entry.runId === runId)
        .toSorted((left, right) => left.seq - right.seq),
    run: (runId) => {
      const row = runs.get(runId)
      return row ? { ...row, attributes: { ...row.attributes } } : null
    },
  }
}

export function postgresEventLog(options: { url: string } | { sql: Sql }): EventLogProjector {
  const created = 'url' in options
  const connected = created ? createPostgresClient(options.url) : options.sql

  return createEventLogProjector('postgres-event-log', postgresStore(connected, created))
}

function createEventLogProjector(
  name: string,
  store: {
    init: () => Promise<void>
    apply: (events: readonly EventEnvelope[]) => Promise<void>
    dispose?: () => Promise<void>
  },
): EventLogProjector {
  return {
    name,
    version: '1',
    init: store.init,
    project: (events) => store.apply(events),
    dispose: store.dispose,
    rebuild: (source, options) => Effect.runPromise(rebuildEventLog(store, source, options)),
  }
}

function rebuildEventLog(
  store: { init: () => Promise<void>; apply: (events: readonly EventEnvelope[]) => Promise<void> },
  source: EventStore,
  options?: { readonly runId?: string; readonly batchSize?: number },
): Effect.Effect<number, EventStoreError> {
  const batchSize = options?.batchSize ?? 100

  return Effect.gen(function* () {
    yield* Effect.promise(() => store.init())
    const runIds = options?.runId ? [options.runId] : yield* source.listRuns
    let written = 0

    for (const runId of runIds) {
      let fromSeq = 1

      while (fromSeq > 0) {
        const events = yield* source.read(runId, { fromSeq, limit: batchSize })
        const last = events.at(-1)

        if (!last) {
          break
        }

        yield* Effect.promise(() => store.apply(events))
        written += events.filter((event) => !event.ephemeral).length
        fromSeq = events.length < batchSize ? 0 : last.seq + 1
      }
    }

    return written
  })
}

function applyMemoryOp(
  events: Map<string, EventLogEntry>,
  runs: Map<string, RunRecord>,
  op: EventLogOp,
): void {
  switch (op.type) {
    case 'insert':
      events.set(`${op.entry.runId}:${op.entry.seq}`, op.entry)
      return
    case 'start':
      runs.set(op.runId, mergeStart(runs.get(op.runId), op))
      return
    case 'finish':
      runs.set(op.runId, mergeFinish(runs.get(op.runId), op))
      return

    case 'touch': {
      const existing = runs.get(op.runId)

      if (!existing || existing.updatedAt >= op.at) {
        return
      }

      runs.set(op.runId, { ...existing, updatedAt: op.at })
      return
    }

    default: {
      const unexpected: never = op
      return unexpected
    }
  }
}

function mergeStart(
  existing: RunRecord | undefined,
  op: Extract<EventLogOp, { type: 'start' }>,
): RunRecord {
  const status = existing && terminal.has(existing.status) ? existing.status : 'running'

  return {
    runId: op.runId,
    status,
    kind: existing?.kind ?? op.kind,
    definitionName: existing?.definitionName ?? op.definitionName,
    definitionVersion: existing?.definitionVersion ?? op.definitionVersion,
    rootThreadId: existing?.rootThreadId ?? op.rootThreadId,
    parentRunId: existing?.parentRunId ?? op.parentRunId,
    launchedByEffectId: existing?.launchedByEffectId ?? op.launchedByEffectId,
    correlationId: existing?.correlationId ?? op.correlationId,
    attributes:
      existing && Object.keys(existing.attributes).length > 0
        ? existing.attributes
        : { ...op.attributes },
    tenant: existing?.tenant ?? op.tenant,
    project: existing?.project ?? op.project,
    org: existing?.org ?? op.org,
    startedAt: existing?.startedAt ?? op.at,
    updatedAt: Math.max(existing?.updatedAt ?? 0, op.at),
    completedAt: existing?.completedAt ?? null,
  }
}

function mergeFinish(
  existing: RunRecord | undefined,
  op: Extract<EventLogOp, { type: 'finish' }>,
): RunRecord {
  return {
    runId: op.runId,
    status: op.status,
    kind: existing?.kind ?? null,
    definitionName: existing?.definitionName ?? null,
    definitionVersion: existing?.definitionVersion ?? null,
    rootThreadId: existing?.rootThreadId ?? null,
    parentRunId: existing?.parentRunId ?? null,
    launchedByEffectId: existing?.launchedByEffectId ?? null,
    correlationId: existing?.correlationId ?? null,
    attributes: existing?.attributes ?? {},
    tenant: existing?.tenant ?? null,
    project: existing?.project ?? null,
    org: existing?.org ?? null,
    startedAt: existing?.startedAt ?? null,
    updatedAt: Math.max(existing?.updatedAt ?? 0, op.at),
    completedAt: existing?.completedAt ?? op.at,
  }
}

function utcDate(ms: number): Date {
  return DateTime.toDateUtc(DateTime.makeUnsafe(ms))
}

function startOp(event: EventEnvelope, payload: { [key: string]: JsonValue }): EventLogOp {
  const launchedBy = readRunLaunchSource(
    payload.launchedBy === undefined ? undefined : payload.launchedBy,
  )

  const attributes = readAttributes(payload.attributes)

  return {
    type: 'start',
    runId: event.runId,
    kind: readString(payload, 'kind'),
    definitionName: readString(payload, 'definitionName'),
    definitionVersion: readString(payload, 'definitionVersion'),
    rootThreadId: readString(payload, 'rootThreadId'),
    parentRunId: launchedBy?.runId ?? null,
    launchedByEffectId: launchedBy?.effectId ?? null,
    correlationId: event.correlationId ?? null,
    attributes,
    tenant: attributes.tenant ?? null,
    project: attributes.project ?? null,
    org: attributes.org ?? null,
    at: event.ts,
  }
}

function readString(payload: { [key: string]: JsonValue }, key: string): string | null {
  const value = payload[key]
  return Predicate.isString(value) ? value : null
}

function readAttributes(value: JsonValue | undefined): { [key: string]: string } {
  if (value === undefined) {
    return {}
  }

  return Option.getOrElse(decodeAttributes(value), () => ({}))
}

function postgresStore(sql: Sql, ownsClient: boolean) {
  return {
    init: () =>
      runProjectorPromise('postgres-event-log', () =>
        sql.unsafe(POSTGRES_EVENT_LOG_SCHEMA_SQL),
      ).then(() => undefined),
    apply: (events: readonly EventEnvelope[]) => {
      const ops = events.flatMap(eventLogOps)

      if (ops.length === 0) {
        return Promise.resolve()
      }

      return runProjectorPromise('postgres-event-log', () =>
        sql.begin((tx) => applySqlOps(tx, ops)),
      ).then(() => undefined)
    },
    dispose: () =>
      ownsClient
        ? runProjectorPromise('postgres-event-log', () => sql.end({ timeout: 5 })).then(
            () => undefined,
          )
        : Promise.resolve(),
  }
}

/** Keeps each statement under Postgres's 65,535 bind parameters (13 per event row). */
const INSERT_CHUNK_ROWS = 1_000

type StartOp = Extract<EventLogOp, { type: 'start' }>
type FinishOp = Extract<EventLogOp, { type: 'finish' }>

/** Every index change a batch makes to one run, folded the way `applyMemoryOp` folds them. */
interface RunIndexPatch {
  readonly runId: string
  start: StartOp | null
  finish: FinishOp | null
  completedAt: number | null
  updatedAt: number
}

function runIndexPatches(ops: readonly EventLogOp[]): RunIndexPatch[] {
  const patches = new Map<string, RunIndexPatch>()

  for (const op of ops) {
    if (op.type === 'insert') {
      continue
    }

    const patch = patches.get(op.runId) ?? {
      runId: op.runId,
      start: null,
      finish: null,
      completedAt: null,
      updatedAt: op.at,
    }

    patch.updatedAt = Math.max(patch.updatedAt, op.at)

    if (op.type === 'start') {
      patch.start ??= op
    }

    if (op.type === 'finish') {
      patch.finish = op
      patch.completedAt ??= op.at
    }

    patches.set(op.runId, patch)
  }

  return [...patches.values()]
}

export function applySqlOps(sql: TransactionSql, ops: readonly EventLogOp[]): Promise<void> {
  const events = ops.flatMap((op) => (op.type === 'insert' ? [envelopeFromEntry(op.entry)] : []))

  return Promise.all([insertRunEvents(sql, events), applyRunIndexOps(sql, ops)]).then(
    () => undefined,
  )
}

/** Fold run-summary ops. Event rows are written by {@link insertRunEvents}. */
export function applyRunIndexOps(sql: TransactionSql, ops: readonly EventLogOp[]): Promise<void> {
  const patches = runIndexPatches(ops)
  const upserts = patches.filter((patch) => patch.start !== null || patch.finish !== null)
  const touches = patches.filter((patch) => patch.start === null && patch.finish === null)
  const statements: Promise<void>[] = []

  if (upserts.length > 0) {
    statements.push(upsertRuns(sql, upserts))
  }

  if (touches.length > 0) {
    statements.push(touchRuns(sql, touches))
  }

  return Promise.all(statements).then(() => undefined)
}

/** Insert event envelopes, including ephemeral ones. Durable callers pass events that are already filtered. */
export function insertRunEvents(
  sql: TransactionSql,
  events: readonly EventEnvelope[],
): Promise<void> {
  const statements: Promise<void>[] = []

  for (let index = 0; index < events.length; index += INSERT_CHUNK_ROWS) {
    statements.push(insertEventChunk(sql, events.slice(index, index + INSERT_CHUNK_ROWS)))
  }

  return Promise.all(statements).then(() => undefined)
}

function envelopeFromEntry(entry: EventLogEntry): EventEnvelope {
  return {
    id: entry.eventId,
    runId: entry.runId,
    seq: entry.seq,
    ts: entry.ts,
    type: entry.type,
    payload: entry.payload,
    threadId: entry.threadId,
    parentThreadId: entry.parentThreadId,
    causationId: entry.causationId,
    correlationId: entry.correlationId,
    effectId: entry.effectId,
    origin: entry.origin,
    idempotencyKey: entry.idempotencyKey,
  }
}

function insertEventChunk(sql: TransactionSql, events: readonly EventEnvelope[]): Promise<void> {
  const rows = events.map((event) => ({
    run_id: event.runId,
    seq: event.seq,
    event_id: event.id,
    ts: utcDate(event.ts),
    type: event.type,
    payload: sql.json(event.payload),
    thread_id: event.threadId,
    parent_thread_id: event.parentThreadId ?? null,
    causation_id: event.causationId ?? null,
    correlation_id: event.correlationId ?? null,
    effect_id: event.effectId ?? null,
    origin: sql.json(event.origin),
    idempotency_key: event.idempotencyKey ?? null,
    ephemeral: event.ephemeral === true,
  }))

  return sql`
    INSERT INTO looms_run_events ${sql(rows)}
    ON CONFLICT (run_id, seq) DO NOTHING
  `.then(() => undefined)
}

// A finish in the batch sets the status; otherwise a finished run keeps its status and a
// started run becomes running. Start fields fill only columns that are still empty.
function upsertRuns(sql: TransactionSql, patches: readonly RunIndexPatch[]): Promise<void> {
  const rows = patches.map(({ runId, start, finish, completedAt, updatedAt }) => ({
    run_id: runId,
    status: finish?.status ?? 'running',
    kind: start?.kind ?? null,
    definition_name: start?.definitionName ?? null,
    definition_version: start?.definitionVersion ?? null,
    root_thread_id: start?.rootThreadId ?? null,
    parent_run_id: start?.parentRunId ?? null,
    launched_by_effect_id: start?.launchedByEffectId ?? null,
    correlation_id: start?.correlationId ?? null,
    attributes: sql.json(start?.attributes ?? {}),
    tenant: start?.tenant ?? null,
    project: start?.project ?? null,
    org: start?.org ?? null,
    started_at: start ? utcDate(start.at) : null,
    updated_at: utcDate(updatedAt),
    completed_at: completedAt === null ? null : utcDate(completedAt),
  }))

  return sql`
    INSERT INTO looms_run_index ${sql(rows)}
    ON CONFLICT (run_id) DO UPDATE SET
      status = CASE
        WHEN EXCLUDED.completed_at IS NOT NULL THEN EXCLUDED.status
        WHEN looms_run_index.status IN ('completed', 'failed', 'cancelled') THEN looms_run_index.status
        ELSE EXCLUDED.status
      END,
      kind = COALESCE(looms_run_index.kind, EXCLUDED.kind),
      definition_name = COALESCE(looms_run_index.definition_name, EXCLUDED.definition_name),
      definition_version = COALESCE(looms_run_index.definition_version, EXCLUDED.definition_version),
      root_thread_id = COALESCE(looms_run_index.root_thread_id, EXCLUDED.root_thread_id),
      parent_run_id = COALESCE(looms_run_index.parent_run_id, EXCLUDED.parent_run_id),
      launched_by_effect_id = COALESCE(looms_run_index.launched_by_effect_id, EXCLUDED.launched_by_effect_id),
      correlation_id = COALESCE(looms_run_index.correlation_id, EXCLUDED.correlation_id),
      attributes = CASE
        WHEN looms_run_index.attributes = '{}'::jsonb THEN EXCLUDED.attributes
        ELSE looms_run_index.attributes
      END,
      tenant = COALESCE(looms_run_index.tenant, EXCLUDED.tenant),
      project = COALESCE(looms_run_index.project, EXCLUDED.project),
      org = COALESCE(looms_run_index.org, EXCLUDED.org),
      started_at = COALESCE(looms_run_index.started_at, EXCLUDED.started_at),
      updated_at = GREATEST(looms_run_index.updated_at, EXCLUDED.updated_at),
      completed_at = COALESCE(looms_run_index.completed_at, EXCLUDED.completed_at)
  `.then(() => undefined)
}

function touchRuns(sql: TransactionSql, patches: readonly RunIndexPatch[]): Promise<void> {
  const runIds = patches.map((patch) => patch.runId)
  const touchedAt = patches.map((patch) => DateTime.formatIso(DateTime.makeUnsafe(patch.updatedAt)))

  return sql`
    UPDATE looms_run_index AS run
    SET updated_at = GREATEST(run.updated_at, touched.at)
    FROM unnest(${sql.array(runIds)}::text[], ${sql.array(touchedAt)}::timestamptz[])
      AS touched (run_id, at)
    WHERE run.run_id = touched.run_id
  `.then(() => undefined)
}
