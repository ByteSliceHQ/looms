import { Effect, Schema } from 'effect'

import {
  DEFAULT_DEFINITION_VERSION,
  type EventInput,
  type JsonValue,
  type RuntimeEffect,
} from '@looms/core'

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
  input: Schema.Finite,
  output: Schema.Finite,
})
export type TokenUsage = Schema.Schema.Type<typeof TokenUsageSchema>

export const ThreadStartedPayloadSchema = Schema.Struct({
  definitionName: Schema.optional(Schema.String),
  definitionVersion: Schema.String.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DEFINITION_VERSION)),
  ),
  input: Schema.optional(Schema.Unknown),
})

export interface PendingEffectTool {
  toolCallId: string
  name: string
}

export interface AgentPendingSpawn {
  readonly childThreadId: string
  readonly kind: string
  readonly definitionName: string
  readonly definitionVersion: string
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
  definitionVersion?: string
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
  consumedSteerMessageIds: string[]
}

export type AgentMessageDelivery = 'steer' | 'followUp' | 'nextTurn'
export type AgentSessionTurnStatus = 'completed' | 'failed' | 'cancelled'

export interface AgentSessionMessage {
  readonly messageId: string
  readonly text: string
  readonly delivery?: AgentMessageDelivery
  readonly steeredIntoMessageId?: string
}

export interface AgentSessionActiveTurn {
  readonly messageId: string
  readonly childThreadId: string
  readonly text: string
}

export interface AgentSessionClosure {
  readonly messageId: string
  readonly status: AgentSessionTurnStatus
  readonly error?: string
}

export interface AgentSessionState {
  readonly definitionName: string
  readonly definitionVersion: string
  readonly pendingMessages: AgentSessionMessage[]
  readonly nextTurnMessages: AgentSessionMessage[]
  readonly processedMessageIds: string[]
  readonly activeTurn: AgentSessionActiveTurn | null
  readonly pendingSteerDeliveries: AgentSessionMessage[]
  readonly pendingClosures: AgentSessionClosure[]
  readonly lastSequence: number
  readonly idleTimeoutMs: number
  readonly idleDeadlineAt: number | null
  readonly parked: boolean
  readonly cancelling: boolean
}

export interface AgentSessionSnapshot {
  readonly activeTurnId: string | null
  readonly activeChildThreadId: string | null
  readonly pendingMessageCount: number
  readonly nextTurnHeldCount: number
  readonly processedMessageIds: readonly string[]
  readonly lastSequence: number
  readonly parked: boolean
}
