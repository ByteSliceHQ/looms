import { Effect, Schema } from 'effect'

import {
  RuntimeEffectSchema,
  WaitConditionSchema,
  type RuntimeEffect,
  type WaitCondition,
} from './effects'
import { JsonValueSchema } from './envelope'
import { DEFAULT_DEFINITION_VERSION } from './module'
import type { JsonValue, ThreadStatus, RunStatus } from './types'

export interface ThreadRecord {
  threadId: string
  kind: string
  definitionName: string
  definitionVersion: string
  parentThreadId: string | null
  status: ThreadStatus
  input: JsonValue
  output: JsonValue | null
  error: string | null
  state: JsonValue
}

export interface WaitRecord {
  waitId: string
  threadId: string
  on: WaitCondition
  tag?: JsonValue
}

export interface OutstandingEffect {
  effectId: string
  threadId: string
  causingSeq: number
  causingEventId: string
  effect: RuntimeEffect
}

export interface EffectExecutionRecord {
  effectId: string
  attempt: number
  status:
    | 'queued'
    | 'dispatched'
    | 'started'
    | 'heartbeat'
    | 'retry_wait'
    | 'cancel_requested'
    | 'timed_out'
    | 'ambiguous'
    | 'running'
  nextAttemptAt: number | null
  deadlineAt: number | null
  lastHeartbeatAt: number | null
  lastError: string | null
}

export interface RunStartIdentity {
  kind: string
  definitionName: string
  definitionVersion: string
  input: JsonValue
  requestedThreadId: string | null
  idempotencyKey: string | null
  rootThreadId: string
}

export interface RunState {
  runId: string
  status: RunStatus
  rootThreadId: string | null
  startIdentity: RunStartIdentity | null
  threads: { [threadId: string]: ThreadRecord }
  waits: { [waitId: string]: WaitRecord }
  outstandingEffects: readonly OutstandingEffect[]
  effectExecutions: { [effectId: string]: EffectExecutionRecord }
  completedEffectIds: readonly string[]
  processedIdempotencyKeys: readonly string[]
}

export const RunStateSchema = Schema.Struct({
  runId: Schema.String,
  status: Schema.Union([
    Schema.Literal('running'),
    Schema.Literal('completed'),
    Schema.Literal('failed'),
    Schema.Literal('cancelled'),
  ]),
  rootThreadId: Schema.NullOr(Schema.String),
  startIdentity: Schema.NullOr(
    Schema.Struct({
      kind: Schema.String,
      definitionName: Schema.String,
      definitionVersion: Schema.String,
      input: JsonValueSchema,
      requestedThreadId: Schema.NullOr(Schema.String),
      idempotencyKey: Schema.NullOr(Schema.String),
      rootThreadId: Schema.String,
    }),
  ).pipe(Schema.withDecodingDefaultKey(Effect.succeed(null))),
  threads: Schema.Record(
    Schema.String,
    Schema.Struct({
      threadId: Schema.String,
      kind: Schema.String,
      definitionName: Schema.String,
      definitionVersion: Schema.String.pipe(
        Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DEFINITION_VERSION)),
      ),
      parentThreadId: Schema.NullOr(Schema.String),
      status: Schema.Union([
        Schema.Literal('running'),
        Schema.Literal('waiting'),
        Schema.Literal('completed'),
        Schema.Literal('failed'),
        Schema.Literal('cancelled'),
      ]),
      input: JsonValueSchema,
      output: Schema.NullOr(JsonValueSchema),
      error: Schema.NullOr(Schema.String),
      state: JsonValueSchema,
    }),
  ),
  waits: Schema.Record(
    Schema.String,
    Schema.Struct({
      waitId: Schema.String,
      threadId: Schema.String,
      on: WaitConditionSchema,
      tag: Schema.optional(JsonValueSchema),
    }),
  ),
  outstandingEffects: Schema.Array(
    Schema.Struct({
      effectId: Schema.String,
      threadId: Schema.String,
      causingSeq: Schema.Finite,
      causingEventId: Schema.String,
      effect: RuntimeEffectSchema,
    }),
  ),
  effectExecutions: Schema.Record(
    Schema.String,
    Schema.Struct({
      effectId: Schema.String,
      attempt: Schema.Finite,
      status: Schema.Union([
        Schema.Literal('queued'),
        Schema.Literal('dispatched'),
        Schema.Literal('started'),
        Schema.Literal('heartbeat'),
        Schema.Literal('retry_wait'),
        Schema.Literal('cancel_requested'),
        Schema.Literal('timed_out'),
        Schema.Literal('ambiguous'),
        Schema.Literal('running'),
      ]),
      nextAttemptAt: Schema.NullOr(Schema.Finite),
      deadlineAt: Schema.NullOr(Schema.Finite).pipe(
        Schema.withDecodingDefaultKey(Effect.succeed(null)),
      ),
      lastHeartbeatAt: Schema.NullOr(Schema.Finite).pipe(
        Schema.withDecodingDefaultKey(Effect.succeed(null)),
      ),
      lastError: Schema.NullOr(Schema.String),
    }),
  ).pipe(Schema.withDecodingDefaultKey(Effect.succeed({}))),
  completedEffectIds: Schema.Array(Schema.String).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed([])),
  ),
  processedIdempotencyKeys: Schema.Array(Schema.String).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed([])),
  ),
})

export function emptyRunState(runId: string): RunState {
  return {
    runId,
    status: 'running',
    rootThreadId: null,
    startIdentity: null,
    threads: {},
    waits: {},
    outstandingEffects: [],
    effectExecutions: {},
    completedEffectIds: [],
    processedIdempotencyKeys: [],
  }
}

export function isRunTerminal(state: RunState): boolean {
  return state.status === 'completed' || state.status === 'failed' || state.status === 'cancelled'
}

export function isRunParked(state: RunState): boolean {
  if (isRunTerminal(state)) {
    return true
  }

  if (state.outstandingEffects.length > 0) {
    return false
  }

  const records = Object.values(state.threads)

  if (records.length === 0) {
    return false
  }

  return records.every(
    (record) =>
      record.status === 'waiting' ||
      record.status === 'completed' ||
      record.status === 'failed' ||
      record.status === 'cancelled',
  )
}
