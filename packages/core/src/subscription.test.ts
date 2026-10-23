import { describe, expect, test } from 'bun:test'

import { createEvent } from './envelope'
import {
  attachmentFromFilter,
  decodeSubscriptionFrame,
  encodeSubscriptionFrame,
  eventMatchesSubscription,
  fanoutSubscription,
  openSubscription,
  pushSubscriptionEvents,
  readSubscriptionData,
  subscriptionFilter,
  subscriptionFromSeq,
  subscriptionReplay,
  type AttachedSubscriptionSocket,
  type SubscriptionAttachment,
} from './subscription'

function envelope(seq: number, threadId: string, ephemeral = false) {
  return {
    ...createEvent('run_1', {
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
      ephemeral,
    }),
    seq,
  }
}

class FakeSocket implements AttachedSubscriptionSocket {
  readonly sent: string[] = []
  closed: { code: number; reason: string } | undefined
  bufferedAmount = 0
  private current: SubscriptionAttachment | undefined

  constructor(attachment: SubscriptionAttachment) {
    this.current = attachment
  }

  send(data: string): void {
    if (this.closed) {
      throw new Error('closed')
    }

    this.sent.push(data)
  }

  close(code: number, reason: string): void {
    this.closed = { code, reason }
  }

  attachment(): SubscriptionAttachment | undefined {
    return this.current
  }

  setAttachment(attachment: SubscriptionAttachment): void {
    this.current = attachment
  }
}

describe('subscription protocol', () => {
  test('decodes hello, a typeless batch, and resync', () => {
    expect(decodeSubscriptionFrame('{"type":"hello","head":1,"tail":4}')).toEqual({
      type: 'hello',
      head: 1,
      tail: 4,
    })

    const batch = decodeSubscriptionFrame('{"batch":[{"type":"runtime.run.started"}]}')
    expect(batch?.type).toBe('batch')

    expect(
      encodeSubscriptionFrame({ type: 'batch', batch: [{ type: 'runtime.run.started' }] }),
    ).toBe('{"batch":[{"type":"runtime.run.started"}]}')

    expect(decodeSubscriptionFrame('{"type":"resync","head":3,"reason":"trimmed"}')).toEqual({
      type: 'resync',
      head: 3,
      reason: 'trimmed',
    })

    expect(decodeSubscriptionFrame('not-json')).toBeUndefined()
  })

  test('cursor and filter follow the query string', () => {
    const url = new URL(
      'http://looms.test/runs/run_1/events?fromSeq=4&threadId=thr_a&includeEphemeral=0',
    )

    expect(subscriptionFromSeq(url, null)).toEqual({ ok: true, fromSeq: 4 })
    expect(subscriptionFromSeq(url, '2')).toEqual({ ok: true, fromSeq: 3 })
    expect(subscriptionFromSeq(url, 'nope').ok).toBe(false)
    expect(subscriptionFilter(url)).toEqual({ threadId: 'thr_a', includeEphemeral: false })
  })

  test('a cursor below the retained head asks for resync', () => {
    expect(subscriptionReplay(1, 1)).toEqual({ kind: 'play', fromSeq: 1 })
    expect(subscriptionReplay(5, 4)).toEqual({ kind: 'resync', head: 5 })
  })

  test('replay sends hello then the matching events and resumes the cursor', () => {
    const socket = new FakeSocket(
      attachmentFromFilter({ threadId: 'thr_a', includeEphemeral: false }, 1, null),
    )

    const next = openSubscription(socket, socket.attachment()!, {
      kind: 'open',
      hello: { type: 'hello', head: 1, tail: 3 },
      events: [envelope(1, 'thr_a'), envelope(2, 'thr_b'), envelope(3, 'thr_a', true)],
    })

    expect(socket.sent.map((line) => JSON.parse(line))).toEqual([
      { type: 'hello', head: 1, tail: 3 },
      { batch: [expect.objectContaining({ seq: 1, threadId: 'thr_a' })] },
    ])

    expect(next?.cursor).toBe(3)
    expect(socket.closed).toBeUndefined()
  })

  test('a trimmed cursor closes with resync', () => {
    const socket = new FakeSocket(
      attachmentFromFilter({ threadId: null, includeEphemeral: true }, 1, 'ada'),
    )

    const next = openSubscription(socket, socket.attachment()!, { kind: 'resync', head: 8 })

    expect(next).toBeUndefined()

    expect(JSON.parse(socket.sent[0] ?? '{}')).toEqual({
      type: 'resync',
      head: 8,
      reason: 'trimmed',
    })

    expect(socket.closed).toEqual({ code: 4000, reason: 'trimmed' })
  })

  test('backpressure closes the socket and a later append does not write to it', () => {
    const slow = new FakeSocket(
      attachmentFromFilter({ threadId: null, includeEphemeral: true }, 1, null),
    )

    slow.bufferedAmount = 32

    const live = new FakeSocket(
      attachmentFromFilter({ threadId: null, includeEphemeral: true }, 1, null),
    )

    fanoutSubscription([slow, live], [envelope(1, 'thr_a')], { bufferLimitBytes: 8, head: 4 })

    expect(slow.closed?.reason).toBe('backpressure')

    expect(JSON.parse(slow.sent[0] ?? '{}')).toMatchObject({
      type: 'resync',
      reason: 'backpressure',
      head: 4,
    })

    expect(live.closed).toBeUndefined()
    expect(live.attachment()?.cursor).toBe(1)

    fanoutSubscription([slow, live], [envelope(2, 'thr_a')], { bufferLimitBytes: 8, head: 4 })
    expect(live.attachment()?.cursor).toBe(2)
    expect(slow.sent).toHaveLength(1)
  })

  test('readSubscriptionData keeps events and surfaces resync', () => {
    const event = envelope(1, 'thr_a')
    const encoded = encodeSubscriptionFrame({ type: 'batch', batch: [event] })
    const read = readSubscriptionData(encoded, 'run_1')

    expect(read.kind).toBe('events')

    if (read.kind === 'events') {
      expect(read.events[0]?.seq).toBe(1)
    }

    expect(readSubscriptionData('{"type":"resync","head":9,"reason":"trimmed"}', 'run_1')).toEqual({
      kind: 'resync',
      head: 9,
      reason: 'trimmed',
    })
  })

  test('filter drops other threads and ephemeral events', () => {
    const filter = { threadId: 'thr_a', includeEphemeral: false }

    expect(eventMatchesSubscription(envelope(1, 'thr_a'), filter)).toBe(true)
    expect(eventMatchesSubscription(envelope(2, 'thr_b'), filter)).toBe(false)
    expect(eventMatchesSubscription(envelope(3, 'thr_a', true), filter)).toBe(false)
  })

  test('push does not resend a seq the attachment already passed', () => {
    const attachment = {
      ...attachmentFromFilter({ threadId: null, includeEphemeral: true }, 1, null),
      cursor: 1,
    }

    const socket = new FakeSocket(attachment)

    const next = pushSubscriptionEvents(
      socket,
      [envelope(1, 'thr_a'), envelope(2, 'thr_a')],
      attachment,
    )

    expect(socket.sent).toHaveLength(1)
    expect(next?.cursor).toBe(2)
  })
})
