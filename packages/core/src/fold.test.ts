import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { defineEventCatalog } from './catalog'
import { complete, invoke, wait } from './effects'
import { createEvent } from './envelope'
import { foldRun } from './fold'
import { createEffectId } from './ids'
import { composeModules, defineRuntimeModule } from './index'
import { matchesWait, isSubset } from './match'
import { foldProjection, threadTree, toThreadTree } from './projection'
import { replayTo } from './replay'
import { buildSnapshotEvent, foldFromSnapshots } from './snapshots'
import { defineThread } from './thread'

const counterCatalog = defineEventCatalog('counter', {
  incremented: Schema.Struct({ by: Schema.Number }),
})

const counter = defineThread<{ count: number }>({
  kind: 'counter',
  initialState: () => ({ count: 0 }),
  step(state, event) {
    switch (event.type) {
      case 'counter.incremented': {
        const by = Schema.decodeUnknownSync(Schema.Struct({ by: Schema.Number }))(event.payload).by
        return { count: state.count + by }
      }
      default:
        return state
    }
  },
  output(state) {
    if (state.count >= 2) {
      return { effects: [complete({ count: state.count })] }
    }
    return { effects: [invoke('counter.tick', { by: 1 })] }
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
        payload: {
          rootThreadId: threadId,
          kind: 'counter',
          definitionName: 'counter',
          input: null,
        },
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
        payload: {
          rootThreadId: threadId,
          kind: 'counter',
          definitionName: 'counter',
          input: null,
        },
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
      step(state, event) {
        if (event.type === 'runtime.wait.satisfied') {
          return { ready: true }
        }
        return state
      },
      output(state) {
        if (state.ready) {
          return { effects: [complete({ ready: true })] }
        }
        return { effects: [wait({ waitId: 'w1', on: { type: 'counter.incremented' } })] }
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

  test('satisfies multi-event wait when any matched event occurs', () => {
    const registry = composeModules([
      defineRuntimeModule({
        namespace: 'noop',
        protocolVersion: '1.0.0',
        threads: {
          agent: defineThread({
            kind: 'agent',
            initialState: () => ({}),
            step: (state) => state,
          }),
        },
      }),
    ])
    const runId = 'run_multi_wait_fold'
    const threadId = 'thr_parent'
    const events = assignSeq([
      createEvent(runId, {
        type: 'runtime.thread.started',
        payload: {
          threadId,
          kind: 'agent',
          definitionName: 'assistant',
          input: null,
          parentThreadId: null,
        },
        threadId,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.wait.registered',
        payload: {
          waitId: 'wait_child',
          threadId,
          on: {
            type: ['runtime.thread.completed', 'runtime.thread.failed'],
            match: { threadId: 'child' },
          },
          tag: { toolCallId: 'tc_1', name: 'checkout' },
        },
        threadId,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.wait.satisfied',
        payload: {
          waitId: 'wait_child',
          event: {
            id: 'ev_done',
            type: 'runtime.thread.completed',
            payload: { threadId: 'child', output: { ok: true } },
          },
        },
        threadId,
        origin: { type: 'system' },
      }),
    ])

    const state = foldRun(events, registry)
    expect(Object.keys(state.waits)).toEqual([])
    expect(state.threads[threadId]?.status).toBe('running')
  })

  test('unhandled effect.failed fails the thread and drops its waits', () => {
    const registry = composeModules([counterModule])
    const runId = 'run_fail'
    const threadId = 'thr_fail'
    const effectId = createEffectId(threadId, 2, 0)
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
      createEvent(runId, {
        type: 'runtime.wait.registered',
        payload: {
          waitId: 'w_orphan',
          threadId,
          on: { type: 'never.happens' },
        },
        threadId,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.effect.failed',
        payload: { effectId, error: 'Invalid input: amount: expected number' },
        threadId,
        effectId,
        origin: { type: 'system' },
      }),
    ])
    const state = foldRun(events, registry)
    expect(state.threads[threadId]?.status).toBe('failed')
    expect(state.threads[threadId]?.error).toBe('Invalid input: amount: expected number')
    expect(state.waits).toEqual({})
    expect(state.outstandingEffects).toEqual([])
  })

  test('withdrawn effect.failed does not fail the thread', () => {
    const registry = composeModules([counterModule])
    const runId = 'run_withdrawn'
    const threadId = 'thr_withdrawn'
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
      createEvent(runId, {
        type: 'runtime.effect.failed',
        payload: {
          effectId: createEffectId(threadId, 1, 1),
          error: 'withdrawn: sibling effect x failed',
        },
        threadId,
        effectId: createEffectId(threadId, 1, 1),
        origin: { type: 'system' },
      }),
    ])
    const state = foldRun(events, registry)
    expect(state.threads[threadId]?.status).toBe('running')
    expect(state.outstandingEffects[0]?.effect.type).toBe('counter.tick')
  })

  test('handled effect.failed leaves the thread running', () => {
    const handler = defineThread<{ saw: boolean }>({
      kind: 'handler',
      initialState: () => ({ saw: false }),
      step(state, event) {
        if (event.type === 'runtime.effect.failed') {
          return { saw: true }
        }
        return state
      },
      output(state) {
        if (state.saw) {
          return { effects: [invoke('handler.recover', {}, 'recover')] }
        }
        return { effects: [] }
      },
    })
    const registry = composeModules([
      defineRuntimeModule({
        namespace: 'handler',
        protocolVersion: '1.0.0',
        threads: { handler },
      }),
    ])
    const runId = 'run_handled'
    const threadId = 'thr_handled'
    const events = assignSeq([
      createEvent(runId, {
        type: 'runtime.thread.started',
        payload: {
          threadId,
          kind: 'handler',
          definitionName: 'handler',
          input: null,
          parentThreadId: null,
        },
        threadId,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.effect.failed',
        payload: { effectId: createEffectId(threadId, 1, 0), error: 'boom' },
        threadId,
        effectId: createEffectId(threadId, 1, 0),
        origin: { type: 'system' },
      }),
    ])
    const state = foldRun(events, registry)
    expect(state.threads[threadId]?.status).toBe('running')
    expect(state.threads[threadId]?.state).toEqual({ saw: true })
    expect(state.outstandingEffects[0]?.effect.type).toBe('handler.recover')
  })

  test('thread.failed clears waits and outstanding effects', () => {
    const registry = composeModules([counterModule])
    const runId = 'run_clear'
    const threadId = 'thr_clear'
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
      createEvent(runId, {
        type: 'runtime.wait.registered',
        payload: {
          waitId: 'w_clear',
          threadId,
          on: { type: 'never.happens' },
        },
        threadId,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.thread.failed',
        payload: { threadId, error: 'stopped' },
        threadId,
        origin: { type: 'system' },
      }),
    ])
    const state = foldRun(events, registry)
    expect(state.threads[threadId]?.status).toBe('failed')
    expect(state.waits).toEqual({})
    expect(state.outstandingEffects).toEqual([])
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
    expect(
      matchesWait(event, { type: ['other.event', 'gate.decided'], match: { gateId: 'a1' } }),
    ).toBe(true)
    expect(
      matchesWait(event, { type: ['other.event', 'third.event'], match: { gateId: 'a1' } }),
    ).toBe(false)
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

