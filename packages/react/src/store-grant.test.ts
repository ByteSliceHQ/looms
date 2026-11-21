import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import type { SubscriptionSocket } from '@looms/client'

import { createLoomsStore } from './store'

async function waitFor(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const start = Date.now()

  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('timed out waiting for the store')
    }

    await Bun.sleep(10)
  }
}

interface Seen {
  readonly method: string
  readonly path: string
  readonly grant: string | null
  readonly authorization: string | null
}

describe('reaching a host on another origin', () => {
  let seen: Seen[] = []
  let server: ReturnType<typeof Bun.serve>
  let endpoint: string

  beforeAll(() => {
    server = Bun.serve({
      port: 0,
      fetch(req) {
        const url = new URL(req.url)

        seen.push({
          method: req.method,
          path: url.pathname,
          grant: url.searchParams.get('grant'),
          authorization: req.headers.get('authorization'),
        })

        if (req.method === 'POST') {
          return Response.json({ ok: true })
        }

        if (url.searchParams.get('live') !== 'true') {
          return Response.json({ events: [] })
        }

        const hello = `data: ${JSON.stringify({ type: 'hello', head: 1, tail: 0 })}\n\n`

        return new Response(hello, { headers: { 'content-type': 'text/event-stream' } })
      },
    })

    endpoint = `http://127.0.0.1:${server.port}`
  })

  afterAll(() => {
    void server.stop()
  })

  test('the grant goes with reads of the log and not with a commit', async () => {
    seen = []
    let current = 'v1.first.sig'

    const store = createLoomsStore({
      storeId: 'run_1',
      endpoint,
      fetch,
      grant: () => current,
    })

    const stop = store.subscribe(() => {})

    await waitFor(() => seen.some((request) => request.method === 'GET'))
    current = 'v1.second.sig'
    await store.sync()
    await store.commit({ type: 'test.tick', payload: {} })

    const reads = seen.filter((request) => request.method === 'GET')
    const writes = seen.filter((request) => request.method === 'POST')

    expect(reads.length).toBeGreaterThan(0)
    expect(reads.every((request) => request.grant?.startsWith('v1.') === true)).toBe(true)
    // Asked for again on each request, so a renewed grant is the one that is sent.
    expect(reads.at(-1)?.grant).toBe('v1.second.sig')
    expect(writes.length).toBeGreaterThan(0)
    expect(writes.every((request) => request.grant === null)).toBe(true)

    stop()
    store.dispose()
  })

  test('a store with no grant sends none', async () => {
    seen = []

    const store = createLoomsStore({ storeId: 'run_1', endpoint, fetch })
    const stop = store.subscribe(() => {})

    await waitFor(() => seen.length > 0)
    expect(seen.every((request) => request.grant === null)).toBe(true)

    stop()
    store.dispose()
  })

  test("the host's own fetch makes the requests, so it can add a header", async () => {
    seen = []

    const store = createLoomsStore({
      storeId: 'run_1',
      endpoint,
      fetch: (input, init) => {
        const headers = new Headers(init?.headers)

        headers.set('authorization', 'Bearer host')

        return fetch(input, { ...init, headers })
      },
    })

    const stop = store.subscribe(() => {})

    await waitFor(() => seen.length > 0)
    expect(seen.every((request) => request.authorization === 'Bearer host')).toBe(true)

    stop()
    store.dispose()
  })

  test('the live socket carries the grant, which it has no header for', async () => {
    const opened: string[] = []

    class RecordingSocket implements SubscriptionSocket {
      constructor(url: string) {
        opened.push(url)
      }

      addEventListener(): void {}

      close(): void {}
    }

    const store = createLoomsStore({
      storeId: 'run_1',
      endpoint,
      fetch,
      transport: 'websocket',
      webSocket: RecordingSocket,
      grant: 'v1.socket.sig',
    })

    const stop = store.subscribe(() => {})

    await waitFor(() => opened.length > 0)

    const url = new URL(opened[0] ?? '')

    expect(url.protocol).toBe('ws:')
    expect(url.searchParams.get('grant')).toBe('v1.socket.sig')

    stop()
    store.dispose()
  })
})
