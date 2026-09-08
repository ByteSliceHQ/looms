import { Schema } from 'effect'
import { defineEventCatalog, type EventsOfCatalog } from './catalog'
import { JsonValueSchema } from './envelope'
import type { WaitCondition } from './effects'

const WaitOnEventSchema = Schema.Struct({
  type: Schema.String,
  match: Schema.optional(JsonValueSchema),
})

const WaitOnTimerSchema = Schema.Struct({
  timerAt: Schema.Number,
})

export const WaitConditionSchema = Schema.Union([WaitOnEventSchema, WaitOnTimerSchema])

export const protocolCatalog = defineEventCatalog('runtime', {
  'run.started': Schema.Struct({
    rootThreadId: Schema.optional(Schema.String),
    kind: Schema.String,
    definitionName: Schema.String,
    input: JsonValueSchema,
  }),
  'run.completed': Schema.Struct({
    output: Schema.NullOr(JsonValueSchema),
    error: Schema.NullOr(Schema.String),
  }),
  'thread.started': Schema.Struct({
    threadId: Schema.String,
    kind: Schema.String,
    definitionName: Schema.String,
    input: JsonValueSchema,
    parentThreadId: Schema.NullOr(Schema.String),
  }),
  'thread.completed': Schema.Struct({
    threadId: Schema.String,
    output: JsonValueSchema,
  }),
  'thread.failed': Schema.Struct({
    threadId: Schema.String,
    error: Schema.String,
  }),
  'thread.cancelled': Schema.Struct({
    threadId: Schema.String,
    reason: Schema.optional(Schema.String),
  }),
  'wait.registered': Schema.Struct({
    waitId: Schema.String,
    threadId: Schema.optional(Schema.String),
    on: WaitConditionSchema,
    tag: Schema.optional(JsonValueSchema),
  }),
  'wait.satisfied': Schema.Struct({
    waitId: Schema.String,
    tag: Schema.optional(JsonValueSchema),
    event: Schema.Struct({
      id: Schema.String,
      type: Schema.String,
      payload: JsonValueSchema,
    }),
  }),
  'timer.set': Schema.Struct({
    timerId: Schema.String,
    waitId: Schema.String,
    wakeAt: Schema.Number,
  }),
  'timer.fired': Schema.Struct({
    timerId: Schema.String,
    waitId: Schema.String,
  }),
  'effect.failed': Schema.Struct({
    effectId: Schema.String,
    error: Schema.String,
  }),
  'snapshot.taken': Schema.Struct({
    seq: Schema.Number,
    stateHash: Schema.String,
    state: Schema.optional(JsonValueSchema),
  }),
  'signal.received': Schema.Struct({
    signalType: Schema.String,
  }),
})

export type ProtocolEvent = EventsOfCatalog<typeof protocolCatalog>

export const PROTOCOL_TYPES = [
  'runtime.run.started',
  'runtime.run.completed',
  'runtime.thread.started',
  'runtime.thread.completed',
  'runtime.thread.failed',
  'runtime.thread.cancelled',
  'runtime.wait.registered',
  'runtime.wait.satisfied',
  'runtime.timer.set',
  'runtime.timer.fired',
  'runtime.effect.failed',
  'runtime.snapshot.taken',
  'runtime.signal.received',
] as const

export type ProtocolEventType = (typeof PROTOCOL_TYPES)[number]

export function isProtocolType(type: string): type is ProtocolEventType {
  // SAFETY: PROTOCOL_TYPES is the closed list of runtime.* event names.
  const names: readonly string[] = PROTOCOL_TYPES
  return names.includes(type)
}

export type RunStartedPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['run.started']>
export type RunCompletedPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['run.completed']>
export type ThreadStartedPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['thread.started']>
export type ThreadCompletedPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['thread.completed']>
export type ThreadFailedPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['thread.failed']>
export type ThreadCancelledPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['thread.cancelled']>
export type WaitRegisteredPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['wait.registered']>
export type WaitSatisfiedPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['wait.satisfied']>
export type TimerSetPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['timer.set']>
export type TimerFiredPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['timer.fired']>
export type EffectFailedPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['effect.failed']>
export type SnapshotTakenPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['snapshot.taken']>

export function asWaitCondition(value: Schema.Schema.Type<typeof WaitConditionSchema>): WaitCondition {
  return value
}
