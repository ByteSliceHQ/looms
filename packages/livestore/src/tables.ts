import type { EventEnvelope, EventOrigin, JsonValue } from '@looms/core'

export interface RunRow {
  runId: string
  status: string
  rootThreadId: string | null
  kind: string | null
  definitionName: string | null
}

export interface ThreadRow {
  threadId: string
  runId: string
  kind: string
  definitionName: string
  parentThreadId: string | null
  status: string
}

export interface EventLogRow {
  id: string
  runId: string
  seq: number
  ts: number
  type: string
  payload: JsonValue
  threadId: string | null
  causationId: string | null
  effectId: string | null
  origin: EventOrigin
}

export interface MaterializedTables {
  runs: Map<string, RunRow>
  threads: Map<string, ThreadRow>
  events_log: EventLogRow[]
}

export function emptyTables(): MaterializedTables {
  const threads = new Map<string, ThreadRow>()
  return {
    runs: new Map(),
    threads,
    events_log: [],
  }
}

export function eventToLogRow(event: EventEnvelope): EventLogRow {
  const threadId = event.threadId ?? null
  return {
    id: event.id,
    runId: event.runId,
    seq: event.seq,
    ts: event.ts,
    type: event.type,
    payload: event.payload,
    threadId,
    causationId: event.causationId ?? null,
    effectId: event.effectId ?? null,
    origin: event.origin,
  }
}
