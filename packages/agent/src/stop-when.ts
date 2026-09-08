import type { Message, ToolCall } from './types'
import type { AgentTurnResult } from './definitions'

export interface StopWhenContext {
  readonly turn: number
  readonly maxTurns: number
  readonly messages: Message[]
  readonly toolCalls: ToolCall[]
  readonly result: AgentTurnResult
}

export type StopWhen = (ctx: StopWhenContext) => boolean

export function hasToolCall(name: string): StopWhen {
  return (ctx) => ctx.toolCalls.some((toolCall) => toolCall.name === name)
}

export function stepCountIs(n: number): StopWhen {
  return (ctx) => ctx.turn >= n
}
