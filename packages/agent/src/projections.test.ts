import { describe, expect, test } from 'bun:test'

import { createEvent, project, type JsonValue } from '@looms/core'

import { conversation, tokenUsage, turnActivity } from './projections'
import { ConversationSchema, TokenUsageSchema } from './types'

function assignSeq<T extends { seq: number }>(events: T[]): T[] {
  return events.map((e, idx) => ({ ...e, seq: idx + 1 }))
}

function at(type: string, payload: JsonValue, threadId: string | null = 'thr_root') {
  return createEvent('run_agent_3', { type, payload, threadId })
}

describe('agent projections with Effect schemas', () => {
  test('conversation projection attaches ConversationSchema as shape', () => {
    expect(conversation.shape).toBe(ConversationSchema)
    expect(conversation.initialState).toEqual({ lines: [] })

    const events = assignSeq([
      createEvent('run_agent_1', {
        type: 'agent.message.received',
        payload: { message: { role: 'user', content: 'hello' } },
      }),
      createEvent('run_agent_1', {
        type: 'agent.message',
        payload: {
          message: {
            role: 'assistant',
            content: 'hi there',
            toolCalls: [{ id: 'call_1', name: 'search', arguments: { q: 'looms' } }],
          },
        },
      }),
      createEvent('run_agent_1', {
        type: 'agent.tool.result',
        payload: {
          toolCallId: 'call_1',
          name: 'search',
          result: { matches: 3 },
        },
      }),
    ])

    const result = project(conversation, events)
    expect(result.lines).toHaveLength(3)
    expect(result.lines[0]?.role).toBe('user')
    expect(result.lines[0]?.content).toBe('hello')
    expect(result.lines[1]?.role).toBe('assistant')
    expect(result.lines[1]?.toolCalls?.[0]?.name).toBe('search')
    expect(result.lines[2]?.role).toBe('tool')
    expect(result.lines[2]?.content).toBe(JSON.stringify({ matches: 3 }))
  })

  test('tokenUsage projection attaches TokenUsageSchema as shape', () => {
    expect(tokenUsage.shape).toBe(TokenUsageSchema)
    expect(tokenUsage.initialState).toEqual({ input: 0, output: 0 })

    const events = assignSeq([
      createEvent('run_agent_2', {
        type: 'agent.message',
        payload: {
          message: { role: 'assistant', content: 'first' },
          usage: { input: 15, output: 25 },
        },
      }),
      createEvent('run_agent_2', {
        type: 'agent.message',
        payload: {
          message: { role: 'assistant', content: 'second' },
          usage: { input: 10, output: 20 },
        },
      }),
    ])

    const result = project(tokenUsage, events)
    expect(result).toEqual({ input: 25, output: 45 })
  })

  test('turnActivity follows the root agent turn and ignores other threads', () => {
    const activity = (...events: ReturnType<typeof at>[]) =>
      project(turnActivity, assignSeq(events)).active

    const started = [
      at('runtime.run.started', { rootThreadId: 'thr_root' }, null),
      at('runtime.thread.started', { threadId: 'thr_root', kind: 'agent' }),
    ]

    const answered = at('agent.message', { message: { role: 'assistant', content: 'hi' } })

    expect(activity(...started)).toBe(true)
    expect(activity(...started, answered)).toBe(false)
    expect(activity(...started, at('agent.turn.stopped', {}))).toBe(false)

    expect(activity(...started, answered, at('agent.message.received', {}, 'thr_child'))).toBe(
      false,
    )

    expect(
      activity(
        ...started,
        answered,
        at('agent.message.received', { message: { role: 'user', content: 'again' } }),
      ),
    ).toBe(true)
  })
})
