import { Predicate } from 'effect'
import type { AppendableEvent, EventEnvelope, EventOrigin } from './envelope'
import { createEvent, payloadAsJson } from './envelope'
import { createEventId } from './ids'
import type { JsonValue } from './types'

export interface LiveStoreGlobalEncoded {
  readonly name: string
  readonly args: {
    readonly id: string
    readonly ts: number
    readonly payload: JsonValue
    readonly threadId: string | null
    readonly parentThreadId: string | null
    readonly causationId: string | null
    readonly correlationId: string | null
    readonly effectId: string | null
    readonly ephemeral: boolean
    readonly origin: EventOrigin
  }
  readonly seqNum: number
  readonly parentSeqNum: number
  readonly clientId: string
  readonly sessionId: string
}

export function encodeLoomsEvent(event: EventEnvelope): LiveStoreGlobalEncoded {
  return {
    name: event.type,
    args: {
      id: event.id,
      ts: event.ts,
      payload: payloadAsJson(event.payload),
      threadId: event.threadId,
      parentThreadId: event.parentThreadId ?? null,
      causationId: event.causationId ?? null,
      correlationId: event.correlationId ?? null,
      effectId: event.effectId ?? null,
      ephemeral: event.ephemeral ?? false,
      origin: event.origin,
    },
    seqNum: event.seq,
    parentSeqNum: Math.max(0, event.seq - 1),
    clientId: 'looms-host',
    sessionId: 'looms-host',
  }
}

export function encodeAppendableEvent(
  event: AppendableEvent,
  options?: { parentSeqNum?: number },
): LiveStoreGlobalEncoded {
  return {
    name: event.type,
    args: {
      id: event.id ?? createEventId(),
      ts: event.ts ?? Date.now(),
      payload: payloadAsJson(event.payload),
      threadId: event.threadId ?? null,
      parentThreadId: event.parentThreadId ?? null,
      causationId: event.causationId ?? null,
      correlationId: event.correlationId ?? null,
      effectId: event.effectId ?? null,
      ephemeral: event.ephemeral ?? false,
      origin: event.origin,
    },
    seqNum: 0,
    parentSeqNum: options?.parentSeqNum ?? 0,
    clientId: 'looms-client',
    sessionId: 'looms-client',
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

export function decodeLoomsEvent(raw: JsonValue | LiveStoreGlobalEncoded, runId: string): EventEnvelope {
  if (!Predicate.isReadonlyObject(raw)) {
    throw new Error('Invalid event payload: expected object')
  }

  if ('name' in raw && Predicate.isString(raw.name)) {
    const args = 'args' in raw && Predicate.isReadonlyObject(raw.args) ? raw.args : {}
    const rawPayload = 'payload' in args ? args.payload : {}
    // SAFETY: payload is JSON-compatible.
    const payload = rawPayload as JsonValue
    const id = 'id' in args && Predicate.isString(args.id) ? args.id : createEventId()
    const ts = 'ts' in args && Predicate.isNumber(args.ts) ? args.ts : Date.now()
    const ephemeral = 'ephemeral' in args && Predicate.isBoolean(args.ephemeral) ? args.ephemeral : false
    const threadId = 'threadId' in args && Predicate.isString(args.threadId) ? args.threadId : null
    const parentThreadId =
      'parentThreadId' in args && Predicate.isString(args.parentThreadId) ? args.parentThreadId : null
    const causationId = 'causationId' in args && Predicate.isString(args.causationId) ? args.causationId : null
    const correlationId =
      'correlationId' in args && Predicate.isString(args.correlationId) ? args.correlationId : null
    const effectId = 'effectId' in args && Predicate.isString(args.effectId) ? args.effectId : null
    const seq = 'seqNum' in raw && Predicate.isNumber(raw.seqNum) ? raw.seqNum : 0
    const origin =
      'origin' in args && Predicate.isReadonlyObject(args.origin)
        ? readOrigin(args.origin)
        : { type: 'system' as const }

    return createEvent(
      runId,
      {
        id,
        ts,
        type: raw.name,
        payload,
        threadId,
        parentThreadId,
        causationId,
        correlationId,
        effectId,
        ephemeral,
        origin,
      },
      { seq },
    )
  }

  if ('type' in raw && Predicate.isString(raw.type)) {
    const rawPayload = 'payload' in raw ? raw.payload : {}
    // SAFETY: payload is JSON-compatible.
    const payload = rawPayload as JsonValue
    const id = 'id' in raw && Predicate.isString(raw.id) ? raw.id : createEventId()
    const ts = 'ts' in raw && Predicate.isNumber(raw.ts) ? raw.ts : Date.now()
    const seq = 'seq' in raw && Predicate.isNumber(raw.seq) ? raw.seq : 0
    const ephemeral = 'ephemeral' in raw && Predicate.isBoolean(raw.ephemeral) ? raw.ephemeral : false
    const itemRunId = 'runId' in raw && Predicate.isString(raw.runId) ? raw.runId : runId
    const threadId = 'threadId' in raw && Predicate.isString(raw.threadId) ? raw.threadId : null
    const parentThreadId =
      'parentThreadId' in raw && Predicate.isString(raw.parentThreadId) ? raw.parentThreadId : null
    const origin =
      'origin' in raw && Predicate.isReadonlyObject(raw.origin) ? readOrigin(raw.origin) : { type: 'system' as const }

    return createEvent(
      itemRunId,
      {
        id,
        ts,
        type: raw.type,
        payload,
        threadId,
        parentThreadId,
        causationId: 'causationId' in raw && Predicate.isString(raw.causationId) ? raw.causationId : null,
        correlationId:
          'correlationId' in raw && Predicate.isString(raw.correlationId) ? raw.correlationId : null,
        effectId: 'effectId' in raw && Predicate.isString(raw.effectId) ? raw.effectId : null,
        ephemeral,
        origin,
      },
      { seq },
    )
  }

  throw new Error('Invalid event payload: missing name or type')
}

export function decodeAppendableEvent(
  raw: JsonValue | LiveStoreGlobalEncoded,
  runId: string,
): AppendableEvent | undefined {
  try {
    const { seq: _seq, ...rest } = decodeLoomsEvent(raw, runId)
    return rest
  } catch {
    return undefined
  }
}
