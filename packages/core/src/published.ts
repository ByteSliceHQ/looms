import { Schema } from 'effect'

import { JsonValueSchema } from './envelope'
import type { RegisteredDefinition } from './module'
import { jsonSchemaOfInput } from './schema'
import { RunStateSchema, type RunState } from './state'

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

/** A run as `GET /runs/summaries` lists it. */
export const RunSummarySchema = Schema.Struct({
  runId: Schema.String,
  status: RunStateSchema.fields.status,
  kind: Schema.NullOr(Schema.String),
  definitionName: Schema.NullOr(Schema.String),
})

export type RunSummary = Schema.Schema.Type<typeof RunSummarySchema>

export function summarizeRun(state: RunState): RunSummary {
  return {
    runId: state.runId,
    status: state.status,
    kind: state.startIdentity?.kind ?? null,
    definitionName: state.startIdentity?.definitionName ?? null,
  }
}

export const RunSummariesSchema = Schema.Struct({
  runs: Schema.Array(RunSummarySchema),
})
