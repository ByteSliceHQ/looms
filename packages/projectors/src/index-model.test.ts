import { describe, expect, test } from 'bun:test'

import { createEvent } from '@looms/core'

import { indexOpsFor } from './index-model'

describe('indexOpsFor', () => {
  test('indexes run started', () => {
    const event = createEvent('run_1', {
      type: 'runtime.run.started',
      payload: { rootThreadId: 'thr_1', kind: 'agent', definitionName: 'echo', input: null },
      threadId: null,
      origin: { type: 'system' },
    })
    expect(indexOpsFor(event)[0]?.type).toBe('upsertActor')
  })

  test('indexes approval requested', () => {
    const event = createEvent('run_1', {
      type: 'approval.requested',
      payload: { approvalId: 'a1', title: 'OK?', actions: [] },
      threadId: 'thr_1',
      origin: { type: 'system' },
    })
    expect(indexOpsFor(event)[0]).toMatchObject({ type: 'upsertReview', reviewId: 'a1' })
  })
})
