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

/**
 * A file that travels with a message: an image, a recording, a document. The event log holds
 * only this reference. The bytes stay wherever the application stored them, and the LLM adapter
 * reads them back by `id` (or from `url`) when it builds a model call.
 */
export const AttachmentSchema = Schema.Struct({
  /** The application's handle on the stored bytes. */
  id: Schema.String,
  /** IANA media type, e.g. `image/png`. */
  mediaType: Schema.String,
  name: Schema.optional(Schema.String),
  /** Size in bytes. */
  size: Schema.optional(Schema.Finite),
  /** Where a model provider can fetch the bytes itself, when the application has such a URL. */
  url: Schema.optional(Schema.String),
})
export type Attachment = Schema.Schema.Type<typeof AttachmentSchema>

export const MessageSchema = Schema.Struct({
  role: MessageRoleSchema,
  content: Schema.String,
  attachments: Schema.optional(Schema.Array(AttachmentSchema)),
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

export const TurnActivitySchema = Schema.Struct({
  rootThreadId: Schema.NullOr(Schema.String),
  active: Schema.Boolean,
})
export type TurnActivity = Schema.Schema.Type<typeof TurnActivitySchema>

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
  readonly depth?: number
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
  depth: number
  structuredOutput?: JsonValue | null
  alreadyCompactedTurns?: number[]
  pendingSteer: Message | null
  input: JsonValue
  output: JsonValue | null
  pendingEffectTools: { [causingSeq: string]: PendingEffectTool }
  consumedSteerMessageIds: string[]
  /**
   * Children of an abandoned turn that still need cancelling, cleared when the next turn starts.
   * Optional so snapshots taken before turns could be abandoned still fold.
   */
  abandonedChildThreadIds?: string[]
  /**
   * Set when a steer arrived during the LLM call. Honored by `agent.turn.settled` after the
   * rest of the turn's events so we do not schedule the next call before `agent.message`.
   */
  deferWake?: boolean
  /**
   * User/system lines that arrived after the LLM call began. Re-attached after compaction so a
   * mid-call steer is not lost when `lines` are replaced.
   */
  midCallMessages?: Message[]
  /**
   * Value of `turn` when the latest user message arrived. A conversational agent counts
   * `maxTurns` from here, so the limit bounds one message and not the whole conversation.
   * Optional so snapshots taken before the count was per message still fold.
   */
  turnsBeforeMessage?: number
}

export type AgentMessageDelivery = 'steer' | 'followUp' | 'nextTurn'
export type AgentSessionTurnStatus = 'completed' | 'failed' | 'cancelled'

export interface AgentSessionMessage {
  readonly messageId: string
  readonly text: string
  readonly attachments?: readonly Attachment[]
  readonly delivery?: AgentMessageDelivery
  readonly steeredIntoMessageId?: string
}

export interface AgentSessionActiveTurn {
  readonly messageId: string
  readonly childThreadId: string
  readonly text: string
  readonly attachments?: readonly Attachment[]
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

/** A user line, carrying `attachments` only when there are some. */
export function userLine(content: string, attachments?: readonly Attachment[]): Message {
  return attachments && attachments.length > 0
    ? { role: 'user', content, attachments }
    : { role: 'user', content }
}

const isAttachment = Schema.is(AttachmentSchema)

/** The attachments in untyped JSON, dropping anything that is not one. */
export function attachmentsFrom(value: JsonValue | undefined): Attachment[] {
  return Array.isArray(value) ? value.filter((item) => isAttachment(item)) : []
}

/** `{ attachments }` when `value` holds any, for spreading into a record that omits empty lists. */
export function attachmentsField(value: JsonValue | undefined): { attachments?: Attachment[] } {
  const attachments = attachmentsFrom(value)

  return attachments.length > 0 ? { attachments } : {}
}
