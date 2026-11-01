import { Option, Predicate, Schema } from 'effect'

import {
  completedRunStatus,
  isJsonObject,
  readRunLaunchSource,
  type EventEnvelope,
  type EventOrigin,
  type JsonValue,
  type RunStatus,
} from '@looms/core'

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

/** Fold one durable event into event-row and run-summary operations. Ephemeral events produce nothing. */
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
