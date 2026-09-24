import { Effect, Schema } from 'effect'

import { defineEventCatalog, type EventInputOf, type EventsOfCatalog } from './catalog'
import { WaitConditionSchema, type WaitCondition } from './effects'
import { JsonValueSchema } from './envelope'
import { DEFAULT_DEFINITION_VERSION } from './module'

const DefinitionVersionSchema = Schema.String.pipe(
  Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DEFINITION_VERSION)),
)

export const protocolCatalog = defineEventCatalog('runtime', {
  'run.started': Schema.Struct({
    rootThreadId: Schema.optional(Schema.String),
    kind: Schema.String,
    definitionName: Schema.String,
    definitionVersion: DefinitionVersionSchema,
    input: JsonValueSchema,
    requestedThreadId: Schema.optional(Schema.NullOr(Schema.String)),
  }),
  'run.completed': Schema.Struct({
    output: Schema.NullOr(JsonValueSchema),
    error: Schema.NullOr(Schema.String),
  }),
  'run.cancelled': Schema.Struct({
    reason: Schema.optional(Schema.String),
  }),
  'thread.started': Schema.Struct({
    threadId: Schema.String,
    kind: Schema.String,
    definitionName: Schema.String,
    definitionVersion: DefinitionVersionSchema,
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
  'thread.cancel.requested': Schema.Struct({
    threadId: Schema.String,
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
    wakeAt: Schema.Finite,
  }),
  'timer.fired': Schema.Struct({
    timerId: Schema.String,
    waitId: Schema.String,
  }),
  'effect.failed': Schema.Struct({
    effectId: Schema.String,
    error: Schema.String,
  }),
  'effect.attempt.started': Schema.Struct({
    effectId: Schema.String,
    attempt: Schema.Finite,
  }),
  'effect.queued': Schema.Struct({
    effectId: Schema.String,
    attempt: Schema.Finite,
    deadlineAt: Schema.NullOr(Schema.Finite),
  }),
  'effect.dispatched': Schema.Struct({
    effectId: Schema.String,
    attempt: Schema.Finite,
    deadlineAt: Schema.NullOr(Schema.Finite),
  }),
  'effect.worker.started': Schema.Struct({
    effectId: Schema.String,
    attempt: Schema.Finite,
    deadlineAt: Schema.NullOr(Schema.Finite),
  }),
  'effect.heartbeat': Schema.Struct({
    effectId: Schema.String,
    attempt: Schema.Finite,
    heartbeatAt: Schema.Finite,
    deadlineAt: Schema.NullOr(Schema.Finite),
  }),
  'effect.cancel.requested': Schema.Struct({
    effectId: Schema.String,
    attempt: Schema.Finite,
    deadlineAt: Schema.NullOr(Schema.Finite),
  }),
  'effect.cancelled': Schema.Struct({
    effectId: Schema.String,
    attempt: Schema.Finite,
  }),
  'effect.completed': Schema.Struct({
    effectId: Schema.String,
    attempt: Schema.Finite,
  }),
  'effect.timed_out': Schema.Struct({
    effectId: Schema.String,
    attempt: Schema.Finite,
    timeout: Schema.String,
  }),
  'effect.ambiguous': Schema.Struct({
    effectId: Schema.String,
    attempt: Schema.Finite,
    error: Schema.String,
  }),
  'effect.retry.scheduled': Schema.Struct({
    effectId: Schema.String,
    attempt: Schema.Finite,
    nextAttemptAt: Schema.Finite,
    error: Schema.String,
  }),
  'snapshot.taken': Schema.Struct({
    seq: Schema.Finite,
    stateHash: Schema.String,
    state: Schema.optional(JsonValueSchema),
  }),
  'signal.received': Schema.Struct({
    signalType: Schema.String,
  }),
})

export type ProtocolEvent = EventsOfCatalog<typeof protocolCatalog>
export type ProtocolEventInput = EventInputOf<typeof protocolCatalog>

export const PROTOCOL_TYPES = [
  'runtime.run.started',
  'runtime.run.completed',
  'runtime.run.cancelled',
  'runtime.thread.started',
  'runtime.thread.completed',
  'runtime.thread.failed',
  'runtime.thread.cancelled',
  'runtime.thread.cancel.requested',
  'runtime.wait.registered',
  'runtime.wait.satisfied',
  'runtime.timer.set',
  'runtime.timer.fired',
  'runtime.effect.failed',
  'runtime.effect.attempt.started',
  'runtime.effect.queued',
  'runtime.effect.dispatched',
  'runtime.effect.worker.started',
  'runtime.effect.heartbeat',
  'runtime.effect.cancel.requested',
  'runtime.effect.cancelled',
  'runtime.effect.completed',
  'runtime.effect.timed_out',
  'runtime.effect.ambiguous',
  'runtime.effect.retry.scheduled',
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
export type RunCompletedPayload = Schema.Schema.Type<
  (typeof protocolCatalog.entries)['run.completed']
>
export type ThreadStartedPayload = Schema.Schema.Type<
  (typeof protocolCatalog.entries)['thread.started']
>
export type ThreadCompletedPayload = Schema.Schema.Type<
  (typeof protocolCatalog.entries)['thread.completed']
>
export type ThreadFailedPayload = Schema.Schema.Type<
  (typeof protocolCatalog.entries)['thread.failed']
>
export type ThreadCancelledPayload = Schema.Schema.Type<
  (typeof protocolCatalog.entries)['thread.cancelled']
>
export type WaitRegisteredPayload = Schema.Schema.Type<
  (typeof protocolCatalog.entries)['wait.registered']
>
export type WaitSatisfiedPayload = Schema.Schema.Type<
  (typeof protocolCatalog.entries)['wait.satisfied']
>
export type TimerSetPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['timer.set']>
export type TimerFiredPayload = Schema.Schema.Type<(typeof protocolCatalog.entries)['timer.fired']>
export type EffectFailedPayload = Schema.Schema.Type<
  (typeof protocolCatalog.entries)['effect.failed']
>
export type SnapshotTakenPayload = Schema.Schema.Type<
  (typeof protocolCatalog.entries)['snapshot.taken']
>

export function asWaitCondition(
  value: Schema.Schema.Type<typeof WaitConditionSchema>,
): WaitCondition {
  return value
}
