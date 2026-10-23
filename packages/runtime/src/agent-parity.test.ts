import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import {
  agent,
  asAgentTool,
  defineAgent,
  defineTool,
  STRUCTURED_OUTPUT_TOOL_NAME,
  TEAM_MEMBER_MAX_DEPTH,
  type AgentUsage,
} from '@looms/agent'
import type { EventEnvelope, RunState } from '@looms/core'

import { createLooms } from './looms'

function rootOf(state: RunState) {
  return state.rootThreadId ? state.threads[state.rootThreadId] : undefined
}

function toolResults(events: readonly EventEnvelope[]) {
  return events.filter((event) => event.type === 'agent.tool.result').map((event) => event.payload)
}

describe('agent parity on the runtime', () => {
  test('submit_output becomes the thread output after a corrected retry', async () => {
    const seenTools: string[][] = []

    const answerer = defineAgent({
      name: 'answerer',
      instructions: 'Answer the question.',
      output: Schema.Struct({ answer: Schema.String }),
      runTurn: ({ turn, tools, instructions }) => {
        seenTools.push(tools.map((tool) => tool.name))

        if (turn === 1) {
          expect(instructions).toContain(STRUCTURED_OUTPUT_TOOL_NAME)

          return {
            message: { role: 'assistant', content: '' },
            toolCalls: [{ id: 'call_bad', name: STRUCTURED_OUTPUT_TOOL_NAME, arguments: {} }],
          }
        }

        if (turn === 2) {
          return {
            message: { role: 'assistant', content: '' },
            toolCalls: [
              { id: 'call_ok', name: STRUCTURED_OUTPUT_TOOL_NAME, arguments: { answer: '42' } },
            ],
          }
        }

        return { message: { role: 'assistant', content: 'done' } }
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [answerer] })] })
    const result = await looms.start(answerer, 'what is the answer?')
    const results = toolResults(await looms.getEvents(result.runId))

    expect(rootOf(result.state)?.output).toEqual({ answer: '42' })
    expect(seenTools[0]).toContain(STRUCTURED_OUTPUT_TOOL_NAME)
    expect(results[0]).toMatchObject({ toolCallId: 'call_bad', result: null })
    expect(String(results[0]?.error)).toContain('Output validation failed')
    await looms.stop()
  })

  test('the depth limit holds for team members whose input schema strips unknown keys', async () => {
    const Task = Schema.Struct({ task: Schema.String })
    let turns = 0

    const nester = defineAgent({
      name: 'nester',
      instructions: 'Delegate once.',
      input: Task,
      tools: [asAgentTool({ agent: { kind: 'agent', name: 'nester', input: Task } })],
      runTurn: ({ turn, messages }) => {
        turns += 1

        if (turns > 20) {
          return { message: { role: 'assistant', content: 'runaway' } }
        }

        if (turn === 1) {
          return {
            message: { role: 'assistant', content: '' },
            toolCalls: [{ id: `call_${turns}`, name: 'nester', arguments: { task: 'go' } }],
          }
        }

        return { message: { role: 'assistant', content: messages.at(-1)?.content ?? '' } }
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [nester] })] })
    const result = await looms.start(nester, { task: 'go' })
    const agentThreads = Object.values(result.state.threads).filter((t) => t.kind === 'agent')
    const results = toolResults(await looms.getEvents(result.runId))

    expect(result.state.status).toBe('completed')
    expect(agentThreads).toHaveLength(TEAM_MEMBER_MAX_DEPTH + 1)

    expect(results.filter((payload) => String(payload.error).includes('depth limit'))).toHaveLength(
      1,
    )

    expect(agentThreads.every((thread) => JSON.stringify(thread.input) === '{"task":"go"}')).toBe(
      true,
    )

    await looms.stop()
  })

  test('tool execution resolves dynamic tools from the agent input', async () => {
    const tenantAgent = defineAgent({
      name: 'tenant-agent',
      instructions: 'Look up tenant data.',
      resolveTools: ({ input }) =>
        JSON.stringify(input).includes('acme')
          ? [
              defineTool({
                name: 'tenant_lookup',
                description: 'Tenant data',
                handler: () => 'acme',
              }),
            ]
          : [],
      runTurn: ({ turn, tools }) =>
        turn === 1
          ? {
              message: { role: 'assistant', content: '' },
              toolCalls: tools.some((tool) => tool.name === 'tenant_lookup')
                ? [{ id: 'call_lookup', name: 'tenant_lookup', arguments: {} }]
                : [],
            }
          : { message: { role: 'assistant', content: 'done' } },
    })

    const looms = createLooms({ modules: [agent({ definitions: [tenantAgent] })] })
    const result = await looms.start(tenantAgent, { tenant: 'acme' })
    const results = toolResults(await looms.getEvents(result.runId))

    expect(results).toEqual([
      { turn: 1, toolCallId: 'call_lookup', name: 'tenant_lookup', result: 'acme', error: null },
    ])

    await looms.stop()
  })

  test('a context overflow compacts the conversation once and retries the turn', async () => {
    const compacted = defineAgent({
      name: 'compacted',
      instructions: 'Keep going.',
      tools: [defineTool({ name: 'noop', description: 'Does nothing', handler: () => 'ok' })],
      compact: () => ({ messages: [{ role: 'user', content: 'summary' }], summary: 'summary' }),
      runTurn: ({ turn, messages }) => {
        if (messages.some((message) => message.content === 'summary')) {
          return { message: { role: 'assistant', content: 'finished after compaction' } }
        }

        if (turn === 1) {
          return {
            message: { role: 'assistant', content: '' },
            toolCalls: [{ id: 'call_noop', name: 'noop', arguments: {} }],
          }
        }

        throw new Error('context_length_exceeded: prompt is too long')
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [compacted] })] })
    const result = await looms.start(compacted, 'start')
    const events = await looms.getEvents(result.runId)
    const compactions = events.filter((event) => event.type === 'agent.context.compacted')

    expect(rootOf(result.state)?.output).toEqual({ text: 'finished after compaction' })
    expect(compactions).toHaveLength(1)

    expect(compactions[0]?.payload).toMatchObject({
      turn: 2,
      reason: 'overflow',
      compactedCount: 1,
    })

    await looms.stop()
  })

  test('a failed credit check fails the thread before the model runs', async () => {
    let modelCalls = 0

    const metered = defineAgent({
      name: 'metered',
      instructions: 'Answer.',
      assertCredits: () => {
        throw new Error('out of credits')
      },
      runTurn: () => {
        modelCalls += 1
        return { message: { role: 'assistant', content: 'unreachable' } }
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [metered] })] })
    const result = await looms.start(metered, 'hi')

    expect(rootOf(result.state)?.status).toBe('failed')
    expect(rootOf(result.state)?.error).toBe('out of credits')
    expect(modelCalls).toBe(0)
    await looms.stop()
  })

  test('usage is recorded and reported, and a failing reporter does not fail the turn', async () => {
    const reported: AgentUsage[] = []

    const usageAgent = defineAgent({
      name: 'usage-agent',
      instructions: 'Answer.',
      trackUsage: (usage) => {
        reported.push(usage)
        throw new Error('billing is down')
      },
      runTurn: () => ({
        message: { role: 'assistant', content: 'answer' },
        usage: { input: 10, output: 5 },
      }),
    })

    const looms = createLooms({ modules: [agent({ definitions: [usageAgent] })] })
    const result = await looms.start(usageAgent, 'hi')
    const events = await looms.getEvents(result.runId)
    const usage = events.filter((event) => event.type === 'agent.turn.usage')

    expect(rootOf(result.state)?.status).toBe('completed')
    expect(reported).toEqual([{ input: 10, output: 5, turn: 1 }])
    expect(usage.map((event) => event.payload)).toEqual([{ turn: 1, input: 10, output: 5 }])
    await looms.stop()
  })
})
