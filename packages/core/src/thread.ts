import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { EventEnvelope } from './envelope'
import type { RuntimeEffect } from './effects'
import type { InferSchemaOutput, SchemaInput } from './schema'
import type { ThreadStatus, JsonValue } from './types'

export interface StartContext {
  readonly runId: string
  readonly threadId: string
  readonly parentThreadId: string | null
  readonly definitionName: string
  readonly input: JsonValue
}

export interface ReduceContext {
  readonly runId: string
  readonly threadId: string
  readonly parentThreadId: string | null
}

export interface ReduceResult<S = JsonValue> {
  state: S
  effects?: RuntimeEffect[]
}

export interface ThreadDefinition<S = any> {
  readonly kind: string
  readonly shape?: unknown
  readonly input?: StandardSchemaV1<JsonValue, JsonValue>
  initialState(ctx: StartContext): S
  reduce(state: S, event: EventEnvelope, ctx: ReduceContext): ReduceResult<S>
}

export function defineThread<
  TShape extends SchemaInput,
>(def: {
  readonly kind: string
  readonly shape: TShape
  readonly input?: StandardSchemaV1<JsonValue, JsonValue>
  initialState(ctx: StartContext): InferSchemaOutput<TShape>
  reduce(
    state: InferSchemaOutput<TShape>,
    event: EventEnvelope,
    ctx: ReduceContext,
  ): ReduceResult<InferSchemaOutput<TShape>>
}): ThreadDefinition<InferSchemaOutput<TShape>>
export function defineThread<S = JsonValue, TShape extends SchemaInput = SchemaInput>(def: {
  readonly kind: string
  readonly shape?: TShape
  readonly input?: StandardSchemaV1<JsonValue, JsonValue>
  initialState(ctx: StartContext): S
  reduce(state: S, event: EventEnvelope, ctx: ReduceContext): ReduceResult<S>
}): ThreadDefinition<S>
export function defineThread(def: ThreadDefinition<any>): ThreadDefinition<any> {
  // SAFETY: kind reducers own their state shape; the kernel stores it as JsonValue.
  return def
}

export function isTerminalStatus(status: ThreadStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}
