import { Effect, Schema } from 'effect'

import type { EffectPlacement, RetryPolicy } from './effects'
import { JsonValueSchema } from './envelope'
import type { RegisteredDefinition } from './module'
import { RunAttributesSchema } from './run-context'
import { jsonSchemaOfInput, type SchemaInput } from './schema'
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

export const DefinitionCatalogSchema = Schema.Struct({
  definitions: Schema.Array(PublishedDefinitionSchema),
  projections: Schema.Array(Schema.String),
})

export type DefinitionCatalog = Schema.Schema.Type<typeof DefinitionCatalogSchema>

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
