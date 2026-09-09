import { describe, expect, test } from 'bun:test'
import { Predicate } from 'effect'
import { createLoomsClient } from './client'

function hrefOf(input: RequestInfo | URL): string {
  if (Predicate.isString(input)) return input
  if (input instanceof URL) return input.href
  if (input instanceof Request) return input.url
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

  test('subscribeEvents follows /api/livestore SSE', async () => {
    const received: string[] = []
    const client = createLoomsClient({
      fetch: async (input) => {
        const href = hrefOf(input)
        expect(href).toContain('/api/livestore')
        expect(href).toContain('live=true')
        expect(href).toContain('storeId=run_1')
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder()
            controller.enqueue(
              encoder.encode(
                `id: 1\ndata: ${JSON.stringify({
                  batch: [
                    {
                      name: 'runtime.run.started',
                      args: {
                        id: 'evt_1',
                        ts: Date.now(),
                        payload: {},
                        threadId: 'thr_1',
                        parentThreadId: null,
                        causationId: null,
                        correlationId: null,
                        effectId: null,
                        ephemeral: false,
                        origin: { type: 'system' },
                      },
                      seqNum: 1,
                      parentSeqNum: 0,
                      clientId: 'looms-host',
                      sessionId: 'looms-host',
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
})
