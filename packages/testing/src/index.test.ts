import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import {
  complete,
  defineEffect,
  defineEventCatalog,
  defineRuntimeModule,
  defineThread,
  invoke,
  makeMemoryEventStore,
  payload,
  wait,
} from '@looms/core'
import { createLooms, RunOverloadedError } from '@looms/runtime'

import {
  assertReplayDeterministic,
  createFaultInjectingEventStore,
  createTestRuntime,
  moduleConformance,
} from './index'

const sample = defineRuntimeModule({
  namespace: 'sample',
  protocolVersion: '1.0.0',
  events: defineEventCatalog('sample', {
    ping: payload<{ n: number }>(),
  }),
})

describe('moduleConformance', () => {
  test('valid module has no errors', () => {
    expect(moduleConformance(sample)).toEqual([])
  })

  test('flags catalog namespace mismatch', () => {
    const broken = defineRuntimeModule({
      namespace: 'other',
      protocolVersion: '1.0.0',
      events: defineEventCatalog('sample', {
        ping: payload<{ n: number }>(),
      }),
    })

    expect(moduleConformance(broken).some((msg) => msg.includes('catalog namespace'))).toBe(true)
  })
})

describe('createTestRuntime', () => {
  test('folds an empty run deterministically', async () => {
    const testRuntime = await createTestRuntime([sample])
    const runId = 'run_test'
    await assertReplayDeterministic(testRuntime, runId)
    const events = await testRuntime.run(testRuntime.runtime.getEvents(runId))
    expect(events).toEqual([])
  })
})

const ingressDefinition = { kind: 'ingress-test', name: 'ingress-test' }

function ingressModule(onDispatch: () => void) {
  const runOnce = defineEffect({
    type: 'ingress.run',
    execute: (_input, ctx) => {
      onDispatch()
      return [{ type: 'ingress.done', payload: {}, threadId: ctx.threadId }]
    },
  })

  return defineRuntimeModule({
    namespace: 'ingress',
    protocolVersion: '1.0.0',
    definitions: [ingressDefinition],
    effects: { runOnce },
    threads: {
      'ingress-test': defineThread({
        kind: 'ingress-test',
        shape: Schema.Struct({ ready: Schema.Boolean, done: Schema.Boolean }),
        initialState: () => ({ ready: false, done: false }),
        step: (state, event) => {
          if (event.type === 'ingress.go') {
            return { ...state, ready: true }
          }

          if (event.type === 'ingress.done') {
            return { ...state, done: true }
          }

          return state
        },
        effects: (state) =>
          state.done
            ? [complete({ ok: true })]
            : state.ready
              ? [invoke(runOnce, {}, 'run-once')]
              : [wait({ waitId: 'go', on: { type: 'ingress.go' } })],
      }),
    },
  })
}

describe('fault injection and concurrent ingress', () => {
  test('injects deterministic store failures without mutating the source', async () => {
    const source = await Effect.runPromise(makeMemoryEventStore)

    const faulted = createFaultInjectingEventStore(source, ({ operation, call }) => {
      if (operation === 'append' && call === 1) {
        throw new Error('planned outage')
      }
    })

    expect(
      Effect.runPromise(
        faulted.store.append('run_fault', [
          {
            type: 'probe.event',
            payload: {},
            threadId: null,
            eventId: 'evt_fault',
            timestamp: 1,
            origin: { type: 'system' },
          },
        ]),
      ),
    ).rejects.toThrow('Injected append fault')

    expect(await Effect.runPromise(source.tail('run_fault'))).toBe(0)
    expect(faulted.calls.get('append')).toBe(1)
  })

  test('bounded local load keeps one dispatch and monotonic sequences', async () => {
    let dispatches = 0

    const looms = createLooms({
      modules: [ingressModule(() => dispatches++)],
      maxPendingRunOperations: 128,
    })

    const runId = 'run_concurrent_ingress'

    const started = await Promise.all(
      Array.from({ length: 32 }, () =>
        looms.start(ingressDefinition, {}, { runId, idempotencyKey: 'same-start' }),
      ),
    )

    expect(new Set(started.map((item) => item.runId))).toEqual(new Set([runId]))

    await Promise.all(
      Array.from({ length: 64 }, () =>
        looms.signal(runId, [{ type: 'ingress.go', payload: {}, threadId: started[0]!.threadId }], {
          idempotencyKey: 'same-signal',
        }),
      ),
    )

    const events = await looms.getEvents(runId)
    expect(dispatches).toBe(1)
    expect(events.filter((event) => event.type === 'runtime.run.started')).toHaveLength(1)
    expect(events.filter((event) => event.type === 'ingress.go')).toHaveLength(1)

    expect(events.map((event) => event.seq)).toEqual(
      Array.from({ length: events.length }, (_, index) => index + 1),
    )

    await looms.stop()
  })

  test('rejects excess per-run work instead of growing an unbounded queue', async () => {
    let release!: () => void

    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })

    const source = await Effect.runPromise(makeMemoryEventStore)
    let pauseReads = false

    const faulted = createFaultInjectingEventStore(source, ({ operation }) =>
      operation === 'read' && pauseReads ? blocked : undefined,
    )

    const looms = createLooms({
      store: faulted.store,
      modules: [ingressModule(() => undefined)],
      maxPendingRunOperations: 2,
    })

    const started = await looms.start(ingressDefinition, {})
    pauseReads = true

    const first = looms.signal(started.runId, [
      { type: 'probe.one', payload: {}, threadId: started.threadId },
    ])

    await Bun.sleep(5)

    const second = looms.signal(started.runId, [
      { type: 'probe.two', payload: {}, threadId: started.threadId },
    ])

    await Bun.sleep(5)

    expect(
      looms.signal(started.runId, [
        { type: 'probe.three', payload: {}, threadId: started.threadId },
      ]),
    ).rejects.toBeInstanceOf(RunOverloadedError)

    pauseReads = false
    release()
    await Promise.all([first, second])
    await looms.stop()
  })
})
