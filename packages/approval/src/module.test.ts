import { describe, expect, test } from 'bun:test'

import { composeModules, createEvent, project } from '@looms/core'

import { approval } from './module'
import { pendingApprovals } from './projections'

describe('@looms/approval module', () => {
  test('composes and exposes request handler', () => {
    const registry = composeModules([approval()])
    expect(registry.effects.get('approval.request')).toBeDefined()
    expect(approval().description).toBe('Human gates that park a run until someone decides.')
    expect(approval().signals.decision('apr_1', 'approve').type).toBe('approval.decided')
    expect(approval().steps.gate({ title: 'Review' }).length).toBeGreaterThan(0)
  })

  test('the first approval, rejection, or timeout outcome wins', () => {
    const events = [
      createEvent('run', {
        type: 'approval.requested',
        payload: { approvalId: 'a', title: 'Review', actions: [] },
      }),
      createEvent('run', {
        type: 'runtime.wait.satisfied',
        payload: {
          waitId: 'timeout',
          tag: { approvalId: 'a', outcome: 'timeout' },
          event: { id: 'timer', type: 'runtime.timer.fired', payload: {} },
        },
      }),
      createEvent('run', {
        type: 'approval.decided',
        payload: { approvalId: 'a', actionId: 'approve', outcome: 'approve' },
      }),
    ].map((event, index) => ({ ...event, seq: index + 1 }))

    expect(project(pendingApprovals, events).items[0]?.status).toBe('timed_out')
  })
})
