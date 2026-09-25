import { describe, expect, test } from 'bun:test'

import { createEvent, type JsonValue } from '@looms/core'

import { summarizeApprovalEvent } from './summarize'

function event(type: string, payload: JsonValue) {
  return createEvent('run_approval', { type, payload, threadId: 'thr_a', id: 'evt_1', ts: 10 })
}

describe('summarizeApprovalEvent', () => {
  test('summarizes a decision', () => {
    expect(
      summarizeApprovalEvent(
        event('approval.decided', { approvalId: 'apr_1', outcome: 'approve' }),
      ),
    ).toEqual({ title: 'approval approve', detail: 'apr_1' })
  })

  test('ignores events from other modules', () => {
    expect(summarizeApprovalEvent(event('agent.message', { message: null }))).toBeUndefined()
  })
})
