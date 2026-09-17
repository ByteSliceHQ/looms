import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import {
  asAgentTool,
  asEffectsTool,
  asJevTool,
  asWorkflowTool,
  defineAgent,
  defineTool,
  normalizeTools,
} from './definitions'
import { toolJsonSchema, toolSpecs } from './tool-schema'

const CheckoutInput = Schema.Struct({
  amount: Schema.Finite,
  currency: Schema.String,
})

const TaskInput = Schema.Struct({
  task: Schema.String,
})

describe('tool schema', () => {
  test('normalizeTools carries definition input onto thread tools', () => {
    const tools = normalizeTools([
      {
        kind: 'workflow',
        name: 'checkout',
        description: 'Approval gate then charge',
        input: CheckoutInput,
      },
    ])

    expect(tools[0]?.kind).toBe('thread')

    if (tools[0]?.kind !== 'thread') {
      return
    }

    expect(tools[0].input).toBe(CheckoutInput)
    expect(tools[0].childKind).toBe('workflow')
    expect(tools[0].childName).toBe('checkout')
  })

  test('asAgentTool inherits input from agent definition if not overridden', () => {
    const tool = asAgentTool({
      agent: {
        kind: 'agent',
        name: 'specialist',
        instructions: 'Specialist agent',
        input: TaskInput,
      },
    })

    expect(tool.input).toBe(TaskInput)
    const schema = toolJsonSchema(tool)
    expect(JSON.stringify(schema)).toContain('task')
  })

  test('asAgentTool respects explicit input override', () => {
    const OverrideInput = Schema.Struct({ topic: Schema.String })

    const tool = asAgentTool({
      agent: {
        kind: 'agent',
        name: 'specialist',
        instructions: 'Specialist agent',
        input: TaskInput,
      },
      input: OverrideInput,
    })

    expect(tool.input).toBe(OverrideInput)
    const schema = toolJsonSchema(tool)
    expect(JSON.stringify(schema)).toContain('topic')
  })

  test('asWorkflowTool inherits input from workflow definition', () => {
    const tool = asWorkflowTool({
      workflow: {
        kind: 'workflow',
        name: 'checkout',
        input: CheckoutInput,
      },
    })

    expect(tool.input).toBe(CheckoutInput)
    const schema = toolJsonSchema(tool)
    expect(JSON.stringify(schema)).toContain('amount')
  })

  test('asJevTool inherits input from jev definition', () => {
    const RefundInput = Schema.Struct({ amount: Schema.Finite })

    const tool = asJevTool({
      jev: {
        kind: 'jev',
        name: 'score-refund',
        description: 'Score a refund',
        input: RefundInput,
      },
    })

    expect(tool.input).toBe(RefundInput)
    expect(tool.childKind).toBe('jev')
    expect(tool.childName).toBe('score-refund')
    const schema = toolJsonSchema(tool)
    expect(JSON.stringify(schema)).toContain('amount')
  })

  test('asEffectsTool exposes input schema in toolSpecs', () => {
    const ApprovalInput = Schema.Struct({ title: Schema.String })

    const tool = asEffectsTool({
      name: 'ask_approval',
      description: 'Ask for approval',
      input: ApprovalInput,
      effects: () => [],
    })

    const specs = toolSpecs([tool])
    expect(specs[0]?.name).toBe('ask_approval')
    expect(JSON.stringify(specs[0]?.inputJsonSchema)).toContain('title')
  })

  test('toolSpecs include properties from thread-tool input schemas', () => {
    const specs = toolSpecs([
      {
        kind: 'workflow',
        name: 'checkout',
        description: 'Approval gate then charge',
        input: CheckoutInput,
      },
    ])

    expect(specs[0]?.name).toBe('checkout')
    const schema = specs[0]?.inputJsonSchema
    expect(schema).toBeDefined()
    const encoded = JSON.stringify(schema)
    expect(encoded).toContain('amount')
    expect(encoded).toContain('currency')
  })

  test('toolJsonSchema falls back to an object when no input is present', () => {
    const tools = normalizeTools([{ kind: 'workflow', name: 'bare' }])
    expect(toolJsonSchema(tools[0]!)).toEqual({ type: 'object' })
  })

  test('defineTool and defineAgent infer input types from input schema', () => {
    const tool = defineTool({
      name: 'echo',
      description: 'Echo message',
      input: TaskInput,
      handler: (input) => ({ echo: input.task }),
    })

    expect(tool.input).toBe(TaskInput)

    const agent = defineAgent({
      name: 'echo_agent',
      instructions: 'Echo',
      input: TaskInput,
    })

    expect(agent.input).toBe(TaskInput)
  })
})
