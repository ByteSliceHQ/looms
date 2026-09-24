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

  test('derives cancellation targets after an earlier signal is admitted', async () => {
    const inner = await Effect.runPromise(makeMemoryEventStore)
    let entered!: () => void
    let release!: () => void
    let blockChildStart = false

    const childStartEntered = new Promise<void>((resolve) => {
      entered = resolve
    })

    const childStartReleased = new Promise<void>((resolve) => {
      release = resolve
    })

    const store = {
      ...inner,
      append: (runId, events, options) => {
        if (blockChildStart && events.some((event) => event.type === 'runtime.thread.started')) {
          blockChildStart = false

          return Effect.gen(function* () {
            entered()
            yield* Effect.promise(() => childStartReleased)
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
    const childThreadId = 'thread_contention_child'
    blockChildStart = true

    const signal = looms.signal(started.runId, [
      {
        type: 'runtime.thread.started',
        payload: {
          threadId: childThreadId,
          kind: workerDefinition.kind,
          definitionName: workerDefinition.name,
          definitionVersion: '1.0.0',
          input: null,
          parentThreadId: started.threadId,
        },
        threadId: childThreadId,
        parentThreadId: started.threadId,
      },
    ])

    await childStartEntered
    const cancellation = looms.cancel(started.runId, started.threadId)
    await Bun.sleep(10)
    release()
    await Promise.all([signal, cancellation])

    const events = await looms.getEvents(started.runId)

    expect(
      events.some(
        (event) =>
          event.type === 'runtime.thread.cancelled' &&
          Predicate.isReadonlyObject(event.payload) &&
          event.payload.threadId === childThreadId,
      ),
    ).toBe(true)

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
    await looms.workerStarted(started.runId, identity)
    await looms.workerHeartbeat(started.runId, identity)
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

    await looms.workerComplete(started.runId, completion)
    await looms.workerComplete(started.runId, completion)
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
    await looms.workerFail(started.runId, { ...first, error: 'retry' })
    await Bun.sleep(3)
    await looms.wake(started.runId)

    await looms.workerComplete(started.runId, {
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
    await looms.workerCancelled(started.runId, first)

    expect(
      (await looms.getEvents(started.runId)).some(
        (event) => event.type === 'runtime.effect.cancelled',
      ),
    ).toBe(false)

    await looms.workerCancelled(started.runId, {
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
    await looms.workerCancelled(started.runId, identity)

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
    await looms.workerCancelled(started.runId, identity)

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

    await looms.workerComplete(started.runId, {
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
