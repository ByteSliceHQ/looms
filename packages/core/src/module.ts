import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Layer } from 'effect'
import type { EventCatalog } from './catalog'
import type { EffectDefinition } from './effects'
import type { ProjectionDefinition } from './projection'
import type { ThreadRecord } from './state'
import type { ThreadDefinition } from './thread'
import type { JsonValue } from './types'

export interface RuntimeModuleDependency {
  readonly namespace: string
  readonly protocolVersion?: string
}

/** Anything a host can start by `{ kind, name }`: an agent, a workflow, or your own kind. */
export interface DefinitionRef {
  readonly kind: string
  readonly name: string
  readonly input?: StandardSchemaV1<unknown, unknown> | undefined
}

/** A definition registered on a host, keyed by `${kind}:${name}`. */
export interface RegisteredDefinition {
  readonly kind: string
  readonly name: string
  readonly input?: { readonly '~standard'?: unknown } | undefined
  readonly value: DefinitionRef
}

/**
 * Input type accepted when starting a definition: the schema's parsed type
 * (definitions declare `StandardSchemaV1<JsonValue, TInput>`), or JsonValue when it has none.
 */
export type DefinitionInput<TDef> = TDef extends { readonly input?: infer S }
  ? NonNullable<S> extends StandardSchemaV1<unknown, infer TParsed>
    ? TParsed
    : JsonValue
  : JsonValue

export interface ModuleServicesContext {
  readonly definitions: ReadonlyArray<RegisteredDefinition>
}

export interface RuntimeModule<
  TNamespace extends string = string,
  TEvents extends EventCatalog = EventCatalog,
  TEffects extends { readonly [key: string]: EffectDefinition } = { readonly [key: string]: EffectDefinition },
  TThreads extends { readonly [key: string]: ThreadDefinition } = {
    readonly [key: string]: ThreadDefinition
  },
  TProjections extends { readonly [key: string]: ProjectionDefinition } = {
    readonly [key: string]: ProjectionDefinition
  },
> {
  readonly namespace: TNamespace
  readonly protocolVersion: string
  readonly events?: TEvents
  readonly threads?: TThreads
  readonly effects?: TEffects
  readonly handlers?: { readonly [type: string]: EffectDefinition }
  readonly projections?: TProjections
  readonly dependencies?: readonly RuntimeModuleDependency[]
  /** Host-side services this module's effect handlers need (an LLM, a definition lookup, a DB pool). */
  readonly services?: (ctx: ModuleServicesContext) => Layer.Layer<never, never, never>
  /** Called with each thread's folded record before its effects are dispatched. */
  readonly bindThread?: (record: ThreadRecord) => void
}

export function defineRuntimeModule<
  TNamespace extends string,
  TEvents extends EventCatalog,
  TEffects extends { readonly [key: string]: EffectDefinition },
  TThreads extends { readonly [key: string]: ThreadDefinition },
  TProjections extends { readonly [key: string]: ProjectionDefinition },
>(
  module: RuntimeModule<TNamespace, TEvents, TEffects, TThreads, TProjections>,
): RuntimeModule<TNamespace, TEvents, TEffects, TThreads, TProjections> {
  return module
}

export type AnyRuntimeModule = RuntimeModule<
  string,
  EventCatalog,
  { readonly [name: string]: EffectDefinition },
  { readonly [kind: string]: ThreadDefinition },
  { readonly [name: string]: ProjectionDefinition }
>
