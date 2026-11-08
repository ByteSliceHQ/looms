import { Effect, Predicate, Schema } from 'effect'

import type { CatalogEntry } from './catalog'
import type { EffectPlacement, RetryPolicy } from './effects'
import { JsonValueSchema } from './envelope'
import type { AnyRuntimeModule, RegisteredDefinition } from './module'
import { RunAttributesSchema } from './run-context'
import { jsonSchemaOfInput, type SchemaInput } from './schema'
import { isSignalDefinition } from './signals'
import { RunStateSchema, type RunState } from './state'
import type { JsonValue } from './types'

/** A registered definition as `GET /definitions` publishes it. */
export const PublishedDefinitionSchema = Schema.Struct({
  kind: Schema.String,
  name: Schema.String,
  version: Schema.String,
  description: Schema.optional(Schema.String),
  /** JSON Schema derived from the definition's `input`. */
  inputSchema: Schema.optional(JsonValueSchema),
})

export type PublishedDefinition = Schema.Schema.Type<typeof PublishedDefinitionSchema>

/** A module as `GET /definitions` publishes it. */
export const PublishedModuleSchema = Schema.Struct({
  namespace: Schema.String,
  protocolVersion: Schema.String,
  description: Schema.optional(Schema.String),
})

export type PublishedModule = Schema.Schema.Type<typeof PublishedModuleSchema>

export const DefinitionCatalogSchema = Schema.Struct({
  definitions: Schema.Array(PublishedDefinitionSchema),
  projections: Schema.Array(Schema.String),
  modules: Schema.Array(PublishedModuleSchema).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed<readonly PublishedModule[]>([])),
  ),
})

export type DefinitionCatalog = Schema.Schema.Type<typeof DefinitionCatalogSchema>

/** Modules in registration order. */
export function publishModules(modules: readonly AnyRuntimeModule[]): readonly PublishedModule[] {
  return modules.map(({ namespace, protocolVersion, description }) => ({
    namespace,
    protocolVersion,
    ...(description ? { description } : undefined),
  }))
}

export function publishDefinition(definition: RegisteredDefinition): PublishedDefinition {
  return {
    kind: definition.kind,
    name: definition.name,
    version: definition.version,
    description: definition.description,
    inputSchema: jsonSchemaOfInput(definition.input),
  }
}

const PublishedRetryPolicySchema = Schema.Struct({
  maxAttempts: Schema.Finite,
  backoffMs: Schema.optional(Schema.Finite),
  maxBackoffMs: Schema.optional(Schema.Finite),
  backoffMultiplier: Schema.optional(Schema.Finite),
  scheduleToStartTimeoutMs: Schema.optional(Schema.Finite),
  startToCloseTimeoutMs: Schema.optional(Schema.Finite),
  heartbeatTimeoutMs: Schema.optional(Schema.Finite),
  cancellationTimeoutMs: Schema.optional(Schema.Finite),
})

/** A declared effect as `GET /definitions/effects` publishes it. */
export const PublishedEffectSchema = Schema.Struct({
  type: Schema.String,
  placement: Schema.Literals(['local', 'worker']),
  deterministic: Schema.optional(Schema.Boolean),
  retry: Schema.optional(PublishedRetryPolicySchema),
  /** JSON Schema derived from the effect's `input`. */
  inputSchema: Schema.optional(JsonValueSchema),
})

export type PublishedEffect = Schema.Schema.Type<typeof PublishedEffectSchema>

export const EffectCatalogSchema = Schema.Struct({
  effects: Schema.Array(PublishedEffectSchema),
})

export type EffectCatalog = Schema.Schema.Type<typeof EffectCatalogSchema>

interface PublishableEffect {
  readonly type: string
  readonly placement: EffectPlacement
  readonly deterministic?: boolean
  readonly retry?: RetryPolicy
  readonly input?: SchemaInput
}

interface PublishedEffectRecord {
  type: string
  placement: EffectPlacement
  deterministic?: boolean
  retry?: RetryPolicy
  inputSchema?: JsonValue
}

export function publishEffect(definition: PublishableEffect): PublishedEffect {
  const published: PublishedEffectRecord = {
    type: definition.type,
    placement: definition.placement,
  }

  if (definition.deterministic !== undefined) {
    published.deterministic = definition.deterministic
  }

  if (definition.retry !== undefined) {
    published.retry = definition.retry
  }

  const inputSchema = jsonSchemaOfInput(definition.input)

  if (inputSchema !== undefined) {
    published.inputSchema = inputSchema
  }

  return published
}

/** Declared effects, sorted by type so the catalog is stable. */
export function publishEffects(effects: Iterable<PublishableEffect>): readonly PublishedEffect[] {
  return [...effects]
    .map(publishEffect)
    .toSorted((left, right) => left.type.localeCompare(right.type))
}

