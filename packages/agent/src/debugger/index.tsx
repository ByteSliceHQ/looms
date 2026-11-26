import type { DebuggerPlugin } from '@looms/debugger'

import { conversation, tokenUsage, turnActivity } from '../projections'
import { AgentChat } from './agent-chat'
import { summarizeAgentEvent } from './summarize'
import { TokenUsageView } from './token-usage'

export const agentDebugger: DebuggerPlugin = {
  name: 'agent',
  families: [{ family: 'agent', color: 'oklch(0.74 0.12 240)', summarize: summarizeAgentEvent }],
  workspace: { kinds: ['agent', 'agent-session'], component: AgentChat },
  projections: [{ name: tokenUsage.name, component: TokenUsageView }],
  headlessProjections: [conversation.name, turnActivity.name],
}

export { AgentChat, TokenUsageView }
