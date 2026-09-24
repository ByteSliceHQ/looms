import { describe, expect, test } from 'bun:test'

import { Effect, Predicate, Schema } from 'effect'

import { agent, defineAgent } from '@looms/agent'
import {
  defineEffect,
  defineEventCatalog,
  defineModule,
  defineRuntimeModule,
  defineThread,
  EventStoreTrimmedError,
  createEvent,
  snapshotStoreOf,
  complete,
  invoke,
  InvalidEventError,
  makeMemoryEventStore,
  makeMemorySnapshotStore,
  wait,
  type EventStore,
} from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLooms } from './looms'
import { type WakeScheduler } from './runtime'

describe('createLooms runtime', () => {
  test('createLooms defaults a snapshot store so trim recovery works without one being passed', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const echo = defineAgent({
      name: 'default-snap',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'ok' },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({
      modules: [agent({ definitions: [echo] })],
      store,
      snapshotEvery: 1,
    })

    const { runId, state } = await looms.start(echo, 'hi')
    expect(state.status).toBe('completed')
    expect(snapshotStoreOf(store)).toBeDefined()

    const latest = await Effect.runPromise(snapshotStoreOf(store)!.loadLatest(runId))
    expect(latest._tag).toBe('Some')

    if (latest._tag === 'Some') {
      await Effect.runPromise(store.trim!(runId, latest.value.cursor + 1))
    }

    const restored = await looms.getRun(runId)
    expect(restored.status).toBe('completed')
    await looms.stop()
  })

  test('trimmed store with a snapshot loads without error', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)

    const echo = defineAgent({
      name: 'snap-echo',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'ok' },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({
      modules: [agent({ definitions: [echo] })],
      store,
      snapshotStore: snapshots,
      snapshotEvery: 1,
    })

    const { runId, state } = await looms.start(echo, 'hi')
    expect(state.status).toBe('completed')
    const latest = await Effect.runPromise(snapshots.loadLatest(runId))
    expect(latest._tag).toBe('Some')

    if (latest._tag === 'Some') {
      await Effect.runPromise(store.trim!(runId, latest.value.cursor + 1))
    }

    const looms2 = createLooms({
      modules: [agent({ definitions: [echo] })],
      store,
      snapshotStore: snapshots,
    })

    const restored = await looms2.getRun(runId)
    expect(restored.status).toBe('completed')
    await looms.stop()
    await looms2.stop()
  })

  test('trimmed store without a snapshot fails with EventStoreTrimmedError', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_trimmed_no_snap'

    await Effect.runPromise(
      store.append(runId, [
        createEvent(runId, {
          type: 'runtime.run.started',
          payload: { rootThreadId: 't', kind: 'echo', definitionName: 'e', input: null },
          threadId: null,
          origin: { type: 'system' },
        }),
        createEvent(runId, {
          type: 'runtime.thread.started',
          payload: { threadId: 't', kind: 'echo', definitionName: 'e', input: null },
          threadId: 't',
          origin: { type: 'system' },
        }),
        createEvent(runId, {
          type: 'probe.event',
          payload: {},
          threadId: null,
          origin: { type: 'system' },
        }),
      ]),
    )

    await Effect.runPromise(store.trim!(runId, 3))

    const echo = defineAgent({ name: 'trim-echo', instructions: 'echo' })

    const looms = createLooms({
      modules: [agent({ definitions: [echo] })],
      store,
    })

    let caught: unknown

    try {
      await looms.getRun(runId)
    } catch (err) {
      caught = err
    }

    expect(caught).toBeInstanceOf(EventStoreTrimmedError)
    await looms.stop()
  })

  test('a leading fence does not look like a trimmed log', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_fence_head'

    const echo = defineAgent({
      name: 'fence-head',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'ok' },
        done: true,
        output: input,
      }),
    })

    await Effect.runPromise(
      store.append(
        runId,
        [
          createEvent(runId, {
            type: 'runtime.run.started',
            payload: { rootThreadId: 't', kind: 'echo', definitionName: 'e', input: null },
            threadId: null,
            origin: { type: 'system' },
          }),
        ],
        { fence: 'tok-a' },
      ),
    )

    const looms = createLooms({
      modules: [agent({ definitions: [echo] })],
      store,
    })

    const state = await looms.getRun(runId)
    expect(state.status).toBe('running')
    await looms.stop()
  })

  test('cached cursor behind a trim falls back to the snapshot path', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)
    const runId = 'run_cache_trim'

    const events = Array.from({ length: 6 }, (_, i) =>
      createEvent(runId, {
        type: i === 0 ? 'runtime.run.started' : 'probe.event',
        payload:
          i === 0 ? { rootThreadId: 't', kind: 'echo', definitionName: 'e', input: null } : { i },
        threadId: null,
        origin: { type: 'system' },
      }),
    )

    await Effect.runPromise(store.append(runId, events))
    const echo = defineAgent({ name: 'cache-trim', instructions: 'echo' })

    const looms = createLooms({
      modules: [agent({ definitions: [echo] })],
      store,
      snapshotStore: snapshots,
    })

    const before = await looms.getRun(runId)
    expect(before.status).toBe('running')

    await Effect.runPromise(
      snapshots.save({
        runId,
        cursor: 6,
        stateHash: 'h',
        takenAt: Date.now(),
        state: before,
      }),
    )

    await Effect.runPromise(
      store.append(runId, [
        createEvent(runId, {
          type: 'probe.event',
          payload: { i: 7 },
          threadId: null,
          origin: { type: 'system' },
        }),
      ]),
    )

    await Effect.runPromise(store.trim!(runId, 7))

    const after = await looms.getRun(runId)
    expect(after.status).toBe('running')
    await looms.stop()
  })

  test('trimAfterSnapshot keeps only the latest snapshot cursor in the log', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)

    const stepper = defineWorkflow({
      name: 'snap-trim',
      nodes: [
        { id: 'a', run: () => ({ n: 1 }) },
        { id: 'b', deps: ['a'], run: () => ({ n: 2 }) },
        { id: 'c', deps: ['b'], run: () => ({ n: 3 }) },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [stepper] })],
      store,
      snapshotStore: snapshots,
      snapshotEvery: 2,
      trimAfterSnapshot: {
        keepSnapshots: 1,
        coverage: () => ({ archiveCursor: Number.MAX_SAFE_INTEGER }),
      },
    })

    const { runId } = await looms.start(stepper, {})
    const bounds = await Effect.runPromise(store.bounds!(runId))
    expect(bounds.head).toBeGreaterThan(1)
    const cursors = await Effect.runPromise(snapshots.listCursors!(runId))
    expect(cursors.length).toBe(1)
    await looms.stop()
  })

  test('an in-process wake mutex serializes concurrent wakes on the same run', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    let release!: () => void
    let dispatches = 0

    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })

    const slow = defineWorkflow({
      name: 'wake-mutex',
      nodes: [
        {
          id: 'block',
          run: async () => {
            dispatches += 1
            await blocked
            return { ok: true }
          },
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [slow] })],
      store,
    })

    const started = looms.start(slow, {})
    await new Promise((resolve) => setTimeout(resolve, 30))
    const runId = (await Effect.runPromise(store.listRuns))[0]
    expect(runId).toBeDefined()

    let overlappingSettled = false

    const overlapping = looms.wake(runId!).then((state) => {
      overlappingSettled = true
      return state
    })

    await Bun.sleep(20)
    expect(overlappingSettled).toBe(false)
    expect(dispatches).toBe(1)
    release()
    const done = await started
    const overlappingState = await overlapping
    expect(done.state.status).toBe('completed')
    expect(overlappingState.status).toBe('completed')
    await looms.stop()
  })

  test('overlapping wakes receive the active wake failure', async () => {
    let entered!: () => void
    let release!: () => void

    const scheduleEntered = new Promise<void>((resolve) => {
      entered = resolve
    })

    const scheduleReleased = new Promise<void>((resolve) => {
      release = resolve
    })

    const scheduler = {
      schedule: () =>
        Effect.promise(() => {
          entered()
          return scheduleReleased
        }).pipe(Effect.andThen(Effect.fail(new Error('schedule failed')))),
      cancel: () => Effect.void,
    }

    const sleeper = defineWorkflow({
      name: 'wake-error-propagation',
      nodes: [
        {
          id: 'sleep',
          run: (ctx) =>
            ctx.effects([
              wait({ waitId: 'blocked-schedule', on: { timerAt: Date.now() + 60_000 } }),
            ]),
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [sleeper] })],
      // @ts-expect-error Deliberately inject a scheduler failure to verify wake error propagation.
      scheduler,
      rescanTimers: false,
    })

    const started = looms.start(sleeper, {})
    await scheduleEntered
    const [runId] = await looms.listRuns()
    const overlapping = looms.wake(runId!)

    release()

    const results = await Promise.allSettled([started, overlapping])
    expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected'])

    for (const result of results) {
      expect(result.status === 'rejected' ? String(result.reason) : '').toContain('schedule failed')
    }

    await looms.stop()
  })

  test('independent run ingress and wake contexts do not block each other', async () => {
    const inner = await Effect.runPromise(makeMemoryEventStore)
    let entered!: () => void
    let release!: () => void
    let blockedRunId: string | undefined

    const appendEntered = new Promise<void>((resolve) => {
      entered = resolve
    })

    const appendReleased = new Promise<void>((resolve) => {
      release = resolve
    })

    const store = {
      ...inner,
      append: (runId, events, options) => {
        if (runId === blockedRunId && events.some((event) => event.type === 'go')) {
          blockedRunId = undefined

          return Effect.gen(function* () {
            entered()
            yield* Effect.promise(() => appendReleased)
            return yield* inner.append(runId, events, options)
          })
        }

        return inner.append(runId, events, options)
      },
    } satisfies typeof inner

    const waiter = { kind: 'isolated-waiter', name: 'isolated-waiter' }

    const waiterModule = defineRuntimeModule({
      definitions: [waiter],
      namespace: 'isolated-waiter',
      protocolVersion: '1.0.0',
      threads: {
        'isolated-waiter': defineThread({
          kind: 'isolated-waiter',
          shape: Schema.Struct({ done: Schema.Boolean }),
          initialState: () => ({ done: false }),
          step: (state, event) => (event.type === 'go' ? { done: true } : state),
          effects: (state) =>
            state.done ? [complete({ ok: true })] : [wait({ waitId: 'w1', on: { type: 'go' } })],
        }),
      },
    })

    const looms = createLooms({ modules: [waiterModule], store })
    const first = await looms.start(waiter, {})
    const second = await looms.start(waiter, {})
    blockedRunId = first.runId

    const firstSignal = looms.signal(first.runId, [
      { type: 'go', payload: {}, threadId: first.threadId },
    ])

    await appendEntered

    const secondState = await Promise.race([
      looms.signal(second.runId, [{ type: 'go', payload: {}, threadId: second.threadId }]),
      Bun.sleep(100).then(() => {
        throw new Error('independent run was blocked by another run ingress')
      }),
    ])

    expect(secondState.status).toBe('completed')
    release()
    expect((await firstSignal).status).toBe('completed')
    await looms.stop()
  })

  test('a second runtime can continue a parked run from the shared store', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const waiter = { kind: 'waiter', name: 'actor-park' }

    const waiterModule = defineRuntimeModule({
      definitions: [waiter],
      namespace: 'actorpark',
      protocolVersion: '1.0.0',
      threads: {
        waiter: defineThread({
          kind: 'waiter',
          shape: Schema.Struct({ done: Schema.Boolean }),
          initialState: () => ({ done: false }),
          step: (state, event) => (event.type === 'go' ? { done: true } : state),
          effects: (state) =>
            state.done ? [complete({ ok: true })] : [wait({ waitId: 'w1', on: { type: 'go' } })],
        }),
      },
    })

    const a = createLooms({
      modules: [waiterModule],
      store,
    })

    const started = await a.start(waiter, {})
    expect(started.state.status).toBe('running')

    const b = createLooms({
      modules: [waiterModule],
      store,
    })

    const after = await b.signal(started.runId, [
      {
        type: 'go',
        payload: {},
        threadId: started.threadId,
        origin: { type: 'external' },
      },
    ])

    expect(after.status).toBe('completed')
    await a.stop()
    await b.stop()
  })

  test('wake writes no lease events onto the run log', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const echo = defineAgent({
      name: 'clean-log',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'ok' },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({
      modules: [agent({ definitions: [echo] })],
      store,
    })

    const { runId, state } = await looms.start(echo, 'hi')
    expect(state.status).toBe('completed')

    const events = await Effect.runPromise(store.read(runId))
    expect(events.some((event) => event.type.startsWith('runtime.lease.'))).toBe(false)
    expect(events.some((event) => event.type === 'runtime.snapshot.taken')).toBe(false)
    await looms.stop()
  })

  test('parking writes a snapshot at the log tail so the next wake starts cold and cheap', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)

    const waiter = { kind: 'waiter', name: 'park-snap' }

    const waiterModule = defineRuntimeModule({
      definitions: [waiter],
      namespace: 'parksnap',
      protocolVersion: '1.0.0',
      threads: {
        waiter: defineThread({
          kind: 'waiter',
          shape: Schema.Struct({ done: Schema.Boolean }),
          initialState: () => ({ done: false }),
          step: (state, event) => (event.type === 'go' ? { done: true } : state),
          effects: (state) =>
            state.done ? [complete({ ok: true })] : [wait({ waitId: 'w1', on: { type: 'go' } })],
        }),
      },
    })

    const looms = createLooms({
      modules: [waiterModule],
      store,
      snapshotStore: snapshots,
    })

    const started = await looms.start(waiter, {})
    expect(started.state.status).toBe('running')

    const parked = await Effect.runPromise(snapshots.loadLatest(started.runId))
    expect(parked._tag).toBe('Some')
    const tailAfterPark = await Effect.runPromise(store.tail(started.runId))

    if (parked._tag === 'Some') {
      expect(parked.value.cursor).toBe(tailAfterPark)
      expect(parked.value.state.status).toBe('running')
    }

    const readFrom: number[] = []

    const counting: EventStore = {
      ...store,
      read: (runId, options) =>
        Effect.gen(function* () {
          readFrom.push(options?.fromSeq ?? 1)
          return yield* store.read(runId, options)
        }),
    }

    const looms2 = createLooms({
      modules: [waiterModule],
      store: counting,
      snapshotStore: snapshots,
    })

    const after = await looms2.signal(started.runId, [
      { type: 'go', payload: {}, threadId: started.threadId, origin: { type: 'external' } },
    ])

    expect(after.status).toBe('completed')
    // rescan + signal + wake each read once, all from just past the park snapshot.
    expect(readFrom.length).toBeLessThanOrEqual(3)
    expect(readFrom.every((fromSeq) => fromSeq === tailAfterPark + 1)).toBe(true)

    const cursors = await Effect.runPromise(snapshots.listCursors!(started.runId))
    expect(cursors.length).toBe(1)
    await looms.stop()
    await looms2.stop()
  })

  test('a cached cursor is dropped when the stream tail moves backwards', async () => {
    const first = await Effect.runPromise(makeMemoryEventStore)
    const second = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_recreated'

    const started = (rootThreadId: string) =>
      createEvent(runId, {
        type: 'runtime.run.started',
        payload: { rootThreadId, kind: 'agent', definitionName: 'e', input: null },
        threadId: null,
        origin: { type: 'system' },
      })

    const probe = () =>
      createEvent(runId, {
        type: 'probe.event',
        payload: {},
        threadId: null,
        origin: { type: 'system' },
      })

    await Effect.runPromise(first.append(runId, [started('first'), probe(), probe()]))
    await Effect.runPromise(second.append(runId, [started('second')]))

    let inner = first

    const swappable: EventStore = {
      append: (storeRunId, events, options) => inner.append(storeRunId, events, options),
      read: (storeRunId, options) => inner.read(storeRunId, options),
      tail: (storeRunId) => inner.tail(storeRunId),
      bounds: (storeRunId) => inner.bounds!(storeRunId),
      subscribe: (storeRunId, options) => inner.subscribe(storeRunId, options),
      listRuns: inner.listRuns,
    }

    const echo = defineAgent({ name: 'recreated', instructions: 'echo' })

    const looms = createLooms({
      modules: [agent({ definitions: [echo] })],
      store: swappable,
      runCacheSize: 10,
    })

    const before = await looms.getRun(runId)
    expect(before.rootThreadId).toBe('first')

    inner = second
    const after = await looms.getRun(runId)
    expect(after.rootThreadId).toBe('second')
    await looms.stop()
  })

  test('pluggable WakeScheduler records schedule on park and cancel on completion', async () => {
    const scheduled: Array<{ runId: string; at: number }> = []
    const cancelled: string[] = []

    const fakeScheduler: WakeScheduler = {
      schedule: (runId, at) => Effect.sync(() => scheduled.push({ runId, at })).pipe(Effect.asVoid),
      cancel: (runId) => Effect.sync(() => cancelled.push(runId)).pipe(Effect.asVoid),
    }

    const targetTimerAt = Date.now() + 10_000

    const sleeper = defineWorkflow({
      name: 'sleeper-custom-scheduler',
      nodes: [
        {
          id: 'step1',
          run: (ctx) =>
            ctx.effects([
              wait({
                waitId: 'timer1',
                on: { timerAt: targetTimerAt },
              }),
            ]),
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [sleeper] })],
      scheduler: fakeScheduler,
      rescanTimers: false,
    })

    const { runId, state } = await looms.start(sleeper, {})
    expect(state.status).toBe('running')
    expect(scheduled.length).toBe(1)
    expect(scheduled[0]?.runId).toBe(runId)
    expect(scheduled[0]?.at).toBe(targetTimerAt)

    await looms.cancel(runId)
    expect(cancelled).toContain(runId)

    await looms.stop()
  })

  test('validates incoming signal events against catalog schemas and rejects invalid payloads', async () => {
    const testCatalog = defineEventCatalog('testmod', {
      ping: Schema.Struct({
        code: Schema.Finite,
      }),
    })

    const testMod = defineModule(
      {
        namespace: 'testmod',
        protocolVersion: '1.0.0',
        events: testCatalog,
      },
      () => ({}),
    )

    const echo = defineAgent({
      name: 'echo-test',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'done' },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({
      modules: [testMod, agent({ definitions: [echo] })],
    })

    const { runId } = await looms.start(echo, {})

    // Valid signal should succeed
    await looms.signal(runId, [
      {
        type: 'testmod.ping',
        payload: { code: 123 },
      },
    ])

    // Invalid signal should reject with InvalidEventError
    let threw = false

    try {
      await looms.signal(runId, [
        {
          type: 'testmod.ping',
          // @ts-expect-error deliberately passing invalid payload to verify runtime schema rejection
          payload: { code: 'not-a-number' },
        },
      ])
    } catch (err) {
      threw = true
      expect(err).toBeInstanceOf(InvalidEventError)
    }

    expect(threw).toBe(true)

    await looms.stop()
  })

  test('effect handler producing invalid event output becomes runtime.effect.failed', async () => {
    const schemaCatalog = defineEventCatalog('schematest', {
      validated: Schema.Struct({
        score: Schema.Finite,
      }),
    })

    const badOutputEffect = defineEffect({
      type: 'schematest.produceBad',
      execute: () => [
        {
          type: 'schematest.validated',
          // @ts-expect-error deliberately producing invalid payload to verify runtime error conversion
          payload: { score: 'not-a-number' },
        },
      ],
    })

    const mod = defineRuntimeModule({
      namespace: 'schematest',
      protocolVersion: '1.0.0',
      events: schemaCatalog,
      effects: { produceBad: badOutputEffect },
    })

    const worker = defineWorkflow({
      name: 'bad-effect-worker',
      nodes: [
        {
          id: 'step1',
          run: (ctx) => ctx.effects([invoke(badOutputEffect, {})]),
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [worker] }), mod],
    })

    const { runId } = await looms.start(worker, {})
    const events = await looms.getEvents(runId)
    const effectFailed = events.find((e) => e.type === 'runtime.effect.failed')
    expect(effectFailed).toBeDefined()
    expect(Predicate.isObject(effectFailed?.payload)).toBe(true)

    if (
      Predicate.isObject(effectFailed?.payload) &&
      Predicate.isString(effectFailed.payload.error)
    ) {
      expect(effectFailed.payload.error).toContain(
        'Invalid payload for event "schematest.validated"',
      )
    }

    await looms.stop()
  })
})
