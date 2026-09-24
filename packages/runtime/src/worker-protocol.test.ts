import { describe, expect, test } from 'bun:test'

import { Effect, Predicate } from 'effect'

import {
  complete,
  defineEffect,
  defineRuntimeModule,
  defineThread,
  invoke,
  makeMemoryEventStore,
  type EventEnvelope,
  type EventInput,
  type RetryPolicy,
} from '@looms/core'

import { createLooms, type EffectWorkerTask } from './index'

const workerDefinition = {
  kind: 'worker-test',
  name: 'worker-test',
  value: { kind: 'worker-test', name: 'worker-test' },
}

function workerModule(retry: RetryPolicy, execute?: () => ReadonlyArray<EventInput>) {
  const effect = defineEffect({
    type: 'worker.do',
    retry,
    execute,
  })

  return defineRuntimeModule({
    namespace: 'worker',
    protocolVersion: '1.0.0',
    effects: { effect },
    threads: {
      'worker-test': defineThread({
        kind: 'worker-test',
        initialState: () => ({ done: false }),
        step: (state, event) => (event.type === 'worker.done' ? { done: true } : state),
        effects: (state) =>
          state.done ? [complete({ ok: true })] : [invoke(effect, {}, 'worker-call')],
      }),
    },
    definitions: [workerDefinition],
  })
}

function effectIdentity(events: readonly EventEnvelope[]) {
  const queued = events.find((event) => event.type === 'runtime.effect.queued')
  const payload = queued?.payload

  if (!payload || Array.isArray(payload) || !Predicate.isReadonlyObject(payload)) {
    throw new Error('missing queued effect')
  }

  if (!Predicate.isString(payload.effectId) || !Predicate.isNumber(payload.attempt)) {
    throw new Error('invalid queued effect identity')
  }

  return { effectId: payload.effectId, attempt: payload.attempt }
}

function local(): ReadonlyArray<EventInput> {
  return [{ type: 'worker.done', payload: { local: true } }]
}

interface WorkerCallbackRequestBody {
  readonly events?: ReadonlyArray<EventInput>
}

