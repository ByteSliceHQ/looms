import { describe, expect, test } from 'bun:test'

import { Effect, Predicate } from 'effect'

import { createLoomsClient } from '@swirls/looms/client'
import {
  cloudflareQueueWorker,
  createMemoryQueue,
  createQueuePullConsumer,
  queueConsumer,
  QueueTaskError,
  type MemoryQueue,
} from '@swirls/looms/cloudflare/queues'
import {
  complete,
  defineEffect,
  defineRuntimeModule,
  defineThread,
  invoke,
  type RetryPolicy,
} from '@swirls/looms/core'
import { bearerAuth, createLooms, type EffectWorkerTask, type Looms } from '@swirls/looms/runtime'
import { defineWorkflow, workflow } from '@swirls/looms/workflow'

import { rootOutput, waitFor, waitForStatus } from './helpers'

const WORKER_TOKEN = 'parity-worker-token'

const FAST: RetryPolicy = {
  maxAttempts: 3,
  backoffMs: 5,
  scheduleToStartTimeoutMs: 60_000,
  heartbeatTimeoutMs: 80,
}

const workerDefinition = {
  kind: 'parity-worker',
  name: 'parity-worker',
  version: 'v1',
}

function workerModule(retry: RetryPolicy = FAST) {
  const effect = defineEffect.worker({
    type: 'parity.work',
    retry,
  })

  const module = defineRuntimeModule({
    namespace: 'parity',
    protocolVersion: '1.0.0',
    effects: { effect },
    threads: {
      'parity-worker': defineThread({
        kind: 'parity-worker',
        initialState: () => ({ done: false }),
        step: (state, event) => (event.type === 'parity.done' ? { done: true } : state),
        effects: (state) =>
          state.done ? [complete({ ok: true })] : [invoke(effect, { step: 1 }, 'work')],
      }),
    },
    definitions: [workerDefinition],
  })

  return { effect, module }
}

function effectIdentity(events: Awaited<ReturnType<Looms['getEvents']>>) {
  const queued = events.find((event) => event.type === 'runtime.effect.queued')
  const payload = queued?.payload

  if (!payload || Array.isArray(payload) || !Predicate.isReadonlyObject(payload)) {
    throw new Error('missing queued effect')
  }

  const effectId = payload.effectId
  const attempt = payload.attempt

  if (!Predicate.isString(effectId) || !Predicate.isNumber(attempt)) {
    throw new Error('invalid queued effect identity')
  }

  return { effectId, attempt }
}

function callbacksFor(looms: Looms) {
  const fetchImpl = Object.assign(
    async (input: RequestInfo | URL, init?: RequestInit) =>
      (await looms.fetch(new Request(input, init))) ?? new Response(null, { status: 404 }),
    { preconnect: () => undefined },
  )

  return createLoomsClient({
    baseUrl: 'http://looms.test',
    workerCallbackToken: WORKER_TOKEN,
    fetch: fetchImpl,
  })
}

describe('swirls-parity workers and queues', () => {
  test('a worker killed mid-flight resumes from heartbeat details', async () => {
    const dispatched: EffectWorkerTask[] = []

    const looms = createLooms({
      modules: [workerModule().module],
      worker: {
        dispatch: (task) => {
          dispatched.push(task)
        },
      },
    })

    const started = await looms.start(workerDefinition, null)
    const identity = effectIdentity(await looms.getEvents(started.runId))

    await looms.workerCallback(started.runId, {
      ...identity,
      kind: 'heartbeat',
      details: { page: 7 },
    })

    await looms.workerCallback(started.runId, {
      ...identity,
      kind: 'fail',
      error: 'executor killed',
    })

    await waitFor(() => dispatched.some((task) => task.attempt === 2))

    expect(dispatched.at(-1)?.details).toEqual({ page: 7 })

    await looms.workerCallback(started.runId, {
      effectId: identity.effectId,
      attempt: 2,
      kind: 'complete',
      events: [{ type: 'parity.done', payload: {} }],
    })

    expect((await waitForStatus(looms, started.runId, 'completed')).status).toBe('completed')
    await looms.stop()
  })

  test('queue delivery survives duplicates, a crash before started, and a long attempt', async () => {
    const queue: MemoryQueue = createMemoryQueue({ maxRetries: 2 })
    let sends = 0

    const { effect: parityEffect, module: parityModule } = workerModule({
      ...FAST,
      startToCloseTimeoutMs: 3_600_000,
    })

    const looms = createLooms({
      modules: [parityModule],
      worker: cloudflareQueueWorker({
        routes: [
          {
            effects: [parityEffect],
            queue: {
              send: async (message, options) => {
                sends += 1
                await queue.send(message, options)

                // Duplicate delivery of the first attempt.
                if (sends === 1) {
                  await queue.send(message, options)
                }
              },
            },
          },
        ],
      }),
      authorize: bearerAuth({ worker: WORKER_TOKEN }),
    })

    const callbacks = callbacksFor(looms)
    let runs = 0

    const started = await looms.start(workerDefinition, null)

    // Crash before started: lease and abandon.
    await Effect.runPromise(queue.pull(10, 20))

    const consumer = createQueuePullConsumer({
      source: queue,
      callbacks,
      visibilityTimeoutMs: 30,
      handlers: {
        'parity.work': async (task, ctx) => {
          runs += 1

          // A long effect: heartbeats keep it alive past the queue lease.
          for (let i = 0; i < 3; i++) {
            await ctx.heartbeat({ tick: i })
            await Bun.sleep(15)
          }

          return [{ type: 'parity.done', payload: { ran: task.attempt } }]
        },
      },
    })

    await waitForStatus(looms, started.runId, 'completed')
    await consumer.stop()

    expect(runs).toBe(1)
    expect(queue.size()).toBe(0)
    await looms.stop()
  })

  test('a non-retryable failure falls back to a recovery node', async () => {
    const recovering = defineWorkflow({
      name: 'parity-fallback',
      nodes: [
        {
          id: 'primary',
          failure: { type: 'fallback', nodeId: 'backup' },
          run: () => {
            throw new Error('non-retryable: primary unavailable')
          },
        },
        { id: 'backup', run: () => ({ recovered: true }) },
      ],
      output: ({ results }) => results.primary ?? results.backup ?? null,
    })

    const looms = createLooms({ modules: [workflow({ definitions: [recovering] })] })
    const started = await looms.start(recovering, null)
    const state = await waitForStatus(looms, started.runId, 'completed')

    expect(rootOutput(state)).toEqual({ recovered: true })
    await looms.stop()
  })

  test('a non-retryable worker failure spends no further attempts', async () => {
    const queue = createMemoryQueue()

    const { effect: parityEffect, module: parityModule } = workerModule()

    const looms = createLooms({
      modules: [parityModule],
      worker: cloudflareQueueWorker({
        routes: [{ effects: [parityEffect], queue }],
      }),
      authorize: bearerAuth({ worker: WORKER_TOKEN }),
    })

    const callbacks = callbacksFor(looms)
    const started = await looms.start(workerDefinition, null)

    await queueConsumer({
      callbacks,
      handlers: {
        'parity.work': () => {
          throw new QueueTaskError({ message: 'bad input', nonRetryable: true })
        },
      },
    })(await Effect.runPromise(queue.batch()))

    expect(await waitForStatus(looms, started.runId, 'failed')).toMatchObject({ status: 'failed' })
    expect(queue.size()).toBe(0)
    await looms.stop()
  })
})
