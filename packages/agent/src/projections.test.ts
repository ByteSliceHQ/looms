import { describe, expect, test } from 'bun:test'
import { createEvent, project } from '@looms/core'
import { conversation, tokenUsage } from './projections'
import { ConversationSchema, TokenUsageSchema } from './types'

function assignSeq<T extends { seq: number }>(events: T[]): T[] {
  return events.map((e, idx) => ({ ...e, seq: idx + 1 }))
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
})
