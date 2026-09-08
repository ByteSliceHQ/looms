import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import type { LiveStoreGlobalEncoded } from '@looms/core'
import { createLoomsStore } from './store'

describe('createLoomsStore against /api/livestore mock', () => {
  const events: LiveStoreGlobalEncoded[] = [
    {
      name: 'agent.message.received',
      args: {
        id: 'msg_0',
        ts: Date.now(),
        payload: {
          message: { role: 'assistant', content: 'hello from server' },
        },
        parentActorId: null,
        ephemeral: false,
      },
      seqNum: 1,
      parentSeqNum: 0,
      clientId: 'host',
      sessionId: 'host',
    },
  ]

  let server: ReturnType<typeof Bun.serve>
  let endpoint: string
  const pushedBatches: Array<{ storeId: string; batch: LiveStoreGlobalEncoded[] }> = []

  beforeAll(() => {
    server = Bun.serve({
      port: 0,
      async fetch(req) {
        const url = new URL(req.url)
        if (url.pathname === '/api/livestore') {
          if (req.method === 'GET') {
            return Response.json({
              batch: events,
              head: events.length,
            })
          }
          if (req.method === 'POST') {
            // SAFETY: Test mock receives JSON body conforming to push shape.
            const body = (await req.json()) as { storeId: string; batch: LiveStoreGlobalEncoded[] }
            pushedBatches.push(body)
            for (const item of body.batch) {
              events.push({
                ...item,
                seqNum: events.length + 1,
              })
            }
            return Response.json({ ok: true, head: events.length })
          }
        }
        return new Response('Not Found', { status: 404 })
      },
    })
    endpoint = `http://127.0.0.1:${server.port}`
  })

  afterAll(async () => {
    await server.stop(true)
  })

  test('pulls and materializes events, and commits encoded client messages', async () => {
    const store = createLoomsStore({
      storeId: 'agt_store_test',
      endpoint,
      pollIntervalMs: 50,
    })

    try {
      await store.sync()
      const initialMessages = store.query.messages()
      expect(initialMessages.length).toBe(1)
      expect(initialMessages[0]?.content).toBe('hello from server')

      // Commit a client message
      await store.commit({
        type: 'agent.message.received',
        payload: {
          message: { role: 'user', content: 'committed from looms store' },
        },
      })

      expect(pushedBatches.length).toBe(1)
      const lastPushed = pushedBatches[0]!
      expect(lastPushed.storeId).toBe('agt_store_test')
      expect(lastPushed.batch[0]?.name).toBe('agent.message.received')

      const afterCommit = store.query.messages()
      const userMsg = afterCommit.find((m) => m.content === 'committed from looms store')
      expect(userMsg).toBeDefined()
      expect(userMsg?.role).toBe('user')
    } finally {
      store.dispose()
    }
  })
})
