import { Schema } from 'effect'
import { describe, expect, test } from 'bun:test'
import { defineEventCatalog } from './catalog'
import { complete, invoke, wait } from './effects'
import { createEvent } from './envelope'
import { defineThread } from './thread'
import { foldRun } from './fold'
import { matchesWait, isSubset } from './match'
import { replayTo } from './replay'
import { composeModules, defineRuntimeModule } from './index'
import { createEffectId } from './ids'

const counterCatalog = defineEventCatalog('counter', {
  incremented: Schema.Struct({ by: Schema.Number }),
})

const counter = defineThread<{ count: number }>({
  kind: 'counter',
  initialState: () => ({ count: 0 }),
  reduce(state, event) {
    switch (event.type) {
      case 'runtime.thread.started':
        return { state, effects: [invoke('counter.tick', { by: 1 })] }
      case 'counter.incremented': {
        const by = Schema.decodeUnknownSync(Schema.Struct({ by: Schema.Number }))(event.payload).by
        const count = state.count + by
        if (count >= 2) {
          return { state: { count }, effects: [complete({ count })] }
        }
        return { state: { count }, effects: [invoke('counter.tick', { by: 1 })] }
      }
      default:
        return { state }
    }
  },
})

const counterModule = defineRuntimeModule({
  namespace: 'counter',
  protocolVersion: '1.0.0',
  events: counterCatalog,
  threads: { counter },
})

function assignSeq<T extends { seq: number }>(events: T[]): T[] {
  return events.map((event, index) => ({ ...event, seq: index + 1 }))
}

describe('foldRun', () => {
  test('creates a thread and records outstanding effects', () => {
    const registry = composeModules([counterModule])
    const runId = 'run_1'
    const threadId = 'thr_1'
    const events = assignSeq([
      createEvent(runId, {
        type: 'runtime.run.started',
        payload: { rootThreadId: threadId, kind: 'counter', definitionName: 'counter', input: null },
        threadId: null,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.thread.started',
        payload: {
          threadId,
          kind: 'counter',
          definitionName: 'counter',
          input: null,
          parentThreadId: null,
        },
        threadId,
        origin: { type: 'system' },
      }),
    ])

    const state = foldRun(events, registry)
    expect(state.rootThreadId).toBe(threadId)
    expect(state.threads[threadId]?.status).toBe('running')
    expect(state.threads[threadId]?.state).toEqual({ count: 0 })
    expect(state.outstandingEffects).toHaveLength(1)
    expect(state.outstandingEffects[0]?.effect.type).toBe('counter.tick')
    expect(state.outstandingEffects[0]?.effectId).toBe(createEffectId(threadId, 2, 0))
  })

  test('completes an effect when an outcome carries effectId', () => {
    const registry = composeModules([counterModule])
    const runId = 'run_2'
    const threadId = 'thr_2'
    const effectId = createEffectId(threadId, 2, 0)
    const events = assignSeq([
      createEvent(runId, {
        type: 'runtime.run.started',
        payload: { rootThreadId: threadId, kind: 'counter', definitionName: 'counter', input: null },
        threadId: null,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.thread.started',
        payload: {
          threadId,
          kind: 'counter',
          definitionName: 'counter',
          input: null,
          parentThreadId: null,
        },
        threadId,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'counter.incremented',
        payload: { by: 1 },
        threadId,
        effectId,
        origin: { type: 'system' },
      }),
    ])

    const state = foldRun(events, registry)
    expect(state.threads[threadId]?.state).toEqual({ count: 1 })
    expect(state.outstandingEffects).toHaveLength(1)
    expect(state.outstandingEffects[0]?.causingSeq).toBe(3)
  })

  test('registers and satisfies waits', () => {
    const waiter = defineThread<{ ready: boolean }>({
      kind: 'waiter',
      initialState: () => ({ ready: false }),
      reduce(state, event) {
        if (event.type === 'runtime.thread.started') {
          return { state, effects: [wait({ waitId: 'w1', on: { type: 'counter.incremented' } })] }
        }
        if (event.type === 'runtime.wait.satisfied') {
          return { state: { ready: true }, effects: [complete({ ready: true })] }
        }
        return { state }
      },
    })
    const registry = composeModules([
      defineRuntimeModule({
        namespace: 'waiter',
        protocolVersion: '1.0.0',
        threads: { waiter },
      }),
    ])
    const runId = 'run_3'
    const threadId = 'thr_3'
    const events = assignSeq([
      createEvent(runId, {
        type: 'runtime.thread.started',
        payload: {
          threadId,
          kind: 'waiter',
          definitionName: 'waiter',
          input: null,
          parentThreadId: null,
        },
        threadId,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.wait.registered',
        payload: {
          waitId: 'w1',
          threadId,
          on: { type: 'counter.incremented' },
        },
        threadId,
        effectId: createEffectId(threadId, 1, 0),
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.wait.satisfied',
        payload: {
          waitId: 'w1',
          event: { id: 'evt_x', type: 'counter.incremented', payload: { by: 1 } },
        },
        threadId,
        origin: { type: 'system' },
      }),
    ])

    const state = foldRun(events, registry)
    expect(state.threads[threadId]?.status).toBe('running')
    expect(state.threads[threadId]?.state).toEqual({ ready: true })
    expect(state.waits).toEqual({})
    expect(state.outstandingEffects[0]?.effect.type).toBe('runtime.complete')
  })
})

describe('match', () => {
  test('isSubset matches nested keys', () => {
    expect(isSubset({ approvalId: 'a1' }, { approvalId: 'a1', extra: true })).toBe(true)
    expect(isSubset({ approvalId: 'a2' }, { approvalId: 'a1' })).toBe(false)
  })

  test('matchesWait uses type + subset', () => {
    const event = createEvent('run', {
      type: 'gate.decided',
      payload: { gateId: 'a1', outcome: 'approve' },
      threadId: null,
      origin: { type: 'external' },
    })
    expect(matchesWait(event, { type: 'gate.decided', match: { gateId: 'a1' } })).toBe(true)
    expect(matchesWait(event, { type: 'gate.decided', match: { gateId: 'nope' } })).toBe(false)
  })
})

describe('replayTo', () => {
  test('returns before/after and newly requested effects', () => {
    const registry = composeModules([counterModule])
    const runId = 'run_4'
    const threadId = 'thr_4'
    const events = assignSeq([
      createEvent(runId, {
        type: 'runtime.thread.started',
        payload: {
          threadId,
          kind: 'counter',
          definitionName: 'counter',
          input: null,
          parentThreadId: null,
        },
        threadId,
        origin: { type: 'system' },
      }),
    ])
    const step = replayTo(events, registry, 1)
    expect(step).not.toBeNull()
    expect(step?.before.threads[threadId]).toBeUndefined()
    expect(step?.after.threads[threadId]?.kind).toBe('counter')
    expect(step?.effects[0]?.type).toBe('counter.tick')
  })
})
