import { describe, expect, test } from 'bun:test'

import { caseStatusForEvent } from './status'

describe('desk status', () => {
  test('a requested approval parks the case', () => {
    expect(caseStatusForEvent({ type: 'approval.requested', payload: {} })).toBe('waiting')
  })

  test('a decision sends the case back to work', () => {
    expect(caseStatusForEvent({ type: 'approval.decided', payload: {} })).toBe('running')
  })

  test('cancelling the run cancels the case', () => {
    expect(caseStatusForEvent({ type: 'runtime.run.cancelled', payload: null })).toBe('cancelled')
  })

  test('a completed run fails the case only when the payload carries an error', () => {
    expect(
      caseStatusForEvent({ type: 'runtime.run.completed', payload: { error: 'partner down' } }),
    ).toBe('failed')

    expect(caseStatusForEvent({ type: 'runtime.run.completed', payload: { output: null } })).toBe(
      'completed',
    )
  })

  test('shipment events do not move the board', () => {
    expect(caseStatusForEvent({ type: 'shipments.lookup.completed', payload: null })).toBe(
      undefined,
    )
  })
})
