import { Data, Effect, Predicate, Schema, type Context } from 'effect'

import { DEFAULT_DEFINITION_VERSION } from './definition-version'
import { EventInputSchema, type EventInput } from './envelope'
import type { RunAttributes, SecretContext } from './run-context'
import {
  validateInputEffect,
  type InferDefinedSchema,
  type InvalidInputError,
  type SchemaInput,
} from './schema'
import type { TraceContext } from './trace'
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

export type LaunchEffect = {
  type: 'runtime.launch'
  runId: string
  kind: string
  definitionName: string
  definitionVersion: string
  input: JsonValue
  close: 'terminate' | 'wait'
  tag?: string
}

export type CancelRunEffect = {
  type: 'runtime.cancelRun'
  runId: string
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
  /** Epoch milliseconds. The host waits until this instant before running the effect. */
  at?: number
}

export type PrimitiveEffect =
  | SpawnEffect
  | WaitEffect
  | EmitEffect
  | CompleteEffect
  | FailEffect
  | CancelEffect
  | LaunchEffect
  | CancelRunEffect

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
    type: Schema.Literal('runtime.launch'),
    runId: Schema.String,
    kind: Schema.String,
    definitionName: Schema.String,
    definitionVersion: Schema.String.pipe(
      Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DEFINITION_VERSION)),
    ),
    input: Schema.Json,
    close: Schema.Union([Schema.Literal('terminate'), Schema.Literal('wait')]).pipe(
      Schema.withDecodingDefaultKey(Effect.succeed('terminate' as const)),
    ),
    tag: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    type: Schema.Literal('runtime.cancelRun'),
    runId: Schema.String,
    tag: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    type: Schema.String,
    input: Schema.Json,
    tag: Schema.optional(Schema.String),
    at: Schema.optional(Schema.Finite),
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
    case 'runtime.launch':
    case 'runtime.cancelRun':
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

/** When a deferred invoke becomes runnable, or undefined for effects that run immediately. */
export function deferredUntil(effect: RuntimeEffect): number | undefined {
  if (isPrimitiveEffect(effect) || effect.at === undefined) {
    return undefined
  }

  return effect.at
}

export const WITHDRAWN_ERROR_PREFIX = 'withdrawn:'

export function withdrawnError(siblingEffectId: string): string {
  return `${WITHDRAWN_ERROR_PREFIX} sibling effect ${siblingEffectId} failed`
}

export function isWithdrawnError(error: string): boolean {
  return error.startsWith(WITHDRAWN_ERROR_PREFIX)
}

/** Shared identity and credentials for an effect attempt. */
export interface EffectContextBase {
  readonly effectId: string
  readonly runId: string
  readonly threadId: string
  readonly causingEventId: string
  readonly signal: AbortSignal
  /** Labels safe for every reader of the run. */
  readonly attributes: RunAttributes
  /**
   * Bearer material for this run. Never copy it into an emitted event.
   * On a durable worker transport this is loaded before the handler runs (same shape as local).
   */
  readonly secrets: SecretContext
  /** The W3C trace context of the caller that started the run, to parent spans the handler starts. */
  readonly trace: TraceContext | null
}

/**
 * Context for an effect that runs in the host actor cell (for example a Durable Object).
 * `emit` appends live so subscribers see events as they happen.
 */
export interface LocalEffectContext extends EffectContextBase {
  readonly placement: 'local'
  /** No-op locally; present so local handlers can call the same progress API as workers. */
  heartbeat(details?: JsonValue): Promise<void>
  /** Appended to the run log immediately. */
  emit(event: EventInput): Promise<void>
}

/**
 * Context for an effect that runs on an external effect worker (for example a Cloudflare Queue consumer).
 * `emit` is buffered until the attempt completes — not a live stream.
 */
export interface WorkerEffectContext extends EffectContextBase {
  readonly placement: 'worker'
  /** Extends the heartbeat deadline on the host. */
  heartbeat(details?: JsonValue): Promise<void>
  /** Buffered until `complete`; subscribers do not see the event until then. */
  emit(event: EventInput): Promise<void>
}

/** Either placement's context. Prefer {@link LocalEffectContext} or {@link WorkerEffectContext}. */
export type EffectContext = LocalEffectContext | WorkerEffectContext

export interface ScopedLocalEffectContext<E extends EventInput = EventInput> extends Omit<
  LocalEffectContext,
  'emit'
> {
  emit(event: E): Promise<void>
}

/** @deprecated Use {@link ScopedLocalEffectContext}. */
export type ScopedEffectContext<E extends EventInput = EventInput> = ScopedLocalEffectContext<E>

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

export interface EffectFailureOptions {
  readonly error: string
  /** Fail the attempt even when the retry policy has attempts remaining. */
  readonly nonRetryable?: boolean
  /** Wait at least this long before the next attempt. Does not shorten the policy backoff. */
  readonly retryAfterMs?: number
}

