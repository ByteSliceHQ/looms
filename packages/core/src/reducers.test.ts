import { describe, expect, test } from 'bun:test'
import { event } from './events'
import { reduceActor, isTerminal } from './reducers'

describe('reduceActor agent', () => {
  test('folds a simple echo turn to completion', () => {
    const actorId = 'agent_1'
    const events = [
      event('actor.started', actorId, {
        kind: 'agent',
        definitionName: 'echo',
        input: { text: 'hi' },
        parentActorId: null,
        maxTurns: 5,
      }),
      event('agent.turn.started', actorId, { turn: 1 }),
      event('agent.message', actorId, {
        turn: 1,
        message: { role: 'assistant', content: 'hi' },
      }),
      event('actor.completed', actorId, { output: { text: 'hi' } }),
    ].map((e, i) => ({ ...e, seq: i + 1 }))

    const state = reduceActor(events)
    expect(state.kind).toBe('agent')
    expect(state.status).toBe('completed')
    expect(state.output).toEqual({ text: 'hi' })
    expect(isTerminal(state)).toBe(true)
    expect(state.owed).toEqual([])
  })

  test('owes tool execution after tool_call.requested', () => {
    const actorId = 'agent_2'
    const events = [
      event('actor.started', actorId, {
        kind: 'agent',
        definitionName: 'tools',
        input: null,
        parentActorId: null,
      }),
      event('agent.turn.started', actorId, { turn: 1 }),
      event('agent.tool_call.requested', actorId, {
        turn: 1,
        toolCall: { id: 'tc1', name: 'echo', arguments: { text: 'x' } },
      }),
    ].map((e, i) => ({ ...e, seq: i + 1 }))

    const state = reduceActor(events)
    expect(state.owed.some((w) => w.type === 'tool.execute')).toBe(true)
  })
})

describe('reduceActor workflow', () => {
  test('schedules after start and completes nodes', () => {
    const actorId = 'wf_1'
    const events = [
      event('actor.started', actorId, {
        kind: 'workflow',
        definitionName: 'pipe',
        input: { n: 1 },
        parentActorId: null,
        nodeIds: ['a', 'b'],
      }),
      event('workflow.node.started', actorId, { nodeId: 'a' }),
      event('workflow.node.finished', actorId, { nodeId: 'a', result: 1, error: null }),
      event('workflow.node.started', actorId, { nodeId: 'b' }),
      event('workflow.node.finished', actorId, { nodeId: 'b', result: 2, error: null }),
      event('actor.completed', actorId, { output: { a: 1, b: 2 } }),
    ].map((e, i) => ({ ...e, seq: i + 1 }))

    const state = reduceActor(events, { kind: 'workflow', nodeIds: ['a', 'b'] })
    expect(state.kind).toBe('workflow')
    expect(state.status).toBe('completed')
    if (state.kind === 'workflow') {
      expect(state.nodes.a?.status).toBe('completed')
      expect(state.nodes.b?.status).toBe('completed')
    }
  })

  test('parks on review.requested until decided', () => {
    const actorId = 'wf_2'
    const pending = [
      event('actor.started', actorId, {
        kind: 'workflow',
        definitionName: 'hitl',
        input: null,
        parentActorId: null,
        nodeIds: ['review'],
      }),
      event('review.requested', actorId, {
        reviewId: 'r1',
        title: 'Approve?',
        actions: [{ id: 'ok', label: 'OK', outcome: 'approve' }],
        nodeId: 'review',
      }),
    ].map((e, i) => ({ ...e, seq: i + 1 }))

    const waiting = reduceActor(pending, { kind: 'workflow', nodeIds: ['review'] })
    expect(waiting.status).toBe('waiting_review')
    expect(waiting.owed.some((w) => w.type === 'review.wait')).toBe(true)

    const decided = reduceActor(
      [
        ...pending,
        { ...event('review.decided', actorId, { reviewId: 'r1', actionId: 'ok', outcome: 'approve' }), seq: 3 },
      ],
      { kind: 'workflow', nodeIds: ['review'] },
    )
    expect(decided.status).toBe('running')
    expect(decided.owed.some((w) => w.type === 'workflow.schedule')).toBe(true)
  })
})
