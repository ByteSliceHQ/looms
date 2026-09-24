import { Data, Effect } from 'effect'

import type { CatalogEvent, EventCatalog } from './catalog'
import type { EffectDefinition } from './effects'
import type { EventEnvelope } from './envelope'
import type { FoldRegistry } from './fold'
import type {
  AnyRuntimeModule,
  EffectMiddleware,
  RuntimeModule,
  RegisteredDefinition,
} from './module'
import { DEFAULT_DEFINITION_VERSION, definitionKey } from './module'
import type { ProjectionDefinition } from './projection'
import { protocolCatalog } from './protocol'
import type { ThreadDefinition } from './thread'

export class ModuleCompositionError extends Data.TaggedError('ModuleCompositionError')<{
  readonly message: string
}> {
  constructor(text: string) {
    super({ message: text })
    this.name = 'ModuleCompositionError'
  }
}

export interface ComposedRegistry extends FoldRegistry {
  readonly definitions: readonly RegisteredDefinition[]
  readonly modules: readonly AnyRuntimeModule[]
  readonly effects: ReadonlyMap<string, EffectDefinition>
  readonly projections: ReadonlyMap<string, ProjectionDefinition>
  readonly catalogs: readonly EventCatalog[]
  readonly middleware: readonly EffectMiddleware[]
}

export function composeModules(modules: readonly AnyRuntimeModule[]): ComposedRegistry {
  const definitions: RegisteredDefinition[] = []
  const definitionKeys = new Set<string>()
  const namespaces = new Set<string>()
  const threads = new Map<string, ThreadDefinition>()
  const effects = new Map<string, EffectDefinition>()
  const projections = new Map<string, ProjectionDefinition>()
  const middleware: EffectMiddleware[] = []
  const catalogs: EventCatalog[] = [protocolCatalog]

  for (const module of modules) {
    if (namespaces.has(module.namespace)) {
      throw new ModuleCompositionError(`Duplicate module namespace: ${module.namespace}`)
    }

    namespaces.add(module.namespace)

    if (module.dependencies) {
      for (const dep of module.dependencies) {
        if (!namespaces.has(dep.namespace) && dep.namespace !== 'runtime') {
          const present = modules.some((item) => item.namespace === dep.namespace)

          if (!present) {
            throw new ModuleCompositionError(
              `Module ${module.namespace} depends on missing module ${dep.namespace}`,
            )
          }
        }
      }
    }

    if (module.events && !catalogs.some((c) => c.namespace === module.events!.namespace)) {
      catalogs.push(module.events)
    }

    if (module.observes) {
      for (const obs of module.observes) {
        if (!catalogs.some((c) => c.namespace === obs.namespace)) {
          catalogs.push(obs)
        }
      }
    }

    for (const definition of module.definitions ?? []) {
      const version = definition.version ?? DEFAULT_DEFINITION_VERSION
      const key = definitionKey(definition.kind, definition.name, version)

      if (definitionKeys.has(key)) {
        throw new ModuleCompositionError(`Duplicate definition: ${key}`)
      }

      if (!module.threads || !Object.hasOwn(module.threads, definition.kind)) {
        throw new ModuleCompositionError(
          `Module ${module.namespace} registers definition ${key} but does not implement thread kind ${definition.kind}`,
        )
      }

      definitionKeys.add(key)

      definitions.push({
        kind: definition.kind,
        name: definition.name,
        version,
        input: definition.input,
        value: definition,
      })
    }

    const moduleThreads = module.threads

    if (moduleThreads) {
      for (const [kind, definition] of Object.entries(moduleThreads)) {
        if (threads.has(kind)) {
          throw new ModuleCompositionError(`Duplicate thread kind: ${kind}`)
        }

        threads.set(kind, definition)
      }
    }

    if (module.effects) {
      for (const definition of Object.values(module.effects)) {
        if (effects.has(definition.type)) {
          throw new ModuleCompositionError(`Duplicate effect type: ${definition.type}`)
        }

        effects.set(definition.type, definition)
      }
    }

    if (module.middleware) {
      middleware.push(...module.middleware)
    }

    if (module.projections) {
      for (const definition of Object.values(module.projections)) {
        if (projections.has(definition.name)) {
          throw new ModuleCompositionError(`Duplicate projection: ${definition.name}`)
        }

        projections.set(definition.name, definition)
      }
    }
  }

  return { definitions, modules, threads, effects, projections, catalogs, middleware }
}

export function composeModulesEffect(
  modules: readonly AnyRuntimeModule[],
): Effect.Effect<ComposedRegistry, ModuleCompositionError> {
  return Effect.try({
    try: () => composeModules(modules),
    catch: (cause) =>
      cause instanceof ModuleCompositionError
        ? cause
        : new ModuleCompositionError(cause instanceof Error ? cause.message : String(cause)),
  })
}

export type ProtocolEvents = CatalogEvent<'runtime', typeof protocolCatalog.entries>

export type ModuleEvents<T> = T extends { readonly events?: infer C }
  ? C extends EventCatalog<infer N, infer E>
    ? CatalogEvent<N, E>
    : never
  : never

export type EventsOf<T> = T extends (...args: never[]) => infer R
  ? EventsOf<R>
  : T extends (...args: any[]) => infer R
    ? EventsOf<R>
    : T extends { readonly modules: infer M }
      ? EventsOf<M>
      : T extends readonly (infer Item)[]
        ? Item extends AnyRuntimeModule
          ? ProtocolEvents | ModuleEvents<Item>
          : Item extends EventCatalog<infer N, infer E>
            ? ProtocolEvents | CatalogEvent<N, E>
            : EventEnvelope
        : T extends RuntimeModule
          ? ProtocolEvents | ModuleEvents<T>
          : T extends EventCatalog<infer N, infer E>
            ? CatalogEvent<N, E>
            : EventEnvelope

export type EffectsOf<T> = T extends { readonly modules: infer M }
  ? M extends readonly AnyRuntimeModule[]
    ? ModuleEffects<M[number]>
    : string
  : T extends RuntimeModule
    ? ModuleEffects<T>
    : string

type ModuleEffects<T> = T extends { readonly effects: infer E }
  ? E extends { readonly [key: string]: EffectDefinition }
    ? E[keyof E]['type']
    : never
  : never

export type ThreadsOf<T> = T extends { readonly modules: infer M }
  ? M extends readonly AnyRuntimeModule[]
    ? ModuleKinds<M[number]>
    : string
  : T extends RuntimeModule
    ? ModuleKinds<T>
    : string

type ModuleKinds<T> = T extends { readonly threads: infer E }
  ? E extends { readonly [key: string]: ThreadDefinition }
    ? keyof E & string
    : never
  : never

export type ProjectionsOf<T> = T extends { readonly modules: infer M }
  ? M extends readonly AnyRuntimeModule[]
    ? ModuleProjectionNames<M[number]>
    : string
  : T extends RuntimeModule
    ? ModuleProjectionNames<T>
    : string

type ModuleProjectionNames<T> = T extends { readonly projections: infer P }
  ? P extends { readonly [key: string]: ProjectionDefinition }
    ? keyof P & string
    : never
  : never