describe('foldFromSnapshots', () => {
  test('folds trailing events starting from the snapshot state', () => {
    const registry = composeModules([counterModule])
    const runId = 'run_snap'
    const threadId = 'thr_snap'

    const initialEvents = assignSeq([
      createEvent(runId, {
        type: 'runtime.run.started',
        payload: {
          rootThreadId: threadId,
          kind: 'counter',
          definitionName: 'counter',
          input: null,
        },
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
        origin: { type: 'thread', threadId },
      }),
    ])

    const snapshot = buildSnapshotEvent(runId, initialEvents, registry, { includeState: true })
    const snapshotWithSeq = { ...snapshot, seq: initialEvents.length + 1 }

    const trailingEvent = createEvent(
      runId,
      {
        type: 'counter.incremented',
        payload: { by: 1 },
        threadId,
        origin: { type: 'thread', threadId },
      },
      { seq: snapshotWithSeq.seq + 1 },
    )

    const allEvents = [...initialEvents, snapshotWithSeq, trailingEvent]
    const state = foldFromSnapshots(allEvents, registry, { runId })

    const thread = state.threads[threadId]
    expect(thread).toBeDefined()
    expect(thread?.state).toEqual({ count: 2 })
    expect(thread?.status).toBe('running')
    // At count: 2, complete effect is emitted
    expect(state.outstandingEffects.some((e) => e.effect.type === 'runtime.complete')).toBe(true)
  })
})

