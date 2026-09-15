import { Effect } from 'effect'

import type { EventInput } from './envelope'
import { validateInputEffect, type InferDefinedSchema, type SchemaInput } from './schema'
import type { JsonValue } from './types'

export type WaitOnEvent = {
  type: string | readonly string[]
  match?: JsonValue
}

export type WaitOnTimer = {
  timerAt: number
}

export type WaitCondition = WaitOnEvent | WaitOnTimer

export type SpawnEffect = {
  type: 'runtime.spawn'
  childThreadId: string
  kind: string
  definitionName: string
  input: JsonValue
}

export type WaitEffect = {
  type: 'runtime.wait'
  waitId: string
  on: WaitCondition
  tag?: JsonValue
}

export type EmitEffect = {
  type: 'runtime.emit'
  event: EventInput
}

export type CompleteEffect = {
  type: 'runtime.complete'
  output: JsonValue
}

export type FailEffect = {
  type: 'runtime.fail'
  error: string
}

export type CancelEffect = {
  type: 'runtime.cancel'
  threadId: string
}

export interface RetryPolicy {
  readonly maxAttempts: number
  readonly backoffMs?: number
  readonly maxBackoffMs?: number
}

export type InvokeEffect = {
  type: string
  input: JsonValue
  tag?: string
}

export type PrimitiveEffect =
  | SpawnEffect
  | WaitEffect
  | EmitEffect
  | CompleteEffect
  | FailEffect
  | CancelEffect

export type RuntimeEffect = PrimitiveEffect | InvokeEffect

export function isPrimitiveEffect(effect: RuntimeEffect): effect is PrimitiveEffect {
  switch (effect.type) {
    case 'runtime.spawn':
    case 'runtime.wait':
    case 'runtime.emit':
    case 'runtime.complete':
    case 'runtime.fail':
    case 'runtime.cancel':
      return true
    default:
      return false
  }
}

export function isWaitOnTimer(on: WaitCondition): on is WaitOnTimer {
  return 'timerAt' in on
}

export function isWaitOnEvent(on: WaitCondition): on is WaitOnEvent {
  return 'type' in on
}

export const WITHDRAWN_ERROR_PREFIX = 'withdrawn:'

export function withdrawnError(siblingEffectId: string): string {
  return `${WITHDRAWN_ERROR_PREFIX} sibling effect ${siblingEffectId} failed`
}

export function isWithdrawnError(error: string): boolean {
  return error.startsWith(WITHDRAWN_ERROR_PREFIX)
}

export interface EffectContext {
  readonly effectId: string
  readonly runId: string
  readonly threadId: string
  readonly causingEventId: string
  emit(event: EventInput): Promise<void>
}

export type EffectInputSchema = SchemaInput

export type EffectHandlerResult<R = never> =
  | ReadonlyArray<EventInput>
  | Promise<ReadonlyArray<EventInput>>
  | Effect.Effect<ReadonlyArray<EventInput>, Error, R>

export interface EffectDefinition<TInput = JsonValue, R = any> {
  readonly type: string
  readonly input?: SchemaInput
  readonly retry?: RetryPolicy
  execute(input: TInput, ctx: EffectContext): Effect.Effect<ReadonlyArray<EventInput>, Error, R>
}

function liftHandlerResult<R>(
  result: EffectHandlerResult<R>,
): Effect.Effect<ReadonlyArray<EventInput>, Error, R> {
  if (Effect.isEffect(result)) {
    return result
  }

  if (result instanceof Promise) {
    return Effect.tryPromise({
      try: () => result,
      catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
    })
  }

  return Effect.succeed(result)
}

/**
 * Define an effect handler. A run's actor cell executes each effect at most
 * once while it is alive. If the cell dies mid-execution, the replacement
 * actor may re-run the handler (at-least-once across failover). Keep handlers
 * idempotent when they have external side effects.
 */
export function defineEffect<
  TSchema = undefined,
  TInput = InferDefinedSchema<TSchema>,
  R = never,
>(def: {
  type: string
  input?: TSchema
  retry?: RetryPolicy
  execute: (input: TInput, ctx: EffectContext) => EffectHandlerResult<R>
}): EffectDefinition<TInput, R> {
  const schema = def.input
  // SAFETY: execute validates raw JsonValue against the optional schema before the typed handler.
  return {
    type: def.type,
    input: schema,
    retry: def.retry,
    execute: (raw: JsonValue, ctx) =>
      Effect.gen(function* () {
        const input = schema ? yield* validateInputEffect(schema, raw) : raw

        // SAFETY: input has been validated against schema or is unconstrained raw input
        return yield* liftHandlerResult(def.execute(input as TInput, ctx))
      }),
  } as EffectDefinition<TInput, R>
}

export function spawn(args: {
  childThreadId?: string
  kind: string
  definitionName: string
  input: JsonValue
}): SpawnEffect {
  const childThreadId = args.childThreadId ?? ''
  return {
    type: 'runtime.spawn',
    childThreadId,
    kind: args.kind,
    definitionName: args.definitionName,
    input: args.input,
  }
}

export function wait(args: { waitId: string; on: WaitCondition; tag?: JsonValue }): WaitEffect {
  const effect: WaitEffect = {
    type: 'runtime.wait',
    waitId: args.waitId,
    on: args.on,
  }

  if (args.tag !== undefined) {
    effect.tag = args.tag
  }

  return effect
}

export function emit(event: EventInput): EmitEffect {
  return { type: 'runtime.emit', event }
}

export function complete(output: JsonValue): CompleteEffect {
  return { type: 'runtime.complete', output }
}

export function fail(error: string): FailEffect {
  return { type: 'runtime.fail', error }
}

export function cancel(threadId: string): CancelEffect {
  return { type: 'runtime.cancel', threadId }
}

export function invoke(type: string, input: JsonValue, tag?: string): InvokeEffect {
  return tag !== undefined ? { type, input, tag } : { type, input }
}
