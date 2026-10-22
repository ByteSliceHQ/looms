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

    expect(indexOpsFor(event)[0]).toMatchObject({
      type: 'upsertActor',
      launchedByRunId: null,
      correlationId: null,
    })
  })

  test('indexes run cancelled', () => {
    const event = createEvent('run_1', {
      type: 'runtime.run.cancelled',
      payload: { reason: 'cancelled' },
      threadId: null,
      origin: { type: 'system' },
    })

    expect(indexOpsFor(event)).toEqual([
      {
        type: 'setActorStatus',
        runId: 'run_1',
        actorId: 'run_1',
        status: 'cancelled',
        updatedAt: event.ts,
      },
    ])
  })

  test('indexes a run that completed with an error as failed', () => {
    const event = createEvent('run_1', {
      type: 'runtime.run.completed',
      payload: { output: null, error: 'boom' },
      threadId: null,
      origin: { type: 'system' },
    })

    expect(indexOpsFor(event)).toEqual([
      {
        type: 'setActorStatus',
        runId: 'run_1',
        actorId: 'run_1',
        status: 'failed',
        updatedAt: event.ts,
      },
    ])
  })

  test('indexes approval requested', () => {
    const event = createEvent('run_1', {
      type: 'approval.requested',
      payload: { approvalId: 'a1', title: 'OK?', actions: [] },
      threadId: 'thr_1',
      origin: { type: 'system' },
    })

    expect(indexOpsFor(event)[0]).toMatchObject({
      type: 'upsertReview',
      runId: 'run_1',
      reviewId: 'a1',
    })
  })
})
