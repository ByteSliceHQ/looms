import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { createLoomsClient } from '@looms/client'
import {
  complete,
  defineEffect,
  defineRuntimeModule,
  defineThread,
  invoke,
  memoryBlobStore,
  utf8JsonBytes,
  type BlobStore,
  type JsonValue,
  type RetryPolicy,
} from '@looms/core'
import { bearerAuth, createLooms, type Looms } from '@looms/runtime'

import { createMemoryQueue, type MemoryQueue } from './memory-queue'
import { queueConsumer, QueueTaskError, type QueueTaskHandler } from './queue-consumer'
import type { QueueEffectMessage } from './queue-message'
import { cloudflareQueuePullSource, createQueuePullConsumer } from './queue-pull'
import { cloudflareQueueWorker, type QueueProducer } from './queue-worker'

const WORKER_TOKEN = 'worker-token'
const SECRET = 'sk_live_never_logged'
const definition = { kind: 'sandbox', name: 'sandbox', version: 'v1' }

const FAST: RetryPolicy = {
  maxAttempts: 3,
  backoffMs: 5,
  scheduleToStartTimeoutMs: 60_000,
}

interface SandboxState {
  readonly input: JsonValue
  readonly output: JsonValue | null
}

function sandboxModule(retry: RetryPolicy) {
  const exec = defineEffect({ type: 'sandbox.exec', retry })

  return defineRuntimeModule({
    namespace: 'sandbox',
    protocolVersion: '1.0.0',
    effects: { exec },
    threads: {
      sandbox: defineThread({
        kind: 'sandbox',
        initialState: (ctx): SandboxState => ({ input: ctx.input ?? null, output: null }),
        step: (state, event) =>
          event.type === 'sandbox.done' ? { ...state, output: event.payload ?? true } : state,
        effects: (state) =>
          state.output === null ? [invoke(exec, state.input, 'exec')] : [complete(state.output)],
      }),
    },
    definitions: [definition],
  })
}

interface Harness {
  readonly looms: Looms
  readonly queue: MemoryQueue
  readonly sent: QueueEffectMessage[]
  readonly callbacks: ReturnType<typeof createLoomsClient>
}

function harness(
  options: {
    retry?: RetryPolicy
    producer?: (queue: MemoryQueue, sent: QueueEffectMessage[]) => QueueProducer
    blobs?: BlobStore
    maxRetries?: number
  } = {},
): Harness {
  const queue = createMemoryQueue({ maxRetries: options.maxRetries })
  const sent: QueueEffectMessage[] = []

  const producer: QueueProducer = options.producer?.(queue, sent) ?? {
    send: (message, sendOptions) => {
      sent.push(message)

      return queue.send(message, sendOptions)
    },
  }

  const looms = createLooms({
    modules: [sandboxModule(options.retry ?? FAST)],
    worker: cloudflareQueueWorker({
      routes: [{ handles: ['sandbox.exec'], queue: producer }],
      blobs: options.blobs,
    }),
    authorize: bearerAuth({ worker: WORKER_TOKEN }),
  })

  const callbacks = createLoomsClient({
    baseUrl: 'http://looms.test',
    workerCallbackToken: WORKER_TOKEN,
    fetch: async (input, init) =>
      (await looms.fetch(new Request(input, init))) ?? new Response(null, { status: 404 }),
  })

  return { looms, queue, sent, callbacks }
}

const done: QueueTaskHandler = (task) => [{ type: 'sandbox.done', payload: { ran: task.attempt } }]

async function waitFor(condition: () => boolean | Promise<boolean>, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs

  while (!(await condition())) {
    if (Date.now() > deadline) {
      throw new Error('condition not met in time')
    }

    await Bun.sleep(5)
  }
}

async function status(looms: Looms, runId: string) {
  return (await looms.getRun(runId)).status
}

async function eventTypes(looms: Looms, runId: string) {
  return (await looms.getEvents(runId)).map((event) => event.type)
}

