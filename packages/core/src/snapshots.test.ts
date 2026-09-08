import { describe, expect, test } from 'bun:test'
import { event } from './events'
import { reduceActor } from './reducers'
import {
  buildSnapshotEvent,
  hashActorState,
  shouldTakeSnapshot,
} from './snapshots'

describe('snapshots', () => {
  test('shouldTakeSnapshot after threshold', () => {
    const actorId = 'a1'
    const events = Array.from({ length: 5 }, (_, i) =>
      event(
        'agent.turn.started',
        actorId,
        { turn: i + 1 },
        { seq: i + 1 },
      ),
    )
    expect(shouldTakeSnapshot(events, 5)).toBe(true)
    expect(shouldTakeSnapshot(events, 10)).toBe(false)
  })

  test('buildSnapshotEvent includes hash', () => {
    const actorId = 'a2'
    const events = [
      {
        ...event('actor.started', actorId, {
          kind: 'agent' as const,
          definitionName: 'echo',
          input: null,
          parentActorId: null,
        }),
        seq: 1,
      },
      { ...event('actor.completed', actorId, { output: { ok: true } }), seq: 2 },
    ]
    const snap = buildSnapshotEvent(actorId, events, { includeState: true })
    expect(snap.type).toBe('snapshot.taken')
    expect(snap.payload.stateHash).toBe(hashActorState(reduceActor(events)))
    expect(snap.payload.state).toBeDefined()
  })
})

describe('steering', () => {
  test('agent.turn.steered with interrupt clears tools and owes new turn', () => {
    const actorId = 'a3'
    const events = [
      {
        ...event('actor.started', actorId, {
          kind: 'agent' as const,
          definitionName: 'x',
          input: null,
          parentActorId: null,
        }),
        seq: 1,
      },
      { ...event('agent.turn.started', actorId, { turn: 1 }), seq: 2 },
      {
        ...event('agent.tool_call.requested', actorId, {
          turn: 1,
          toolCall: { id: 't1', name: 'slow', arguments: {} },
        }),
        seq: 3,
      },
      {
        ...event('agent.turn.steered', actorId, {
          turn: 1,
          message: { role: 'user', content: 'stop and summarize' },
          interrupt: true,
        }),
        seq: 4,
      },
    ]
    const state = reduceActor(events)
    expect(state.kind).toBe('agent')
    if (state.kind !== 'agent') return
    expect(state.pendingToolCalls).toEqual([])
    expect(state.pendingSteer?.content).toBe('stop and summarize')
    expect(state.owed.some((w) => w.type === 'agent.turn')).toBe(true)
  })
})
