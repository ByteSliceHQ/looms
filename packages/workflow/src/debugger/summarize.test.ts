import { describe, expect, test } from 'bun:test'

import { createEvent, type JsonValue } from '@looms/core'

import { summarizeWorkflowEvent } from './summarize'

function event(type: string, payload: JsonValue) {
  return createEvent('run_workflow', { type, payload, threadId: 'thr_a', id: 'evt_1', ts: 10 })
}

describe('summarizeWorkflowEvent', () => {
  test('summarizes a finished node', () => {
    expect(
      summarizeWorkflowEvent(
        event('workflow.node.finished', { nodeId: 'charge', result: { ok: true }, error: null }),
      ),
    ).toEqual({ title: 'node finished', detail: 'charge {"ok":true}' })
  })

  test('ignores events from other modules', () => {
    expect(summarizeWorkflowEvent(event('approval.requested', { title: 'Review' }))).toBeUndefined()
  })
})
