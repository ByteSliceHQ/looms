import { Predicate } from 'effect'
import {
  createEventId,
  fromWireEvent,
  payloadAsJson,
  type AppendableLoomsEvent,
  type EventOrigin,
  type LoomsEvent,
} from './events'
import type { JsonValue } from './types'

export interface LiveStoreGlobalEncoded {
  readonly name: string
  readonly args: {
    readonly id: string
    readonly ts: number
    readonly payload: JsonValue
    readonly parentActorId: string | null
    readonly ephemeral: boolean
  }
  readonly seqNum: number
  readonly parentSeqNum: number
  readonly clientId: string
  readonly sessionId: string
}

export function encodeLoomsEvent(event: LoomsEvent): LiveStoreGlobalEncoded {
  return {
    name: event.type,
    args: {
      id: event.id,
      ts: event.ts,
      payload: payloadAsJson(event.payload),
      parentActorId: event.parentActorId ?? null,
      ephemeral: event.ephemeral ?? false,
    },
    seqNum: event.seq,
    parentSeqNum: Math.max(0, event.seq - 1),
    clientId: event.origin?.clientId ?? 'looms-host',
    sessionId: event.origin?.sessionId ?? 'looms-host',
  }
}

export function encodeAppendableLoomsEvent(
  event: AppendableLoomsEvent,
  options?: { parentSeqNum?: number; origin?: EventOrigin },
): LiveStoreGlobalEncoded {
  const origin = options?.origin ?? event.origin
  return {
    name: event.type,
    args: {
      id: event.id ?? createEventId(),
      ts: event.ts ?? Date.now(),
      payload: payloadAsJson(event.payload),
      parentActorId: event.parentActorId ?? null,
      ephemeral: event.ephemeral ?? false,
    },
    seqNum: 0,
    parentSeqNum: options?.parentSeqNum ?? 0,
    clientId: origin?.clientId ?? 'looms-client',
    sessionId: origin?.sessionId ?? 'looms-client',
  }
}

export function decodeLoomsEvent(
  raw: JsonValue | LiveStoreGlobalEncoded,
  actorId: string,
): LoomsEvent {
  if (!Predicate.isReadonlyObject(raw)) {
    throw new Error('Invalid event payload: expected object')
  }

  // LiveStore Global.Encoded format: has 'name' and 'args'
  if ('name' in raw && Predicate.isString(raw.name)) {
    const args =
      'args' in raw && Predicate.isReadonlyObject(raw.args)
        ? raw.args
        : {}
    const rawPayload = 'payload' in args ? args.payload : {}
    // SAFETY: payload is verified to be JSON-compatible structure.
    const payload = rawPayload as JsonValue
    const id = 'id' in args && Predicate.isString(args.id) ? args.id : createEventId()
    const ts = 'ts' in args && Predicate.isNumber(args.ts) ? args.ts : Date.now()
    const ephemeral =
      'ephemeral' in args && Predicate.isBoolean(args.ephemeral) ? args.ephemeral : false
    const parentActorId =
      'parentActorId' in args && Predicate.isString(args.parentActorId)
        ? args.parentActorId
        : undefined
    const seq = 'seqNum' in raw && Predicate.isNumber(raw.seqNum) ? raw.seqNum : 0

    let origin: EventOrigin | undefined
    if (
      'clientId' in raw &&
      Predicate.isString(raw.clientId) &&
      'sessionId' in raw &&
      Predicate.isString(raw.sessionId)
    ) {
      origin = { clientId: raw.clientId, sessionId: raw.sessionId }
    }

    // SAFETY: fromWireEvent constructs typed LoomsEvent.
    return fromWireEvent({
      id,
      actorId,
      type: raw.name as never,
      seq,
      ts,
      ephemeral,
      parentActorId,
      origin,
      payload,
    })
  }

  // Direct Looms wire event format: has 'type'
  if ('type' in raw && Predicate.isString(raw.type)) {
    const rawPayload = 'payload' in raw ? raw.payload : {}
    // SAFETY: payload is verified to be JSON-compatible structure.
    const payload = rawPayload as JsonValue
    const id = 'id' in raw && Predicate.isString(raw.id) ? raw.id : createEventId()
    const ts = 'ts' in raw && Predicate.isNumber(raw.ts) ? raw.ts : Date.now()
    const seq = 'seq' in raw && Predicate.isNumber(raw.seq) ? raw.seq : 0
    const ephemeral =
      'ephemeral' in raw && Predicate.isBoolean(raw.ephemeral) ? raw.ephemeral : false
    const parentActorId =
      'parentActorId' in raw && Predicate.isString(raw.parentActorId)
        ? raw.parentActorId
        : undefined
    const itemActorId =
      'actorId' in raw && Predicate.isString(raw.actorId) ? raw.actorId : actorId

    let origin: EventOrigin | undefined
    if (
      'origin' in raw &&
      Predicate.isReadonlyObject(raw.origin) &&
      'clientId' in raw.origin &&
      Predicate.isString(raw.origin.clientId) &&
      'sessionId' in raw.origin &&
      Predicate.isString(raw.origin.sessionId)
    ) {
      origin = { clientId: raw.origin.clientId, sessionId: raw.origin.sessionId }
    }

    // SAFETY: fromWireEvent constructs typed LoomsEvent.
    return fromWireEvent({
      id,
      actorId: itemActorId,
      type: raw.type as never,
      seq,
      ts,
      ephemeral,
      parentActorId,
      origin,
      payload,
    })
  }

  throw new Error('Unrecognized event format: must have "name" (LiveStore) or "type" (Looms)')
}

export function decodeAppendableLoomsEvent(
  raw: JsonValue | LiveStoreGlobalEncoded,
  actorId: string,
): AppendableLoomsEvent | undefined {
  try {
    const event = decodeLoomsEvent(raw, actorId)
    const { seq: _, ...rest } = event
    // SAFETY: omitting seq yields AppendableLoomsEvent with valid actorId.
    return rest as AppendableLoomsEvent
  } catch {
    return undefined
  }
}
