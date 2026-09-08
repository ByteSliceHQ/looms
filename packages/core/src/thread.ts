import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { EventEnvelope } from './envelope'
import type { RuntimeEffect } from './effects'
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

export interface ThreadDefinition<S = JsonValue> {
  readonly kind: string
  readonly input?: StandardSchemaV1<JsonValue, JsonValue>
  initialState(ctx: StartContext): S
  reduce(state: S, event: EventEnvelope, ctx: ReduceContext): ReduceResult<S>
}

export function defineThread<S>(def: ThreadDefinition<S>): ThreadDefinition {
  // SAFETY: kind reducers own their state shape; the kernel stores it as JsonValue.
  return def as ThreadDefinition
}

export function isTerminalStatus(status: ThreadStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}
