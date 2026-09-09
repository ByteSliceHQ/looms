import type { JsonValue } from '@looms/core'
import { Schema } from 'effect'

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

export interface PendingEffectTool {
  toolCallId: string
  name: string
}

export interface AgentState {
  definitionName?: string
  lines: Message[]
  pendingToolCalls: ToolCall[]
  turn: number
  maxTurns: number
  pendingSteer: Message | null
  input: JsonValue
  output: JsonValue | null
  pendingEffectTools: { [causingSeq: string]: PendingEffectTool }
}
