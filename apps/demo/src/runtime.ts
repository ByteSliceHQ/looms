import { agent, type AgentDefinition, type LlmAdapter } from '@looms/agent'
import { approval } from '@looms/approval'
import type { EventsOf } from '@looms/core'
import type {} from '@looms/react'
import { workflow } from '@looms/workflow'

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

declare module '@looms/react' {
  interface LoomsRegister {
    events: DemoEvents
  }
}
