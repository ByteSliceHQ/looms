import { agent, type AgentDefinition, type LlmAdapter } from '@swirls/looms/agent'
import { approval } from '@swirls/looms/approval'
import type { EventsOf } from '@swirls/looms/core'
import '@swirls/looms/react'
import { workflow } from '@swirls/looms/workflow'

import { definitions } from './definitions'
import { demoLlm } from './demo-llm'
import { payments } from './modules/payments'

/** The demo's module set. Without an `llm`, agents run on the interactive demo LLM adapter. */
export function demoModules(
  options: { llm?: LlmAdapter; agents?: readonly AgentDefinition[] } = {},
) {
  return [
    agent({
      llm: options.llm ?? demoLlm,
      definitions: [...definitions.filter((d) => d.kind === 'agent'), ...(options.agents ?? [])],
    }),
    workflow({ definitions: definitions.filter((d) => d.kind === 'workflow') }),
    approval(),
    payments,
  ] as const
}

export type DemoEvents = EventsOf<typeof demoModules>

declare module '@swirls/looms/react' {
  interface LoomsRegister {
    events: DemoEvents
  }
}
