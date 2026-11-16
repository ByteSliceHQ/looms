import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import { encodeLoomsEvent, type EventEnvelope } from '@looms/core'

import { createLoomsStore } from './store'

function event(seq: number): EventEnvelope {
  return {
    id: `evt_${seq}`,
    runId: 'run_1',
    seq,
    ts: Date.now(),
    type: seq === 1 ? 'runtime.run.started' : 'test.tick',
    payload: { rootThreadId: 'thr_1', kind: 'agent', definitionName: 'echo', input: null },
    threadId: 'thr_1',
    origin: { type: 'system' },
  }
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

describe('catching up to the log', () => {
  const log = [event(1), event(2), event(3), event(4)]
  // Set by a test to hold the replay back until it says so.
  let gate: Promise<void> = Promise.resolve()
  // A filtered subscription is not sent every event; here it never gets the one at the tail.
  let hideTail = false
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
        requestedFromSeq.push(fromSeq)
        const encoder = new TextEncoder()

        const stream = new ReadableStream({
          async start(controller) {
            const hello = { type: 'hello', head: 1, tail: log.length }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(hello)}\n\n`))
            await gate

            for (const item of log.filter(
              (entry) => entry.seq >= fromSeq && !(hideTail && entry.seq === log.length),
            )) {
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

  test('is not synced until it holds the tail the subscription reported', async () => {
    let open!: () => void

    // oxlint-disable-next-line effecttsgo/new-promise
    gate = new Promise<void>((resolve) => {
      open = resolve
    })

    const store = createLoomsStore({ storeId: 'run_1', endpoint, fetch })

    await waitFor(() => store.status() === 'live')
    await Bun.sleep(30)
    expect(store.synced()).toBe(false)

    open()
    await waitFor(() => store.synced())
    expect(store.events()).toHaveLength(4)
    store.dispose()
  })

  test('starts from a seed cursor and never sees what came before it', async () => {
    gate = Promise.resolve()
    requestedFromSeq = []
    const store = createLoomsStore({ storeId: 'run_1', endpoint, fetch, fromSeq: 3 })

    await waitFor(() => store.synced())
    expect(requestedFromSeq).toEqual([3])
    expect(store.events().map((item) => item.seq)).toEqual([3, 4])
    store.dispose()
  })

  test('a seed cursor already at the tail is synced with nothing to download', async () => {
    const store = createLoomsStore({ storeId: 'run_1', endpoint, fetch, fromSeq: 5 })

    await waitFor(() => store.synced())
    expect(store.events()).toHaveLength(0)
    store.dispose()
  })

  test('a filtered subscription is synced once its replay goes quiet', async () => {
    hideTail = true

    const store = createLoomsStore({
      storeId: 'run_1',
      endpoint,
      fetch,
      includeEphemeral: false,
    })

    await waitFor(() => store.events().length === 3)
    expect(store.synced()).toBe(false)
    await waitFor(() => store.synced())
    hideTail = false
    store.dispose()
  })
})
