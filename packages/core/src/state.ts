import { Schema } from 'effect'

import {
  RuntimeEffectSchema,
  WaitConditionSchema,
  type RuntimeEffect,
  type WaitCondition,
} from './effects'
import { JsonValueSchema } from './envelope'
import type { JsonValue, ThreadStatus, RunStatus } from './types'

export interface ThreadRecord {
  threadId: string
  kind: string
  definitionName: string
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

export interface RunState {
  runId: string
  status: RunStatus
  rootThreadId: string | null
  threads: { [threadId: string]: ThreadRecord }
  waits: { [waitId: string]: WaitRecord }
  outstandingEffects: readonly OutstandingEffect[]
  completedEffectIds?: readonly string[]
  processedIdempotencyKeys?: readonly string[]
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
  threads: Schema.Record(
    Schema.String,
    Schema.Struct({
      threadId: Schema.String,
      kind: Schema.String,
      definitionName: Schema.String,
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
  completedEffectIds: Schema.optional(Schema.Array(Schema.String)),
  processedIdempotencyKeys: Schema.optional(Schema.Array(Schema.String)),
})

export function emptyRunState(runId: string): RunState {
  return {
    runId,
    status: 'running',
    rootThreadId: null,
    threads: {},
    waits: {},
    outstandingEffects: [],
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
