import { Schema } from 'effect'

import type { EventInput, JsonValue, RuntimeEffect } from '@looms/core'

export const ToolCallSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  arguments: Schema.Json,
})
export type ToolCall = Schema.Schema.Type<typeof ToolCallSchema>

export const MessageRoleSchema = Schema.Union([
  Schema.Literal('system'),
  Schema.Literal('user'),
  Schema.Literal('assistant'),
  Schema.Literal('tool'),
])
export type MessageRole = Schema.Schema.Type<typeof MessageRoleSchema>

export const MessageSchema = Schema.Struct({
  role: MessageRoleSchema,
  content: Schema.String,
  toolCallId: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
  toolCalls: Schema.optional(Schema.mutable(Schema.Array(ToolCallSchema))),
})
export type Message = Schema.Schema.Type<typeof MessageSchema>

export const ConversationSchema = Schema.Struct({
  lines: Schema.mutable(Schema.Array(MessageSchema)),
})
export type ConversationState = Schema.Schema.Type<typeof ConversationSchema>

export const TokenUsageSchema = Schema.Struct({
  input: Schema.Number,
  output: Schema.Number,
})
export type TokenUsage = Schema.Schema.Type<typeof TokenUsageSchema>

export const ThreadStartedPayloadSchema = Schema.Struct({
  definitionName: Schema.optional(Schema.String),
  input: Schema.optional(Schema.Unknown),
})

export const AgentMessagePayloadSchema = Schema.Struct({
  message: MessageSchema,
})

export const AgentTurnStartedPayloadSchema = Schema.Struct({
  turn: Schema.optional(Schema.Number),
})

export const AgentToolCallRequestedPayloadSchema = Schema.Struct({
  toolCall: ToolCallSchema,
  turn: Schema.optional(Schema.Number),
})

export const AgentToolResultPayloadSchema = Schema.Struct({
  toolCallId: Schema.String,
  name: Schema.optional(Schema.String),
  result: Schema.optional(Schema.Unknown),
  error: Schema.optional(Schema.NullOr(Schema.String)),
})

export const AgentSteeredPayloadSchema = Schema.Struct({
  message: MessageSchema,
  interrupt: Schema.optional(Schema.Boolean),
})

export const AgentSpawnRequestedPayloadSchema = Schema.Struct({
  childThreadId: Schema.String,
  kind: Schema.String,
  definitionName: Schema.String,
  toolCallId: Schema.String,
  input: Schema.optional(Schema.Unknown),
})

export const AgentEffectsRequestedPayloadSchema = Schema.Struct({
  toolCallId: Schema.String,
  effects: Schema.optional(Schema.Array(Schema.Unknown)),
  waitOn: Schema.optional(
    Schema.Struct({
      type: Schema.Union([Schema.String, Schema.Array(Schema.String)]),
      match: Schema.optional(Schema.Unknown),
    }),
  ),
})

export interface PendingEffectTool {
  toolCallId: string
  name: string
}

export interface AgentPendingSpawn {
  readonly childThreadId: string
  readonly kind: string
  readonly definitionName: string
  readonly toolCallId: string
  readonly input: JsonValue
}

export interface AgentPendingEffects {
  readonly toolCallId: string
  readonly effects: RuntimeEffect[]
  readonly waitOn?: { type: string | readonly string[]; match?: JsonValue }
}

export interface AgentPendingEmit {
  readonly id: string
  readonly event: EventInput
}

export interface AgentState {
  definitionName?: string
  lines: Message[]
  pendingToolCalls: ToolCall[]
  executingToolCalls: ToolCall[]
  pendingSpawns: AgentPendingSpawn[]
  pendingEffects: AgentPendingEffects[]
  pendingEmits: AgentPendingEmit[]
  needsLlmCall: boolean
  turn: number
  maxTurns: number
  pendingSteer: Message | null
  input: JsonValue
  output: JsonValue | null
  pendingEffectTools: { [causingSeq: string]: PendingEffectTool }
}

// SAFETY: AgentState is folded by reducers; Schema.Unknown is a typed placeholder, not a decoder.
export const AgentStateSchema = Schema.Unknown as Schema.Schema<AgentState>
