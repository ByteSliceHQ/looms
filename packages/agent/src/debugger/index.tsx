import { defineDebuggerPlugin, projectionView } from '@looms/debugger'

import { tokenUsage } from '../projections'
import { AgentChat } from './agent-chat'
import { summarizeAgentEvent } from './summarize'
import { TokenUsageView } from './token-usage'

export const agentDebugger = defineDebuggerPlugin({
  name: 'agent',
  families: [
    {
      family: 'agent',
      prefix: 'agent.',
      color: 'oklch(0.74 0.12 240)',
      summarize: summarizeAgentEvent,
    },
  ],
  workspace: {
    kinds: ['agent', 'agent-session'],
    component: AgentChat,
  },
  projections: [projectionView(tokenUsage, TokenUsageView)],
})

export { AgentChat, TokenUsageView }