/** A module signal as `GET /definitions/signals` publishes it. */
export const PublishedSignalSchema = Schema.Struct({
  namespace: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  /** JSON Schema derived from the signal's `input`. Omitted for no-arg signals. */
  inputSchema: Schema.optional(JsonValueSchema),
})

export type PublishedSignal = Schema.Schema.Type<typeof PublishedSignalSchema>

export const SignalCatalogSchema = Schema.Struct({
  signals: Schema.Array(PublishedSignalSchema),
})

export type SignalCatalog = Schema.Schema.Type<typeof SignalCatalogSchema>

interface PublishedSignalRecord {
  namespace: string
  name: string
  description?: string
  inputSchema?: JsonValue
}

export function publishSignal(
  namespace: string,
  name: string,
  definition: { readonly description?: string; readonly input?: SchemaInput },
): PublishedSignal {
  const published: PublishedSignalRecord = { namespace, name }

  if (definition.description !== undefined) {
    published.description = definition.description
  }

  const inputSchema = jsonSchemaOfInput(definition.input)

  if (inputSchema !== undefined) {
    published.inputSchema = inputSchema
  }

  return published
}

/** Declared signals across modules, sorted by namespace then name. */
export function publishSignals(modules: readonly AnyRuntimeModule[]): readonly PublishedSignal[] {
  const signals: PublishedSignal[] = []

  for (const module of modules) {
    for (const [name, candidate] of Object.entries(module.signals ?? {})) {
      if (!isSignalDefinition(candidate)) {
        continue
      }

      signals.push(publishSignal(module.namespace, name, candidate))
    }
  }

  return signals.toSorted(
    (left, right) =>
      left.namespace.localeCompare(right.namespace) || left.name.localeCompare(right.name),
  )
}

/** A catalog event as `GET /definitions/events` publishes it. */
export const PublishedEventSchema = Schema.Struct({
  type: Schema.String,
  namespace: Schema.String,
  /** JSON Schema for the event payload, when the catalog entry has a runtime schema. */
  payloadSchema: Schema.optional(JsonValueSchema),
})

export type PublishedEvent = Schema.Schema.Type<typeof PublishedEventSchema>

export const EventTypeCatalogSchema = Schema.Struct({
  events: Schema.Array(PublishedEventSchema),
})

export type EventTypeCatalog = Schema.Schema.Type<typeof EventTypeCatalogSchema>

function payloadSchemaOfEntry(entry: CatalogEntry): JsonValue | undefined {
  if (Predicate.isReadonlyObject(entry) && '~standard' in entry) {
    // SAFETY: CatalogEntry with ~standard is a Standard Schema; jsonSchemaOfInput expects SchemaInput.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return jsonSchemaOfInput(entry as SchemaInput)
  }

  if (Schema.isSchema(entry)) {
    // SAFETY: Schema.isSchema narrows CatalogEntry to an Effect Schema, which is a valid SchemaInput.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return jsonSchemaOfInput(entry as SchemaInput)
  }

  return undefined
}

interface PublishedEventRecord {
  type: string
  namespace: string
  payloadSchema?: JsonValue
}

/** Catalog events across modules, sorted by type. */
export function publishEvents(modules: readonly AnyRuntimeModule[]): readonly PublishedEvent[] {
  const events: PublishedEvent[] = []

  for (const module of modules) {
    const catalog = module.events

    if (!catalog) {
      continue
    }

    for (const [key, entry] of Object.entries(catalog.entries)) {
      const published: PublishedEventRecord = {
        type: `${catalog.namespace}.${key}`,
        namespace: catalog.namespace,
      }

      const payloadSchema = payloadSchemaOfEntry(entry)

      if (payloadSchema !== undefined) {
        published.payloadSchema = payloadSchema
      }

      events.push(published)
    }
  }

  return events.toSorted((left, right) => left.type.localeCompare(right.type))
}

/** A run as `GET /runs/summaries` lists it. */
export const RunSummarySchema = Schema.Struct({
  runId: Schema.String,
  status: RunStateSchema.fields.status,
  kind: Schema.NullOr(Schema.String),
  definitionName: Schema.NullOr(Schema.String),
  attributes: RunAttributesSchema.pipe(Schema.withDecodingDefaultKey(Effect.succeed({}))),
})

export type RunSummary = Schema.Schema.Type<typeof RunSummarySchema>

export function summarizeRun(state: RunState): RunSummary {
  return {
    runId: state.runId,
    status: state.status,
    kind: state.startIdentity?.kind ?? null,
    definitionName: state.startIdentity?.definitionName ?? null,
    attributes: state.attributes ?? {},
  }
}

export const RunSummariesSchema = Schema.Struct({
  runs: Schema.Array(RunSummarySchema),
})
