import type { Layer } from 'effect'

import type { EventCatalog, EventInputOf, EventsOfCatalog, InferPayload } from './catalog'
import type { EventsOf, ProtocolEvents } from './compose'
import {
  emit,
  defineEffect,
  type EffectDefinition,
  type EffectHandlerResult,
  type EmitEffect,
  type RetryPolicy,
  type RuntimeEffect,
  type ScopedEffectContext,
} from './effects'
import type { EventEnvelope, EventInput } from './envelope'
import {
  defineRuntimeModule,
  type AnyRuntimeModule,
  type EffectMiddleware,
  type ModuleServicesContext,
  type RuntimeModule,
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
  ? { readonly services?: (ctx: ModuleServicesContext) => Layer.Layer<any> }
  : { readonly services: (ctx: ModuleServicesContext) => Layer.Layer<TR> }

export interface ModuleScope<
  TNamespace extends string,
  U extends EventEnvelope<any, any>,
  TEvents extends EventCatalog | undefined,
> {
  readonly namespace: TNamespace
  readonly protocolVersion: string
  readonly events?: TEvents

  thread<TShape, TInputSchema extends SchemaInput | undefined = undefined>(def: {
    readonly kind: string
    readonly shape: TShape
    readonly input?: TInputSchema
    initialState(ctx: StartContext<InferDefinedSchema<TInputSchema>>): InferSchemaOutput<TShape>
    step(state: InferSchemaOutput<TShape>, event: U, ctx: ThreadContext): InferSchemaOutput<TShape>
    effects?(state: InferSchemaOutput<TShape>, ctx: ThreadContext): RuntimeEffect[]
  }): ThreadDefinition<InferSchemaOutput<TShape>>

  thread<S = JsonValue, TInputSchema extends SchemaInput | undefined = undefined>(def: {
    readonly kind: string
    readonly shape?: unknown
    readonly input?: TInputSchema
    initialState(ctx: StartContext<InferDefinedSchema<TInputSchema>>): S
    step(state: S, event: U, ctx: ThreadContext): S
    effects?(state: S, ctx: ThreadContext): RuntimeEffect[]
  }): ThreadDefinition<S>

  projection<TShape>(def: {
    readonly name: string
    readonly shape: TShape
    readonly initialState: InferSchemaOutput<TShape>
    reduce(state: InferSchemaOutput<TShape>, event: U): InferSchemaOutput<TShape>
  }): ProjectionDefinition<InferSchemaOutput<TShape>>

  projection<S>(def: {
    readonly name: string
    readonly shape?: unknown
    readonly initialState: S
    reduce(state: S, event: U): S
  }): ProjectionDefinition<S>

  effect<
    TSchema = undefined,
    TInput = InferDefinedSchema<TSchema>,
    R = never,
    E extends EventInputOf<U> = EventInputOf<U>,
  >(def: {
    type: `${TNamespace}.${string}`
    input?: TSchema
    retry?: RetryPolicy
    execute: (
      input: TInput,
      ctx: ScopedEffectContext<EventInputOf<U>>,
    ) => EffectHandlerResult<R, EventInputOf<U>>
  }): EffectDefinition<TInput, R, E>

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

  build<
    TEffects extends { readonly [key: string]: EffectDefinition<any, any, any> } = {},
    TThreads extends { readonly [key: string]: ThreadDefinition } = {},
    TProjections extends { readonly [key: string]: ProjectionDefinition } = {},
  >(
    config: {
      readonly threads?: TThreads
      readonly effects?: TEffects
      readonly projections?: TProjections
      readonly middleware?: readonly EffectMiddleware[]
    } & ModuleServicesConfig<EffectRequirementsOf<TEffects>>,
  ): RuntimeModule<
    TNamespace,
    TEvents extends EventCatalog ? TEvents : EventCatalog,
    TEffects,
    TThreads,
    TProjections,
    [EffectRequirementsOf<TEffects>] extends [never] ? any : EffectRequirementsOf<TEffects>
  >
}

export type EventOf<T> =
  T extends ModuleScope<any, infer U, any> ? U : T extends AnyRuntimeModule ? EventsOf<T> : never

export type ThreadStateOf<T> = T extends ThreadDefinition<infer S> ? S : never

function buildScopeInput(
  namespace: string,
  events: EventCatalog | undefined,
  key: string,
  payload: JsonValue,
  meta?: Omit<EventInput, 'type' | 'payload'>,
): EventInput {
  if (events) {
    // SAFETY: catalog input produces typed EventInput for the catalog entry.
    return events.input(key, payload, meta) as EventInput
  }

  return {
    ...meta,
    type: `${namespace}.${key}`,
    payload: asJson(payload),
  }
}

export function defineModule<
  TNamespace extends string,
  TEvents extends EventCatalog | undefined = undefined,
  TObserves extends readonly EventCatalog[] | undefined = undefined,
>(
  options: DefineModuleOptions<TNamespace, TEvents, TObserves>,
): ModuleScope<TNamespace, ScopeUniverse<TEvents, TObserves>, TEvents> {
  const { namespace, protocolVersion, events, observes, dependencies } = options

  const scope: ModuleScope<TNamespace, ScopeUniverse<TEvents, TObserves>, TEvents> = {
    namespace,
    protocolVersion,
    events,

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
      return buildScopeInput(namespace, events, key, payload, meta)
    },

    emit(key: any, payload: any, meta?: any): any {
      return emit(buildScopeInput(namespace, events, key, payload, meta))
    },

    build(config: any): any {
      return defineRuntimeModule({
        namespace,
        protocolVersion,
        events,
        observes,
        dependencies,
        threads: config.threads,
        effects: config.effects,
        projections: config.projections,
        middleware: config.middleware,
        services: config.services,
      })
    },
  }

  return scope
}
