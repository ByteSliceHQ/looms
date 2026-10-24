import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { createEvent, makeMemoryEventStore } from '@looms/core'

import { createEventStreamResponse } from './sse'

describe('createEventStreamResponse', () => {
  test('sends immediate keepalive and correct headers', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const abort = new AbortController()

    let timeoutCalledWith: [unknown, number] | undefined

    const mockReq = new Request('http://test/stream')

    Object.defineProperty(mockReq, 'runtime', {
      value: {
        bun: {
          server: {
            timeout: (request: Request, seconds: number) => {
              timeoutCalledWith = [request, seconds]
            },
          },
        },
      },
    })

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

  test('tells the client to resync when the cursor was trimmed', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const event = createEvent('run_trim', {
      type: 'runtime.thread.started',
      payload: {
        threadId: 'thr_a',
        kind: 'workflow',
        definitionName: 'checkout',
        definitionVersion: 'v1',
        input: null,
        parentThreadId: null,
      },
      threadId: 'thr_a',
      origin: { type: 'system' },
    })

    const second = createEvent('run_trim', {
      type: 'runtime.thread.started',
      payload: {
        threadId: 'thr_a',
        kind: 'workflow',
        definitionName: 'checkout',
        definitionVersion: 'v1',
        input: null,
        parentThreadId: null,
      },
      threadId: 'thr_a',
      origin: { type: 'system' },
    })

    await Effect.runPromise(store.append('run_trim', [event, second], { expectedTail: 0 }))

    if (!store.trim) {
      throw new Error('memory store does not trim')
    }

    await Effect.runPromise(store.trim('run_trim', 2))

    const abort = new AbortController()

    const res = createEventStreamResponse({
      signal: abort.signal,
      store,
      runId: 'run_trim',
      fromSeq: 1,
      heartbeatMs: 60_000,
    })

    const reader = res.body?.getReader()

    if (!reader) {
      throw new Error('missing stream body')
    }

    const decoder = new TextDecoder()
    let text = ''

    while (!text.includes('resync')) {
      const chunk = await reader.read()

      if (chunk.done) {
        break
      }

      text += decoder.decode(chunk.value)
    }

    expect(text.startsWith(': keepalive\n\n')).toBe(true)
    expect(text).toContain('"type":"resync"')
    expect(text).toContain('"head":2')
    expect(text).toContain('"reason":"trimmed"')
    await reader.cancel()
    abort.abort()
  })
})
