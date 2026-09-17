import { DateTime, Schema } from 'effect'

import { createEventId } from './ids'
import { cleanUndefined, type JsonValue } from './types'

export const JsonValueSchema = Schema.Json

export const EventOriginSchema = Schema.Union([
  Schema.Struct({
    type: Schema.Literal('thread'),
    threadId: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal('external'),
    actorId: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    type: Schema.Literal('system'),
  }),
])

export type EventOrigin = Schema.Schema.Type<typeof EventOriginSchema>

export const EventEnvelopeSchema = Schema.Struct({
  id: Schema.String,
  runId: Schema.String,
  seq: Schema.Finite,
  ts: Schema.Finite,
  type: Schema.String,
  payload: JsonValueSchema,
  threadId: Schema.NullOr(Schema.String),
  parentThreadId: Schema.optional(Schema.NullOr(Schema.String)),
  causationId: Schema.optional(Schema.NullOr(Schema.String)),
  correlationId: Schema.optional(Schema.NullOr(Schema.String)),
  effectId: Schema.optional(Schema.NullOr(Schema.String)),
  origin: EventOriginSchema,
  ephemeral: Schema.optional(Schema.Boolean),
  idempotencyKey: Schema.optional(Schema.NullOr(Schema.String)),
})

export const EventInputSchema = Schema.Struct({
  type: Schema.String,
  payload: JsonValueSchema,
  threadId: Schema.optional(Schema.NullOr(Schema.String)),
  parentThreadId: Schema.optional(Schema.NullOr(Schema.String)),
  causationId: Schema.optional(Schema.NullOr(Schema.String)),
  correlationId: Schema.optional(Schema.NullOr(Schema.String)),
  effectId: Schema.optional(Schema.NullOr(Schema.String)),
  origin: Schema.optional(EventOriginSchema),
  ephemeral: Schema.optional(Schema.Boolean),
  id: Schema.optional(Schema.String),
  ts: Schema.optional(Schema.Finite),
  idempotencyKey: Schema.optional(Schema.NullOr(Schema.String)),
})

export type EventEnvelope<TType extends string = string, TPayload = JsonValue> = {
  id: string
  runId: string
  seq: number
  ts: number
  type: TType
  payload: TPayload
  threadId: string | null
  parentThreadId?: string | null
  causationId?: string | null
  correlationId?: string | null
  effectId?: string | null
  origin: EventOrigin
  ephemeral?: boolean
  idempotencyKey?: string | null
}

export type TypedEvent<TType extends string, TPayload = JsonValue> = EventEnvelope<TType, TPayload>

export type EventInput<TType extends string = string, TPayload = JsonValue> = {
  type: TType
  payload: TPayload
  threadId?: string | null
  parentThreadId?: string | null
  causationId?: string | null
  correlationId?: string | null
  effectId?: string | null
  origin?: EventOrigin
  ephemeral?: boolean
  id?: string
  ts?: number
  idempotencyKey?: string | null
}

export type AppendableEvent = Omit<EventEnvelope, 'seq'> & { seq?: number }

export function payloadAsJson(payload: JsonValue): JsonValue {
  return cleanUndefined(payload)
}

export function withAssignedSeq(
  partial: AppendableEvent,
  runId: string,
  seq: number,
): EventEnvelope {
  return { ...partial, runId, seq }
}

export function createEvent<TType extends string, TPayload = JsonValue>(
  runId: string,
  input: EventInput<TType, TPayload>,
  options?: { seq?: number },
): EventEnvelope<TType, TPayload> {
  const threadId = input.threadId ?? null
  const parentThreadId = input.parentThreadId ?? null
  return {
    id: input.id ?? createEventId(),
    runId,
    seq: options?.seq ?? 0,
    ts: input.ts ?? DateTime.toEpochMillis(DateTime.nowUnsafe()),
    type: input.type,
    payload: input.payload,
    threadId,
    parentThreadId,
    causationId: input.causationId,
    correlationId: input.correlationId,
    effectId: input.effectId,
    origin: input.origin ?? { type: 'system' },
    ephemeral: input.ephemeral,
    idempotencyKey: input.idempotencyKey ?? null,
  }
}

export function fromWireEvent(wire: Schema.Schema.Type<typeof EventEnvelopeSchema>): EventEnvelope {
  const threadId = wire.threadId ?? null
  const parentThreadId = wire.parentThreadId ?? null
  return {
    ...wire,
    threadId,
    parentThreadId,
  }
}
