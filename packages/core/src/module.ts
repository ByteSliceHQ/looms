import type { Context, Effect, Layer } from 'effect'

import type { EventCatalog } from './catalog'
import type { EffectContext, EffectDefinition, RuntimeEffect } from './effects'
import type { EventInput } from './envelope'
import type { ProjectionDefinition } from './projection'
import type { InferDefinedSchema, SchemaInput } from './schema'
import type { ThreadDefinition } from './thread'
import type { JsonValue } from './types'

export type NextEffectHandler = (
  effect: RuntimeEffect,
  ctx: EffectContext,
) => Effect.Effect<ReadonlyArray<EventInput>, Error>

export type EffectMiddleware = (
  effect: RuntimeEffect,
  ctx: EffectContext,
  next: NextEffectHandler,
) => Effect.Effect<ReadonlyArray<EventInput>, Error>

/**
 * Names the threads whose in-process effects an admitted signal event interrupts, so a running
 * effect (such as a model call) can stop early. Return an empty array when the event interrupts
 * nothing.
 */
export type SignalInterruptRule = (event: EventInput) => readonly string[]

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
}

export const DEFAULT_DEFINITION_VERSION = 'v1'

export function definitionKey(kind: string, name: string, version: string): string {
  return `${kind}:${name}@${version}`
}

/** A definition registered on a host, keyed by `${kind}:${name}@${version}`. */
export interface RegisteredDefinition {
  readonly kind: string
  readonly name: string
  readonly version: string
  readonly input?: SchemaInput | undefined
  readonly value: DefinitionRef
}

/**
 * Input type accepted when starting a definition: inferred from the definition's
 * `input` Standard Schema / Effect Schema, or JsonValue when it has none.
 */
export type DefinitionInput<TDef> = TDef extends { readonly input?: infer S }
  ? InferDefinedSchema<S>
  : JsonValue

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
> {
  readonly namespace: TNamespace
  readonly protocolVersion: string
  readonly events?: TEvents
  readonly observes?: readonly EventCatalog[]
  readonly threads?: TThreads
  readonly effects?: TEffects
  readonly projections?: TProjections
  readonly definitions?: readonly DefinitionRef[]
  readonly dependencies?: readonly RuntimeModuleDependency[]
  readonly middleware?: readonly EffectMiddleware[]
  readonly interruptsOnSignal?: SignalInterruptRule
  /** Host-side services this module's effect handlers need (an LLM, a definition lookup, a DB pool). */
  readonly services?: () => Layer.Layer<TServices>
}

export function defineRuntimeModule<
  TNamespace extends string,
  TEvents extends EventCatalog,
  TEffects extends { readonly [key: string]: EffectDefinition },
  TThreads extends { readonly [key: string]: ThreadDefinition },
  TProjections extends { readonly [key: string]: ProjectionDefinition },
  TServices = Context.Service.Any,
>(
  module: RuntimeModule<TNamespace, TEvents, TEffects, TThreads, TProjections, TServices>,
): RuntimeModule<TNamespace, TEvents, TEffects, TThreads, TProjections, TServices> {
  return module
}

export type AnyRuntimeModule = RuntimeModule<
  string,
  EventCatalog,
  { readonly [name: string]: EffectDefinition<any, any, any> },
  { readonly [kind: string]: ThreadDefinition },
  { readonly [name: string]: ProjectionDefinition }
>
