import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Schema } from 'effect'
import { Effect } from 'effect'
import type { EventInput } from './envelope'
import { validateInput } from './schema'
import type { JsonValue } from './types'

export type WaitOnEvent = {
  type: string
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

export type InvokeEffect = {
  type: string
  input: JsonValue
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

export interface EffectContext {
  readonly effectId: string
  readonly runId: string
  readonly threadId: string
  readonly causingEventId: string
  emit(event: EventInput): void
}

export type EffectInputSchema<TInput extends JsonValue> =
  | StandardSchemaV1<JsonValue, TInput>
  | StandardSchemaV1<unknown, TInput>
  | Schema.Schema<TInput>

export type EffectHandlerResult<R = never> =
  | ReadonlyArray<EventInput>
  | Promise<ReadonlyArray<EventInput>>
  | Effect.Effect<ReadonlyArray<EventInput>, Error, R>

export interface EffectDefinition<TInput extends JsonValue = JsonValue> {
  readonly type: string
  readonly input?: EffectInputSchema<TInput>
  execute(
    input: TInput,
    ctx: EffectContext,
  ): Effect.Effect<ReadonlyArray<EventInput>, Error>
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
 * Handlers may `yield*` host services. `createRuntime` provides each module's
 * `services` Layer before the effect is run, so those requirements are closed here.
 */
function closeHandlerRequirements<R>(
  effect: Effect.Effect<ReadonlyArray<EventInput>, Error, R>,
): Effect.Effect<ReadonlyArray<EventInput>, Error> {
  // SAFETY: createRuntime provides each module's `services` Layer before runPromise.
  return effect as Effect.Effect<ReadonlyArray<EventInput>, Error>
}

export function defineEffect<TInput extends JsonValue = JsonValue, R = never>(def: {
  type: string
  input?: EffectInputSchema<TInput>
  execute: (input: TInput, ctx: EffectContext) => EffectHandlerResult<R>
}): EffectDefinition<TInput> {
  return {
    type: def.type,
    input: def.input,
    execute: (raw, ctx) =>
      closeHandlerRequirements(
        Effect.gen(function* () {
          const input = def.input ? yield* Effect.tryPromise(() => validateInput(def.input, raw)) : raw
          return yield* liftHandlerResult(def.execute(input, ctx))
        }),
      ),
  }
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

export function invoke(type: string, input: JsonValue): InvokeEffect {
  return { type, input }
}
