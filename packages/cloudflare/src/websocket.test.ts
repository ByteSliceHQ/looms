import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import {
  createEvent,
  makeMemoryEventStore,
  type EventStore,
  type SubscriptionAttachment,
} from '@looms/core'

import { attachSocketFanout, openRunSocket, type HibernatingSocketState } from './websocket'

class FakeSocket {
  readonly sent: string[] = []
  closed: { code: number; reason: string } | undefined
  bufferedAmount = 0
  private attachment: SubscriptionAttachment | undefined

  send(data: string): void {
    this.sent.push(data)
  }

  close(code?: number, reason?: string): void {
    this.closed = { code: code ?? 0, reason: reason ?? '' }
  }

  serializeAttachment(value: SubscriptionAttachment): void {
    this.attachment = value
  }

  deserializeAttachment(): SubscriptionAttachment | undefined {
    return this.attachment
  }
}

class FakeState implements HibernatingSocketState {
  readonly accepted: FakeSocket[] = []
  autoResponse: { request: string; response: string } | undefined

  acceptWebSocket(ws: WebSocket): void {
    if (ws instanceof FakeSocket) {
      this.accepted.push(ws)
    }
  }

  getWebSockets(): readonly WebSocket[] {
    return this.accepted.map(asSocket)
  }

  setWebSocketAutoResponse(pair: WebSocketRequestResponsePair): void {
    this.autoResponse = { request: pair.request, response: pair.response }
  }
}

function pairFrom(server: FakeSocket, client: FakeSocket) {
  return () => ({ client: asSocket(client), server: asSocket(server) })
}

function asSocket(socket: FakeSocket): WebSocket {
  // SAFETY: the test socket implements send, close, bufferedAmount, and attachment.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return socket as WebSocket
}

async function seededStore(): Promise<EventStore> {
  const store = await Effect.runPromise(makeMemoryEventStore)

  await Effect.runPromise(
    store.append('run_1', [threadEvent('thr_a'), threadEvent('thr_b')], { expectedTail: 0 }),
  )

  return store
}

function threadEvent(threadId: string) {
  return createEvent('run_1', {
    type: 'runtime.thread.started',
    payload: {
      threadId,
      kind: 'workflow',
      definitionName: 'checkout',
      definitionVersion: 'v1',
      input: null,
      parentThreadId: null,
    },
    threadId,
    origin: { type: 'system' },
  })
}

function upgrade(url: string): Request {
  return new Request(url, { headers: { upgrade: 'websocket' } })
}

describe('hibernating run sockets', () => {
  test('replays the log, then fans out a later append', async () => {
    const store = await seededStore()
    const ctx = new FakeState()
    const server = new FakeSocket()
    const broadcasting = attachSocketFanout(ctx, store, 'run_1')

    const response = await Effect.runPromise(
      openRunSocket({
        ctx,
        store,
        request: upgrade('http://looms.test/runs/run_1/events'),
        runId: 'run_1',
        createPair: pairFrom(server, new FakeSocket()),
      }),
    )

    expect(response.status).toBe(101)
    const frames = server.sent.map((line) => JSON.parse(line))
    expect(frames[0]).toEqual({ type: 'hello', head: 1, tail: 2 })
    expect(frames[1]?.batch).toHaveLength(2)

    expect(frames[1]?.batch.map((item: { threadId: string }) => item.threadId)).toEqual([
      'thr_a',
      'thr_b',
    ])

    await Effect.runPromise(
      broadcasting.append('run_1', [threadEvent('thr_a')], { expectedTail: 2 }),
    )

    const live = server.sent.map((line) => JSON.parse(line))
    expect(live.at(-1)).toMatchObject({ batch: [expect.objectContaining({ seq: 3 })] })
  })

  test('resumes after fromSeq and drops other threads', async () => {
    const store = await seededStore()
    const server = new FakeSocket()

    await Effect.runPromise(
      openRunSocket({
        ctx: new FakeState(),
        store,
        request: upgrade('http://looms.test/runs/run_1/events?fromSeq=2&threadId=thr_b'),
        runId: 'run_1',
        createPair: pairFrom(server, new FakeSocket()),
      }),
    )

    const frames = server.sent.map((line) => JSON.parse(line))
    const batches = frames.filter((frame) => 'batch' in frame)
    expect(batches).toHaveLength(1)
    expect(batches[0].batch[0].threadId).toBe('thr_b')
    expect(batches[0].batch[0].seq).toBe(2)
  })

  test('a trimmed cursor closes with resync', async () => {
    const store = await seededStore()

    if (!store.trim) {
      throw new Error('memory store does not trim')
    }

    await Effect.runPromise(store.trim('run_1', 2))
    const server = new FakeSocket()

    await Effect.runPromise(
      openRunSocket({
        ctx: new FakeState(),
        store,
        request: upgrade('http://looms.test/runs/run_1/events?fromSeq=1'),
        runId: 'run_1',
        createPair: pairFrom(server, new FakeSocket()),
      }),
    )

    expect(JSON.parse(server.sent[0] ?? '{}')).toEqual({
      type: 'resync',
      head: 2,
      reason: 'trimmed',
    })

    expect(server.closed).toEqual({ code: 4000, reason: 'trimmed' })
  })

  test('backpressure closes the socket', async () => {
    const store = await seededStore()
    const server = new FakeSocket()
    server.bufferedAmount = 2 * 1024 * 1024

    await Effect.runPromise(
      openRunSocket({
        ctx: new FakeState(),
        store,
        request: upgrade('http://looms.test/runs/run_1/events'),
        runId: 'run_1',
        createPair: pairFrom(server, new FakeSocket()),
      }),
    )

    expect(server.closed?.reason).toBe('backpressure')

    expect(server.sent.map((line) => JSON.parse(line))).toContainEqual({
      type: 'resync',
      head: 1,
      reason: 'backpressure',
    })
  })

  test('refuses a socket the authorizer rejected', async () => {
    const store = await seededStore()
    const ctx = new FakeState()

    const response = await Effect.runPromise(
      openRunSocket({
        ctx,
        store,
        request: upgrade('http://looms.test/runs/run_1/events'),
        runId: 'run_1',
        authorize: () => Effect.succeed({ allowed: false, status: 401, error: 'no' }),
      }),
    )

    expect(response.status).toBe(401)
    expect(ctx.accepted).toHaveLength(0)
  })

  test('rejects an invalid Last-Event-ID and a mismatched run', async () => {
    const store = await seededStore()

    const invalid = await Effect.runPromise(
      openRunSocket({
        ctx: new FakeState(),
        store,
        request: new Request('http://looms.test/runs/run_1/events', {
          headers: { upgrade: 'websocket', 'last-event-id': 'nope' },
        }),
        runId: 'run_1',
      }),
    )

    expect(invalid.status).toBe(400)

    const missing = await Effect.runPromise(
      openRunSocket({
        ctx: new FakeState(),
        store,
        request: upgrade('http://looms.test/runs/other/events'),
        runId: 'run_1',
      }),
    )

    expect(missing.status).toBe(404)
  })
})
