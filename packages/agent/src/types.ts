import type { JsonValue } from '@looms/core'

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  toolCallId?: string
  name?: string
  toolCalls?: ToolCall[]
  readonly [key: string]: JsonValue | ToolCall[] | undefined
}

export interface ToolCall {
  id: string
  name: string
  arguments: JsonValue
  readonly [key: string]: JsonValue | undefined
}

export interface TokenUsage {
  input: number
  output: number
}

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
