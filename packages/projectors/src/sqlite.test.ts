import { describe, expect, test } from 'bun:test'

import { createEvent } from '@looms/core'

import { sqlite } from './sqlite'

function threadEvents(runId: string, status: 'completed' | 'cancelled') {
  return [
    createEvent(runId, {
      type: 'runtime.thread.started',
      payload: {
        threadId: 'thr_shared',
        kind: 'agent',
        definitionName: 'echo',
        input: null,
        parentThreadId: null,
      },
      threadId: 'thr_shared',
      origin: { type: 'system' },
    }),
    createEvent(runId, {
      type: `runtime.thread.${status}`,
      payload: { threadId: 'thr_shared', output: null },
      threadId: 'thr_shared',
      origin: { type: 'system' },
    }),
    createEvent(runId, {
      type: 'approval.requested',
      payload: { approvalId: 'approval_shared', title: `${runId} approval`, actions: [] },
      threadId: 'thr_shared',
      origin: { type: 'system' },
    }),
  ]
}

describe('sqlite projector', () => {
  test('indexes a started run', async () => {
    const projector = sqlite({ path: ':memory:' })
    await projector.init?.()

    await projector.project([
      createEvent('run_1', {
        type: 'runtime.run.started',
        payload: { rootThreadId: 'thr_1', kind: 'agent', definitionName: 'echo', input: null },
        threadId: null,
        origin: { type: 'system' },
      }),
    ])

    const row = await projector.getActor('run_1')
    expect(row?.definitionName).toBe('echo')
    await projector.dispose?.()
  })

  test('keeps a thread id shared by two runs apart', async () => {
    const projector = sqlite({ path: ':memory:' })
    await projector.init?.()
    await projector.project(threadEvents('run_source', 'cancelled'))
    await projector.project(threadEvents('run_fork', 'completed'))

    expect((await projector.getActor('run_source', 'thr_shared'))?.status).toBe('cancelled')
    expect((await projector.getActor('run_fork', 'thr_shared'))?.status).toBe('completed')

    expect((await projector.listReviews('run_source')).map((row) => row.title)).toEqual([
      'run_source approval',
    ])

    expect(await projector.listReviews()).toHaveLength(2)
    await projector.dispose?.()
  })
})
