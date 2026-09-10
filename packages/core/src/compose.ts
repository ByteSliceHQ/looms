import type { CatalogEvent, EventCatalog } from './catalog'
import type { EffectDefinition } from './effects'
import type { EventEnvelope } from './envelope'
import type { FoldRegistry } from './fold'
import type { AnyRuntimeModule, EffectMiddleware, RuntimeModule } from './module'
import type { ProjectionDefinition } from './projection'
import { protocolCatalog } from './protocol'
import type { ThreadDefinition } from './thread'

export class ModuleCompositionError extends Error {
  readonly _tag = 'ModuleCompositionError'
  constructor(text: string) {
    super(text)
    this.name = 'ModuleCompositionError'
  }
}

export interface ComposedRegistry extends FoldRegistry {
  readonly modules: readonly AnyRuntimeModule[]
  readonly effects: ReadonlyMap<string, EffectDefinition>
  readonly projections: ReadonlyMap<string, ProjectionDefinition>
  readonly catalogs: readonly EventCatalog[]
  readonly middleware: readonly EffectMiddleware[]
}

export function composeModules(modules: readonly AnyRuntimeModule[]): ComposedRegistry {
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

    if (module.events) {
      catalogs.push(module.events)
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

  return { modules, threads, effects, projections, catalogs, middleware }
}

export type ProtocolEvents = CatalogEvent<'runtime', typeof protocolCatalog.entries>

export type ModuleEvents<T> = T extends { readonly events: infer C }
  ? C extends EventCatalog<infer N, infer E>
    ? CatalogEvent<N, E>
    : never
  : never

export type EventsOf<T> = T extends { readonly modules: infer M }
  ? M extends readonly AnyRuntimeModule[]
    ? ProtocolEvents | ModuleEvents<M[number]>
    : T extends RuntimeModule
      ? ProtocolEvents | ModuleEvents<T>
      : EventEnvelope
  : T extends RuntimeModule
    ? ProtocolEvents | ModuleEvents<T>
    : T extends EventCatalog
      ? CatalogEvent<T['namespace'], T['entries']>
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
