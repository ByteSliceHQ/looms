import { Effect, type Context, type Layer } from 'effect'

import type { EventCatalog } from './catalog'
import type { DefinitionResolver } from './definition-resolver'
import {
  isPrimitiveEffect,
  type EffectDefinition,
  type LocalEffectContext,
  type LocalEffectDefinition,
  type RuntimeEffect,
} from './effects'
import type { EventInput } from './envelope'
import type { ProjectionDefinition } from './projection'
import type { RunAttributes, SecretContext } from './run-context'
import {
  validateInputEffect,
  type InferDefinedSchema,
  type InvalidInputError,
  type SchemaInput,
} from './schema'
import type { AnySignalDefinition } from './signals'
import type { ThreadDefinition } from './thread'
import type { TraceContext } from './trace'
import type { JsonValue } from './types'

export { DEFAULT_DEFINITION_VERSION, definitionKey } from './definition-version'

export type NextEffectHandler = (
  effect: RuntimeEffect,
  ctx: LocalEffectContext,
) => Effect.Effect<ReadonlyArray<EventInput>, Error>

export type EffectMiddleware = (
  effect: RuntimeEffect,
  ctx: LocalEffectContext,
  next: NextEffectHandler,
) => Effect.Effect<ReadonlyArray<EventInput>, Error>

/** Continues the middleware chain for the effect `onEffect` already matched. */
export type OnEffectNext = () => Effect.Effect<ReadonlyArray<EventInput>, Error>

/**
 * Middleware that runs only for one **local** effect definition. The handler receives the effect's
 * decoded input type and must call `next()` to continue (or `failEffect` to reject the attempt).
 *
 * Middleware wraps local (in-process) effect dispatch only. Worker-placed effects never see it —
 * pass a {@link LocalEffectDefinition} so that is a type error rather than a silent no-op.
 * Prefer {@link EffectAdmission} / {@link onAdmit} for gates that must apply on both paths.
 *
 * `R` and `E` are inferred from the definition and otherwise unused, so an effect that requires
 * host services (`agent.callLLM` needs the LLM and the agent definitions) can be wrapped directly.
 */
export function onEffect<TInput, R = never, E extends EventInput = EventInput>(
  definition: LocalEffectDefinition<TInput, R, E>,
  handler: (
    input: TInput,
    ctx: LocalEffectContext,
    next: OnEffectNext,
  ) => Effect.Effect<ReadonlyArray<EventInput>, Error>,
): EffectMiddleware {
  return (effect, ctx, next) => {
    if (isPrimitiveEffect(effect) || effect.type !== definition.type) {
      return next(effect, ctx)
    }

    return decodeEffectInput(definition, effect.input).pipe(
      Effect.flatMap((input) => handler(input, ctx, () => next(effect, ctx))),
    )
  }
}

function decodeEffectInput<TInput, R, E extends EventInput>(
  definition: EffectDefinition<TInput, R, E>,
  raw: JsonValue,
): Effect.Effect<TInput, InvalidInputError> {
  return validateInputEffect(definition.input, raw).pipe(
    // SAFETY: decoded with the definition's own schema, whose output is the phantom TInput.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    Effect.map((input) => input as TInput),
  )
}

/**
 * Identity of an effect attempt before it runs locally or is dispatched to a worker.
 * Admission hooks see this on both paths; they cannot call `emit` or `heartbeat`.
 */
export interface EffectAdmissionContext {
  readonly effectId: string
  readonly runId: string
  readonly threadId: string
  readonly causingEventId: string
  readonly attributes: RunAttributes
  readonly secrets: SecretContext
  readonly trace: TraceContext | null
}

/**
 * Runs in the host before a local attempt starts and before a worker attempt is queued.
 * Fail with `failEffect` to reject the attempt under the retry policy on either path.
 */
export type EffectAdmission = (
  effect: RuntimeEffect,
  ctx: EffectAdmissionContext,
) => Effect.Effect<void, Error>

/**
 * Admission that runs only for one effect definition (local or worker). Prefer this over
 * middleware when the gate must apply to worker-placed effects as well as local ones.
 */
export function onAdmit<TInput, R = never, E extends EventInput = EventInput>(
  definition: EffectDefinition<TInput, R, E>,
  handler: (input: TInput, ctx: EffectAdmissionContext) => Effect.Effect<void, Error>,
): EffectAdmission {
  return (effect, ctx) => {
    if (isPrimitiveEffect(effect) || effect.type !== definition.type) {
      return Effect.void
    }

    return decodeEffectInput(definition, effect.input).pipe(
      Effect.flatMap((input) => handler(input, ctx)),
    )
  }
}

/**
 * Names the threads whose in-process effects an admitted signal event interrupts, so a running
 * effect (such as a model call) can stop early. The runtime also interrupts each named thread's
 * descendants. Return an empty array when the event interrupts nothing.
 */
