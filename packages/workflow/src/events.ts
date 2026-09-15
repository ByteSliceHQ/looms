import { Schema } from 'effect'

import { defineEventCatalog, type RuntimeEffect } from '@looms/core'

export const WorkflowNodeStartedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
})

export const WorkflowNodeFinishedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
  result: Schema.NullOr(Schema.Json),
  error: Schema.NullOr(Schema.String),
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
  input: Schema.Json,
})

export const WorkflowSleepRequestedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
  waitId: Schema.String,
  wakeAt: Schema.Number,
})

export const WorkflowEffectsRequestedPayloadSchema = Schema.Struct({
  nodeId: Schema.String,
  // SAFETY: RuntimeEffect represents serializable requested effect instructions.
  effects: Schema.Array(Schema.Unknown as Schema.Schema<RuntimeEffect>),
})

export const workflowCatalog = defineEventCatalog('workflow', {
  'node.started': WorkflowNodeStartedPayloadSchema,
  'node.finished': WorkflowNodeFinishedPayloadSchema,
  'node.skipped': WorkflowNodeSkippedPayloadSchema,
  'spawn.requested': WorkflowSpawnRequestedPayloadSchema,
  'sleep.requested': WorkflowSleepRequestedPayloadSchema,
  'effects.requested': WorkflowEffectsRequestedPayloadSchema,
})
