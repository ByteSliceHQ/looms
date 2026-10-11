import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import { defineEventCatalog } from './catalog'
import { complete, invoke } from './effects'
import { createEvent, type EventEnvelope, type EventInput } from './envelope'
import { foldRun } from './fold'
import { planFork } from './fork'
import { createEffectId } from './ids'
import { composeModules, defineRuntimeModule } from './index'
import { defineThread } from './thread'

const counterCatalog = defineEventCatalog('counter', {
  incremented: Schema.Struct({ by: Schema.Finite }),
})

const decodeIncrement = Schema.decodeUnknownSync(Schema.Struct({ by: Schema.Finite }))

const counter = defineThread({
  kind: 'counter',
  shape: Schema.Struct({ count: Schema.Finite }),
  initialState: () => ({ count: 0 }),
  step(state, event) {
    return event.type === 'counter.incremented'
      ? { count: state.count + decodeIncrement(event.payload).by }
      : state
  },
  effects(state) {
    return state.count >= 2 ? [complete({ count: state.count })] : [invoke('counter.tick', {})]
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

const sourceRunId = 'run_source'
const threadId = 'thr_root'
const tickEffectId = createEffectId(threadId, 2, 0)

function history(...rest: EventInput[]): EventEnvelope[] {
  return [
    {
      type: 'runtime.run.started',
      payload: { rootThreadId: threadId, kind: 'counter', definitionName: 'counter', input: null },
      threadId: null,
      idempotencyKey: 'start-key',
    },
    {
      type: 'runtime.thread.started',
      payload: {
        threadId,
        kind: 'counter',
        definitionName: 'counter',
        input: null,
        parentThreadId: null,
      },
      threadId,
    },
    ...rest,
  ].map((input, index) => createEvent(sourceRunId, input, { seq: index + 1 }))
}

function fork(events: EventEnvelope[]) {
  return Effect.runSync(planFork({ sourceRunId, runId: 'run_fork', events, registry }))
}

describe('planFork', () => {
  test('re-issues the effect whose failure ended the run', () => {
    const events = history(
      {
        type: 'counter.progress',
        payload: { text: 'partial' },
        threadId,
        effectId: tickEffectId,
        ephemeral: true,
      },
      {
        type: 'runtime.snapshot.taken',
        payload: { seq: 3, stateHash: 'abc', state: { runId: sourceRunId } },
        threadId: null,
      },
      {
        id: 'evt_tick_failed',
        type: 'runtime.effect.failed',
        payload: { effectId: tickEffectId, error: 'boom' },
        threadId,
        effectId: tickEffectId,
      },
      {
        type: 'runtime.thread.failed',
        payload: { threadId, error: 'boom' },
        threadId,
        causationId: 'evt_tick_failed',
      },
      { type: 'runtime.run.completed', payload: { output: null, error: 'boom' }, threadId: null },
    )

    const plan = fork(events)

    expect(plan.sourceSeq).toBe(4)
    expect(plan.events.map((event) => event.seq)).toEqual([1, 2, 3, 4, 5])
    expect(plan.events.every((event) => event.runId === 'run_fork')).toBe(true)
    expect(plan.events[0]?.idempotencyKey).toBeNull()

    expect(plan.events[2]).toMatchObject({
      type: 'runtime.fork.elided',
      payload: { type: 'counter.progress' },
      ephemeral: true,
    })

    expect(plan.events[3]?.payload).toEqual({ seq: 3, stateHash: 'abc' })

    expect(plan.events[4]).toMatchObject({
      type: 'runtime.run.forked',
      payload: { sourceRunId, sourceSeq: 4 },
    })

    const state = foldRun(plan.events, registry)

    expect(state.runId).toBe('run_fork')
    expect(state.status).toBe('running')
    expect(state.threads[threadId]?.status).toBe('running')
    expect(state.outstandingEffects.map((item) => item.effectId)).toEqual([tickEffectId])
    expect(state.forkedFrom).toEqual({ runId: sourceRunId, seq: 4 })
    expect(state.startIdentity?.idempotencyKey).toBeNull()
  })

  test('leaves out the whole cancellation of the root, from where it began', () => {
    const events = history(
      {
        type: 'runtime.effect.cancelled',
        payload: { effectId: tickEffectId, attempt: 1 },
        threadId,
        effectId: tickEffectId,
      },
      {
        type: 'runtime.thread.cancelled',
        payload: { threadId, reason: 'cancelled', resumeSeq: 2 },
        threadId,
      },
      { type: 'runtime.run.cancelled', payload: {}, threadId: null },
    )

    const plan = fork(events)
    const state = foldRun(plan.events, registry)

    expect(plan.sourceSeq).toBe(2)
    expect(plan.rootThreadId).toBe(threadId)
    expect(state.status).toBe('running')
    expect(state.outstandingEffects.map((item) => item.effectId)).toEqual([tickEffectId])
  })

  test('cuts at the root cancellation when it did not record where it began', () => {
    const events = history(
      {
        type: 'runtime.thread.cancelled',
        payload: { threadId, reason: 'cancelled' },
        threadId,
      },
      { type: 'runtime.run.cancelled', payload: {}, threadId: null },
    )

    expect(fork(events).sourceSeq).toBe(2)
  })

  test('stops before the root completes', () => {
    const events = history(
      {
        type: 'counter.incremented',
        payload: { by: 2 },
        threadId,
        effectId: tickEffectId,
      },
      {
        type: 'runtime.thread.completed',
        payload: { threadId, output: { count: 2 } },
        threadId,
        effectId: createEffectId(threadId, 3, 0),
      },
      { type: 'runtime.run.completed', payload: { output: null, error: null }, threadId: null },
    )

    const plan = fork(events)
    const state = foldRun(plan.events, registry)

    expect(plan.sourceSeq).toBe(3)
    expect(state.threads[threadId]?.state).toEqual({ count: 2 })
    expect(state.outstandingEffects.map((item) => item.effect.type)).toEqual(['runtime.complete'])
  })

  test('rejects a history that does not start at seq 1', () => {
    const events = history({ type: 'counter.incremented', payload: { by: 1 }, threadId }).slice(1)

    expect(() =>
      Effect.runSync(planFork({ sourceRunId, runId: 'run_fork', events, registry })),
    ).toThrow('does not have its full history')
  })
})
