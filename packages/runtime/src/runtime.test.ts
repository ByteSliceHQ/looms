import { describe, expect, test } from 'bun:test'
import { defineAgent, defineTool, defineWorkflow } from '@looms/core'
import { createLooms } from './looms'

describe('@looms/runtime', () => {
  test('startAgent with runTurn completes', async () => {
    const echo = defineAgent({
      name: 'echo',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'ok' },
        done: true,
        output: input,
      }),
    })
    const looms = createLooms({ definitions: [echo] })
    const { actorId, state } = await looms.startAgent('echo', { text: 'hi' })
    expect(actorId).toStartWith('agt_')
    expect(state.status).toBe('completed')
    expect(state.output).toEqual({ text: 'hi' })
  })

  test('startWorkflow runs DAG to completion', async () => {
    const wf = defineWorkflow({
      name: 'add',
      nodes: [
        { id: 'a', run: () => 1 },
        { id: 'b', deps: ['a'], run: (ctx) => Number(ctx.results.a) + 1 },
      ],
      output: ({ results }) => results,
    })
    const looms = createLooms({ definitions: [wf] })
    const { state } = await looms.startWorkflow('add', null)
    expect(state.status).toBe('completed')
    expect(state.output).toEqual({ a: 1, b: 2 })
  })

  test('function tool executes during wake', async () => {
    const agent = defineAgent({
      name: 'with-tool',
      instructions: 'tool',
      tools: [
        defineTool({
          name: 'ping',
          description: 'ping',
          handler: () => ({ pong: true }),
        }),
      ],
      runTurn: ({ turn, messages }) => {
        if (turn === 1) {
          return {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [{ id: 't1', name: 'ping', arguments: {} }],
            },
            toolCalls: [{ id: 't1', name: 'ping', arguments: {} }],
          }
        }
        const tool = messages.find((m) => m.role === 'tool')
        return {
          message: { role: 'assistant', content: tool?.content ?? '' },
          done: true,
          output: { pong: true },
        }
      },
    })
    const looms = createLooms({ definitions: [agent] })
    const { state } = await looms.startAgent('with-tool', null)
    expect(state.status).toBe('completed')
    expect(state.output).toEqual({ pong: true })
  })

  test('review parks then decideReview resumes', async () => {
    const wf = defineWorkflow({
      name: 'hitl',
      nodes: [
        {
          id: 'review',
          run: (ctx) => ctx.requestReview({ title: 'Go?' }),
        },
      ],
    })
    const looms = createLooms({ definitions: [wf] })
    const { actorId, state } = await looms.startWorkflow('hitl', null)
    expect(state.status).toBe('waiting_review')
    const reviewId = Object.keys(state.reviews)[0]!
    const next = await looms.decideReview(actorId, reviewId, {
      actionId: 'approve',
      outcome: 'approve',
    })
    expect(next.status).toBe('completed')
  })

  test('agent-tool spawns child and completes', async () => {
    const child = defineAgent({
      name: 'child-echo',
      instructions: 'child',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'ok' },
        done: true,
        output: input,
      }),
    })
    const parent = defineAgent({
      name: 'parent',
      instructions: 'parent',
      tools: [
        {
          kind: 'agent-tool' as const,
          name: 'child-echo',
          description: 'spawn child',
          agent: child,
        },
      ],
      runTurn: ({ turn, messages }) => {
        if (turn === 1) {
          return {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [{ id: 't1', name: 'child-echo', arguments: { x: 1 } }],
            },
            toolCalls: [{ id: 't1', name: 'child-echo', arguments: { x: 1 } }],
          }
        }
        const tool = messages.find((m) => m.role === 'tool')
        return {
          message: { role: 'assistant', content: tool?.content ?? '' },
          done: true,
          output: tool ? JSON.parse(tool.content) : null,
        }
      },
    })
    const looms = createLooms({ definitions: [parent, child] })
    const { state } = await looms.startAgent('parent', null)
    expect(state.status).toBe('completed')
    expect(state.output).toEqual({ x: 1 })
    expect(Object.values(state.children).some((c) => c.status === 'completed')).toBe(true)
  })

  test('steer appends interrupt and resumes', async () => {
    const agent = defineAgent({
      name: 'steerable',
      instructions: 's',
      runTurn: ({ messages }) => {
        const steered = messages.some((m) => m.content === 'pivot')
        return {
          message: { role: 'assistant', content: steered ? 'pivoted' : 'hello' },
          done: true,
          output: { steered },
        }
      },
    })
    const looms = createLooms({ definitions: [agent] })
    const { actorId, state: first } = await looms.startAgent('steerable', null)
    expect(first.status).toBe('completed')

    // Re-open via steer on a completed agent: append steered + wake runs a new turn
    const after = await looms.steer(actorId, 'pivot', { interrupt: true, turn: 1 })
    expect(after.messages.some((m) => m.content === 'pivot')).toBe(true)
  })

  test('wake continues after the 100-iteration guard', async () => {
    let n = 0
    const agent = defineAgent({
      name: 'long-run',
      instructions: 'keep going',
      maxTurns: 80,
      tools: [
        defineTool({
          name: 'inc',
          description: 'increment',
          handler: () => {
            n += 1
            return { n }
          },
        }),
      ],
      runTurn: ({ turn }) => {
        if (turn <= 60) {
          return {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [{ id: `t${turn}`, name: 'inc', arguments: {} }],
            },
            toolCalls: [{ id: `t${turn}`, name: 'inc', arguments: {} }],
          }
        }
        return {
          message: { role: 'assistant', content: 'done' },
          done: true,
          output: { n },
        }
      },
    })
    const looms = createLooms({ definitions: [agent] })
    const { state } = await looms.startAgent('long-run', null)
    expect(state.status).toBe('completed')
    expect(state.output).toEqual({ n: 60 })
  })
})
