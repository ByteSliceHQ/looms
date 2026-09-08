import type { AgentTurnResult } from './definitions'
import type { Message, ToolCall } from './types'

export interface StopWhenContext {
  readonly turn: number
  readonly maxTurns: number
  readonly messages: Message[]
  readonly toolCalls: ToolCall[]
  readonly result: AgentTurnResult
}

export type StopWhen = (ctx: StopWhenContext) => boolean

/** Stop when the model requested a tool with this name (AI SDK `hasToolCall` equivalent). */
export function hasToolCall(name: string): StopWhen {
  return (ctx) => ctx.toolCalls.some((toolCall) => toolCall.name === name)
}

/** Stop when the current turn number is at least `n` (AI SDK `stepCountIs` equivalent). */
export function stepCountIs(n: number): StopWhen {
  return (ctx) => ctx.turn >= n
}
