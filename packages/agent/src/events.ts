import { Schema } from 'effect'

import { defineEventCatalog, type RuntimeEffect } from '@looms/core'

import { MessageSchema, TokenUsageSchema, ToolCallSchema } from './types'

export const AgentMessageReceivedPayloadSchema = Schema.Struct({
  message: MessageSchema,
})

export const AgentTurnStartedPayloadSchema = Schema.Struct({
  turn: Schema.Number,
})

export const AgentTurnTextDeltaPayloadSchema = Schema.Struct({
  turn: Schema.Number,
  delta: Schema.String,
})

export const AgentMessageEventPayloadSchema = Schema.Struct({
  turn: Schema.Number,
  message: MessageSchema,
  usage: Schema.optional(TokenUsageSchema),
})

export const AgentToolCallRequestedPayloadSchema = Schema.Struct({
  turn: Schema.Number,
  toolCall: ToolCallSchema,
})

export const AgentToolResultPayloadSchema = Schema.Struct({
  turn: Schema.Number,
  toolCallId: Schema.String,
  name: Schema.String,
  result: Schema.NullOr(Schema.Json),
  error: Schema.NullOr(Schema.String),
})

export const AgentSteeredPayloadSchema = Schema.Struct({
  turn: Schema.Number,
  message: MessageSchema,
  interrupt: Schema.optional(Schema.Boolean),
})

export const AgentSpawnRequestedPayloadSchema = Schema.Struct({
  childThreadId: Schema.String,
  kind: Schema.String,
  definitionName: Schema.String,
  toolCallId: Schema.String,
  input: Schema.Json,
})

export const AgentEffectsRequestedPayloadSchema = Schema.Struct({
  toolCallId: Schema.String,
  // SAFETY: RuntimeEffect represents serializable requested effect instructions.
  effects: Schema.Array(Schema.Unknown as Schema.Schema<RuntimeEffect>),
  waitOn: Schema.optional(
    Schema.Struct({
      type: Schema.Union([Schema.String, Schema.Array(Schema.String)]),
      match: Schema.optional(Schema.Json),
    }),
  ),
})

export const agentCatalog = defineEventCatalog('agent', {
  'message.received': AgentMessageReceivedPayloadSchema,
  'turn.started': AgentTurnStartedPayloadSchema,
  'turn.text_delta': AgentTurnTextDeltaPayloadSchema,
  message: AgentMessageEventPayloadSchema,
  'tool_call.requested': AgentToolCallRequestedPayloadSchema,
  'tool.result': AgentToolResultPayloadSchema,
  steered: AgentSteeredPayloadSchema,
  'spawn.requested': AgentSpawnRequestedPayloadSchema,
  'effects.requested': AgentEffectsRequestedPayloadSchema,
})
