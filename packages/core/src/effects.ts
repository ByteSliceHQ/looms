import { Data, Effect, Predicate, Schema, type Context } from 'effect'

import { EventInputSchema, type EventInput } from './envelope'
import { DEFAULT_DEFINITION_VERSION } from './module'
import {
  validateInputEffect,
  type InferDefinedSchema,
  type InvalidInputError,
  type SchemaInput,
} from './schema'
import { asJson, type JsonValue } from './types'

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
  definitionVersion: string
  input: JsonValue
}

export type WaitEffect = {
  type: 'runtime.wait'
  waitId: string
  on: WaitCondition
  tag?: JsonValue
}

export type EmitEffect<E extends EventInput = EventInput> = {
  type: 'runtime.emit'
  event: E
  /** Stable identity, so the emit survives reordering of the thread's effects. */
  tag?: string
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
  tag?: string
}

export interface RetryPolicy {
  readonly maxAttempts: number
  readonly backoffMs?: number
  readonly maxBackoffMs?: number
  readonly backoffMultiplier?: number
  readonly scheduleToStartTimeoutMs?: number
  readonly startToCloseTimeoutMs?: number
  readonly heartbeatTimeoutMs?: number
  readonly cancellationTimeoutMs?: number
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

export const WaitConditionSchema = Schema.Union([
  Schema.Struct({
    type: Schema.Union([Schema.String, Schema.Array(Schema.String)]),
    match: Schema.optional(Schema.Json),
  }),
  Schema.Struct({ timerAt: Schema.Finite }),
])

export const RuntimeEffectSchema = Schema.Union([
  Schema.Struct({
    type: Schema.Literal('runtime.spawn'),
    childThreadId: Schema.String,
    kind: Schema.String,
    definitionName: Schema.String,
    definitionVersion: Schema.String.pipe(
      Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DEFINITION_VERSION)),
    ),
    input: Schema.Json,
  }),
  Schema.Struct({
    type: Schema.Literal('runtime.wait'),
    waitId: Schema.String,
    on: WaitConditionSchema,
    tag: Schema.optional(Schema.Json),
  }),
  Schema.Struct({
    type: Schema.Literal('runtime.emit'),
    event: EventInputSchema,
    tag: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    type: Schema.Literal('runtime.complete'),
    output: Schema.Json,
  }),
  Schema.Struct({
    type: Schema.Literal('runtime.fail'),
    error: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal('runtime.cancel'),
    threadId: Schema.String,
    tag: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    type: Schema.String,
    input: Schema.Json,
    tag: Schema.optional(Schema.String),
  }),
])

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
  readonly signal: AbortSignal
  emit(event: EventInput): Promise<void>
}

export interface ScopedEffectContext<E extends EventInput = EventInput> {
  readonly effectId: string
  readonly runId: string
  readonly threadId: string
  readonly causingEventId: string
  readonly signal: AbortSignal
  emit(event: E): Promise<void>
}

export type EffectInputSchema = SchemaInput

export class EffectHandlerError extends Data.TaggedError('EffectHandlerError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'EffectHandlerError'
  }
}

export type EffectHandlerResult<
  R = never,
  E extends EventInput = EventInput,
  HandlerError = never,
> = ReadonlyArray<E> | Promise<ReadonlyArray<E>> | Effect.Effect<ReadonlyArray<E>, HandlerError, R>

declare const effectInputType: unique symbol

export type EffectExecution = 'local' | 'worker'

export interface EffectDefinition<
  TInput = JsonValue,
  R = Context.Service.Any,
  E extends EventInput = EventInput,
> {
  readonly type: string
  readonly input?: SchemaInput
  readonly retry?: RetryPolicy
  /** Forces where the effect runs. When omitted, the runtime decides from `hasHandler` and the configured worker. */
  readonly execution?: EffectExecution
  /** Whether `execute` runs a user handler. Without one, the effect can only complete through a worker. */
  readonly hasHandler: boolean
  readonly [effectInputType]?: (input: TInput) => TInput
  execute(
    input: JsonValue,
    ctx: EffectContext,
  ): Effect.Effect<ReadonlyArray<E>, InvalidInputError | EffectHandlerError, R>
}

function liftHandlerResult<R, E extends EventInput, HandlerError>(
  result: EffectHandlerResult<R, E, HandlerError>,
): Effect.Effect<ReadonlyArray<E>, EffectHandlerError, R> {
  if (Effect.isEffect(result)) {
    return result.pipe(Effect.mapError((cause) => new EffectHandlerError(cause)))
  }

  if (result instanceof Promise) {
    return Effect.tryPromise({
      try: () => result,
      catch: (cause) => new EffectHandlerError(cause),
    })
  }

  return Effect.succeed(result)
}