/** A handler's deliberate attempt failure, distinct from an unexpected thrown error. */
export class EffectFailure extends Data.TaggedError('EffectFailure')<{
  readonly error: string
  readonly nonRetryable: boolean
  readonly retryAfterMs?: number
}> {
  constructor(options: EffectFailureOptions) {
    const error = options.error
    const nonRetryable = options.nonRetryable === true

    if (options.retryAfterMs === undefined) {
      super({ error, nonRetryable })
    } else {
      super({ error, nonRetryable, retryAfterMs: options.retryAfterMs })
    }

    this.name = 'EffectFailure'
  }
}

/** Fail the current attempt. The retry policy decides whether another attempt is scheduled. */
export function failEffect(options: EffectFailureOptions): Effect.Effect<never, EffectFailure> {
  return Effect.fail(new EffectFailure(options))
}

/** Unwrap a handler failure, including one wrapped by `EffectHandlerError`. */
export function readEffectFailure(cause: unknown): EffectFailure | null {
  if (cause instanceof EffectFailure) {
    return cause
  }

  if (cause instanceof EffectHandlerError) {
    return readEffectFailure(cause.cause)
  }

  return null
}

export type EffectHandlerResult<
  R = never,
  E extends EventInput = EventInput,
  HandlerError = never,
> = ReadonlyArray<E> | Promise<ReadonlyArray<E>> | Effect.Effect<ReadonlyArray<E>, HandlerError, R>

declare const effectInputType: unique symbol

/** Where an effect attempt runs. Set by {@link defineEffect.local} / {@link defineEffect.worker}. */
export type EffectPlacement = 'local' | 'worker'

/** @deprecated Use {@link EffectPlacement}. */
export type EffectExecution = EffectPlacement

interface EffectDefinitionFields<TInput> {
  readonly type: string
  readonly input?: SchemaInput
  readonly retry?: RetryPolicy
  /**
   * The outcome follows from the input alone, like scheduling from state already folded. Forking
   * a failed run retries the effect that produced the failure, not a deterministic one passing it on.
   */
  readonly deterministic?: boolean
  readonly [effectInputType]?: (input: TInput) => TInput
}

/**
 * An effect that runs in the host actor cell. Requires `execute`. Live `emit` / local middleware apply.
 */
export interface LocalEffectDefinition<
  TInput = JsonValue,
  R = Context.Service.Any,
  E extends EventInput = EventInput,
> extends EffectDefinitionFields<TInput> {
  readonly placement: 'local'
  readonly hasHandler: true
  execute(
    input: JsonValue,
    ctx: LocalEffectContext,
  ): Effect.Effect<ReadonlyArray<E>, InvalidInputError | EffectHandlerError, R>
}

/**
 * An effect that only an external effect worker completes. Declare it with {@link defineEffect.worker}
 * and implement the handler via `workerHandlers` (or an equivalent consumer).
 */
export interface WorkerEffectDefinition<
  TInput = JsonValue,
  R = Context.Service.Any,
  E extends EventInput = EventInput,
> extends EffectDefinitionFields<TInput> {
  readonly placement: 'worker'
  readonly hasHandler: false
  /**
   * Never invoked by the host for worker placement. Kept so catalogs stay uniform; always yields `[]`.
   */
  execute(
    input: JsonValue,
    ctx: LocalEffectContext,
  ): Effect.Effect<ReadonlyArray<E>, InvalidInputError | EffectHandlerError, R>
}

export type EffectDefinition<
  TInput = JsonValue,
  R = Context.Service.Any,
  E extends EventInput = EventInput,
> = LocalEffectDefinition<TInput, R, E> | WorkerEffectDefinition<TInput, R, E>

export function isLocalEffectDefinition(
  definition: EffectDefinition,
): definition is LocalEffectDefinition {
  return definition.placement === 'local'
}

