import type { AgentTurnResult } from './definitions'
import type { Message, ToolCall } from './types'

export interface StopWhenContext {
  /**
   * The model turn that just ran, counted the way `maxTurns` counts: from the start of the
   * thread, or from the latest user message for a conversational agent.
   */
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

/** Stop once `n` model turns have run. For a conversational agent that is `n` turns per user message. */
export function stepCountIs(n: number): StopWhen {
  return (ctx) => ctx.turn >= n
}
