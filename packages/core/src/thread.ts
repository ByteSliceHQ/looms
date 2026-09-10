import type { RuntimeEffect } from './effects'
import type { EventEnvelope } from './envelope'
import type { InferDefinedSchema, InferSchemaOutput, SchemaInput } from './schema'
import type { ThreadStatus, JsonValue } from './types'

export interface StartContext<TInput = JsonValue> {
  readonly runId: string
  readonly threadId: string
  readonly parentThreadId: string | null
  readonly definitionName: string
  readonly input: TInput
}

export interface ThreadContext {
  readonly runId: string
  readonly threadId: string
  readonly parentThreadId: string | null
}

export interface ThreadOutput {
  readonly effects?: RuntimeEffect[]
}

export interface ThreadDefinition<S = any> {
  readonly kind: string
  readonly shape?: unknown
  readonly input?: SchemaInput
  initialState(ctx: StartContext): S
  step(state: S, event: EventEnvelope, ctx: ThreadContext): S
  output(state: S, ctx: ThreadContext): ThreadOutput
}

export function defineThread<
  TShape,
  TInputSchema extends SchemaInput | undefined = undefined,
>(def: {
  readonly kind: string
  readonly shape: TShape
  readonly input?: TInputSchema
  initialState(ctx: StartContext<InferDefinedSchema<TInputSchema>>): InferSchemaOutput<TShape>
  step(
    state: InferSchemaOutput<TShape>,
    event: EventEnvelope,
    ctx: ThreadContext,
  ): InferSchemaOutput<TShape>
  output?(state: InferSchemaOutput<TShape>, ctx: ThreadContext): ThreadOutput
}): ThreadDefinition<InferSchemaOutput<TShape>>
export function defineThread<
  S = JsonValue,
  TInputSchema extends SchemaInput | undefined = undefined,
>(def: {
  readonly kind: string
  readonly shape?: unknown
  readonly input?: TInputSchema
  initialState(ctx: StartContext<InferDefinedSchema<TInputSchema>>): S
  step(state: S, event: EventEnvelope, ctx: ThreadContext): S
  output?(state: S, ctx: ThreadContext): ThreadOutput
}): ThreadDefinition<S>

export function defineThread(def: {
  readonly kind: string
  readonly shape?: unknown
  readonly input?: SchemaInput
  initialState(ctx: StartContext): any
  step(state: any, event: EventEnvelope, ctx: ThreadContext): any
  output?(state: any, ctx: ThreadContext): ThreadOutput
}): ThreadDefinition {
  return {
    kind: def.kind,
    shape: def.shape,
    input: def.input,
    initialState: (ctx) => def.initialState(ctx),
    step: (state, event, ctx) => def.step(state, event, ctx),
    output: def.output ? (state, ctx) => def.output!(state, ctx) : () => ({}),
  }
}

export function isTerminalStatus(status: ThreadStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}
