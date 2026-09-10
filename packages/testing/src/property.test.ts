import { describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'
import fc from 'fast-check'

import {
  buildSnapshotEvent,
  composeModules,
  createEvent,
  defineThread,
  foldFromSnapshots,
  foldRun,
  type EventEnvelope,
  type RuntimeModule,
} from '@looms/core'

describe('Property-based testing for Looms core invariants', () => {
  const testModule: RuntimeModule = {
    namespace: 'counter',
    protocolVersion: '1.0.0',
    threads: [
      defineThread<{ count: number; history: string[] }>({
        kind: 'counter',
        initialState: () => ({ count: 0, history: [] }),
        step(state, event) {
          if (event.type === 'counter.increment') {
            const step =
              Predicate.isObject(event.payload) && Predicate.isNumber(event.payload.step)
                ? event.payload.step
                : 1
            return {
              count: state.count + step,
              history: [...state.history, `+${step}`],
            }
          }
          if (event.type === 'counter.decrement') {
            const step =
              Predicate.isObject(event.payload) && Predicate.isNumber(event.payload.step)
                ? event.payload.step
                : 1
            return {
              count: state.count - step,
              history: [...state.history, `-${step}`],
            }
          }
          if (event.type === 'counter.reset') {
            return { count: 0, history: [...state.history, 'reset'] }
          }
          return state
        },
      }),
    ],
  }

  const registry = composeModules([testModule])
  const runId = 'run_prop_test'
  const threadId = 'thr_prop_counter'

  const arbitraryCounterAction = fc.record({
    type: fc.constantFrom('counter.increment', 'counter.decrement', 'counter.reset'),
    step: fc.integer({ min: 1, max: 100 }),
    idempotencyKey: fc.option(fc.string({ minLength: 1, maxLength: 8 }), { nil: undefined }),
  })

  function buildEventStream(
    actions: Array<{ type: string; step: number; idempotencyKey?: string }>,
  ): EventEnvelope[] {
    const events: EventEnvelope[] = [
      createEvent(
        runId,
        {
          type: 'runtime.run.started',
          payload: { rootThreadId: threadId, kind: 'counter', definitionName: 'counter' },
          threadId: null,
          origin: { type: 'system' },
        },
        { seq: 1 },
      ),
      createEvent(
        runId,
        {
          type: 'runtime.thread.started',
          payload: { threadId, kind: 'counter', definitionName: 'counter' },
          threadId,
          origin: { type: 'system' },
        },
        { seq: 2 },
      ),
    ]

    let seq = 3
    for (const action of actions) {
      events.push(
        createEvent(
          runId,
          {
            type: action.type,
            payload: { step: action.step },
            threadId,
            origin: { type: 'external' },
            idempotencyKey: action.idempotencyKey,
          },
          { seq: seq++ },
        ),
      )
    }
    return events
  }

  test('Property 1: Pure fold determinism (fold is idempotent across runs)', () => {
    fc.assert(
      fc.property(fc.array(arbitraryCounterAction, { minLength: 0, maxLength: 30 }), (actions) => {
        const events = buildEventStream(actions)
        const state1 = foldRun(events, registry, { runId })
        const state2 = foldRun(events, registry, { runId })

        expect(state1).toEqual(state2)
      }),
      { numRuns: 100 },
    )
  })

  test('Property 2: Snapshot equivalence (snapshot at seq K matches continuous fold)', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryCounterAction, { minLength: 5, maxLength: 25 }),
        fc.integer({ min: 2, max: 10 }),
        (actions, splitOffset) => {
          const events = buildEventStream(actions)
          const fullState = foldRun(events, registry, { runId })

          const snapshotIndex = Math.min(splitOffset, events.length - 1)
          const prefixEvents = events.slice(0, snapshotIndex + 1)
          const trailingEvents = events.slice(snapshotIndex + 1)

          const snapshot = buildSnapshotEvent(runId, prefixEvents, registry, { includeState: true })
          const restoredState = foldFromSnapshots([snapshot, ...trailingEvents], registry, {
            runId,
          })

          // SAFETY: counter thread state schema is { count: number; history: string[] }
          const fullThread = fullState.threads[threadId]?.state as {
            count: number
            history: string[]
          }
          // SAFETY: counter thread state schema is { count: number; history: string[] }
          const restoredThread = restoredState.threads[threadId]?.state as {
            count: number
            history: string[]
          }

          expect(restoredThread.count).toBe(fullThread.count)
          expect(restoredThread.history).toEqual(fullThread.history)
          expect(restoredState.status).toBe(fullState.status)
        },
      ),
      { numRuns: 100 },
    )
  })

  test('Property 3: Idempotency keys are recorded without duplicates', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constant('counter.increment'),
            step: fc.integer({ min: 1, max: 10 }),
            idempotencyKey: fc.constantFrom('key_a', 'key_b', 'key_c'),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        (actions) => {
          const events = buildEventStream(actions)
          const state = foldRun(events, registry, { runId })

          const processed = state.processedIdempotencyKeys ?? []
          const uniqueKeys = new Set(processed)
          // Every key in processedIdempotencyKeys is unique
          expect(processed.length).toBe(uniqueKeys.size)
        },
      ),
      { numRuns: 50 },
    )
  })
})
