import { Effect, Schema } from 'effect'

import { DEFAULT_DEFINITION_VERSION, defineEventCatalog, RuntimeEffectSchema } from '@looms/core'

export const WorkflowNodeStartedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
})

export const WorkflowNodeFinishedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
  result: Schema.NullOr(Schema.Json),
  error: Schema.NullOr(Schema.String),
  branch: Schema.optional(Schema.String),
})

export const WorkflowSkipCauseSchema = Schema.Union([
  Schema.Literal('inactive'),
  Schema.Literal('policy'),
])

export const WorkflowNodeSkippedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
  reason: Schema.String,
  cause: WorkflowSkipCauseSchema.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed('inactive' as const)),
  ),
})

const attempt = Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(1)))

const definitionVersion = Schema.String.pipe(
  Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DEFINITION_VERSION)),
)

export const WorkflowSpawnRequestedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
  attempt,
  childThreadId: Schema.String,
  kind: Schema.String,
  definitionName: Schema.String,
  definitionVersion,
  input: Schema.Json,
  /** Set for `loop` iterations: the node re-runs after this child instead of finishing. */
  loopIndex: Schema.NullOr(Schema.Finite).pipe(Schema.withDecodingDefaultKey(Effect.succeed(null))),
})

export const WorkflowMapRequestedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
  attempt,
  kind: Schema.String,
  definitionName: Schema.String,
  definitionVersion,
  items: Schema.Array(Schema.Json),
  concurrency: Schema.Finite,
  limitBytes: Schema.Finite,
})

export const WorkflowSleepRequestedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
  waitId: Schema.String,
  wakeAt: Schema.Finite,
})

export const WorkflowEffectsRequestedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
  effects: Schema.Array(RuntimeEffectSchema),
})

export const workflowCatalog = defineEventCatalog('workflow', {
  'node.started': WorkflowNodeStartedPayloadSchema,
  'node.finished': WorkflowNodeFinishedPayloadSchema,
  'node.skipped': WorkflowNodeSkippedPayloadSchema,
  'spawn.requested': WorkflowSpawnRequestedPayloadSchema,
  'map.requested': WorkflowMapRequestedPayloadSchema,
  'sleep.requested': WorkflowSleepRequestedPayloadSchema,
  'effects.requested': WorkflowEffectsRequestedPayloadSchema,
})
