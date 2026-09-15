import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { defineEventCatalog } from './catalog'
import { advanceCursor, assignSequences, emptyCursor } from './cursor'
import { createEvent } from './envelope'
import { composeModules, defineRuntimeModule } from './index'
import { defineThread } from './thread'

const counterCatalog = defineEventCatalog('counter', {
  incremented: Schema.Struct({ by: Schema.Number }),
})

const counter = defineThread({
  kind: 'counter',
  shape: Schema.Struct({ count: Schema.Number }),
  initialState: () => ({ count: 0 }),
  step(state, event) {
    if (event.type === 'counter.incremented') {
      const by = Schema.decodeUnknownSync(Schema.Struct({ by: Schema.Number }))(event.payload).by
      return { count: state.count + by }
    }

    return state
  },
})

const registry = composeModules([
  defineRuntimeModule({
    namespace: 'counter',
    protocolVersion: '1.0.0',
    events: counterCatalog,
    threads: { counter },
  }),
])

describe('advanceCursor', () => {
  test('advances seq and durableSinceSnapshot, skipping ephemeral events', () => {
    const runId = 'run_c'
    const threadId = 'thr_c'

    const started = createEvent(
      runId,
      {
        type: 'runtime.thread.started',
        payload: { threadId, kind: 'counter', definitionName: 'c', input: null },
        threadId,
        origin: { type: 'system' },
      },
      { seq: 1 },
    )

    const delta = createEvent(
      runId,
      {
        type: 'agent.turn.text_delta',
        payload: { text: 'hi' },
        threadId,
        ephemeral: true,
        origin: { type: 'system' },
      },
      { seq: 2 },
    )

    const inc = createEvent(
      runId,
      {
        type: 'counter.incremented',
        payload: { by: 3 },
        threadId,
        origin: { type: 'system' },
      },
      { seq: 3 },
    )

    const cursor = advanceCursor(emptyCursor(runId), [started, delta, inc], registry)
    expect(cursor.seq).toBe(3)
    expect(cursor.durableSinceSnapshot).toBe(2)
    expect(cursor.state.threads[threadId]?.state).toEqual({ count: 3 })
  })

  test('resets durableSinceSnapshot on snapshot.taken', () => {
    const runId = 'run_snap'

    const started = createEvent(
      runId,
      {
        type: 'runtime.run.started',
        payload: { rootThreadId: 't', kind: 'counter', definitionName: 'c', input: null },
        threadId: null,
        origin: { type: 'system' },
      },
      { seq: 1 },
    )

    const snap = createEvent(
      runId,
      {
        type: 'runtime.snapshot.taken',
        payload: { seq: 1, stateHash: 'abc' },
        threadId: null,
        origin: { type: 'system' },
      },
      { seq: 2 },
    )

    const cursor = advanceCursor(emptyCursor(runId), [started, snap], registry)
    expect(cursor.seq).toBe(2)
    expect(cursor.durableSinceSnapshot).toBe(0)
  })
})

describe('assignSequences', () => {
  test('assigns sequences 1:1', () => {
    const runId = 'run_as'

    const batch = [
      createEvent(runId, { type: 'a', payload: {}, threadId: null, origin: { type: 'system' } }),
      createEvent(runId, { type: 'b', payload: {}, threadId: null, origin: { type: 'system' } }),
    ]

    const assigned = assignSequences(batch, { sequences: [10, 11], tail: 11 })
    expect(assigned.map((e) => e.seq)).toEqual([10, 11])
  })

  test('throws on length mismatch', () => {
    const runId = 'run_as'

    const batch = [
      createEvent(runId, { type: 'a', payload: {}, threadId: null, origin: { type: 'system' } }),
    ]

    expect(() => assignSequences(batch, { sequences: [1, 2], tail: 2 })).toThrow(
      'assignSequences length mismatch',
    )
  })
})
