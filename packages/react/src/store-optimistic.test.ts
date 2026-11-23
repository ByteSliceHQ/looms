import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import { defineProjection, encodeLoomsEvent, type EventEnvelope } from '@looms/core'

import { createLoomsStore, isPendingEvent } from './store'

const notes = defineProjection<{ texts: string[] }>({
  name: 'notes',
  initialState: { texts: [] },
  reduce(state, event) {
    if (event.type !== 'test.note') {
      return state
    }

    // SAFETY: the test only writes `{ text }` payloads under this type.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return { texts: [...state.texts, (event.payload as { text: string }).text] }
  },
})

async function waitFor(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const start = Date.now()

  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('timed out waiting for store update')
    }

    await Bun.sleep(10)
  }
}

describe('optimistic commit', () => {
  let log: EventEnvelope[] = []
  let push: ((event: EventEnvelope) => void) | undefined

  // What the host does with the next POST.
  let onPost: (body: {
    events: { type: string; payload: unknown }[]
    idempotencyKey?: string
  }) => Response

  let server: ReturnType<typeof Bun.serve>
  let endpoint: string

  /** Records the events as the host would, echoing them on the live stream. */
  const record = (events: { type: string; payload: unknown }[], idempotencyKey?: string) => {
    for (const input of events) {
      const envelope: EventEnvelope = {
        id: `evt_${log.length + 1}`,
        runId: 'run_1',
        seq: log.length + 1,
        ts: Date.now(),
        type: input.type,
        // SAFETY: test payloads are plain JSON.
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        payload: input.payload as EventEnvelope['payload'],
        threadId: 'thr_1',
        origin: { type: 'external' },
        idempotencyKey: idempotencyKey ?? null,
      }

      log.push(envelope)
      push?.(envelope)
    }
  }

  beforeAll(() => {
    server = Bun.serve({
      port: 0,
      async fetch(req) {
        const url = new URL(req.url)

        if (url.pathname !== '/runs/run_1/events') {
          return new Response('Not Found', { status: 404 })
        }

        if (req.method === 'POST') {
          return onPost(await req.json())
        }

        const encoder = new TextEncoder()

        const stream = new ReadableStream({
          start(controller) {
            const write = (event: EventEnvelope) => {
              const frame = JSON.stringify({ batch: [encodeLoomsEvent(event)] })
              controller.enqueue(encoder.encode(`id: ${event.seq}\ndata: ${frame}\n\n`))
            }

            controller.enqueue(encoder.encode(': keepalive\n\n'))
            log.forEach(write)
            push = write
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

  const open = async () => {
    log = []
    const store = createLoomsStore({ storeId: 'run_1', endpoint, fetch, optimistic: true })
    await waitFor(() => store.status() === 'live')
    return store
  }

  test('shows the event before the host answers, then swaps in the confirmed one', async () => {
    const store = await open()
    let answer!: () => void

    // oxlint-disable-next-line effecttsgo/new-promise
    const held = new Promise<void>((resolve) => {
      answer = resolve
    })

    let recorded: Promise<void> | undefined

    onPost = (body) => {
      recorded = held.then(() => record(body.events, body.idempotencyKey))
      return Response.json({ ok: true }, { status: 202 })
    }

    const committed = store.commit({ type: 'test.note', payload: { text: 'hello' } })

    // Shown synchronously, before any network round trip.
    expect(store.project(notes).texts).toEqual(['hello'])
    expect(store.pending()).toHaveLength(1)
    expect(store.events().every(isPendingEvent)).toBe(true)

    await committed
    answer()
    await recorded
    await waitFor(() => store.pending().length === 0)

    expect(store.project(notes).texts).toEqual(['hello'])
    expect(store.events().map((event) => event.seq)).toEqual([1])
    store.dispose()
  })

  test('keeps pending events after confirmed ones that arrive first', async () => {
    const store = await open()

    onPost = () => Response.json({ ok: true }, { status: 202 })

    await store.commit({ type: 'test.note', payload: { text: 'mine' } })
    record([{ type: 'test.note', payload: { text: 'theirs' } }])
    await waitFor(() => store.events().length === 2)

    expect(store.project(notes).texts).toEqual(['theirs', 'mine'])
    store.dispose()
  })

  test('rolls the event back and rejects when the host refuses it', async () => {
    const store = await open()

    onPost = () => new Response('nope', { status: 409 })

    const committed = store.commit({ type: 'test.note', payload: { text: 'refused' } })

    expect(store.project(notes).texts).toEqual(['refused'])
    expect(committed).rejects.toThrow('409')
    await committed.catch(() => undefined)

    expect(store.project(notes).texts).toEqual([])
    expect(store.pending()).toHaveLength(0)
    store.dispose()
  })

  test('sends through a custom route and still matches the confirmed event by key', async () => {
    const store = await open()
    const sent: (string | undefined)[] = []

    await store.commit(
      { type: 'test.note', payload: { text: 'routed' } },
      {
        idempotencyKey: 'msg-1',
        send: (commit) => {
          sent.push(commit.idempotencyKey)
          return Promise.resolve()
        },
      },
    )

    expect(sent).toEqual(['msg-1'])
    expect(store.pending()).toHaveLength(1)

    record([{ type: 'test.note', payload: { text: 'routed' } }], 'msg-1')
    await waitFor(() => store.pending().length === 0)

    expect(store.project(notes).texts).toEqual(['routed'])
    store.dispose()
  })

  test('draws pending event ids and the idempotency key from the ids option', async () => {
    log = []
    let next = 0

    const store = createLoomsStore({
      storeId: 'run_1',
      endpoint,
      fetch,
      optimistic: true,
      ids: {
        create: (kind) => `my-${kind}-${++next}`,
        derive: (kind, parts) => `my-${kind}-${parts.join('.')}`,
      },
    })

    await waitFor(() => store.status() === 'live')

    let key: string | undefined

    onPost = (body) => {
      key = body.idempotencyKey
      return Response.json({ ok: true }, { status: 202 })
    }

    await store.commit({ type: 'test.note', payload: { text: 'named' } })

    expect(key).toMatch(/^my-event-\d+$/)
    expect(store.pending().map((event) => event.id)).toEqual([expect.stringMatching(/^my-event-/)])
    store.dispose()
  })
})
