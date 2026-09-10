import { payload, defineEventCatalog, type JsonValue } from '@looms/core'

import type { Message, ToolCall, TokenUsage } from './types'

export const agentCatalog = defineEventCatalog('agent', {
  'message.received': payload<{ message: Message }>(),
  'turn.started': payload<{ turn: number }>(),
  'turn.text_delta': payload<{ turn: number; delta: string }>(),
  message: payload<{ turn: number; message: Message; usage?: TokenUsage }>(),
  'tool_call.requested': payload<{ turn: number; toolCall: ToolCall }>(),
  'tool.result': payload<{
    turn: number
    toolCallId: string
    name: string
    result: JsonValue
    error: string | null
  }>(),
  steered: payload<{ turn: number; message: Message; interrupt?: boolean }>(),
  'spawn.requested': payload<{
    childThreadId: string
    kind: string
    definitionName: string
    input: JsonValue
    toolCallId: string
  }>(),
  'effects.requested': payload<{
    toolCallId: string
    effects: JsonValue[]
    waitOn?: { type: string; match?: JsonValue }
  }>(),
})