describe('Cloudflare Queues effect transport', () => {
  test('runs an attempt over the queue and reads secrets only through the callback', async () => {
    const { looms, queue, sent, callbacks } = harness()
    let secret: string | undefined

    const started = await looms.start(
      definition,
      { cmd: 'ls' },
      {
        secrets: { token: SECRET },
        trace: { traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' },
      },
    )

    const consumer = createQueuePullConsumer({
      source: queue,
      callbacks,
      handlers: {
        'sandbox.exec': async (task, ctx) => {
          secret = (await ctx.secrets()).token

          return done(task, ctx)
        },
      },
    })

    await waitFor(async () => (await status(looms, started.runId)) === 'completed')
    await consumer.stop()

    expect(secret).toBe(SECRET)
    expect(JSON.stringify(sent)).not.toContain(SECRET)
    expect(sent[0]?.input).toEqual({ cmd: 'ls' })
    expect(sent[0]?.trace?.traceparent).toContain('4bf92f3577b34da6a3ce929d0e0e4736')
    expect(sent[0]?.deadlines?.scheduleToStartAt).toBeGreaterThan(0)
    expect(queue.size()).toBe(0)
    await looms.stop()
  })

  test('a duplicate delivery runs the handler once', async () => {
    let runs = 0

    const { looms, queue, callbacks } = harness({
      producer: (memory) => ({
        send: async (message, sendOptions) => {
          await memory.send(message, sendOptions)
          await memory.send(message, sendOptions)
        },
      }),
    })

    const started = await looms.start(definition, null)

    await queueConsumer({
      callbacks,
      handlers: {
        'sandbox.exec': (task, ctx) => {
          runs += 1

          return done(task, ctx)
        },
      },
    })(await Effect.runPromise(queue.batch()))

    expect(runs).toBe(1)
    expect(queue.size()).toBe(0)
    expect(await status(looms, started.runId)).toBe('completed')
    await looms.stop()
  })

  test('a consumer that dies before started leaves the message for redelivery', async () => {
    const { looms, queue, callbacks } = harness()
    const started = await looms.start(definition, null)

    await Effect.runPromise(queue.pull(10, 20))

    const consumer = createQueuePullConsumer({
      source: queue,
      callbacks,
      handlers: { 'sandbox.exec': done },
      visibilityTimeoutMs: 20,
    })

    await waitFor(async () => (await status(looms, started.runId)) === 'completed')
    await consumer.stop()

    expect(queue.size()).toBe(0)
    await looms.stop()
  })

  test('an attempt that dies after started is retried by Looms, and its stale message is dropped', async () => {
    const { looms, queue, sent, callbacks } = harness({
      retry: { ...FAST, heartbeatTimeoutMs: 40 },
    })

    const ran: number[] = []

    const consume = queueConsumer({
      callbacks,
      handlers: {
        'sandbox.exec': (task, ctx) => {
          ran.push(task.attempt)

          return task.attempt === 1 ? new Promise(() => undefined) : done(task, ctx)
        },
      },
    })

    const started = await looms.start(definition, null)

    void consume(await Effect.runPromise(queue.batch()))

    await waitFor(() => sent.length === 2)
    await consume(await Effect.runPromise(queue.batch()))

    expect(await status(looms, started.runId)).toBe('completed')

    const first = sent[0]

    if (!first) {
      throw new Error('missing first attempt')
    }

    await queue.send(first)
    await consume(await Effect.runPromise(queue.batch()))

    expect(ran).toEqual([1, 2])
    expect(queue.size()).toBe(0)
    await looms.stop()
  })

  test('cancelling the run aborts the running attempt through its heartbeat', async () => {
    const { looms, queue, callbacks } = harness()
    let aborted = false

    const started = await looms.start(definition, null)

    const consumer = createQueuePullConsumer({
      source: queue,
      callbacks,
      handlers: {
        'sandbox.exec': async (_task, ctx) => {
          while (!ctx.signal.aborted) {
            await ctx.heartbeat({ at: Date.now() })
            await Bun.sleep(5)
          }

          aborted = true

          throw new Error('stopped')
        },
      },
    })

    await waitFor(async () =>
      (await eventTypes(looms, started.runId)).includes('runtime.effect.heartbeat'),
    )

    await looms.cancel(started.runId)
    await waitFor(() => aborted)
    await consumer.stop()

    expect(await eventTypes(looms, started.runId)).toContain('runtime.effect.cancelled')
    expect(await status(looms, started.runId)).toBe('cancelled')
    await looms.stop()
  })

  test('a send the queue rejects is retried with backoff', async () => {
    let rejected = 0

    const { looms, queue, sent } = harness({
      producer: (memory, attempts) => ({
        send: (message, sendOptions) => {
          attempts.push(message)

          if (rejected === 0) {
            rejected += 1

            return Promise.reject(new Error('429 Too Many Requests'))
          }

          return memory.send(message, sendOptions)
        },
      }),
    })

    const started = await looms.start(definition, null)

    await waitFor(() => queue.size() === 1)

    const types = await eventTypes(looms, started.runId)

    expect(types).toContain('runtime.effect.retry.scheduled')
    expect(types).not.toContain('runtime.effect.ambiguous')
    expect(sent.map((message) => message.attempt)).toEqual([1, 2])
    await looms.stop()
  })

  test('an input over the message limit travels as a blob reference', async () => {
    const blobs = memoryBlobStore()
    const { looms, queue, sent, callbacks } = harness({ blobs })
    const input = { file: 'x'.repeat(150_000) }
    let length = 0

    const started = await looms.start(definition, input)

    await queueConsumer({
      callbacks,
      blobs,
      handlers: {
        'sandbox.exec': (task, ctx) => {
          length = JSON.stringify(task.input).length

          return done(task, ctx)
        },
      },
    })(await Effect.runPromise(queue.batch()))

    expect(sent[0]?.input).toBeUndefined()
    expect(sent[0]?.inputRef?.bytes).toBe(utf8JsonBytes(input))
    expect(utf8JsonBytes(sent[0] ?? null)).toBeLessThan(128 * 1024)
    expect(length).toBe(JSON.stringify(input).length)
    expect(await status(looms, started.runId)).toBe('completed')
    await looms.stop()
  })

  test('a dead-lettered message is recovered by the schedule-to-start timeout', async () => {
    const { looms, queue, sent, callbacks } = harness({
      retry: { ...FAST, scheduleToStartTimeoutMs: 60 },
      maxRetries: 0,
    })

    const started = await looms.start(definition, null)

    await Effect.runPromise(queue.pull(10, 1))
    await Bun.sleep(5)
    await Effect.runPromise(queue.pull(10, 1))

    expect(queue.deadLetters()).toHaveLength(1)

    await waitFor(() => sent.length === 2)

    await queueConsumer({ callbacks, handlers: { 'sandbox.exec': done } })(
      await Effect.runPromise(queue.batch()),
    )

    expect(await status(looms, started.runId)).toBe('completed')
    await looms.stop()
  })

  test('a non-retryable handler error fails the effect without another attempt', async () => {
    const { looms, queue, sent, callbacks } = harness()
    const started = await looms.start(definition, null)

    await queueConsumer({
      callbacks,
      handlers: {
        'sandbox.exec': () => {
          throw new QueueTaskError({ message: 'bad input', nonRetryable: true })
        },
      },
    })(await Effect.runPromise(queue.batch()))

    expect(await status(looms, started.runId)).toBe('failed')
    expect(sent).toHaveLength(1)
    await looms.stop()
  })

  test('stop lets running attempts finish, sends their acks, and pulls nothing more', async () => {
    const { looms, queue, callbacks } = harness()
    const gate = Promise.withResolvers<void>()

    const first = await looms.start(definition, null)

    const consumer = createQueuePullConsumer({
      source: queue,
      callbacks,
      handlers: { 'sandbox.exec': async (task, ctx) => gate.promise.then(() => done(task, ctx)) },
    })

    await waitFor(() => consumer.inFlight() === 1)

    const stopped = consumer.stop()

    gate.resolve()
    await stopped

    expect(await status(looms, first.runId)).toBe('completed')
    expect(queue.size()).toBe(0)

    await looms.start(definition, null)
    await Bun.sleep(20)

    expect(queue.size()).toBe(1)
    await looms.stop()
  })
})

describe('cloudflareQueuePullSource', () => {
  test('pulls and acks through the Cloudflare Queues HTTP API', async () => {
    const requests: Array<{ url: string; auth: string | null; body: string }> = []

    const source = cloudflareQueuePullSource({
      accountId: 'acct',
      queueId: 'q1',
      token: 'cf-token',
      fetch: async (input, init) => {
        const request = new Request(input, init)

        requests.push({
          url: request.url,
          auth: request.headers.get('authorization'),
          body: await request.text(),
        })

        return request.url.endsWith('/pull')
          ? Response.json({
              result: {
                message_backlog_count: 7,
                messages: [{ lease_id: 'l1', attempts: 2, body: '{"v":1}' }],
              },
            })
          : Response.json({ success: true })
      },
    })

    const pulled = await Effect.runPromise(source.pull(10, 30_000))

    await Effect.runPromise(source.settle(['l1'], [{ leaseId: 'l2', delaySeconds: 4 }]))

    expect(pulled).toEqual({
      backlog: 7,
      messages: [{ leaseId: 'l1', attempts: 2, body: { v: 1 } }],
    })

    expect(requests).toEqual([
      {
        url: 'https://api.cloudflare.com/client/v4/accounts/acct/queues/q1/messages/pull',
        auth: 'Bearer cf-token',
        body: '{"batch_size":10,"visibility_timeout_ms":30000}',
      },
      {
        url: 'https://api.cloudflare.com/client/v4/accounts/acct/queues/q1/messages/ack',
        auth: 'Bearer cf-token',
        body: '{"acks":[{"lease_id":"l1"}],"retries":[{"lease_id":"l2","delay_seconds":4}]}',
      },
    ])
  })

  test('a rate-limited pull fails with its status', async () => {
    const source = cloudflareQueuePullSource({
      accountId: 'acct',
      queueId: 'q1',
      token: 'cf-token',
      fetch: async () => new Response(null, { status: 429 }),
    })

    const error = await Effect.runPromise(Effect.flip(source.pull(10, 30_000)))

    expect(error.status).toBe(429)
  })
})