export type SignalInterruptRule = (event: EventInput) => readonly string[]

/** Passed to a module once, before its services layer is constructed. */
export interface DefinitionHost {
  readonly definitionResolver: DefinitionResolver
}

export interface RuntimeModuleDependency {
  readonly namespace: string
  readonly protocolVersion?: string
}

/** Anything a host can start by `{ kind, name }`: an agent, a workflow, or your own kind. */
export interface DefinitionRef {
  readonly kind: string
  readonly name: string
  readonly version?: string
  readonly input?: SchemaInput | undefined
  readonly description?: string | undefined
}

/** A definition registered on a host, keyed by `${kind}:${name}@${version}`. */
export interface RegisteredDefinition {
  readonly kind: string
  readonly name: string
  readonly version: string
  readonly input?: SchemaInput | undefined
  readonly description?: string | undefined
  readonly value: DefinitionRef
}

/**
 * Input type accepted when starting a definition: inferred from the definition's
 * `input` Standard Schema / Effect Schema, or JsonValue when it has none.
 */
export type DefinitionInput<TDef> = TDef extends { readonly input?: infer S }
  ? InferDefinedSchema<S>
  : JsonValue

/**
 * A trace `moduleConformance` folds. Events are catalog inputs in log order. `projections` maps a
 * projection member key to the JSON state the fold must produce. The host does not read examples.
 */
export interface ModuleExample {
  readonly name: string
  readonly events: readonly EventInput[]
  readonly projections: { readonly [memberKey: string]: JsonValue }
}

export interface RuntimeModule<
  TNamespace extends string = string,
  TEvents extends EventCatalog = EventCatalog,
  TEffects extends { readonly [key: string]: EffectDefinition } = {
    readonly [key: string]: EffectDefinition
  },
  TThreads extends { readonly [key: string]: ThreadDefinition } = {
    readonly [key: string]: ThreadDefinition
  },
  TProjections extends { readonly [key: string]: ProjectionDefinition } = {
    readonly [key: string]: ProjectionDefinition
  },
  TServices = Context.Service.Any,
  TSignals = {},
  TSteps = {},
> {
  readonly namespace: TNamespace
  readonly protocolVersion: string
  /** Published on `GET /definitions` so a catalog can name the module. */
  readonly description?: string
  readonly events?: TEvents
  readonly observes?: readonly EventCatalog[]
  readonly threads?: TThreads
  readonly effects?: TEffects
  readonly projections?: TProjections
  /**
   * Schema-backed event builders for callers outside a run. Callers import them, and the host
   * publishes their input schemas and can run `build` for preview / named send over HTTP.
   */
  readonly signals?: TSignals
  /** Effect composers for threads and workflow nodes. The host does not run them. */
  readonly steps?: TSteps
  /** Sample traces. The host ignores them; conformance folds them. */
  readonly examples?: readonly ModuleExample[]
  readonly definitions?: readonly DefinitionRef[]
  readonly dependencies?: readonly RuntimeModuleDependency[]
  readonly middleware?: readonly EffectMiddleware[]
  /**
   * Gates that run in the host before every local attempt and before every worker dispatch.
   * Prefer this over middleware for credits, flags, and tenant checks that must cover worker effects.
   */
  readonly admission?: readonly EffectAdmission[]
  readonly interruptsOnSignal?: SignalInterruptRule
  /** Host-side services this module's effect handlers need (an LLM, a definition lookup, a DB pool). */
  readonly services?: () => Layer.Layer<TServices>
  /**
   * Receives the host's definition resolver before `services()` runs.
   * Modules that look definitions up during fold share one store with this resolver.
   */
  readonly bindHost?: (host: DefinitionHost) => void
}

export function defineRuntimeModule<
  TNamespace extends string,
  TEvents extends EventCatalog,
  TEffects extends { readonly [key: string]: EffectDefinition },
  TThreads extends { readonly [key: string]: ThreadDefinition },
  TProjections extends { readonly [key: string]: ProjectionDefinition },
  TServices = Context.Service.Any,
  TSignals = {},
  TSteps = {},
>(
  module: RuntimeModule<
    TNamespace,
    TEvents,
    TEffects,
    TThreads,
    TProjections,
    TServices,
    TSignals,
    TSteps
  >,
): RuntimeModule<
  TNamespace,
  TEvents,
  TEffects,
  TThreads,
  TProjections,
  TServices,
  TSignals,
  TSteps
> {
  return module
}

export type AnyRuntimeModule = RuntimeModule<
  string,
  EventCatalog,
  { readonly [name: string]: EffectDefinition<any, any, any> },
  { readonly [kind: string]: ThreadDefinition },
  { readonly [name: string]: ProjectionDefinition },
  Context.Service.Any,
  { readonly [name: string]: AnySignalDefinition },
  { readonly [name: string]: (...args: never[]) => readonly RuntimeEffect[] }
>
