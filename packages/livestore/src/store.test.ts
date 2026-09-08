import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import type { EventEnvelope } from '@looms/core'
import { createLoomsStore } from './store'

describe('createLoomsStore against /runs mock', () => {
  const events: EventEnvelope[] = [
    {
      id: 'evt_1',
      runId: 'run_1',
      seq: 1,
      ts: Date.now(),
      type: 'runtime.run.started',
      payload: { rootThreadId: 'thr_1', kind: 'agent', definitionName: 'echo', input: null },
      threadId: 'thr_1',
      origin: { type: 'system' },
    },
  ]

  let server: ReturnType<typeof Bun.serve>
  let endpoint: string

  beforeAll(() => {
    server = Bun.serve({
      port: 0,
      async fetch(req) {
        const url = new URL(req.url)
        if (url.pathname === '/runs/run_1/events') {
          if (req.method === 'GET') {
            const fromSeq = Number(url.searchParams.get('fromSeq') ?? '1')
            if (fromSeq > events.length) {
              return Response.json(
                { error: 'Range not satisfiable: starting point is out of range (tail seq_num=1).' },
                { status: 500 },
              )
            }
            return Response.json({ events: events.filter((event) => event.seq >= fromSeq) })
          }
          if (req.method === 'POST') {
            return Response.json({ ok: true })
          }
        }
        return new Response('Not Found', { status: 404 })
      },
    })
    endpoint = `http://127.0.0.1:${server.port}`
  })

  afterAll(() => {
    void server.stop()
  })

  test('pulls events and materializes the run row', async () => {
    const store = createLoomsStore({ storeId: 'run_1', endpoint, pollIntervalMs: 10_000 })
    await store.sync()
    expect(store.getState().runs.get('run_1')?.status).toBe('running')
    expect(store.events()[0]?.type).toBe('runtime.run.started')
    store.dispose()
    store.subscribe(() => undefined)
    await store.sync()
    expect(store.events()[0]?.type).toBe('runtime.run.started')
    await store.sync()
    expect(store.events()).toHaveLength(1)
    store.dispose()
  })
})