/**
 * Define an effect. With `execute`, a run's actor cell runs the handler at
 * most once while it is alive; if the cell dies mid-execution, the replacement
 * actor may re-run it (at-least-once across failover). Keep handlers
 * idempotent when they have external side effects.
 *
 * Omit `execute` to declare an effect that only an `EffectWorker` completes.
 */
export function defineEffect<
  TSchema extends SchemaInput,
  R = never,
  E extends EventInput = EventInput,
  HandlerError = never,
>(def: {
  type: string
  input: TSchema
  retry?: RetryPolicy
  execution?: EffectExecution
  execute?: (
    input: InferDefinedSchema<TSchema>,
    ctx: EffectContext,
  ) => EffectHandlerResult<R, E, HandlerError>
}): EffectDefinition<InferDefinedSchema<TSchema>, R, E>

export function defineEffect<
  R = never,
  E extends EventInput = EventInput,
  HandlerError = never,
>(def: {
  type: string
  input?: undefined
  retry?: RetryPolicy
  execution?: EffectExecution
  execute?: (input: JsonValue, ctx: EffectContext) => EffectHandlerResult<R, E, HandlerError>
}): EffectDefinition<JsonValue, R, E>

export function defineEffect<R, E extends EventInput, HandlerError>(def: {
  type: string
  input?: SchemaInput
  retry?: RetryPolicy
  execution?: EffectExecution
  execute?: (input: any, ctx: EffectContext) => EffectHandlerResult<R, E, HandlerError>
}): EffectDefinition<any, R, E> {
  const schema = def.input
  const handler = def.execute
  const noOutput: ReadonlyArray<E> = []

  return {
    type: def.type,
    input: schema,
    retry: def.retry,
    execution: def.execution,
    hasHandler: handler !== undefined,
    execute: (raw: JsonValue, ctx) =>
      Effect.gen(function* () {
        const input = schema ? yield* validateInputEffect(schema, raw) : raw

        return handler ? yield* liftHandlerResult(handler(input, ctx)) : noOutput
      }),
  }
}

export function spawn(args: {
  childThreadId?: string
  kind: string
  definitionName: string
  definitionVersion?: string
  input: JsonValue
}): SpawnEffect {
  const childThreadId = args.childThreadId ?? ''
  return {
    type: 'runtime.spawn',
    childThreadId,
    kind: args.kind,
    definitionName: args.definitionName,
    definitionVersion: args.definitionVersion ?? DEFAULT_DEFINITION_VERSION,
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

export interface WaitOutcome {
  readonly result: JsonValue | null
  readonly error: string | null
}

/**
 * Reads the outcome of a satisfied wait. The wait fails when the satisfying event's payload has an
 * `error`, or when the waiter put an `error` on the wait's tag (such as a timeout that loses a
 * race). Otherwise the result is the payload's `output`, else the whole payload.
 */
export function waitOutcome(
  satisfied: JsonValue | undefined,
  tag: JsonValue | undefined,
  fallback: JsonValue | null = null,
): WaitOutcome {
  const payload =
    Predicate.isObject(satisfied) && Predicate.isObject(satisfied.payload) ? satisfied.payload : {}

  const tagError = Predicate.isObject(tag) && Predicate.isString(tag.error) ? tag.error : null
  const error = Predicate.isString(payload.error) ? payload.error : tagError

  if (error !== null) {
    return { result: null, error }
  }

  const result = payload.output ?? (Predicate.isObject(satisfied) ? satisfied.payload : fallback)

  // SAFETY: wait results are persisted JSON event payloads.
  return { result: asJson(result) ?? null, error: null }
}

export function emit<E extends EventInput = EventInput>(event: E, tag?: string): EmitEffect<E> {
  return tag === undefined ? { type: 'runtime.emit', event } : { type: 'runtime.emit', event, tag }
}

export function complete(output: JsonValue): CompleteEffect {
  return { type: 'runtime.complete', output }
}

export function fail(error: string): FailEffect {
  return { type: 'runtime.fail', error }
}

export function cancel(threadId: string, tag?: string): CancelEffect {
  return tag === undefined
    ? { type: 'runtime.cancel', threadId }
    : { type: 'runtime.cancel', threadId, tag }
}

export function invoke<TInput>(
  definition: EffectDefinition<TInput, any, any>,
  input: TInput,
  tag?: string,
): InvokeEffect

export function invoke(type: string, input: JsonValue, tag?: string): InvokeEffect

export function invoke(
  typeOrDef: string | EffectDefinition<any, any, any>,
  input: JsonValue,
  tag?: string,
): InvokeEffect {
  const type = Predicate.isString(typeOrDef) ? typeOrDef : typeOrDef.type
  const jsonInput = asJson(input)

  return tag !== undefined ? { type, input: jsonInput, tag } : { type, input: jsonInput }
}
