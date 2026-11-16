import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import { encodeLoomsEvent, type EventEnvelope } from '@looms/core'

import { memoryEventCache } from './cache'
import type { StoreObservation } from './observer'
import { createLoomsStore } from './store'

function event(seq: number, ephemeral = false): EventEnvelope {
  return {
    id: `evt_${seq}`,
    runId: 'run_1',
    seq,
    ts: Date.now(),
    type: seq === 1 ? 'runtime.run.started' : 'test.tick',
    payload: { rootThreadId: 'thr_1', kind: 'agent', definitionName: 'echo', input: null },
    threadId: 'thr_1',
    origin: { type: 'system' },
    ephemeral,
  }
}

async function waitFor(predicate: () => boolean, timeoutMs = 3_000): Promise<void> {
  const start = Date.now()

  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('timed out waiting for store update')
    }

    await Bun.sleep(10)
  }
}

describe('a store with an event cache', () => {
  let log: EventEnvelope[] = []
  let requestedFromSeq: number[] = []
  let server: ReturnType<typeof Bun.serve>
  let endpoint: string

  beforeAll(() => {
    server = Bun.serve({
      port: 0,
      fetch(req) {
        const url = new URL(req.url)

        if (url.pathname !== '/runs/run_1/events' || req.method !== 'GET') {
          return new Response('Not Found', { status: 404 })
        }

        const fromSeq = Number(url.searchParams.get('fromSeq') ?? '1')
        const sent = log.filter((entry) => entry.seq >= fromSeq)

        if (url.searchParams.get('live') !== 'true') {
          return Response.json({ runId: 'run_1', events: sent.map(encodeLoomsEvent) })
        }

        requestedFromSeq.push(fromSeq)
        const encoder = new TextEncoder()

        const stream = new ReadableStream({
          start(controller) {
            const tail = log.at(-1)?.seq ?? 0
            const hello = { type: 'hello', head: 1, tail }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(hello)}\n\n`))

            for (const item of sent) {
              const frame = JSON.stringify({ batch: [encodeLoomsEvent(item)] })
              controller.enqueue(encoder.encode(`id: ${item.seq}\ndata: ${frame}\n\n`))
            }
          },
        })

        return new Response(stream, { headers: { 'content-type': 'text/event-stream' } })
      },
    })

    endpoint = `http://127.0.0.1:${server.port}`
  })

  afterAll(() => {
    void server.stop()
  })

  test('keeps durable events and starts the next store from them', async () => {
    log = [event(1), event(2), event(3, true), event(4)]
    requestedFromSeq = []
    const cache = memoryEventCache()

    const first = createLoomsStore({ storeId: 'run_1', endpoint, fetch, cache })
    await waitFor(() => first.synced())
    first.dispose()
    await waitFor(() => requestedFromSeq.length === 1)

    log = [...log, event(5)]
    const seen: StoreObservation[] = []

    const second = createLoomsStore({
      storeId: 'run_1',
      endpoint,
      fetch,
      cache,
      observer: { observe: (observation) => seen.push(observation) },
    })

    await waitFor(() => second.synced())

    // Only what was appended since is asked for, and the ephemeral event was never kept.
    expect(requestedFromSeq).toEqual([1, 5])
    expect(second.events().map((item) => item.seq)).toEqual([1, 2, 4, 5])

    const synced = seen.find((observation) => observation.type === 'store.synced')

    expect(synced).toMatchObject({ eventCount: 4, cachedEvents: 3 })
    second.dispose()
  })

  test('throws the cache away when the host has a different, shorter log', async () => {
    log = [event(1), event(2), event(3), event(4)]
    const cache = memoryEventCache()

    const first = createLoomsStore({ storeId: 'run_1', endpoint, fetch, cache })
    await waitFor(() => first.synced())
    first.dispose()

    // The run was recreated: same id, new log.
    log = [event(1), event(2)]

    const second = createLoomsStore({
      storeId: 'run_1',
      endpoint,
      fetch,
      cache,
      reconnectDelayMs: 20,
    })

    await waitFor(() => second.synced())

    expect(second.events().map((item) => item.seq)).toEqual([1, 2])
    await waitFor(() => second.status() === 'live')
    second.dispose()

    await Bun.sleep(20)
    expect((await cache.load(`${endpoint}|run_1|`)).map((item) => item.seq)).toEqual([1, 2])
  })
})
