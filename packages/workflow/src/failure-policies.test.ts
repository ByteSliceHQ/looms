import { describe, expect, test } from 'bun:test'

import { defineWorkflow, type NodeState } from './definitions'
import { scheduleEvents } from './effects'

const failed = (attempts: number): NodeState => ({
  status: 'failed',
  result: null,
  error: 'boom',
  attempts,
})

describe('workflow failure policies', () => {
  test('retries up to maxAttempts then fails', () => {
    const definition = defineWorkflow({
      name: 'retry',
      nodes: [{ id: 'task', failure: { type: 'retry', maxAttempts: 3 }, run: () => null }],
    })

    expect(
      scheduleEvents(definition, { nodes: { task: failed(2) }, input: null }, 'thread')[0]?.type,
    ).toBe('workflow.node.started')

    expect(
      scheduleEvents(definition, { nodes: { task: failed(3) }, input: null }, 'thread')[0]?.type,
    ).toBe('runtime.thread.failed')
  })

  test('skip and fallback policies continue deterministically', () => {
    const skip = defineWorkflow({
      name: 'skip',
      nodes: [{ id: 'task', failure: { type: 'skip' }, run: () => null }],
    })

    expect(
      scheduleEvents(skip, { nodes: { task: failed(1) }, input: null }, 'thread')[0]?.type,
    ).toBe('workflow.node.skipped')

    const fallback = defineWorkflow({
      name: 'fallback',
      nodes: [
        { id: 'task', failure: { type: 'fallback', nodeId: 'recover' }, run: () => null },
        { id: 'recover', run: () => null },
      ],
    })

    expect(
      scheduleEvents(
        fallback,
        {
          nodes: {
            task: failed(1),
            recover: { status: 'pending', result: null, error: null },
          },
          input: null,
        },
        'thread',
      ).map((event) => event.type),
    ).toEqual(['workflow.node.skipped', 'workflow.node.started'])
  })
})
