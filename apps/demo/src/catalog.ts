import type { AgentDefinition } from '@looms/agent'
import type { JsonValue } from '@looms/core'
import type { WorkflowDefinition } from '@looms/workflow'

import {
  assistant,
  checkout,
  echo,
  greeter,
  orchestrator,
  pipeline,
  researcher,
  specialist,
} from './definitions'

export type CatalogField = {
  name: string
  label: string
  type: 'string' | 'number'
  default: string | number
}

export type AgentRunType = {
  kind: 'agent'
  name: string
  label: string
  description: string
  conversational: boolean
  def: AgentDefinition
  placeholder: string
  toInput: (text: string) => JsonValue
}

export type WorkflowRunType = {
  kind: 'workflow'
  name: string
  label: string
  description: string
  def: WorkflowDefinition
  fields: CatalogField[]
}

export type RunType = AgentRunType | WorkflowRunType

export const catalog: readonly RunType[] = [
  {
    kind: 'agent',
    name: echo.name,
    label: 'echo',
    description: 'Repeats the input as an assistant message',
    conversational: false,
    def: echo,
    placeholder: 'hi',
    toInput: (text) => ({ text: text || 'hi' }),
  },
  {
    kind: 'agent',
    name: greeter.name,
    label: 'greeter',
    description: 'Calls the greet tool, then finishes',
    conversational: false,
    def: greeter,
    placeholder: 'Ada',
    toInput: (text) => ({ name: text || 'world' }),
  },
  {
    kind: 'agent',
    name: orchestrator.name,
    label: 'orchestrator',
    description: 'Spawns the specialist child agent',
    conversational: false,
    def: orchestrator,
    placeholder: 'summarize',
    toInput: (text) => ({ task: text || 'summarize' }),
  },
  {
    kind: 'agent',
    name: specialist.name,
    label: 'specialist',
    description: 'Specialist LLM agent that delegates to researcher & pipeline tools',
    conversational: false,
    def: specialist,
    placeholder: 'Analyze cache latency and metrics',
    toInput: (text) => ({ task: text || 'Analyze cache latency' }),
  },
  {
    kind: 'agent',
    name: researcher.name,
    label: 'researcher',
    description: 'Sub-agent that queries telemetry and triggers data pipelines',
    conversational: false,
    def: researcher,
    placeholder: 'telemetry benchmarks',
    toInput: (text) => ({ topic: text || 'telemetry benchmarks' }),
  },
  {
    kind: 'workflow',
    name: checkout.name,
    label: 'checkout',
    description: 'Approval gate above $100, then a charge',
    def: checkout,
    fields: [
      { name: 'amount', label: 'Amount', type: 'number', default: 150 },
      { name: 'currency', label: 'Currency', type: 'string', default: 'USD' },
    ],
  },
  {
    kind: 'workflow',
    name: pipeline.name,
    label: 'pipeline',
    description: 'Double a number, spawn echo, format the result',
    def: pipeline,
    fields: [{ name: 'n', label: 'n', type: 'number', default: 21 }],
  },
  {
    kind: 'agent',
    name: assistant.name,
    label: 'assistant',
    description: 'Conversational agent with tools',
    conversational: true,
    def: assistant,
    placeholder: 'Ask specialist to research cache latency, or run checkout…',
    toInput: (text) => text,
  },
]

export function findRunType(name: string | undefined): RunType | undefined {
  if (!name) {
    return undefined
  }

  return catalog.find((item) => item.name === name)
}
