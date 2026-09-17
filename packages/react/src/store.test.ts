import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import { encodeLoomsEvent, type EventEnvelope, type JsonValue } from '@looms/core'

import { createLoomsStore } from './store'

function event(seq: number, type: string): EventEnvelope {
  return {
    id: `evt_${seq}`,
    runId: 'run_1',
    seq,
    ts: Date.now(),
    type,
    payload: { rootThreadId: 'thr_1', kind: 'agent', definitionName: 'echo', input: null },
    threadId: 'thr_1',
    origin: { type: 'system' },
  }
}

function sseFrame(envelope: EventEnvelope): string {
  return `id: ${envelope.seq}\ndata: ${JSON.stringify({ batch: [encodeLoomsEvent(envelope)] })}\n\n`
}

async function waitFor(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const start = Date.now()

  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('timed out waiting for store update')
    }

    await Bun.sleep(10)
  }
}

describe('createLoomsStore', () => {
  const events: EventEnvelope[] = [event(1, 'runtime.run.started')]
  let server: ReturnType<typeof Bun.serve>
  let endpoint: string
  let liveRequests = 0

  beforeAll(() => {
    server = Bun.serve({
      port: 0,
      async fetch(req) {
        const url = new URL(req.url)

        if (url.pathname === '/runs/run_1/events' && req.method === 'GET') {
          const accept = req.headers.get('accept') ?? ''

          const isLive =
            url.searchParams.get('live') === 'true' || accept.includes('text/event-stream')

          if (!isLive) {
            return Response.json({ runId: 'run_1', events: events.map(encodeLoomsEvent) })
          }

          liveRequests += 1
          const lastEventId = req.headers.get('last-event-id')

          const cursor = lastEventId
            ? Number(lastEventId)
            : Number(url.searchParams.get('fromSeq') ?? '1') - 1

          const pending = events.filter((item) => item.seq > cursor)

          const stream = new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder()

              for (const item of pending) {
                controller.enqueue(encoder.encode(sseFrame(item)))
              }

              req.signal.addEventListener('abort', () => {
                try {
                  controller.close()
                } catch {
                  // already closed
                }
              })
            },
          })

          return new Response(stream, {
            headers: { 'content-type': 'text/event-stream' },
          })
        }

        if (url.pathname === '/runs/run_1/events' && req.method === 'POST') {
          return Response.json({ ok: true })
        }

        return new Response('Not Found', { status: 404 })
      },
    })

    endpoint = `http://127.0.0.1:${server.port}`
  })

  afterAll(() => {
    void server.stop()
  })

  test('pulls events and materializes the run row', async () => {
    const store = createLoomsStore({ storeId: 'run_1', endpoint, reconnectDelayMs: 10_000, fetch })
    await store.sync()
    expect(store.getState().runs.get('run_1')?.status).toBe('running')
    expect(store.events()[0]?.type).toBe('runtime.run.started')
    store.dispose()
    store.subscribe(() => undefined)
    await store.sync()
    expect(store.events()[0]?.type).toBe('runtime.run.started')
    await store.sync()
    expect(store.events()).toHaveLength(1)
    store.dispose()
  })

  test('applies events from the live SSE stream', async () => {
    const store = createLoomsStore({ storeId: 'run_1', endpoint, reconnectDelayMs: 10_000, fetch })
    await waitFor(() => store.events().length === 1)
    expect(store.getState().runs.get('run_1')?.status).toBe('running')
    expect(store.events()[0]?.type).toBe('runtime.run.started')
    store.dispose()
  })

  test('dispose stops further live requests', async () => {
    const before = liveRequests
    const store = createLoomsStore({ storeId: 'run_1', endpoint, reconnectDelayMs: 20, fetch })
    await waitFor(() => store.events().length === 1)
    store.dispose()
    await Bun.sleep(80)
    expect(liveRequests).toBeLessThan(before + 4)
  })
})

