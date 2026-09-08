import { describe, expect, test } from 'bun:test'
import { event } from '@looms/core'
import { sqlite } from './sqlite'

describe('sqlite projector', () => {
  test('upserts actors and reviews through started → requested → decided', async () => {
    const projector = sqlite({ path: ':memory:' })
    await projector.init?.()
    const actorId = 'agt_1'
    await projector.project([
      event(
        'actor.started',
        actorId,
        {
          kind: 'agent',
          definitionName: 'echo',
          input: null,
          parentActorId: null,
        },
        { seq: 1 },
      ),
      event(
        'review.requested',
        actorId,
        {
          reviewId: 'rev_1',
          title: 'OK?',
          actions: [{ id: 'approve', label: 'Yes', outcome: 'approve' }],
        },
        { seq: 2 },
      ),
      event(
        'review.decided',
        actorId,
        { reviewId: 'rev_1', actionId: 'approve', outcome: 'approve' },
        { seq: 3 },
      ),
    ])

    const actor = await projector.getActor(actorId)
    expect(actor?.definitionName).toBe('echo')
    expect(actor?.status).toBe('waiting_review')

    const reviews = await projector.listReviews(actorId)
    expect(reviews).toHaveLength(1)
    expect(reviews[0]?.status).toBe('approved')
    expect(reviews[0]?.title).toBe('OK?')
    await projector.dispose?.()
  })
})
