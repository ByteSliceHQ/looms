import { describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'

import {
  cloudflareQueueWorker,
  createMemoryQueue,
  processQueueMessage,
  queuePushConsumer,
  type QueueTaskHandler,
} from './queue-worker'

function urlOf(input: RequestInfo | URL): string {
  if (Predicate.isString(input)) {
    return input
  }

  if (input instanceof URL) {
    return input.href
  }

  return input.url
}

describe('cloudflare queues effect worker', () => {
  test('producer enqueues formatted QueueEffectMessage', async () => {
    const queue = createMemoryQueue()

    const worker = cloudflareQueueWorker({
      routes: [{ handles: ['sandbox.run', 'payment.charge'], queue }],
    })

    expect(worker.dispatchSemantics).toBe('acknowledged')
    expect(Predicate.isFunction(worker.handles) && worker.handles('sandbox.run')).toBe(true)
    expect(Predicate.isFunction(worker.handles) && worker.handles('unknown.task')).toBe(false)

    await worker.dispatch({
      runId: 'run_1',
      effectId: 'eff_1',
      attempt: 1,
      type: 'sandbox.run',
      input: { command: 'echo hello' },
    })

    expect(queue.enqueued).toHaveLength(1)
    const enqueued = queue.enqueued[0]

    expect(enqueued).toMatchObject({
      v: 1,
      runId: 'run_1',
      effectId: 'eff_1',
      attempt: 1,
      type: 'sandbox.run',
      input: { command: 'echo hello' },
    })
  })

  test('producer throws on 429 for acknowledged retry', async () => {
    const queue = createMemoryQueue()
    queue.setSimulation({ rateLimit429: true })

    const worker = cloudflareQueueWorker({
      routes: [{ handles: ['sandbox.run'], queue }],
    })

    expect(
      worker.dispatch({
        runId: 'run_1',
        effectId: 'eff_1',
        attempt: 1,
        type: 'sandbox.run',
        input: {},
      }),
    ).rejects.toThrow('429 Too Many Requests')
  })

  test('producer offloads inputs exceeding threshold', async () => {
    const queue = createMemoryQueue()
    let offloaded = false

    const worker = cloudflareQueueWorker({
      routes: [{ handles: ['sandbox.run'], queue }],
      offloadInput: async (input) => {
        offloaded = true
        return { $ref: 'blob_123', size: JSON.stringify(input).length }
      },
    })

    const largeInput = { payload: 'x'.repeat(120_000) }

    await worker.dispatch({
      runId: 'run_1',
      effectId: 'eff_1',
      attempt: 1,
      type: 'sandbox.run',
      input: largeInput,
    })

    expect(offloaded).toBe(true)
    expect(queue.enqueued[0]?.input).toEqual({ $ref: 'blob_123', size: 120_014 })
  })

  test('consumer acknowledges queue message immediately once started is accepted', async () => {
    const queue = createMemoryQueue()

    await queue.send({
      v: 1,
      runId: 'run_1',
      effectId: 'eff_1',
      attempt: 1,
      type: 'sandbox.run',
      input: { cmd: 'test' },
      deadlines: {},
    })

    const calls: string[] = []

    const mockFetch: typeof fetch = async (input) => {
      const url = urlOf(input)
      calls.push(url)

      if (url.includes('/started')) {
        return new Response(JSON.stringify({ status: 'accepted' }), { status: 200 })
      }

      if (url.includes('/complete')) {
        return new Response(JSON.stringify({ status: 'accepted' }), { status: 200 })
      }

      return new Response(null, { status: 200 })
    }

    const handler: QueueTaskHandler = async () => {
      // At this point in handler execution, the queue message must already be acknowledged
      expect(queue.acknowledged).toHaveLength(1)
      return [{ type: 'sandbox.finished', payload: { ok: true } }]
    }

    const consumer = queuePushConsumer({
      handlers: { 'sandbox.run': handler },
      callbackUrl: 'http://looms.internal',
      fetch: mockFetch,
    })

    const batch = queue.receiveBatch()
    await consumer.consumeBatch(batch)

    expect(calls.some((c) => c.includes('/started'))).toBe(true)
    expect(calls.some((c) => c.includes('/complete'))).toBe(true)
    expect(queue.acknowledged).toHaveLength(1)
  })

  test('stale attempt is acknowledged on queue without running handler', async () => {
    const queue = createMemoryQueue()

    await queue.send({
      v: 1,
      runId: 'run_1',
      effectId: 'eff_1',
      attempt: 1,
      type: 'sandbox.run',
      input: {},
      deadlines: {},
    })

    let handlerRan = false

    const mockFetch: typeof fetch = async (input) => {
      const url = urlOf(input)

      if (url.includes('/started')) {
        return new Response(JSON.stringify({ status: 'stale' }), { status: 200 })
      }

      return new Response(null, { status: 200 })
    }

    const handler: QueueTaskHandler = async () => {
      handlerRan = true
      return []
    }

    const consumer = queuePushConsumer({
      handlers: { 'sandbox.run': handler },
      callbackUrl: 'http://looms.internal',
      fetch: mockFetch,
    })

    const batch = queue.receiveBatch()
    await consumer.consumeBatch(batch)

    expect(handlerRan).toBe(false)
    expect(queue.acknowledged).toHaveLength(1)
  })

  test('cancellation mid-flight signals handler abort', async () => {
    const queue = createMemoryQueue()

    await queue.send({
      v: 1,
      runId: 'run_1',
      effectId: 'eff_1',
      attempt: 1,
      type: 'sandbox.run',
      input: {},
      deadlines: {},
    })

    const mockFetch: typeof fetch = async (input) => {
      const url = urlOf(input)

      if (url.includes('/started')) {
        return new Response(JSON.stringify({ status: 'accepted' }), { status: 200 })
      }

      if (url.includes('/heartbeat')) {
        return new Response(JSON.stringify({ status: 'accepted', cancelRequested: true }), {
          status: 200,
        })
      }

      return new Response(null, { status: 200 })
    }

    let aborted = false

    const handler: QueueTaskHandler = async (_task, ctx) => {
      ctx.signal.addEventListener('abort', () => {
        aborted = true
      })

      // Send a heartbeat which returns cancelRequested
      await ctx.heartbeat({ progress: 50 })
      return []
    }

    const batch = queue.receiveBatch()
    const message = batch.messages[0]

    if (message) {
      await processQueueMessage(message, {
        handlers: { 'sandbox.run': handler },
        callbackUrl: 'http://looms.internal',
        fetch: mockFetch,
      })
    }

    expect(aborted).toBe(true)
  })
})
