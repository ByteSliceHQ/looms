import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { makeMemoryEventStore } from '@looms/core'

import { createEventStreamResponse } from './sse'

describe('createEventStreamResponse', () => {
  test('sends immediate keepalive and correct headers', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const abort = new AbortController()

    let timeoutCalledWith: [unknown, number] | undefined

    // SAFETY: Mocking Bun request with runtime.bun.server for testing.
    const mockReq = new Request('http://test/stream') as Request & {
      runtime: { bun: { server: { timeout: (r: Request, s: number) => void } } }
    }

    mockReq.runtime = {
      bun: {
        server: {
          timeout: (r: Request, s: number) => {
            timeoutCalledWith = [r, s]
          },
        },
      },
    }

    const res = createEventStreamResponse({
      signal: abort.signal,
      request: mockReq,
      store,
      runId: 'run_sse_test',
      heartbeatMs: 1_000,
    })

    expect(res.headers.get('content-type')).toBe('text/event-stream')
    expect(res.headers.get('connection')).toBe('keep-alive')
    expect(res.headers.get('x-accel-buffering')).toBe('no')
    expect(timeoutCalledWith).toEqual([mockReq, 0])

    const reader = res.body?.getReader()

    if (!reader) {
      throw new Error('missing stream body')
    }

    // First chunk must be the immediate keepalive
    const { value } = await reader.read()
    const firstText = new TextDecoder().decode(value)
    expect(firstText).toBe(': keepalive\n\n')

    // Stream cancellation triggers cleanup
    await reader.cancel()
    abort.abort()
  })
})