export function isWorkerEffectDefinition(
  definition: EffectDefinition,
): definition is WorkerEffectDefinition {
  return definition.placement === 'worker'
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

function invokeHandler<R, E extends EventInput, HandlerError>(
  handler: (input: JsonValue, ctx: LocalEffectContext) => EffectHandlerResult<R, E, HandlerError>,
  input: JsonValue,
  ctx: LocalEffectContext,
): Effect.Effect<ReadonlyArray<E>, EffectHandlerError, R> {
  try {
    return liftHandlerResult(handler(input, ctx))
  } catch (cause) {
    return Effect.fail(new EffectHandlerError(cause))
  }
}

function validateThen<R, E extends EventInput>(
  schema: SchemaInput | undefined,
  raw: JsonValue,
  run: (input: JsonValue) => Effect.Effect<ReadonlyArray<E>, EffectHandlerError, R>,
): Effect.Effect<ReadonlyArray<E>, InvalidInputError | EffectHandlerError, R> {
  return Effect.gen(function* () {
    const input = schema ? yield* validateInputEffect(schema, raw) : raw
    return yield* run(input)
  })
}

function defineLocalEffect<
  TSchema extends SchemaInput,
  R = never,
  E extends EventInput = EventInput,
  HandlerError = never,
>(def: {
  type: string
  input: TSchema
  retry?: RetryPolicy
  deterministic?: boolean
  execute: (
    input: InferDefinedSchema<TSchema>,
    ctx: LocalEffectContext,
  ) => EffectHandlerResult<R, E, HandlerError>
}): LocalEffectDefinition<InferDefinedSchema<TSchema>, R, E>

function defineLocalEffect<
  R = never,
  E extends EventInput = EventInput,
  HandlerError = never,
>(def: {
  type: string
  input?: undefined
  retry?: RetryPolicy
  deterministic?: boolean
  execute: (input: JsonValue, ctx: LocalEffectContext) => EffectHandlerResult<R, E, HandlerError>
}): LocalEffectDefinition<JsonValue, R, E>

function defineLocalEffect<R, E extends EventInput, HandlerError>(def: {
  type: string
  input?: SchemaInput
  retry?: RetryPolicy
  deterministic?: boolean
  execute: (input: any, ctx: LocalEffectContext) => EffectHandlerResult<R, E, HandlerError>
}): LocalEffectDefinition<any, R, E> {
  const schema = def.input
  const handler = def.execute

  return {
    type: def.type,
    input: schema,
    retry: def.retry,
    placement: 'local',
    hasHandler: true,
    deterministic: def.deterministic,
    execute: (raw, ctx) => validateThen(schema, raw, (input) => invokeHandler(handler, input, ctx)),
  }
}

function defineWorkerEffect<TSchema extends SchemaInput>(def: {
  type: string
  input: TSchema
  retry?: RetryPolicy
  deterministic?: boolean
}): WorkerEffectDefinition<InferDefinedSchema<TSchema>>

function defineWorkerEffect(def: {
  type: string
  input?: undefined
  retry?: RetryPolicy
  deterministic?: boolean
}): WorkerEffectDefinition

function defineWorkerEffect(def: {
  type: string
  input?: SchemaInput
  retry?: RetryPolicy
  deterministic?: boolean
}): WorkerEffectDefinition<any> {
  const schema = def.input
  const noOutput: ReadonlyArray<EventInput> = []

  return {
    type: def.type,
    input: schema,
    retry: def.retry,
    placement: 'worker',
    hasHandler: false,
    deterministic: def.deterministic,
    execute: (raw, _ctx) => validateThen(schema, raw, () => Effect.succeed(noOutput)),
  }
}

/**
 * Declare where an effect runs.
 *
 * - {@link defineEffect.local} — host actor cell; requires `execute`; live `emit`; local middleware.
 * - {@link defineEffect.worker} — external effect worker; implement with `workerHandlers`.
 */
export const defineEffect = {
  local: defineLocalEffect,
  worker: defineWorkerEffect,
} as const

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

export function launch(args: {
  runId: string
  kind: string
  definitionName: string
  definitionVersion?: string
  input: JsonValue
  close?: 'terminate' | 'wait'
  tag?: string
}): LaunchEffect {
  const effect: LaunchEffect = {
    type: 'runtime.launch',
    runId: args.runId,
    kind: args.kind,
    definitionName: args.definitionName,
    definitionVersion: args.definitionVersion ?? DEFAULT_DEFINITION_VERSION,
    input: args.input,
    close: args.close ?? 'terminate',
  }

  if (args.tag !== undefined) {
    effect.tag = args.tag
  }

  return effect
}

export function cancelRun(runId: string, tag?: string): CancelRunEffect {
  return tag === undefined
    ? { type: 'runtime.cancelRun', runId }
    : { type: 'runtime.cancelRun', runId, tag }
}

export interface InvokeOptions {
  /** Wait until this epoch millisecond before the host runs the effect. */
  readonly at?: number
}

export function invoke<TInput>(
  definition: EffectDefinition<TInput, any, any>,
  input: TInput,
  tag?: string,
  options?: InvokeOptions,
): InvokeEffect

export function invoke(
  type: string,
  input: JsonValue,
  tag?: string,
  options?: InvokeOptions,
): InvokeEffect

export function invoke(
  typeOrDef: string | EffectDefinition<any, any, any>,
  input: JsonValue,
  tag?: string,
  options?: InvokeOptions,
): InvokeEffect {
  const type = Predicate.isString(typeOrDef) ? typeOrDef : typeOrDef.type
  const jsonInput = asJson(input)
  const at = options?.at

  if (at !== undefined && !Number.isFinite(at)) {
    throw new Error('invoke at must be a finite epoch timestamp')
  }

  const effect: InvokeEffect = { type, input: jsonInput }

  if (tag !== undefined) {
    effect.tag = tag
  }

  if (at !== undefined) {
    effect.at = at
  }

  return effect
}
