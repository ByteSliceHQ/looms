import { describe, expect, test } from 'bun:test'

import { createEvent, type JsonValue } from '@looms/core'

import { searchText, summarizeEvent } from './catalog'
import { summarizeProtocolEvent } from './protocol-summarize'

const runId = 'run_catalog'

function event(type: string, payload: JsonValue, threadId: string | null = 'thr_a') {
  return createEvent(runId, { type, payload, threadId, id: 'evt_1', ts: 10 })
}

describe('summarizeProtocolEvent', () => {
  test('summarizes runtime events', () => {
    expect(
      summarizeProtocolEvent(
        event('runtime.run.started', { kind: 'workflow', definitionName: 'checkout', input: null }),
      ),
    ).toEqual({ title: 'run started', detail: 'workflow:checkout' })

    expect(
      summarizeProtocolEvent(
        event('runtime.wait.registered', { waitId: 'wait_1', on: { type: 'approval.decided' } }),
      ),
    ).toEqual({ title: 'wait registered', detail: 'approval.decided' })
  })

  test('returns undefined for domain events', () => {
    expect(
      summarizeProtocolEvent(
        event('agent.message', { message: { role: 'assistant', content: 'hi' } }),
      ),
    ).toBeUndefined()
  })
})

describe('summarizeEvent', () => {
  test('covers protocol and domain families', () => {
    expect(
      summarizeEvent(
        event('agent.message.received', { message: { role: 'user', content: 'charge 42' } }),
      ),
    ).toEqual({ title: 'user message', detail: 'charge 42' })

    expect(summarizeEvent(event('custom.unknown', { foo: 1 }))).toEqual({
      title: 'custom.unknown',
      detail: '{"foo":1}',
    })
  })
})

describe('searchText', () => {
  test('joins type, thread, summary, and id', () => {
    const item = event('agent.message', { message: { role: 'assistant', content: 'ready' } })
    expect(searchText(item)).toContain('agent.message')
    expect(searchText(item)).toContain('thr_a')
    expect(searchText(item)).toContain('ready')
  })
})
