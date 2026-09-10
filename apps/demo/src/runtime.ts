import { agent, type agentCatalog, type LlmAdapter } from '@looms/agent'
import { approval, type approvalCatalog } from '@looms/approval'
import type { EventsOfCatalog, ProtocolEvents } from '@looms/core'
import { workflow, type workflowCatalog } from '@looms/workflow'

import { demoLlm } from './demo-llm'
import { payments, type paymentsCatalog } from './modules/payments'

/** The demo's module set. Without an `llm`, agents run on the interactive demo LLM adapter. */
export function demoModules(options: { llm?: LlmAdapter } = {}) {
  return [agent({ llm: options.llm ?? demoLlm }), workflow(), approval(), payments()] as const
}

export type DemoEvents =
  | ProtocolEvents
  | EventsOfCatalog<typeof agentCatalog>
  | EventsOfCatalog<typeof workflowCatalog>
  | EventsOfCatalog<typeof approvalCatalog>
  | EventsOfCatalog<typeof paymentsCatalog>
