import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import { createElement } from 'react'
import { renderToString } from 'react-dom/server'

import { encodeLoomsEvent, type EventEnvelope } from '@looms/core'

import { LoomsProvider, preloadRunStore, useRunStore, type LoomsClientStore } from './react'

function event(runId: string, seq: number): EventEnvelope {
  return {
    id: `evt_${runId}_${seq}`,
    runId,
    seq,
    ts: Date.now(),
    type: seq === 1 ? 'runtime.run.started' : 'test.tick',
    payload: { rootThreadId: 'thr_1', kind: 'agent', definitionName: 'echo', input: null },
    threadId: 'thr_1',
    origin: { type: 'system' },
  }
}

describe('preloading a run store outside React', () => {
  // Set by a test to hold the replay back until it says so.
  let gate: Promise<void> = Promise.resolve()
  const opened = new Map<string, number>()
  let server: ReturnType<typeof Bun.serve>
  let endpoint: string

  beforeAll(() => {
    server = Bun.serve({
      port: 0,
      fetch(req) {
        const url = new URL(req.url)
        const runId = /^\/runs\/([^/]+)\/events$/.exec(url.pathname)?.[1]

        if (!runId || req.method !== 'GET') {
          return new Response('Not Found', { status: 404 })
        }

        opened.set(runId, (opened.get(runId) ?? 0) + 1)

        const log = [1, 2, 3].map((seq) => event(runId, seq))
        const encoder = new TextEncoder()

        const stream = new ReadableStream({
          async start(controller) {
            const hello = { type: 'hello', head: 1, tail: log.length }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(hello)}\n\n`))
            await gate

            for (const item of log) {
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

  test('resolves with the store once it has caught up to the log', async () => {
    const held = Promise.withResolvers<void>()

    gate = held.promise

    let resolved = false

    const loading = preloadRunStore('run_wait', { endpoint, retainMs: 0 }).then((store) => {
      resolved = true

      return store
    })

    await Bun.sleep(50)
    expect(resolved).toBe(false)

    held.resolve()

    const store = await loading

    expect(store.synced()).toBe(true)
    expect(store.events()).toHaveLength(3)
  })

  test('gives the same store to a second caller and opens the log once', async () => {
    gate = Promise.resolve()

    const options = { endpoint, retainMs: 1_000 }
    const first = await preloadRunStore('run_shared', options)
    // Already caught up, so this one resolves without waiting on anything.
    const second = await preloadRunStore('run_shared', options)

    expect(second).toBe(first)
    expect(opened.get('run_shared')).toBe(1)
  })

  test('a component under a provider with the same options gets the preloaded store', async () => {
    gate = Promise.resolve()

    const options = { endpoint, retainMs: 1_000 }
    const preloaded = await preloadRunStore('run_page', options)
    let seen: LoomsClientStore | undefined

    function Page() {
      seen = useRunStore('run_page')

      return null
    }

    renderToString(createElement(LoomsProvider, { ...options, children: createElement(Page) }))

    expect(seen).toBe(preloaded)
    expect(seen?.synced()).toBe(true)
    expect(opened.get('run_page')).toBe(1)
  })

  test('keeps the store for the retention time, then lets it go', async () => {
    gate = Promise.resolve()

    const options = { endpoint, retainMs: 40 }
    const first = await preloadRunStore('run_retained', options)

    await Bun.sleep(120)

    // The first store was disposed when its retention ran out, so this opens the run again.
    const second = await preloadRunStore('run_retained', options)

    expect(second).not.toBe(first)
    expect(opened.get('run_retained')).toBe(2)
  })

  test('rejects with the reason when the signal aborts before the log arrives', async () => {
    gate = Promise.withResolvers<void>().promise

    const controller = new AbortController()

    const loading = preloadRunStore('run_aborted', {
      endpoint,
      retainMs: 0,
      signal: controller.signal,
    })

    await Bun.sleep(30)
    controller.abort(new Error('navigated away'))

    const failure = await loading.catch((cause: unknown) => cause)

    expect(failure).toEqual(new Error('navigated away'))
  })

  test('rejects without opening anything when the signal has already aborted', async () => {
    const before = opened.get('run_never') ?? 0

    const failure = await preloadRunStore('run_never', {
      endpoint,
      signal: AbortSignal.abort(new Error('too late')),
    }).catch((cause: unknown) => cause)

    expect(failure).toEqual(new Error('too late'))

    await Bun.sleep(30)
    expect(opened.get('run_never') ?? 0).toBe(before)
  })
})
