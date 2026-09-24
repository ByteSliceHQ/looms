import type { Layer } from 'effect'

import {
  defineEventCatalog,
  type CatalogEntries,
  type EventCatalog,
  type EventInputOf,
  type EventsOfCatalog,
  type InferPayload,
} from './catalog'
import type { EventsOf, ProtocolEvents } from './compose'
import {
  emit,
  defineEffect,
  type EffectDefinition,
  type EffectExecution,
  type EffectHandlerResult,
  type EmitEffect,
  type RetryPolicy,
  type RuntimeEffect,
  type ScopedEffectContext,
} from './effects'
import type { EventEnvelope, EventInput } from './envelope'
import {
  type AnyRuntimeModule,
  type EffectMiddleware,
  type RuntimeModule,
  type DefinitionRef,
  type RuntimeModuleDependency,
} from './module'
import { defineProjection, type ProjectionDefinition } from './projection'
import type { InferDefinedSchema, InferSchemaOutput, SchemaInput } from './schema'
import {
  defineThread,
  type StartContext,
  type ThreadContext,
  type ThreadDefinition,
} from './thread'
import { asJson, type JsonValue } from './types'

export interface DefineModuleOptions<
  TNamespace extends string,
  TEvents extends EventCatalog | undefined = undefined,
  TObserves extends readonly EventCatalog[] | undefined = undefined,
> {
  readonly namespace: TNamespace
  readonly protocolVersion: string
  readonly events?: TEvents
  readonly observes?: TObserves
  readonly dependencies?: readonly RuntimeModuleDependency[]
}

export type ScopeUniverse<
  TEvents extends EventCatalog | undefined,
  TObserves extends readonly EventCatalog[] | undefined,
> =
  | ProtocolEvents
  | (TEvents extends EventCatalog ? EventsOfCatalog<TEvents> : never)
  | (TObserves extends readonly EventCatalog[] ? EventsOfCatalog<TObserves[number]> : never)

export type EffectRequirementsOf<TEffects> = TEffects extends {
  readonly [key: string]: EffectDefinition<any, any, any>
}
  ? {
      [K in keyof TEffects]: TEffects[K] extends EffectDefinition<any, infer R, any> ? R : never
    }[keyof TEffects]
  : never

export type ModuleServicesConfig<TR> = [TR] extends [never]
  ? { readonly services?: () => Layer.Layer<any> }
  : { readonly services: () => Layer.Layer<TR> }

export interface ModuleScope<
  TNamespace extends string,
  U extends EventEnvelope<any, any>,
  TEvents extends EventCatalog | undefined,
  TObserves extends readonly EventCatalog[] | undefined = readonly EventCatalog[] | undefined,
> {
  readonly namespace: TNamespace
  readonly protocolVersion: string
  readonly events?: TEvents
  readonly observes?: TObserves
  readonly dependencies?: readonly RuntimeModuleDependency[]

  thread<S = JsonValue, TInputSchema extends SchemaInput | undefined = undefined>(def: {
    readonly kind: string
    readonly shape?: undefined
    readonly input?: TInputSchema
    initialState(ctx: StartContext<InferDefinedSchema<TInputSchema>>): S
    step(state: S, event: U, ctx: ThreadContext): S
    effects?(state: S, ctx: ThreadContext): RuntimeEffect[]
  }): ThreadDefinition<S>

  thread<
    TShape extends SchemaInput,
    TInputSchema extends SchemaInput | undefined = undefined,
  >(def: {
    readonly kind: string
    readonly shape: TShape
    readonly input?: TInputSchema
    initialState(ctx: StartContext<InferDefinedSchema<TInputSchema>>): InferSchemaOutput<TShape>
    step(
      state: NoInfer<InferSchemaOutput<TShape>>,
      event: U,
      ctx: ThreadContext,
    ): InferSchemaOutput<TShape>
    effects?(state: NoInfer<InferSchemaOutput<TShape>>, ctx: ThreadContext): RuntimeEffect[]
  }): ThreadDefinition<InferSchemaOutput<TShape>>

  projection<S>(def: {
    readonly name: string
    readonly shape?: undefined
    readonly initialState: S
    reduce(state: S, event: U): S
  }): ProjectionDefinition<S>

  projection<TShape extends SchemaInput>(def: {
    readonly name: string
    readonly shape: TShape
    readonly initialState: InferSchemaOutput<TShape>
    reduce(state: NoInfer<InferSchemaOutput<TShape>>, event: U): InferSchemaOutput<TShape>
  }): ProjectionDefinition<InferSchemaOutput<TShape>>

  effect<
    TSchema extends SchemaInput | undefined = undefined,
    TInput = InferDefinedSchema<TSchema>,
    R = never,
    HandlerError = never,
  >(def: {
    type: `${TNamespace}.${string}`
    input?: TSchema
    retry?: RetryPolicy
    execution?: EffectExecution
    execute?: (
      input: TInput,
      ctx: ScopedEffectContext<EventInputOf<U>>,
    ) => EffectHandlerResult<R, EventInputOf<U>, HandlerError>
  }): NoInfer<EffectDefinition<TInput, R, EventInputOf<U>>>

  input<K extends keyof (TEvents extends EventCatalog<any, infer E> ? E : never) & string>(
    key: K,
    payload: InferPayload<(TEvents extends EventCatalog<any, infer E> ? E : never)[K]>,
    meta?: Omit<EventInput, 'type' | 'payload'>,
  ): Omit<EventInput, 'type' | 'payload'> & {
    readonly type: `${TNamespace}.${K}`
    readonly payload: InferPayload<(TEvents extends EventCatalog<any, infer E> ? E : never)[K]>
  }

  emit<K extends keyof (TEvents extends EventCatalog<any, infer E> ? E : never) & string>(
    key: K,
    payload: InferPayload<(TEvents extends EventCatalog<any, infer E> ? E : never)[K]>,
    meta?: Omit<EventInput, 'type' | 'payload'>,
  ): EmitEffect
}

