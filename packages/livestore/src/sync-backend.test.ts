import { describe, expect, test } from 'bun:test'
import { ServerAheadError } from '@livestore/common'
import { FetchHttpClient } from '@livestore/utils/effect'
import { Effect, Option, Stream } from 'effect'
import { createLoomsSyncBackend } from './sync-backend'

describe('LoomsSyncBackend', () => {
  test('sync backend handles pull, push, 409 conflict, and ping', async () => {
    let pushedBatches: any[] = []

    const server = Bun.serve({
      port: 0,
      fetch(req) {
        const url = new URL(req.url)
        if (req.method === 'HEAD') {
          return new Response(null, { status: 200 })
        }
        if (req.method === 'GET' && url.pathname === '/api/livestore') {
          return Response.json({
            batch: [
              {
                name: 'agent.message.received',
                args: {
                  id: 'm1',
                  payload: { message: { role: 'user', content: 'hello' } },
                },
                seqNum: 1,
                parentSeqNum: 0,
                clientId: 'test-client',
                sessionId: 'test-session',
              },
            ],
            head: 1,
          })
        }
        if (req.method === 'POST') {
          return (async () => {
            // SAFETY: Test mock receives JSON body conforming to push shape.
            const body = (await req.json()) as { storeId: string; batch: any[] }
            pushedBatches.push(body)
            const first = body.batch[0]
            if (first && first.parentSeqNum < 1) {
              return new Response(JSON.stringify({ head: 2 }), {
                status: 409,
                headers: { 'content-type': 'application/json' },
              })
            }
            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            })
          })()
        }
        return new Response('Not Found', { status: 404 })
      },
    })

    const endpoint = `http://127.0.0.1:${server.port}/api/livestore`
    const backendFactory = createLoomsSyncBackend({
      endpoint,
      ping: { enabled: false },
    })

    const program = Effect.gen(function* () {
      const backend = yield* backendFactory({ storeId: 'actor_test' })

      // 1. Pull non-live batch
      const pullStream = backend.pull({
        storeId: 'actor_test',
        cursor: Option.none(),
      })
      const items = yield* Stream.runCollect(pullStream)
      expect(items.length).toBeGreaterThan(0)

      // 2. Successful push
      yield* backend.push([
        {
          name: 'agent.message.received',
          args: { id: 'm2', payload: { message: { role: 'user', content: 'test' } } },
          seqNum: 2,
          parentSeqNum: 1,
          clientId: 'test-client',
          sessionId: 'test-session',
        },
      ])
      expect(pushedBatches.length).toBe(1)

      // 3. Conflict push (parentSeqNum < 1 returns 409 -> ServerAheadError)
      const pushExit = yield* Effect.exit(
        backend.push([
          {
            name: 'agent.message.received',
            args: { id: 'm3', payload: { message: { role: 'user', content: 'stale' } } },
            seqNum: 1,
            parentSeqNum: 0,
            clientId: 'test-client',
            sessionId: 'test-session',
          },
        ]),
      )
      expect(pushExit._tag).toBe('Failure')
      if (pushExit._tag === 'Failure') {
        // SAFETY: Effect Failure cause has reasons array containing the error.
        const fail = (pushExit.cause as any).reasons?.find((r: any) => r._tag === 'Fail')
        expect(fail?.error instanceof ServerAheadError).toBe(true)
      }

      // 4. Ping
      yield* backend.ping
    }).pipe(
      Effect.scoped,
      Effect.provide(FetchHttpClient.layer),
    )

    try {
      const exit = await Effect.runPromiseExit(program)
      expect(exit._tag).toBe('Success')
    } finally {
      await server.stop()
    }
  })
})