describe('durable external effect workers', () => {
  test('dispatches a handler-less effect to the worker', async () => {
    const dispatched: EffectWorkerTask[] = []

    const looms = createLooms({
      modules: [workerModule({ maxAttempts: 1 })],
      worker: { dispatch: (task) => dispatched.push(task) },
    })

    const started = await looms.start(workerDefinition, {})
    expect(dispatched.map((task) => task.type)).toEqual(['worker.do'])
    expect(started.state.status).toBe('running')
    await looms.stop()
  })

  test('runs a local handler in process unless the worker claims its type', async () => {
    const dispatched: EffectWorkerTask[] = []

    const inProcess = createLooms({
      modules: [workerModule({ maxAttempts: 1 }, local)],
      worker: { dispatch: (task) => dispatched.push(task) },
    })

    expect((await inProcess.start(workerDefinition, {})).state.status).toBe('completed')
    expect(dispatched).toHaveLength(0)
    await inProcess.stop()

    const claimed = createLooms({
      modules: [workerModule({ maxAttempts: 1 }, local)],
      worker: { handles: ['worker.do'], dispatch: (task) => dispatched.push(task) },
    })

    expect((await claimed.start(workerDefinition, {})).state.status).toBe('running')
    expect(dispatched.map((task) => task.type)).toEqual(['worker.do'])
    await claimed.stop()
  })

  test('marks a handler-less effect ambiguous when no worker is configured', async () => {
    const looms = createLooms({ modules: [workerModule({ maxAttempts: 1 })] })

    const started = await looms.start(workerDefinition, {})
    const events = await looms.getEvents(started.runId)

    expect(events.some((event) => event.type === 'runtime.effect.ambiguous')).toBe(true)
    expect(events.some((event) => event.type === 'runtime.effect.failed')).toBe(false)
    await looms.stop()
  })

  test('recovers a rejected dispatch through the schedule-to-start timeout', async () => {
    let calls = 0

    const looms = createLooms({
      modules: [workerModule({ maxAttempts: 2, backoffMs: 1, scheduleToStartTimeoutMs: 5 })],
      worker: {
        dispatch: () => {
          calls += 1
          return calls === 1 ? Promise.reject(new Error('network blip')) : undefined
        },
      },
    })

    const started = await looms.start(workerDefinition, {})
    await Bun.sleep(10)
    await looms.wake(started.runId)
    await Bun.sleep(5)
    await looms.wake(started.runId)

    const events = await looms.getEvents(started.runId)

    expect(calls).toBe(2)
    expect(events.some((event) => event.type === 'runtime.effect.ambiguous')).toBe(false)
    await looms.stop()
  })

  test('times out a local handler that never settles', async () => {
    const hanging = defineEffect({
      type: 'hang.forever',
      retry: { maxAttempts: 1, startToCloseTimeoutMs: 10 },
      execute: () => Effect.never,
    })

    const hangDefinition = { kind: 'hang', name: 'hang', value: { kind: 'hang', name: 'hang' } }

    const looms = createLooms({
      modules: [
        defineRuntimeModule({
          namespace: 'hang',
          protocolVersion: '1.0.0',
          effects: { hanging },
          threads: {
            hang: defineThread({
              kind: 'hang',
              initialState: () => ({}),
              step: (state) => state,
              effects: () => [invoke(hanging, {}, 'hang')],
            }),
          },
          definitions: [hangDefinition],
        }),
      ],
    })

    const started = await looms.start(hangDefinition, {})
    const types = (await looms.getEvents(started.runId)).map((event) => event.type)

    expect(types).toContain('runtime.effect.timed_out')
    expect(types).toContain('runtime.effect.failed')
    await looms.stop()
  })

  test('serializes operator retry with a concurrent signal on the same run', async () => {
    const inner = await Effect.runPromise(makeMemoryEventStore)
    let entered!: () => void
    let release!: () => void
    let blockRetry = false

    const retryEntered = new Promise<void>((resolve) => {
      entered = resolve
    })

    const retryReleased = new Promise<void>((resolve) => {
      release = resolve
    })

    const store = {
      ...inner,
      append: (runId, events, options) => {
        if (blockRetry && events.some((event) => event.type === 'runtime.effect.retry.scheduled')) {
          blockRetry = false

          return Effect.gen(function* () {
            entered()
            yield* Effect.promise(() => retryReleased)
            return yield* inner.append(runId, events, options)
          })
        }

        return inner.append(runId, events, options)
      },
    } satisfies typeof inner

    const looms = createLooms({
      store,
      modules: [workerModule({ maxAttempts: 2 })],
      worker: { dispatch: () => Promise.reject(new Error('ambiguous dispatch')) },
    })

    const started = await looms.start(workerDefinition, {})
    const identity = effectIdentity(await looms.getEvents(started.runId))
    blockRetry = true

    const retry = looms.retryEffect(started.runId, identity.effectId)
    await retryEntered

    const signal = looms.signal(started.runId, [
      {
        type: 'runtime.signal.received',
        payload: { signalType: 'contention-probe' },
        threadId: null,
      },
    ])

    await Bun.sleep(10)
    release()
    await Promise.all([retry, signal])

    const events = await looms.getEvents(started.runId)

    expect(events.some((event) => event.type === 'runtime.effect.retry.scheduled')).toBe(true)

    expect(
      events.some(
        (event) =>
          event.type === 'runtime.signal.received' &&
          Predicate.isReadonlyObject(event.payload) &&
          event.payload.signalType === 'contention-probe',
      ),
    ).toBe(true)

    await looms.stop()
  })

  test('admits cancellation after an earlier in-flight signal', async () => {
    const inner = await Effect.runPromise(makeMemoryEventStore)
    let entered!: () => void
    let release!: () => void
    let blockSignal = false

    const signalEntered = new Promise<void>((resolve) => {
      entered = resolve
    })

    const signalReleased = new Promise<void>((resolve) => {
      release = resolve
    })

    const store = {
      ...inner,
      append: (runId, events, options) => {
        if (blockSignal && events.some((event) => event.type === 'worker.progress')) {
          blockSignal = false

          return Effect.gen(function* () {
            entered()
            yield* Effect.promise(() => signalReleased)
            return yield* inner.append(runId, events, options)
          })
        }

        return inner.append(runId, events, options)
      },
    } satisfies typeof inner

    const looms = createLooms({
      store,
      modules: [workerModule({ maxAttempts: 1, cancellationTimeoutMs: 1_000 })],
      worker: { dispatch: () => undefined },
    })

    const started = await looms.start(workerDefinition, {})
    blockSignal = true

    const signal = looms.signal(started.runId, [
      { type: 'worker.progress', payload: { step: 1 }, threadId: started.threadId },
    ])

    await signalEntered
    const cancellation = looms.cancel(started.runId, started.threadId)
    await Bun.sleep(10)
    release()
    await Promise.all([signal, cancellation])

    const events = await looms.getEvents(started.runId)
    const progressSeq = events.find((event) => event.type === 'worker.progress')?.seq
    const cancelledSeq = events.find((event) => event.type === 'runtime.thread.cancelled')?.seq

    expect(progressSeq).toBeNumber()
    expect(cancelledSeq).toBeGreaterThan(progressSeq ?? Number.POSITIVE_INFINITY)

    await looms.stop()
  })

  test('cancels a retry-waiting worker effect without asking the worker', async () => {
    const cancelled: EffectWorkerTask[] = []

    const looms = createLooms({
      modules: [workerModule({ maxAttempts: 3, backoffMs: 60_000 })],
      worker: { dispatch: () => undefined, cancel: (task) => cancelled.push(task) },
    })

    const started = await looms.start(workerDefinition, {})
    const identity = effectIdentity(await looms.getEvents(started.runId))

    await looms.workerCallback(started.runId, {
      kind: 'fail',
      ...identity,
      error: 'transient',
    })

    await looms.cancel(started.runId, started.threadId)

    const types = (await looms.getEvents(started.runId)).map((event) => event.type)

    expect(cancelled).toHaveLength(0)
    expect(types).toContain('runtime.effect.cancelled')
    expect(types).not.toContain('runtime.effect.cancel.requested')
    await looms.stop()
  })

  test('rejects reserved runtime events from external signals', async () => {
    const looms = createLooms({
      modules: [workerModule({ maxAttempts: 1 })],
      worker: { dispatch: () => undefined },
    })

    const started = await looms.start(workerDefinition, {})
    const identity = effectIdentity(await looms.getEvents(started.runId))

    expect(
      looms.signal(started.runId, [
        {
          type: 'runtime.effect.cancelled',
          payload: { effectId: identity.effectId, attempt: identity.attempt },
          threadId: started.threadId,
        },
      ]),
    ).rejects.toThrow('reserved for the runtime')

    await looms.signal(started.runId, [
      {
        type: 'worker.progress',
        payload: { forged: true },
        threadId: started.threadId,
        effectId: identity.effectId,
        origin: { type: 'system' },
      },
    ])

    const forged = (await looms.getEvents(started.runId)).find(
      (event) => event.type === 'worker.progress',
    )

    expect(forged?.effectId).toBeNull()
    expect(forged?.origin).toEqual({ type: 'external' })
    expect((await looms.getRun(started.runId)).outstandingEffects).toHaveLength(1)

    await looms.stop()
  })

  test('authorizes and routes worker callback actions over HTTP', async () => {
    const looms = createLooms({
      modules: [workerModule({ maxAttempts: 1 })],
      worker: { dispatch: () => undefined },
      workerCallbackToken: 'worker-secret',
    })

    const started = await looms.start(workerDefinition, {})
    const identity = effectIdentity(await looms.getEvents(started.runId))

    const callbackUrl = (action: string) =>
      `http://looms.test/runs/${encodeURIComponent(started.runId)}/effects/${encodeURIComponent(identity.effectId)}/${identity.attempt}/${action}`

    const request = (action: string, body: WorkerCallbackRequestBody, authorized = true) => {
      const headers = new Headers({ 'content-type': 'application/json' })

      if (authorized) {
        headers.set('authorization', 'Bearer worker-secret')
      }

      return new Request(callbackUrl(action), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
    }

    const unauthorized = await looms.fetch(request('started', {}, false))
    const unknownAction = await looms.fetch(request('unknown', {}))
    const startedResponse = await looms.fetch(request('started', {}))

    const completedResponse = await looms.fetch(
      request('complete', {
        events: [{ type: 'worker.done', payload: { ok: true } }],
      }),
    )

    expect(unauthorized?.status).toBe(401)
    expect(unknownAction?.status).toBe(404)
    expect(startedResponse?.status).toBe(200)
    expect(completedResponse?.status).toBe(200)

    expect(
      (await looms.getEvents(started.runId)).some((event) => event.type === 'worker.done'),
    ).toBe(true)

    await looms.stop()
  })

  test('does not redispatch after restart', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const dispatched: EffectWorkerTask[] = []

    const first = createLooms({
      store,
      modules: [workerModule({ maxAttempts: 2, scheduleToStartTimeoutMs: 60_000 })],
      worker: { dispatch: (task) => dispatched.push(task) },
    })

    const started = await first.start(workerDefinition, {})
    expect(dispatched).toHaveLength(1)
    await first.stop()

    const second = createLooms({
      store,
      modules: [workerModule({ maxAttempts: 2, scheduleToStartTimeoutMs: 60_000 })],
      worker: { dispatch: (task) => dispatched.push(task) },
    })

    await second.wake(started.runId)
    expect(dispatched).toHaveLength(1)
    await second.stop()
  })

  test('retries after a heartbeat deadline', async () => {
    const dispatched: EffectWorkerTask[] = []

    const looms = createLooms({
      modules: [
        workerModule({
          maxAttempts: 2,
          backoffMs: 1,
          scheduleToStartTimeoutMs: 1_000,
          heartbeatTimeoutMs: 5,
        }),
      ],
      worker: { dispatch: (task) => dispatched.push(task) },
    })

    const started = await looms.start(workerDefinition, {})
    const identity = effectIdentity(await looms.getEvents(started.runId))
    await looms.workerCallback(started.runId, { ...identity, kind: 'started' })
    await looms.workerCallback(started.runId, { ...identity, kind: 'heartbeat' })
    await Bun.sleep(12)
    await looms.wake(started.runId)
    await Bun.sleep(3)
    await looms.wake(started.runId)

    expect(dispatched.map((task) => task.attempt)).toEqual([1, 2])

    expect(
      (await looms.getEvents(started.runId)).some(
        (event) => event.type === 'runtime.effect.timed_out',
      ),
    ).toBe(true)

    await looms.stop()
  })

  test('extends the heartbeat deadline on every heartbeat up to the start-to-close cap', async () => {
    const looms = createLooms({
      modules: [
        workerModule({ maxAttempts: 1, heartbeatTimeoutMs: 600, startToCloseTimeoutMs: 5_000 }),
      ],
      worker: { dispatch: () => undefined },
    })

    const started = await looms.start(workerDefinition, {})
    const identity = effectIdentity(await looms.getEvents(started.runId))

    const deadline = async () =>
      (await looms.getRun(started.runId)).effectExecutions[identity.effectId]?.deadlineAt ?? 0

    await looms.workerCallback(started.runId, { ...identity, kind: 'heartbeat' })
    const first = await deadline()
    await Bun.sleep(350)
    await looms.workerCallback(started.runId, { ...identity, kind: 'heartbeat' })
    const second = await deadline()
    // Past the first heartbeat's deadline, well inside the second's.
    await Bun.sleep(350)
    await looms.wake(started.runId)

    const execution = (await looms.getRun(started.runId)).effectExecutions[identity.effectId]

    expect(second).toBeGreaterThan(first)
    expect(execution?.status).toBe('heartbeat')
    expect(execution?.startedAt).toBeNumber()

    await looms.stop()
  })

  test('ignores worker callbacks for an effect running in process', async () => {
    const looms = createLooms({
      modules: [workerModule({ maxAttempts: 1 }, local)],
      worker: { dispatch: () => undefined },
    })

    const started = await looms.start(workerDefinition, {})
    const events = await looms.getEvents(started.runId)
    const attempt = events.find((event) => event.type === 'runtime.effect.attempt.started')
    const payload = Predicate.isReadonlyObject(attempt?.payload) ? attempt.payload : {}

    await looms.workerCallback(started.runId, {
      kind: 'fail',
      effectId: Predicate.isString(payload.effectId) ? payload.effectId : '',
      attempt: 1,
      error: 'forged',
    })

    const after = await looms.getEvents(started.runId)
    expect(after.some((event) => event.type === 'runtime.effect.failed')).toBe(false)
    expect(after).toHaveLength(events.length)

    await looms.stop()
  })

  test('duplicate completion is an atomic no-op', async () => {
    const looms = createLooms({
      modules: [workerModule({ maxAttempts: 1 })],
      worker: { dispatch: () => undefined },
    })

    const started = await looms.start(workerDefinition, {})
    const identity = effectIdentity(await looms.getEvents(started.runId))

    const completion = {
      ...identity,
      events: [{ type: 'worker.done', payload: { ok: true } }],
    }

    await looms.workerCallback(started.runId, { ...completion, kind: 'complete' })
    await looms.workerCallback(started.runId, { ...completion, kind: 'complete' })
    const events = await looms.getEvents(started.runId)
    expect(events.filter((event) => event.type === 'worker.done')).toHaveLength(1)
    expect(events.filter((event) => event.type === 'runtime.effect.completed')).toHaveLength(1)
    await looms.stop()
  })

  test('stale callback cannot complete a newer attempt', async () => {
    const looms = createLooms({
      modules: [
        workerModule({
          maxAttempts: 2,
          backoffMs: 1,
          scheduleToStartTimeoutMs: 60_000,
          cancellationTimeoutMs: 1_000,
        }),
      ],
      worker: { dispatch: () => undefined },
    })

    const started = await looms.start(workerDefinition, {})
    const first = effectIdentity(await looms.getEvents(started.runId))

    await looms.workerCallback(started.runId, {
      kind: 'fail',
      ...first,
      error: 'retry',
    })

    await Bun.sleep(3)
    await looms.wake(started.runId)

    await looms.workerCallback(started.runId, {
      kind: 'complete',
      ...first,
      events: [{ type: 'worker.done', payload: { stale: true } }],
    })

    expect(
      (await looms.getEvents(started.runId)).some((event) => event.type === 'worker.done'),
    ).toBe(false)

    const newerExecution = (await looms.getRun(started.runId)).effectExecutions[first.effectId]

    if (!newerExecution) {
      throw new Error('missing newer effect execution')
    }

    expect(newerExecution.attempt).toBe(first.attempt + 1)
    await looms.cancel(started.runId)
    await looms.workerCallback(started.runId, { ...first, kind: 'cancelled' })

    expect(
      (await looms.getEvents(started.runId)).some(
        (event) => event.type === 'runtime.effect.cancelled',
      ),
    ).toBe(false)

    await looms.workerCallback(started.runId, {
      kind: 'cancelled',
      effectId: first.effectId,
      attempt: newerExecution.attempt,
    })

    expect(
      (await looms.getEvents(started.runId)).filter(
        (event) => event.type === 'runtime.effect.cancelled',
      ),
    ).toHaveLength(1)

    await looms.stop()
  })

  test('accepts a requested worker cancellation acknowledgement', async () => {
    const looms = createLooms({
      modules: [workerModule({ maxAttempts: 1, cancellationTimeoutMs: 1_000 })],
      worker: {
        dispatch: () => undefined,
        cancel: () => undefined,
      },
    })

    const started = await looms.start(workerDefinition, {})
    const identity = effectIdentity(await looms.getEvents(started.runId))
    await looms.cancel(started.runId)
    await looms.workerCallback(started.runId, { ...identity, kind: 'cancelled' })

    const events = await looms.getEvents(started.runId)
    expect(events.some((event) => event.type === 'runtime.effect.cancel.requested')).toBe(true)
    expect(events.filter((event) => event.type === 'runtime.effect.cancelled')).toHaveLength(1)
    expect(events.some((event) => event.type === 'runtime.effect.ambiguous')).toBe(false)

    await looms.stop()
  })

  test('ignores an unsolicited worker cancellation acknowledgement', async () => {
    const looms = createLooms({
      modules: [workerModule({ maxAttempts: 1 })],
      worker: { dispatch: () => undefined },
    })

    const started = await looms.start(workerDefinition, {})
    const identity = effectIdentity(await looms.getEvents(started.runId))
    await looms.workerCallback(started.runId, { ...identity, kind: 'cancelled' })

    const events = await looms.getEvents(started.runId)
    expect(events.some((event) => event.type === 'runtime.effect.cancel.requested')).toBe(false)
    expect(events.some((event) => event.type === 'runtime.effect.cancelled')).toBe(false)
    expect((await looms.getRun(started.runId)).status).toBe('running')

    await looms.stop()
  })

  test('cancellation is sent and late results are ignored', async () => {
    const cancelled: EffectWorkerTask[] = []

    const looms = createLooms({
      modules: [workerModule({ maxAttempts: 1, cancellationTimeoutMs: 5 })],
      worker: {
        dispatch: () => undefined,
        cancel: (task) => cancelled.push(task),
      },
    })

    const started = await looms.start(workerDefinition, {})
    const identity = effectIdentity(await looms.getEvents(started.runId))
    await looms.cancel(started.runId)
    await Bun.sleep(12)
    await looms.wake(started.runId)

    await looms.workerCallback(started.runId, {
      kind: 'complete',
      ...identity,
      events: [{ type: 'worker.done', payload: { late: true } }],
    })

    const events = await looms.getEvents(started.runId)
    expect(cancelled).toHaveLength(1)
    expect(events.some((event) => event.type === 'runtime.effect.cancel.requested')).toBe(true)
    expect(events.some((event) => event.type === 'runtime.effect.ambiguous')).toBe(true)
    expect(events.some((event) => event.type === 'worker.done')).toBe(false)
    expect((await looms.getRun(started.runId)).status).toBe('cancelled')
    await looms.stop()
  })
})
