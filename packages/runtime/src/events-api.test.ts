import { describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'

import { agent, defineAgent } from '@looms/agent'

import { createLooms } from './looms'

async function readSseFrames(res: Response, count: number): Promise<string[]> {
  const reader = res.body?.getReader()

  if (!reader) {
    throw new Error('missing SSE body')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  const frames: string[] = []

  while (frames.length < count) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      if (part.includes('data:')) {
        frames.push(part)
      }
    }
  }

  await reader.cancel()
  return frames
}

describe('handleEventsApi SSE', () => {
  test('streams existing events with id framing', async () => {
    const echo = defineAgent({
      name: 'echo-sse',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: JSON.stringify(input) },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({ modules: [agent({ definitions: [echo] })] })
    const { runId } = await looms.start(echo, { text: 'hi' })

    const res = await looms.fetch(
      new Request(`http://looms.test/api/events?runId=${encodeURIComponent(runId)}&live=true`),
    )

    expect(res).not.toBeNull()
    expect(res!.headers.get('content-type')).toBe('text/event-stream')
    expect(res!.headers.get('cache-control')).toBe('no-cache, no-transform')
    const frames = await readSseFrames(res!, 3)
    expect(frames.length).toBeGreaterThanOrEqual(1)
    expect(frames[0]).toContain('id: 1')
    expect(frames[0]).toContain('data: ')
  })

  test('Last-Event-ID skips already-seen events', async () => {
    const echo = defineAgent({
      name: 'echo-resume',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: JSON.stringify(input) },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({ modules: [agent({ definitions: [echo] })] })
    const { runId } = await looms.start(echo, { text: 'hi' })
    const events = await looms.getEvents(runId)
    expect(events.length).toBeGreaterThan(1)

    const res = await looms.fetch(
      new Request(`http://looms.test/api/events?runId=${encodeURIComponent(runId)}&live=true`, {
        headers: { 'last-event-id': '1', accept: 'text/event-stream' },
      }),
    )

    expect(res).not.toBeNull()
    const frames = await readSseFrames(res!, 1)
    expect(frames[0]).toContain('id: 2')
    expect(frames[0]).not.toContain('id: 1\n')
  })

  test('non-live pull returns a JSON batch', async () => {
    const echo = defineAgent({
      name: 'echo-pull',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: JSON.stringify(input) },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({ modules: [agent({ definitions: [echo] })] })
    const { runId } = await looms.start(echo, { text: 'hi' })

    const res = await looms.fetch(
      new Request(`http://looms.test/api/events?runId=${encodeURIComponent(runId)}&cursor=0`),
    )

    expect(res).not.toBeNull()
    const body: unknown = await res!.json()
    expect(Predicate.isReadonlyObject(body)).toBe(true)

    if (!Predicate.isReadonlyObject(body)) {
      return
    }

    expect(Array.isArray(body.batch)).toBe(true)
    expect(Predicate.isNumber(body.head)).toBe(true)
  })

  test('POST /runs with stream=true returns SSE frames', async () => {
    const echo = defineAgent({
      name: 'echo-start-stream',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: JSON.stringify(input) },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({ modules: [agent({ definitions: [echo] })] })

    const res = await looms.fetch(
      new Request('http://looms.test/runs?stream=true', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
        body: JSON.stringify({
          kind: 'agent',
          definitionName: 'echo-start-stream',
          input: { text: 'hi' },
        }),
      }),
    )

    expect(res).not.toBeNull()
    expect(res!.headers.get('content-type')).toBe('text/event-stream')
    const frames = await readSseFrames(res!, 2)
    expect(frames.length).toBeGreaterThanOrEqual(1)

    expect(
      frames.some(
        (frame) => frame.includes('runtime.run.started') || frame.includes('event: done'),
      ),
    ).toBe(true)
  })
})
