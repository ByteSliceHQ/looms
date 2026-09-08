import { describe, expect, test } from 'bun:test'
import { event } from '@looms/core'
import { materializeActor, emptyTables } from './index'

describe('@looms/livestore materialize', () => {
  test('materializeActor builds actors, messages, reviews', () => {
    const actorId = 'agt_test'
    const events = [
      event(
        'actor.started',
        actorId,
        {
          kind: 'agent',
          definitionName: 'echo',
          input: { text: 'hi' },
          parentActorId: null,
        },
        { seq: 1 },
      ),
      event(
        'agent.message.received',
        actorId,
        { message: { role: 'user', content: 'hi' } },
        { seq: 2 },
      ),
      event(
        'agent.turn.started',
        actorId,
        { turn: 1 },
        { seq: 3 },
      ),
      event(
        'agent.message',
        actorId,
        { turn: 1, message: { role: 'assistant', content: 'hello' } },
        { seq: 4 },
      ),
      event(
        'actor.completed',
        actorId,
        { output: { text: 'hello' } },
        { seq: 5 },
      ),
    ]

    const tables = materializeActor(events)
    expect(tables.actors.get(actorId)?.status).toBe('completed')
    expect(tables.actors.get(actorId)?.definitionName).toBe('echo')
    expect(tables.messages).toHaveLength(2)
    expect(tables.messages[0]?.content).toBe('hi')
    expect(tables.events).toHaveLength(5)
    expect(tables.turns.get(`${actorId}:1`)?.turn).toBe(1)
  })

  test('review events populate reviews table', () => {
    const actorId = 'wf_hitl'
    const events = [
      event(
        'actor.started',
        actorId,
        {
          kind: 'workflow',
          definitionName: 'hitl',
          input: null,
          parentActorId: null,
          nodeIds: ['review'],
        },
        { seq: 1 },
      ),
      event(
        'workflow.node.started',
        actorId,
        { nodeId: 'review' },
        { seq: 2 },
      ),
      event(
        'review.requested',
        actorId,
        {
          reviewId: 'rev_1',
          title: 'Go?',
          actions: [
            { id: 'approve', label: 'Approve', outcome: 'approve' },
            { id: 'reject', label: 'Reject', outcome: 'reject' },
          ],
          nodeId: 'review',
        },
        { seq: 3 },
      ),
      event(
        'review.decided',
        actorId,
        { reviewId: 'rev_1', actionId: 'approve', outcome: 'approve' },
        { seq: 4 },
      ),
    ]

    const tables = materializeActor(events)
    expect(tables.reviews.get('rev_1')?.status).toBe('approved')
    expect(tables.nodes.get(`${actorId}:review`)?.status).toBe('completed')
    expect(tables.actors.get(actorId)?.status).toBe('running')
  })

  test('empty seed starts empty', () => {
    const t = emptyTables()
    expect(t.actors.size).toBe(0)
    expect(t.events).toEqual([])
  })
})
