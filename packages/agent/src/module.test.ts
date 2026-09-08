import { describe, expect, test } from 'bun:test'
import { composeModules, createEvent, foldRun } from '@looms/core'
import { agent } from './module'
import { defineAgent } from './definitions'

describe('@looms/agent module', () => {
  test('started thread requests callLLM', () => {
    const registry = composeModules([agent()])
    const runId = 'run_a'
    const threadId = 'thr_a'
    const state = foldRun(
      [
        {
          ...createEvent(runId, {
            type: 'runtime.thread.started',
            payload: {
              threadId,
              kind: 'agent',
              definitionName: 'echo',
              input: { text: 'hi' },
              parentThreadId: null,
            },
            threadId,
            origin: { type: 'system' },
          }),
          seq: 1,
        },
      ],
      registry,
    )
    expect(state.outstandingEffects[0]?.effect.type).toBe('agent.callLLM')
    expect(state.threads[threadId]?.kind).toBe('agent')
  })

  test('keeps tool calls on the assistant line for later LLM turns', () => {
    const registry = composeModules([agent()])
    const runId = 'run_b'
    const threadId = 'thr_b'
    const state = foldRun(
      [
        {
          ...createEvent(runId, {
            type: 'runtime.thread.started',
            payload: {
              threadId,
              kind: 'agent',
              definitionName: 'assistant',
              input: 'hi',
              parentThreadId: null,
            },
            threadId,
            origin: { type: 'system' },
          }),
          seq: 1,
        },
        {
          ...createEvent(runId, {
            type: 'agent.message',
            payload: {
              turn: 1,
              message: {
                role: 'assistant',
                content: '',
                toolCalls: [{ id: 'tc1', name: 'greet', arguments: { name: 'Dylan' } }],
              },
            },
            threadId,
            origin: { type: 'thread', threadId },
          }),
          seq: 2,
        },
        {
          ...createEvent(runId, {
            type: 'agent.tool_call.requested',
            payload: {
              turn: 1,
              toolCall: { id: 'tc1', name: 'greet', arguments: { name: 'Dylan' } },
            },
            threadId,
            origin: { type: 'thread', threadId },
          }),
          seq: 3,
        },
      ],
      registry,
    )
    const lines = state.threads[threadId]?.state
    expect(JSON.stringify(lines)).toContain('"name":"greet"')
  })

  test('defineAgent sets kind', () => {
    const def = defineAgent({ name: 'echo', instructions: 'echo' })
    expect(def.kind).toBe('agent')
    expect(def.name).toBe('echo')
  })
})
