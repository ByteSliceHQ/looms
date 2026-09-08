import { describe, expect, test } from 'bun:test'
import { event } from '@looms/core'
import { indexOpsFor } from './index-model'

describe('indexOpsFor', () => {
  test('maps actor.started to upsertActor', () => {
    const ops = indexOpsFor(
      event(
        'actor.started',
        'agt_1',
        {
          kind: 'agent',
          definitionName: 'echo',
          input: null,
          parentActorId: null,
        },
        { seq: 1, ts: 100 },
      ),
    )
    expect(ops).toEqual([
      {
        type: 'upsertActor',
        actorId: 'agt_1',
        kind: 'agent',
        status: 'running',
        definitionName: 'echo',
        parentActorId: null,
        updatedAt: 100,
      },
    ])
  })

  test('maps actor terminal events to setActorStatus', () => {
    expect(
      indexOpsFor(event('actor.completed', 'agt_1', { output: null }, { seq: 2, ts: 200 })),
    ).toEqual([{ type: 'setActorStatus', actorId: 'agt_1', status: 'completed', updatedAt: 200 }])
    expect(
      indexOpsFor(event('actor.failed', 'agt_1', { error: 'boom' }, { seq: 2, ts: 200 })),
    ).toEqual([{ type: 'setActorStatus', actorId: 'agt_1', status: 'failed', updatedAt: 200 }])
    expect(
      indexOpsFor(event('actor.cancelled', 'agt_1', {}, { seq: 2, ts: 200 })),
    ).toEqual([{ type: 'setActorStatus', actorId: 'agt_1', status: 'cancelled', updatedAt: 200 }])
  })

  test('maps review.requested to actor waiting_review and pending review', () => {
    const ops = indexOpsFor(
      event(
        'review.requested',
        'agt_1',
        {
          reviewId: 'rev_1',
          title: 'OK?',
          actions: [{ id: 'approve', label: 'Yes', outcome: 'approve' }],
        },
        { seq: 2, ts: 200 },
      ),
    )
    expect(ops).toEqual([
      { type: 'setActorStatus', actorId: 'agt_1', status: 'waiting_review', updatedAt: 200 },
      {
        type: 'upsertReview',
        reviewId: 'rev_1',
        actorId: 'agt_1',
        status: 'pending',
        title: 'OK?',
        updatedAt: 200,
      },
    ])
  })

  test('maps review.decided approve/reject', () => {
    expect(
      indexOpsFor(
        event(
          'review.decided',
          'agt_1',
          { reviewId: 'rev_1', actionId: 'approve', outcome: 'approve' },
          { seq: 3, ts: 300 },
        ),
      ),
    ).toEqual([
      {
        type: 'upsertReview',
        reviewId: 'rev_1',
        actorId: 'agt_1',
        status: 'approved',
        title: 'Review',
        updatedAt: 300,
      },
    ])
    expect(
      indexOpsFor(
        event(
          'review.decided',
          'agt_1',
          { reviewId: 'rev_1', actionId: 'reject', outcome: 'reject' },
          { seq: 3, ts: 300 },
        ),
      ),
    ).toEqual([
      {
        type: 'upsertReview',
        reviewId: 'rev_1',
        actorId: 'agt_1',
        status: 'rejected',
        title: 'Review',
        updatedAt: 300,
      },
    ])
  })

  test('maps review.timed_out to setReviewStatus', () => {
    expect(
      indexOpsFor(event('review.timed_out', 'agt_1', { reviewId: 'rev_1' }, { seq: 4, ts: 400 })),
    ).toEqual([{ type: 'setReviewStatus', reviewId: 'rev_1', status: 'timed_out', updatedAt: 400 }])
  })

  test('ignores events that do not affect the index', () => {
    expect(
      indexOpsFor(
        event('agent.message.received', 'agt_1', { message: { role: 'user', content: 'hi' } }, { seq: 5 }),
      ),
    ).toEqual([])
    expect(indexOpsFor(event('timer.fired', 'agt_1', { timerId: 't1' }, { seq: 6 }))).toEqual([])
  })
})
