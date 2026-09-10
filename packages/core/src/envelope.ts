import { Schema } from 'effect'

import { createEventId } from './ids'
import type { JsonValue } from './types'

export const JsonValueSchema = Schema.MutableJson

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
  seq: Schema.Number,
  ts: Schema.Number,
  type: Schema.String,
  payload: JsonValueSchema,
  threadId: Schema.NullOr(Schema.String),
  parentThreadId: Schema.optional(Schema.NullOr(Schema.String)),
  causationId: Schema.optional(Schema.NullOr(Schema.String)),
  correlationId: Schema.optional(Schema.NullOr(Schema.String)),
  effectId: Schema.optional(Schema.NullOr(Schema.String)),
  origin: EventOriginSchema,
  ephemeral: Schema.optional(Schema.Boolean),
})

export type EventEnvelope<TType extends string = string, TPayload extends JsonValue = JsonValue> = {
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
}

export type TypedEvent<TType extends string, TPayload extends JsonValue> = EventEnvelope<
  TType,
  TPayload
>

export type EventInput = {
  type: string
  payload: JsonValue
  threadId?: string | null
  parentThreadId?: string | null
  causationId?: string | null
  correlationId?: string | null
  effectId?: string | null
  origin?: EventOrigin
  ephemeral?: boolean
  id?: string
  ts?: number
}

export type AppendableEvent = Omit<EventEnvelope, 'seq'> & { seq?: number }

export function payloadAsJson(payload: JsonValue): JsonValue {
  // SAFETY: round-trip through JSON yields JsonValue.
  return JSON.parse(JSON.stringify(payload)) as JsonValue
}

export function withAssignedSeq(
  partial: AppendableEvent,
  runId: string,
  seq: number,
): EventEnvelope {
  return { ...partial, runId, seq }
}

export function createEvent<TType extends string>(
  runId: string,
  input: Omit<EventInput, 'type'> & { type: TType },
  options?: { seq?: number },
): EventEnvelope<TType> {
  const threadId = input.threadId ?? null
  const parentThreadId = input.parentThreadId ?? null
  return {
    id: input.id ?? createEventId(),
    runId,
    seq: options?.seq ?? 0,
    ts: input.ts ?? Date.now(),
    type: input.type,
    payload: input.payload,
    threadId,
    parentThreadId,
    causationId: input.causationId,
    correlationId: input.correlationId,
    effectId: input.effectId,
    origin: input.origin ?? { type: 'system' },
    ephemeral: input.ephemeral,
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