describe('createLoomsStore reconnect', () => {
  test('resumes from Last-Event-ID after the stream closes', async () => {
    const log: EventEnvelope[] = [
      event(1, 'runtime.run.started'),
      event(2, 'runtime.thread.started'),
    ]

    let connections = 0
    const seenLastEventIds: string[] = []

    const server = Bun.serve({
      port: 0,
      async fetch(req) {
        const url = new URL(req.url)

        if (url.pathname !== '/runs/run_1/events') {
          return new Response('Not Found', { status: 404 })
        }

        if (
          url.searchParams.get('live') !== 'true' &&
          !(req.headers.get('accept') ?? '').includes('text/event-stream')
        ) {
          return Response.json({ runId: 'run_1', events: [] })
        }

        connections += 1
        const lastEventId = req.headers.get('last-event-id')

        if (lastEventId) {
          seenLastEventIds.push(lastEventId)
        }

        const cursor = lastEventId
          ? Number(lastEventId)
          : Number(url.searchParams.get('fromSeq') ?? '1') - 1

        const pending = log.filter((item) => item.seq > cursor)
        const first = pending[0]

        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder()

            if (first) {
              controller.enqueue(encoder.encode(sseFrame(first)))
            }

            controller.close()
          },
        })

        return new Response(stream, { headers: { 'content-type': 'text/event-stream' } })
      },
    })

    const store = createLoomsStore({
      storeId: 'run_1',
      endpoint: `http://127.0.0.1:${server.port}`,
      reconnectDelayMs: 20,
      fetch,
    })

    await waitFor(() => store.events().length === 2)
    expect(store.events().map((item) => item.seq)).toEqual([1, 2])
    expect(seenLastEventIds).toContain('1')
    expect(connections).toBeGreaterThanOrEqual(2)
    store.dispose()
    void server.stop()
  })

  test('recovers and reconnects when EventSource enters CLOSED state', async () => {
    type ListenerFn = (payload?: JsonValue) => void
    interface MockInstance {
      readyState: number
      listeners: Map<string, Array<ListenerFn>>
      close(): void
      dispatch(name: string, payload?: JsonValue): void
    }
    const instances: MockInstance[] = []

    class MockEventSource {
      static readonly CONNECTING = 0
      static readonly OPEN = 1
      static readonly CLOSED = 2

      readyState = MockEventSource.OPEN
      listeners = new Map<string, Array<ListenerFn>>()

      constructor(_url: string) {
        instances.push(this)
      }

      addEventListener(name: string, fn: ListenerFn) {
        const list = this.listeners.get(name) ?? []
        list.push(fn)
        this.listeners.set(name, list)
      }

      dispatch(name: string, payload?: JsonValue) {
        for (const fn of this.listeners.get(name) ?? []) {
          fn(payload)
        }
      }

      close() {
        this.readyState = MockEventSource.CLOSED
      }
    }

    const prevEventSource = globalThis.EventSource

    Object.defineProperty(globalThis, 'EventSource', {
      configurable: true,
      value: MockEventSource,
    })

    try {
      const store = createLoomsStore({
        storeId: 'run_1',
        endpoint: 'http://127.0.0.1:9999',
        reconnectDelayMs: 15,
      })

      expect(instances.length).toBe(1)
      instances[0]?.dispatch('open')

      instances[0]?.dispatch('message', {
        data: JSON.stringify({ batch: [encodeLoomsEvent(event(1, 'runtime.run.started'))] }),
      })

      expect(store.events().length).toBe(1)

      // Simulate unexpected server error or socket close that transitions EventSource to CLOSED
      instances[0]!.readyState = MockEventSource.CLOSED
      instances[0]?.dispatch('error')

      // Store must automatically recover by creating a new EventSource instance
      await waitFor(() => instances.length >= 2)
      expect(instances.length).toBe(2)
      expect(instances[0]?.readyState).toBe(MockEventSource.CLOSED)

      store.dispose()
    } finally {
      Object.defineProperty(globalThis, 'EventSource', {
        configurable: true,
        value: prevEventSource,
      })
    }
  })
})
