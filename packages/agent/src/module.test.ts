import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { composeModules, createEvent, foldRun } from '@looms/core'

import { defineAgent } from './definitions'
import { agent } from './module'

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

  test('effect.failed during an effects-tool step emits tool.result', () => {
    const registry = composeModules([agent()])
    const runId = 'run_fx'
    const threadId = 'thr_fx'

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
            type: 'agent.tool_call.requested',
            payload: {
              turn: 1,
              toolCall: { id: 'tc1', name: 'ask_approval', arguments: {} },
            },
            threadId,
            origin: { type: 'thread', threadId },
          }),
          seq: 2,
        },
        {
          ...createEvent(runId, {
            type: 'agent.effects.requested',
            payload: {
              toolCallId: 'tc1',
              effects: [],
              waitOn: { type: 'approval.decided' },
            },
            threadId,
            origin: { type: 'thread', threadId },
          }),
          seq: 3,
        },
        {
          ...createEvent(runId, {
            type: 'runtime.effect.failed',
            payload: { effectId: `${threadId}:3:0`, error: 'approval handler down' },
            threadId,
            effectId: `${threadId}:3:0`,
            origin: { type: 'system' },
          }),
          seq: 4,
        },
      ],
      registry,
    )

    expect(state.threads[threadId]?.status).toBe('running')
    const emitted = state.outstandingEffects.find((item) => item.effect.type === 'runtime.emit')
    expect(emitted).toBeDefined()
    expect(JSON.stringify(emitted?.effect)).toContain('agent.tool.result')
    expect(JSON.stringify(emitted?.effect)).toContain('approval handler down')
  })

  test('started thread extracts task or topic from input object as user line', () => {
    const registry = composeModules([agent()])
    const runId = 'run_task'
    const threadId = 'thr_task'

    const state = foldRun(
      [
        {
          ...createEvent(runId, {
            type: 'runtime.thread.started',
            payload: {
              threadId,
              kind: 'agent',
              definitionName: 'specialist',
              input: { task: 'number of lakes in minnesota' },
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

    const threadState = Schema.decodeUnknownSync(
      Schema.Struct({
        lines: Schema.Array(Schema.Struct({ role: Schema.String, content: Schema.String })),
      }),
    )(state.threads[threadId]?.state)

    expect(threadState.lines[0]?.role).toBe('user')
    expect(threadState.lines[0]?.content).toBe('number of lakes in minnesota')
  })
})
