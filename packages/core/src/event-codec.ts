import { Predicate } from 'effect'

import type { AppendableEvent, EventEnvelope, EventOrigin } from './envelope'
import { createEvent, payloadAsJson } from './envelope'
import { createEventId } from './ids'
import type { JsonValue } from './types'

/** JSON-safe event envelope for SSE and pull responses. */
export type EncodedLoomsEvent = EventEnvelope

export function encodeLoomsEvent(event: EventEnvelope): EncodedLoomsEvent {
  return {
    ...event,
    payload: payloadAsJson(event.payload),
  }
}

export function encodeAppendableEvent(event: AppendableEvent): EncodedLoomsEvent {
  return {
    id: event.id ?? createEventId(),
    runId: event.runId,
    seq: event.seq ?? 0,
    ts: event.ts ?? Date.now(),
    type: event.type,
    payload: payloadAsJson(event.payload),
    threadId: event.threadId ?? null,
    parentThreadId: event.parentThreadId ?? null,
    causationId: event.causationId ?? null,
    correlationId: event.correlationId ?? null,
    effectId: event.effectId ?? null,
    ephemeral: event.ephemeral ?? false,
    origin: event.origin,
  }
}

function readOrigin(raw: { [key: string]: JsonValue } | EventOrigin): EventOrigin {
  if ('type' in raw && raw.type === 'thread') {
    const threadId = 'threadId' in raw && Predicate.isString(raw.threadId) ? raw.threadId : ''
    return { type: 'thread', threadId }
  }

  if ('type' in raw && raw.type === 'external') {
    const actorId = 'actorId' in raw && Predicate.isString(raw.actorId) ? raw.actorId : undefined
    return actorId ? { type: 'external', actorId } : { type: 'external' }
  }

  return { type: 'system' }
}

export function decodeLoomsEvent(raw: JsonValue | EncodedLoomsEvent, runId: string): EventEnvelope {
  if (!Predicate.isReadonlyObject(raw)) {
    throw new Error('Invalid event payload: expected object')
  }

  if ('type' in raw && Predicate.isString(raw.type)) {
    const rawPayload = 'payload' in raw ? raw.payload : {}
    // SAFETY: payload is JSON-compatible.
    const payload = rawPayload
    const id = 'id' in raw && Predicate.isString(raw.id) ? raw.id : createEventId()
    const ts = 'ts' in raw && Predicate.isNumber(raw.ts) ? raw.ts : Date.now()
    const seq = 'seq' in raw && Predicate.isNumber(raw.seq) ? raw.seq : 0

    const ephemeral =
      'ephemeral' in raw && Predicate.isBoolean(raw.ephemeral) ? raw.ephemeral : false

    const itemRunId = 'runId' in raw && Predicate.isString(raw.runId) ? raw.runId : runId
    const threadId = 'threadId' in raw && Predicate.isString(raw.threadId) ? raw.threadId : null

    const parentThreadId =
      'parentThreadId' in raw && Predicate.isString(raw.parentThreadId) ? raw.parentThreadId : null

    const origin =
      'origin' in raw && Predicate.isReadonlyObject(raw.origin)
        ? readOrigin(raw.origin)
        : { type: 'system' as const }

    return createEvent(
      itemRunId,
      {
        id,
        ts,
        type: raw.type,
        payload,
        threadId,
        parentThreadId,
        causationId:
          'causationId' in raw && Predicate.isString(raw.causationId) ? raw.causationId : null,
        correlationId:
          'correlationId' in raw && Predicate.isString(raw.correlationId)
            ? raw.correlationId
            : null,
        effectId: 'effectId' in raw && Predicate.isString(raw.effectId) ? raw.effectId : null,
        ephemeral,
        origin,
      },
      { seq },
    )
  }

  throw new Error('Invalid event payload: missing type')
}

export function decodeAppendableEvent(
  raw: JsonValue | EncodedLoomsEvent,
  runId: string,
): AppendableEvent | undefined {
  try {
    const { seq: _seq, ...rest } = decodeLoomsEvent(raw, runId)
    return rest
  } catch {
    return undefined
  }
}
