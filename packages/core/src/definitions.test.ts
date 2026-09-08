import { describe, expect, test } from 'bun:test'
import { defineAgent, defineTool, defineWorkflow, normalizeTools } from './definitions'
import { hasToolCall, stepCountIs } from './stop-when'

describe('normalizeTools', () => {
  test('wraps agent and workflow definitions', () => {
    const specialist = defineAgent({
      name: 'specialist',
      instructions: 'Specialize',
    })
    const hitl = defineWorkflow({
      name: 'hitl',
      description: 'Human-in-the-loop approval gate',
      nodes: [{ id: 'n', run: () => 1 }],
    })
    const greet = defineTool({
      name: 'greet',
      description: 'Return a greeting',
      handler: () => ({ greeting: 'hi' }),
    })
    const tools = normalizeTools([greet, specialist, hitl])
    expect(tools.map((t) => ({ kind: t.kind, name: t.name }))).toEqual([
      { kind: 'function', name: 'greet' },
      { kind: 'agent-tool', name: 'specialist' },
      { kind: 'workflow-tool', name: 'hitl' },
    ])
    expect(tools[2]?.description).toBe('Human-in-the-loop approval gate')
  })

  test('defineAgent normalizes tools on construction', () => {
    const child = defineWorkflow({
      name: 'pipeline',
      nodes: [{ id: 'n', run: () => 1 }],
    })
    const parent = defineAgent({
      name: 'assistant',
      instructions: 'help',
      tools: [child],
    })
    expect(parent.tools?.[0]?.kind).toBe('workflow-tool')
    expect(parent.tools?.[0]?.name).toBe('pipeline')
  })
})

describe('stopWhen helpers', () => {
  const base = {
    turn: 3,
    maxTurns: 20,
    messages: [],
    result: { message: { role: 'assistant' as const, content: '' } },
  }

  test('hasToolCall matches name', () => {
    expect(
      hasToolCall('answer')({
        ...base,
        toolCalls: [{ id: '1', name: 'answer', arguments: { text: 'done' } }],
      }),
    ).toBe(true)
    expect(hasToolCall('answer')({ ...base, toolCalls: [] })).toBe(false)
  })

  test('stepCountIs compares turn', () => {
    expect(stepCountIs(3)({ ...base, toolCalls: [] })).toBe(true)
    expect(stepCountIs(4)({ ...base, toolCalls: [] })).toBe(false)
  })
})