describe('threadTree projection', () => {
  test('tracks running, waiting, and satisfied wait statuses', () => {
    const runId = 'run_tree'
    const threadId = 'thr_tree'
    const waitId = 'wait_1'

    const e1 = createEvent(runId, {
      type: 'runtime.run.started',
      payload: { rootThreadId: threadId, kind: 'agent', definitionName: 'agent', input: null },
      threadId: null,
      origin: { type: 'system' },
    })
    const e2 = createEvent(runId, {
      type: 'runtime.thread.started',
      payload: {
        threadId,
        kind: 'agent',
        definitionName: 'agent',
        input: null,
        parentThreadId: null,
      },
      threadId,
      origin: { type: 'system' },
    })

    let projState = foldProjection(threadTree, [e1, e2])
    let tree = toThreadTree(projState)
    expect(tree.root?.status).toBe('running')

    const e3 = createEvent(runId, {
      type: 'runtime.wait.registered',
      payload: { waitId, on: { type: 'approval.decided' } },
      threadId,
      origin: { type: 'system' },
    })
    projState = foldProjection(threadTree, [e3], projState)
    tree = toThreadTree(projState)
    expect(tree.root?.status).toBe('waiting')

    const e4 = createEvent(runId, {
      type: 'runtime.wait.satisfied',
      payload: { waitId, event: { id: 'ev_dec', type: 'approval.decided', payload: {} } },
      threadId,
      origin: { type: 'system' },
    })
    projState = foldProjection(threadTree, [e4], projState)
    tree = toThreadTree(projState)
    expect(tree.root?.status).toBe('running')
  })

  test('tracks thread status when multi-event child wait is satisfied', () => {
    const runId = 'run_child_wait'
    const parentId = 'thr_parent'
    const childId = 'thr_child'
    const tag = { toolCallId: 'tc_1', name: 'checkout' }

    const events = [
      createEvent(runId, {
        type: 'runtime.run.started',
        payload: {
          rootThreadId: parentId,
          kind: 'agent',
          definitionName: 'assistant',
          input: null,
        },
        threadId: null,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.thread.started',
        payload: {
          threadId: parentId,
          kind: 'agent',
          definitionName: 'assistant',
          input: null,
          parentThreadId: null,
        },
        threadId: parentId,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.wait.registered',
        payload: {
          waitId: 'wait_child',
          on: {
            type: ['runtime.thread.completed', 'runtime.thread.failed'],
            match: { threadId: childId },
          },
          tag,
        },
        threadId: parentId,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.thread.started',
        payload: {
          threadId: childId,
          kind: 'workflow',
          definitionName: 'checkout',
          input: null,
          parentThreadId: parentId,
        },
        threadId: childId,
        origin: { type: 'system' },
      }),
    ]

    let projState = foldProjection(threadTree, events)
    expect(toThreadTree(projState).root?.status).toBe('waiting')
    expect(projState.activeWaits?.[parentId]).toEqual(['wait_child'])

    projState = foldProjection(
      threadTree,
      [
        createEvent(runId, {
          type: 'runtime.wait.satisfied',
          payload: {
            waitId: 'wait_child',
            tag,
            event: {
              id: 'ev_child_done',
              type: 'runtime.thread.completed',
              payload: { threadId: childId, output: { ok: true } },
            },
          },
          threadId: parentId,
          origin: { type: 'system' },
        }),
      ],
      projState,
    )

    const tree = toThreadTree(projState)
    expect(tree.root?.status).toBe('running')
    expect(projState.activeWaits?.[parentId]).toEqual([])
  })

  test('preserves parent activeWaits when a child thread starts', () => {
    const runId = 'run_preserve_waits'
    const parentId = 'thr_parent'
    const childId = 'thr_child'

    let projState = foldProjection(threadTree, [
      createEvent(runId, {
        type: 'runtime.run.started',
        payload: {
          rootThreadId: parentId,
          kind: 'agent',
          definitionName: 'assistant',
          input: null,
        },
        threadId: null,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.thread.started',
        payload: {
          threadId: parentId,
          kind: 'agent',
          definitionName: 'assistant',
          input: null,
          parentThreadId: null,
        },
        threadId: parentId,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.wait.registered',
        payload: { waitId: 'wait_1', on: { type: 'approval.decided' }, tag: { toolCallId: 't1' } },
        threadId: parentId,
        origin: { type: 'system' },
      }),
    ])
    expect(projState.activeWaits?.[parentId]).toEqual(['wait_1'])

    projState = foldProjection(
      threadTree,
      [
        createEvent(runId, {
          type: 'runtime.thread.started',
          payload: {
            threadId: childId,
            kind: 'workflow',
            definitionName: 'checkout',
            input: null,
            parentThreadId: parentId,
          },
          threadId: childId,
          origin: { type: 'system' },
        }),
      ],
      projState,
    )

    expect(projState.activeWaits?.[parentId]).toEqual(['wait_1'])
    expect(toThreadTree(projState).root?.status).toBe('waiting')
  })

  test('defineThread with shape infers state type', () => {
    const threadShape = Schema.Struct({ count: Schema.Number })
    const thread = defineThread({
      kind: 'shaped_counter',
      shape: threadShape,
      initialState: () => ({ count: 0 }),
      step(state) {
        return { count: state.count + 1 }
      },
    })
    expect(thread.kind).toBe('shaped_counter')
    expect(thread.shape).toBe(threadShape)
    const initial = thread.initialState({
      runId: 'r1',
      threadId: 't1',
      parentThreadId: null,
      definitionName: 'test',
      input: null,
    })
    expect(initial).toEqual({ count: 0 })
    const stepped = thread.step(initial, createEvent('r1', { type: 'tick', payload: {} }), {
      runId: 'r1',
      threadId: 't1',
      parentThreadId: null,
    })
    expect(stepped).toEqual({ count: 1 })
  })

  test('thread with step and output derives enabled effects from state', () => {
    type LightState = { phase: 'green' | 'yellow' | 'red'; ticks: number }
    const trafficLight = defineThread<LightState>({
      kind: 'traffic_light',
      initialState: () => ({ phase: 'green', ticks: 0 }),
      step(state, event) {
        if (event.type === 'tick') {
          if (state.phase === 'green') return { phase: 'yellow', ticks: state.ticks + 1 }
          if (state.phase === 'yellow') return { phase: 'red', ticks: state.ticks + 1 }
          return { phase: 'green', ticks: state.ticks + 1 }
        }
        return state
      },
      output(state) {
        if (state.phase === 'green') {
          return { effects: [invoke('drive', { speed: 30 }, 'drive-now')] }
        }
        if (state.phase === 'yellow') {
          return { effects: [invoke('slow', { speed: 10 }, 'slow-now')] }
        }
        return { effects: [invoke('stop', {}, 'stop-now')] }
      },
    })

    const registry = composeModules([
      defineRuntimeModule({
        namespace: 'traffic',
        protocolVersion: '1.0.0',
        threads: { traffic_light: trafficLight },
      }),
    ])

    const runId = 'run_tl'
    const threadId = 'thr_tl'
    const startEvent = createEvent(runId, {
      type: 'runtime.thread.started',
      payload: {
        threadId,
        kind: 'traffic_light',
        definitionName: 'traffic_light',
        input: null,
      },
      threadId,
      origin: { type: 'system' },
    })

    // Green phase -> output should be 'drive'
    const state1 = foldRun([startEvent], registry)
    expect(state1.threads[threadId]?.state).toEqual({ phase: 'green', ticks: 0 })
    expect(state1.outstandingEffects).toHaveLength(1)
    expect(state1.outstandingEffects[0]?.effectId).toBe(createEffectId(threadId, 'drive-now'))

    // Tick -> phase becomes 'yellow', drive is removed, slow is enabled
    const tickEvent = createEvent(runId, {
      type: 'tick',
      payload: {},
      threadId,
      origin: { type: 'system' },
    })
    const state2 = foldRun([startEvent, tickEvent], registry)
    expect(state2.threads[threadId]?.state).toEqual({ phase: 'yellow', ticks: 1 })
    expect(state2.outstandingEffects).toHaveLength(1)
    expect(state2.outstandingEffects[0]?.effectId).toBe(createEffectId(threadId, 'slow-now'))

    // Outcome for slow-now arrives -> effect completes and is cleared
    const outcomeEvent = createEvent(runId, {
      type: 'slow.completed',
      payload: {},
      threadId,
      effectId: createEffectId(threadId, 'slow-now'),
      origin: { type: 'system' },
    })
    const state3 = foldRun([startEvent, tickEvent, outcomeEvent], registry)
    expect(state3.threads[threadId]?.state).toEqual({ phase: 'yellow', ticks: 1 })
    expect(state3.outstandingEffects).toHaveLength(0)
    expect(state3.completedEffectIds).toContain(createEffectId(threadId, 'slow-now'))
  })
})
