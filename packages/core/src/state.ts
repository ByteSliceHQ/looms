import { Effect, Predicate, Schema } from 'effect'

import {
  RuntimeEffectSchema,
  WaitConditionSchema,
  type RuntimeEffect,
  type WaitCondition,
} from './effects'
import { JsonValueSchema } from './envelope'
import { RunLaunchSourceSchema, type ChildClose, type RunLaunchSource } from './launcher'
import { DEFAULT_DEFINITION_VERSION } from './module'
import { RunAttributesSchema, type RunAttributes } from './run-context'
import { isTerminalStatus } from './thread'
import { TraceContextSchema, type TraceContext } from './trace'
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
  /** When the current attempt started executing, locally or on a worker. */
  startedAt: number | null
  lastHeartbeatAt: number | null
  /** Progress reported by the latest heartbeat. Survives retries so the next attempt can resume. */
  heartbeatDetails: JsonValue | null
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
  launchedBy: RunLaunchSource | null
  correlationId: string | null
  attributes: RunAttributes
  /** The caller's W3C trace context. Effects, workers, and launched runs inherit it. */
  trace: TraceContext | null
}

/** The run and last sequence a fork copied its history from. */
export interface RunForkSource {
  runId: string
  seq: number
}

export interface LaunchedRun {
  runId: string
  close: ChildClose
}

export interface RunState {
  runId: string
  status: RunStatus
  rootThreadId: string | null
  startIdentity: RunStartIdentity | null
  forkedFrom: RunForkSource | null
  /** Immutable labels copied from `runtime.run.started`. Safe for every reader of the run. */
  attributes: RunAttributes
  threads: { [threadId: string]: ThreadRecord }
  waits: { [waitId: string]: WaitRecord }
  outstandingEffects: readonly OutstandingEffect[]
  effectExecutions: { [effectId: string]: EffectExecutionRecord }
  completedEffectIds: readonly string[]
  processedIdempotencyKeys: readonly string[]
  /** Child runs this run launched and has not yet seen settle. */
  launchedRuns: readonly LaunchedRun[]
  /** The run is cancelling and will not finish until `wait` children settle. */
  closeWaiting: boolean
  /** Child runs were already asked to stop because this run closed. */
  childCloseSent: boolean
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
      launchedBy: Schema.NullOr(RunLaunchSourceSchema).pipe(
        Schema.withDecodingDefaultKey(Effect.succeed(null)),
      ),
      correlationId: Schema.NullOr(Schema.String).pipe(
        Schema.withDecodingDefaultKey(Effect.succeed(null)),
      ),
      attributes: RunAttributesSchema.pipe(Schema.withDecodingDefaultKey(Effect.succeed({}))),
      trace: Schema.NullOr(TraceContextSchema).pipe(
        Schema.withDecodingDefaultKey(Effect.succeed(null)),
      ),
    }),
  ).pipe(Schema.withDecodingDefaultKey(Effect.succeed(null))),
  attributes: RunAttributesSchema.pipe(Schema.withDecodingDefaultKey(Effect.succeed({}))),
  forkedFrom: Schema.NullOr(Schema.Struct({ runId: Schema.String, seq: Schema.Finite })).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(null)),
  ),
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
      startedAt: Schema.NullOr(Schema.Finite).pipe(
        Schema.withDecodingDefaultKey(Effect.succeed(null)),
      ),
      lastHeartbeatAt: Schema.NullOr(Schema.Finite).pipe(
        Schema.withDecodingDefaultKey(Effect.succeed(null)),
      ),
      heartbeatDetails: Schema.NullOr(JsonValueSchema).pipe(
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
  launchedRuns: Schema.Array(
    Schema.Struct({
      runId: Schema.String,
      close: Schema.Union([Schema.Literal('terminate'), Schema.Literal('wait')]),
    }),
  ).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  closeWaiting: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  childCloseSent: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
})

export function emptyRunState(runId: string): RunState {
  return {
    runId,
    status: 'running',
    rootThreadId: null,
    startIdentity: null,
    forkedFrom: null,
    attributes: {},
    threads: {},
    waits: {},
    outstandingEffects: [],
    effectExecutions: {},
    completedEffectIds: [],
    processedIdempotencyKeys: [],
    launchedRuns: [],
    closeWaiting: false,
    childCloseSent: false,
  }
}

export function isRunTerminal(state: RunState): boolean {
  return isTerminalStatus(state.status)
}

/** Every thread below `threadId`, in the order they were started. */
export function descendantThreadIds(state: RunState, threadId: string): string[] {
  return Object.values(state.threads)
    .filter((record) => {
      let parentThreadId = record.parentThreadId

      while (parentThreadId) {
        if (parentThreadId === threadId) {
          return true
        }

        parentThreadId = state.threads[parentThreadId]?.parentThreadId ?? null
      }

      return false
    })
    .map((record) => record.threadId)
}

/** The status a `runtime.run.completed` payload ends the run with: an error means it failed. */
export function completedRunStatus(payload: JsonValue): 'completed' | 'failed' {
  const error = Predicate.isObject(payload) ? payload.error : undefined
  return Predicate.isString(error) && error.length > 0 ? 'failed' : 'completed'
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