export type EventOf<T> =
  T extends ModuleScope<any, infer U, any> ? U : T extends AnyRuntimeModule ? EventsOf<T> : never

export type ThreadStateOf<T> = T extends ThreadDefinition<infer S> ? S : never

function buildScopeInput(
  namespace: string,
  key: string,
  payload: JsonValue,
  meta?: Omit<EventInput, 'type' | 'payload'>,
): EventInput {
  return {
    ...meta,
    type: `${namespace}.${key}`,
    payload: asJson(payload),
  }
}

export function createModuleScope<
  TNamespace extends string,
  TEvents extends EventCatalog | undefined = undefined,
  TObserves extends readonly EventCatalog[] | undefined = undefined,
>(
  options: DefineModuleOptions<TNamespace, TEvents, TObserves>,
): ModuleScope<TNamespace, ScopeUniverse<TEvents, TObserves>, TEvents, TObserves> {
  const { namespace, protocolVersion, events, observes, dependencies } = options

  const scope: ModuleScope<TNamespace, ScopeUniverse<TEvents, TObserves>, TEvents, TObserves> = {
    namespace,
    protocolVersion,
    events,
    observes,
    dependencies,

    thread(def: any): any {
      return defineThread(def)
    },

    projection(def: any): any {
      return defineProjection(def)
    },

    effect(def: any): any {
      return defineEffect(def)
    },

    input(key: any, payload: any, meta?: any): any {
      return buildScopeInput(namespace, key, payload, meta)
    },

    emit(key: any, payload: any, meta?: any): any {
      return emit(buildScopeInput(namespace, key, payload, meta))
    },
  }

  return scope
}

/** A catalog may be supplied directly, or created from inline event schemas. */
export type ModuleCatalog<N extends string, E> = E extends EventCatalog
  ? E
  : E extends CatalogEntries
    ? EventCatalog<N, E>
    : undefined

function isEventCatalog(source: EventCatalog | CatalogEntries): source is EventCatalog {
  return 'namespace' in source && 'entries' in source
}

function isModuleScope(
  source:
    | DefineModuleOptions<string, EventCatalog | undefined>
    | ModuleScope<string, EventEnvelope, EventCatalog, readonly EventCatalog[]>,
): source is ModuleScope<string, EventEnvelope, EventCatalog> {
  return 'thread' in source && 'effect' in source
}

/** Construct a complete module. Only members returned by setup are installed. */
export function defineModule<
  const N extends string,
  E extends EventCatalog | CatalogEntries | undefined = undefined,
  O extends readonly EventCatalog[] | undefined = undefined,
  FX extends { readonly [key: string]: EffectDefinition<any, any, any> } = {},
  TH extends { readonly [key: string]: ThreadDefinition } = {},
  PR extends { readonly [key: string]: ProjectionDefinition } = {},
>(
  options: Omit<DefineModuleOptions<N, ModuleCatalog<N, E>, O>, 'events'> & { readonly events?: E },
  setup: (scope: ModuleScope<N, ScopeUniverse<ModuleCatalog<N, E>, O>, ModuleCatalog<N, E>, O>) => {
    readonly effects?: FX
    readonly threads?: TH
    readonly projections?: PR
    readonly definitions?: readonly DefinitionRef[]
    readonly middleware?: readonly EffectMiddleware[]
  } & ModuleServicesConfig<EffectRequirementsOf<FX>>,
): RuntimeModule<N, Extract<ModuleCatalog<N, E>, EventCatalog>, FX, TH, PR> & {
  readonly effects: FX
  readonly threads: TH
  readonly projections: PR
}

export function defineModule(options: any, setup: (scope: any) => any): any {
  const source = options.events

  const events = source
    ? isEventCatalog(source)
      ? source
      : defineEventCatalog(options.namespace, source)
    : undefined

  const scope = isModuleScope(options) ? options : createModuleScope({ ...options, events })

  const members = setup(scope)

  const module: any = {
    namespace: options.namespace,
    protocolVersion: options.protocolVersion,
    events,
    effects: members.effects ?? {},
    threads: members.threads ?? {},
    projections: members.projections ?? {},
  }

  if (options.observes) {
    module.observes = options.observes
  }

  if (options.dependencies) {
    module.dependencies = options.dependencies
  }

  if (members.definitions) {
    module.definitions = members.definitions
  }

  if (members.middleware) {
    module.middleware = members.middleware
  }

  if (members.services) {
    module.services = members.services
  }

  return module
}
