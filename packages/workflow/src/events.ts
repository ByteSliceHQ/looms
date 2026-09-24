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

export const WorkflowNodeSkippedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
  reason: Schema.String,
})

export const WorkflowSpawnRequestedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
  childThreadId: Schema.String,
  kind: Schema.String,
  definitionName: Schema.String,
  definitionVersion: Schema.String.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DEFINITION_VERSION)),
  ),
  input: Schema.Json,
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
  'sleep.requested': WorkflowSleepRequestedPayloadSchema,
  'effects.requested': WorkflowEffectsRequestedPayloadSchema,
})
