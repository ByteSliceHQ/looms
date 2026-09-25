import { describe, expect, test } from 'bun:test'

import { createEvent, type JsonValue } from '@looms/core'

import { summarizeAgentEvent } from './summarize'

function event(type: string, payload: JsonValue) {
  return createEvent('run_agent', { type, payload, threadId: 'thr_a', id: 'evt_1', ts: 10 })
}

describe('summarizeAgentEvent', () => {
  test('summarizes user and agent messages', () => {
    expect(
      summarizeAgentEvent(
        event('agent.message.received', { message: { role: 'user', content: 'charge 42' } }),
      ),
    ).toEqual({ title: 'user message', detail: 'charge 42' })

    expect(
      summarizeAgentEvent(
        event('agent.message', { message: { role: 'assistant', content: 'done' } }),
      ),
    ).toEqual({ title: 'agent message', detail: 'done' })
  })

  test('ignores events from other modules', () => {
    expect(summarizeAgentEvent(event('workflow.node.started', { nodeId: 'pay' }))).toBeUndefined()
  })
})
