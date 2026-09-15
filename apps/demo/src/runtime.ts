import { agent, type LlmAdapter } from '@looms/agent'
import { approval } from '@looms/approval'
import type { EventsOf } from '@looms/core'
import type {} from '@looms/react'
import { workflow } from '@looms/workflow'

import { demoLlm } from './demo-llm'
import { payments } from './modules/payments'

/** The demo's module set. Without an `llm`, agents run on the interactive demo LLM adapter. */
export function demoModules(options: { llm?: LlmAdapter } = {}) {
  return [agent({ llm: options.llm ?? demoLlm }), workflow(), approval(), payments()] as const
}

export type DemoEvents = EventsOf<typeof demoModules>

declare module '@looms/react' {
  interface LoomsRegister {
    events: DemoEvents
  }
}
