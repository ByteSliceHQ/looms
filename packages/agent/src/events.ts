import { Effect, Schema } from 'effect'

import { DEFAULT_DEFINITION_VERSION, defineEventCatalog, RuntimeEffectSchema } from '@looms/core'

import { MessageSchema, TokenUsageSchema, ToolCallSchema } from './types'

export const AgentMessageReceivedPayloadSchema = Schema.Struct({
  message: MessageSchema,
})

export const AgentTurnStartedPayloadSchema = Schema.Struct({
  turn: Schema.Finite,
})

export const AgentTurnTextDeltaPayloadSchema = Schema.Struct({
  turn: Schema.Finite,
  delta: Schema.String,
})

export const AgentMessageEventPayloadSchema = Schema.Struct({
  turn: Schema.Finite,
  message: MessageSchema,
  usage: Schema.optional(TokenUsageSchema),
})

export const AgentToolCallRequestedPayloadSchema = Schema.Struct({
  turn: Schema.Finite,
  toolCall: ToolCallSchema,
})

export const AgentToolResultPayloadSchema = Schema.Struct({
  turn: Schema.Finite,
  toolCallId: Schema.String,
  name: Schema.String,
  result: Schema.NullOr(Schema.Json),
  error: Schema.NullOr(Schema.String),
})

export const AgentSteeredPayloadSchema = Schema.Struct({
  turn: Schema.Finite,
  messageId: Schema.optional(Schema.String),
  message: MessageSchema,
  interrupt: Schema.optional(Schema.Boolean),
})

export const AgentSessionDeliverySchema = Schema.Union([
  Schema.Literal('steer'),
  Schema.Literal('followUp'),
  Schema.Literal('nextTurn'),
])

export const AgentSessionMessageSubmittedPayloadSchema = Schema.Struct({
  messageId: Schema.String,
  text: Schema.String,
  delivery: Schema.optional(AgentSessionDeliverySchema),
  activeChildThreadId: Schema.optional(Schema.String),
})

export const AgentSessionSteerDeliveredPayloadSchema = Schema.Struct({
  messageId: Schema.String,
  activeMessageId: Schema.String,
})

export const AgentSessionTurnStartedPayloadSchema = Schema.Struct({
  messageId: Schema.String,
  childThreadId: Schema.String,
})

export const AgentSessionTurnClosedPayloadSchema = Schema.Struct({
  messageId: Schema.String,
  status: Schema.Union([
    Schema.Literal('completed'),
    Schema.Literal('failed'),
    Schema.Literal('cancelled'),
  ]),
  error: Schema.optional(Schema.String),
})

export const AgentSessionCancelRequestedPayloadSchema = Schema.Struct({})

export const AgentSpawnRequestedPayloadSchema = Schema.Struct({
  childThreadId: Schema.String,
  kind: Schema.String,
  definitionName: Schema.String,
  definitionVersion: Schema.String.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DEFINITION_VERSION)),
  ),
  toolCallId: Schema.String,
  input: Schema.Json,
})

export const AgentEffectsRequestedPayloadSchema = Schema.Struct({
  toolCallId: Schema.String,
  effects: Schema.Array(RuntimeEffectSchema),
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
  'session.message.submitted': AgentSessionMessageSubmittedPayloadSchema,
  'session.steer.delivered': AgentSessionSteerDeliveredPayloadSchema,
  'session.turn.started': AgentSessionTurnStartedPayloadSchema,
  'session.turn.closed': AgentSessionTurnClosedPayloadSchema,
  'session.cancel.requested': AgentSessionCancelRequestedPayloadSchema,
  'spawn.requested': AgentSpawnRequestedPayloadSchema,
  'effects.requested': AgentEffectsRequestedPayloadSchema,
})
