import { describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'

import { createLoomsClient } from './client'

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
        return new Response(JSON.stringify({ runId: 'run_1', threadId: 'thr_1', state: {} }), {
          headers: { 'content-type': 'application/json' },
        })
      },
    })

    await client.start({ kind: 'agent', name: 'echo' }, { text: 'hi' })
    expect(calls[0]).toBe('/runs')
  })

  test('subscribeEvents follows /api/events SSE', async () => {
    const received: string[] = []

    const client = createLoomsClient({
      fetch: async (input) => {
        const href = hrefOf(input)
        expect(href).toContain('/api/events')
        expect(href).toContain('live=true')
        expect(href).toContain('runId=run_1')

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
