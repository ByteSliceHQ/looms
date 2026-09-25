import type { PublishedDefinition } from '@looms/core'
import { inputForm, messageInput, type DebuggerPlugin } from '@looms/debugger'

import { tokenUsage } from '../projections'
import { AgentChat } from './agent-chat'
import { summarizeAgentEvent } from './summarize'
import { TokenUsageView } from './token-usage'

function isChat(definition: PublishedDefinition): boolean {
  return messageInput(inputForm(definition.inputSchema), '') !== undefined
}

export const agentDebugger: DebuggerPlugin = {
  name: 'agent',
  families: [{ family: 'agent', color: 'oklch(0.74 0.12 240)', summarize: summarizeAgentEvent }],
  workspace: {
    kinds: ['agent', 'agent-session'],
    matches: (definition) => definition.kind === 'agent-session' || isChat(definition),
    component: AgentChat,
  },
  projections: [{ name: tokenUsage.name, component: TokenUsageView }],
}

export { AgentChat, TokenUsageView }
