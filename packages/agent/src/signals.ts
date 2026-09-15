import type { EventInput } from '@looms/core'

import { agentModule } from './scope'

export interface AgentSignalOptions {
  /** Target thread. Defaults to the run's root thread when omitted. */
  readonly threadId?: string
}

/**
 * Build the `agent.message.received` event for a conversational agent.
 * Send it with `looms.signal(runId, [userMessage('Also greet Maya')])`.
 */
export function userMessage(content: string, options: AgentSignalOptions = {}): EventInput {
  return agentModule.input(
    'message.received',
    { message: { role: 'user', content } },
    { threadId: options.threadId },
  )
}

/**
 * Build the `agent.steered` event: inject a user message mid-run, optionally
 * interrupting the current turn so the agent replans immediately.
 */
export function steer(
  content: string,
  options: AgentSignalOptions & { readonly interrupt?: boolean } = {},
): EventInput {
  return agentModule.input(
    'steered',
    {
      turn: 0,
      interrupt: options.interrupt ?? true,
      message: { role: 'user', content },
    },
    { threadId: options.threadId },
  )
}
