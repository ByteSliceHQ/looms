import { describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'

import { emptyRunState } from '@looms/core'

import { createLoomsClient } from './client'
import { consumeSseStream } from './sse'

function hrefOf(input: RequestInfo | URL): string {
  if (Predicate.isString(input)) {
    return input
  }

  if (input instanceof URL) {
    return input.href
  }

  if (input instanceof Request) {
    return input.url
  }

  return '/runs'
}

describe('createLoomsClient', () => {
  test('builds relative run routes', async () => {
    const calls: string[] = []

    const client = createLoomsClient({
      fetch: async (input) => {
        calls.push(hrefOf(input))
        return new Response(
          JSON.stringify({
            runId: 'run_1',
            threadId: 'thr_1',
            state: emptyRunState('run_1'),
          }),
          {
            headers: { 'content-type': 'application/json' },
          },
        )
      },
    })

    await client.start({ kind: 'agent', name: 'echo' }, { text: 'hi' })
    expect(calls[0]).toBe('/runs')
  })

  test('cancel posts the optional thread to the cancel route', async () => {
    const calls: { href: string; method?: string; body?: unknown }[] = []

    const client = createLoomsClient({
      fetch: async (input, init) => {
        calls.push({ href: hrefOf(input), method: init?.method, body: init?.body })
        return Response.json({ runId: 'run 1', state: emptyRunState('run 1') })
      },
    })

    await client.cancel('run 1')
    await client.cancel('run 1', 'thr_child')

    expect(calls).toEqual([
      { href: '/runs/run%201/cancel', method: 'POST', body: '{}' },
      { href: '/runs/run%201/cancel', method: 'POST', body: '{"threadId":"thr_child"}' },
    ])
  })

  test('startRun sends the trace context as W3C headers, not in the body', async () => {
    const calls: { traceparent: string | null; tracestate: string | null; body: unknown }[] = []

    const client = createLoomsClient({
      fetch: async (_input, init) => {
        const headers = new Headers(init?.headers)

        calls.push({
          traceparent: headers.get('traceparent'),
          tracestate: headers.get('tracestate'),
          body: Predicate.isString(init?.body) ? JSON.parse(init.body) : null,
        })

        return Response.json({ runId: 'run_1', threadId: 'thr_1', state: emptyRunState('run_1') })
      },
    })

    const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'

    await client.startRun({
      kind: 'agent',
      definitionName: 'echo',
      trace: { traceparent, tracestate: 'k=v' },
    })

    expect(calls).toEqual([
      { traceparent, tracestate: 'k=v', body: { kind: 'agent', definitionName: 'echo' } },
    ])
  })

  test('workerSecrets posts to the attempt with the worker token', async () => {
    const calls: { href: string; authorization?: string | null }[] = []

    const client = createLoomsClient({
      workerCallbackToken: 'worker-token',
      fetch: async (input, init) => {
        calls.push({
          href: hrefOf(input),
          authorization: new Headers(init?.headers).get('authorization'),
        })

        return Response.json({ status: 'accepted', secrets: { token: 'abc' } })
      },
    })

    const result = await client.workerSecrets('run 1', { effectId: 'eff/1', attempt: 2 })

    expect(result).toEqual({ status: 'accepted', secrets: { token: 'abc' } })

    expect(calls).toEqual([
      { href: '/runs/run%201/effects/eff%2F1/2/secrets', authorization: 'Bearer worker-token' },
    ])
  })

  test('listDefinitions reads the definitions route', async () => {
    const calls: string[] = []

    const client = createLoomsClient({
      fetch: async (input) => {
        calls.push(hrefOf(input))
        return new Response(
          JSON.stringify({
            definitions: [{ kind: 'workflow', name: 'checkout', version: 'v1' }],
            projections: ['nodes'],
          }),
          { headers: { 'content-type': 'application/json' } },
        )
      },
    })

    const catalog = await client.listDefinitions()
    expect(calls).toEqual(['/definitions'])
    expect(catalog.definitions[0]?.name).toBe('checkout')
    expect(catalog.projections).toEqual(['nodes'])
  })

  test('listEffects reads the effects route', async () => {
    const calls: string[] = []

    const client = createLoomsClient({
      fetch: async (input) => {
        calls.push(hrefOf(input))
        return new Response(
          JSON.stringify({
            effects: [{ type: 'billing.charge', placement: 'worker' }],
          }),
          { headers: { 'content-type': 'application/json' } },
        )
      },
    })

    const catalog = await client.listEffects()
    expect(calls).toEqual(['/definitions/effects'])
    expect(catalog.effects).toEqual([{ type: 'billing.charge', placement: 'worker' }])
  })

  test('listRunSummaries asks the runs route for summaries', async () => {
    const calls: string[] = []

    const client = createLoomsClient({
      fetch: async (input) => {
        calls.push(hrefOf(input))

        return Response.json({
          runIds: ['run_1'],
          runs: [
            { runId: 'run_1', status: 'running', kind: 'workflow', definitionName: 'checkout' },
          ],
        })
      },
    })

    const { runs } = await client.listRunSummaries()
    expect(calls).toEqual(['/runs/summaries'])
    expect(runs[0]?.definitionName).toBe('checkout')
  })

  test('subscribeEvents follows the run event resource over SSE', async () => {
    const received: string[] = []

    const client = createLoomsClient({
      fetch: async (input) => {
        const href = hrefOf(input)
        expect(href).toContain('/runs/run_1/events')
        expect(href).toContain('fromSeq=1')

        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder()

            controller.enqueue(
              encoder.encode(
                `id: 1\ndata: ${JSON.stringify({
                  batch: [
                    {
                      id: 'evt_1',
                      runId: 'run_1',
                      seq: 1,
                      ts: Date.now(),
                      type: 'runtime.run.started',
                      payload: {},
                      threadId: 'thr_1',
                      parentThreadId: null,
                      causationId: null,
                      correlationId: null,
                      effectId: null,
                      ephemeral: false,
                      origin: { type: 'system' },
                    },
                  ],
                })}\n\n`,
              ),
            )
          },
        })

        return new Response(stream, { headers: { 'content-type': 'text/event-stream' } })
      },
    })

    const stop = client.subscribeEvents('run_1', (event) => {
      received.push(event.type)
    })

    const start = Date.now()

    while (received.length === 0 && Date.now() - start < 2_000) {
      await Bun.sleep(10)
    }

    expect(received).toEqual(['runtime.run.started'])
    stop()
  })

  test('subscribeEvents puts the read grant on the event stream', async () => {
    const calls: string[] = []

    const client = createLoomsClient({
      grant: 'v1.abc.def',
      fetch: async (input) => {
        calls.push(hrefOf(input))

        return new Response(null, { status: 401 })
      },
    })

    const stop = client.subscribeEvents('run_1', () => undefined)
    const start = Date.now()

    while (calls.length === 0 && Date.now() - start < 2_000) {
      await Bun.sleep(10)
    }

    stop()
    expect(calls[0]).toContain('/runs/run_1/events')
    expect(calls[0]).toContain('grant=v1.abc.def')
  })

  test('subscribeEvents resumes from a resync head', async () => {
    const calls: string[] = []
    let attempt = 0

    const started = {
      id: 'evt_4',
      runId: 'run_1',
      seq: 4,
      ts: 1,
      type: 'runtime.run.started',
      payload: {},
      threadId: 'thr_1',
      parentThreadId: null,
      causationId: null,
      correlationId: null,
      effectId: null,
      ephemeral: false,
      origin: { type: 'system' },
    }

    const client = createLoomsClient({
      fetch: async (input) => {
        calls.push(hrefOf(input))
        attempt += 1
        const encoder = new TextEncoder()

        const frame =
          attempt === 1
            ? `data: ${JSON.stringify({ type: 'resync', head: 4, reason: 'trimmed' })}\n\n`
            : `id: 4\ndata: ${JSON.stringify({ batch: [started] })}\n\n`

        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(frame))
              controller.close()
            },
          }),
          { headers: { 'content-type': 'text/event-stream' } },
        )
      },
    })

    const received: number[] = []

    const stop = client.subscribeEvents(
      'run_1',
      (event) => {
        received.push(event.seq)
      },
      { reconnectDelayMs: 20 },
    )

    const start = Date.now()

    while (received.length === 0 && Date.now() - start < 2_000) {
      await Bun.sleep(10)
    }

    expect(received).toEqual([4])
    expect(calls[0]).toContain('fromSeq=1')
    expect(calls.some((href) => href.includes('fromSeq=4'))).toBe(true)
    stop()
  })

  test('subscribeEvents can follow a websocket with the read grant', async () => {
    const received: number[] = []

    class FakeSocket {
      static latest: FakeSocket | undefined
      readonly url: string
      private readonly listeners = new Map<
        string,
        Array<(event: { readonly data?: unknown }) => void>
      >()

      constructor(url: string) {
        this.url = url
        FakeSocket.latest = this
      }

      addEventListener(type: string, listener: (event: { readonly data?: unknown }) => void): void {
        const current = this.listeners.get(type) ?? []
        current.push(listener)
        this.listeners.set(type, current)
      }

      emit(type: string, data?: string): void {
        for (const listener of this.listeners.get(type) ?? []) {
          listener({ data })
        }
      }

      close(): void {
        this.emit('close')
      }
    }

    const client = createLoomsClient({ baseUrl: 'http://looms.test', grant: 'v1.abc.def' })

    const stop = client.subscribeEvents(
      'run_1',
      (event) => {
        received.push(event.seq)
      },
      { transport: 'websocket', webSocket: FakeSocket, reconnectDelayMs: 60_000 },
    )

    const socket = FakeSocket.latest
    expect(socket?.url).toBe('ws://looms.test/runs/run_1/events?fromSeq=1&grant=v1.abc.def')
    socket?.emit('message', JSON.stringify({ type: 'hello', head: 1, tail: 1 }))

    socket?.emit(
      'message',
      JSON.stringify({
        batch: [
          {
            id: 'evt_1',
            runId: 'run_1',
            seq: 1,
            ts: 1,
            type: 'runtime.run.started',
            payload: {},
            threadId: 'thr_1',
            parentThreadId: null,
            causationId: null,
            correlationId: null,
            effectId: null,
            ephemeral: false,
            origin: { type: 'system' },
          },
        ],
      }),
    )

    const start = Date.now()

    while (received.length === 0 && Date.now() - start < 2_000) {
      await Bun.sleep(10)
    }

    expect(received).toEqual([1])
    stop()
  })

  test('stream yields live deltas then the completed run events', async () => {
    const client = createLoomsClient({
      fetch: async (input, init) => {
        const href = hrefOf(input)

        if (href === '/runs' && init?.method === 'POST') {
          const stream = new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder()

              controller.enqueue(
                encoder.encode(
                  `id: 1\ndata: ${JSON.stringify({
                    batch: [
                      {
                        id: 'evt_delta',
                        runId: 'run_stream',
                        seq: 1,
                        ts: Date.now(),
                        type: 'agent.turn.text_delta',
                        payload: { turn: 1, delta: 'hel' },
                        threadId: 'thr_1',
                        parentThreadId: null,
                        causationId: null,
                        correlationId: null,
                        effectId: null,
                        ephemeral: true,
                        origin: { type: 'system' },
                      },
                    ],
                  })}\n\n`,
                ),
              )

              controller.enqueue(
                encoder.encode(
                  `id: 2\ndata: ${JSON.stringify({
                    batch: [
                      {
                        id: 'evt_msg',
                        runId: 'run_stream',
                        seq: 2,
                        ts: Date.now(),
                        type: 'agent.message',
                        payload: { turn: 1, message: { role: 'assistant', content: 'hello' } },
                        threadId: 'thr_1',
                        parentThreadId: null,
                        causationId: null,
                        correlationId: null,
                        effectId: null,
                        ephemeral: false,
                        origin: { type: 'system' },
                      },
                    ],
                  })}\n\n`,
                ),
              )

              controller.enqueue(
                encoder.encode(
                  `event: done\ndata: ${JSON.stringify({
                    runId: 'run_stream',
                    threadId: 'thr_1',
                    state: { status: 'completed' },
                  })}\n\n`,
                ),
              )

              controller.close()
            },
          })

          return new Response(stream, { headers: { 'content-type': 'text/event-stream' } })
        }

        return new Response('not found', { status: 404 })
      },
    })

    const handle = client.streamRun({ kind: 'agent', definitionName: 'echo', runId: 'run_stream' })
    expect(handle.runId).toBe('run_stream')
    const types: string[] = []

    for await (const event of handle) {
      types.push(event.type)
    }

    expect(types).toEqual(['agent.turn.text_delta', 'agent.message'])
  })
})

test('consumeSseStream cancels its reader when aborted', async () => {
  let cancelled = false

  const stream = new ReadableStream<Uint8Array>({
    pull: () => new Promise(() => undefined),
    cancel: () => {
      cancelled = true
    },
  })

  const controller = new AbortController()
  const consuming = consumeSseStream(stream, () => undefined, controller.signal)

  await Promise.resolve()
  controller.abort()
  await consuming.catch(() => undefined)

  expect(cancelled).toBe(true)
})
