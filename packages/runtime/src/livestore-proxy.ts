import type { LlmTag } from '@looms/agent'
import {
  decodeAppendableLoomsEvent,
  encodeLoomsEvent,
  EventStoreConflictError,
  EventStoreTag,
  type AppendableLoomsEvent,
  type EventStore,
  type LiveStoreGlobalEncoded,
} from '@looms/core'
import { Effect, Fiber, Predicate, Stream } from 'effect'
import type { LoomsRuntime } from './runtime'

export { encodeLoomsEvent, type LiveStoreGlobalEncoded }

export interface HandleLivestoreProxyOptions {
  readonly provide: <A, E>(effect: Effect.Effect<A, E, LlmTag>) => Effect.Effect<A, E>
}

/**
 * LiveStore sync proxy over the Looms EventStore.
 *
 * Exposes the standard LiveStore protocol contract:
 * - HEAD  — reachability ping (200)
 * - GET   — pull events for `storeId` from `cursor` (JSON batch or live SSE)
 * - POST  — push batch with `parentSeqNum` conflict detection (409 ServerAheadError) + actor wake
 */
export async function handleLivestoreProxy(
  req: Request,
  runtime: LoomsRuntime,
  store: EventStore,
  options: HandleLivestoreProxyOptions,
): Promise<Response> {
  const url = new URL(req.url)

  if (req.method === 'HEAD') {
    return new Response(null, { status: 200 })
  }

  if (req.method === 'GET') {
    const storeId = url.searchParams.get('storeId') ?? url.searchParams.get('actorId')
    if (!storeId) {
      return Response.json({ error: 'storeId required' }, { status: 400 })
    }

    const cursor = Number(url.searchParams.get('cursor') ?? '0')
    const acceptHeader = req.headers.get('accept') ?? ''
    const isLive =
      url.searchParams.get('live') === 'true' ||
      url.searchParams.get('live') === '1' ||
      acceptHeader.includes('text/event-stream')

    if (!isLive) {
      const events = await Effect.runPromise(
        store.read(storeId, { fromSeq: cursor + 1 }),
      )
      const head = await Effect.runPromise(store.tail(storeId))
      const batch = events.map(encodeLoomsEvent)
      return Response.json({ batch, head })
    }

    // Live SSE streaming pull
    const encoder = new TextEncoder()
    let cleanup = () => {}

    const stream = new ReadableStream({
      async start(controller) {
        let active = true
        cleanup = () => {
          active = false
        }

        req.signal.addEventListener('abort', () => {
          active = false
          try {
            controller.close()
          } catch {
            // Stream already closed.
          }
        })

        // Initial backlog from cursor
        try {
          const backlog = await Effect.runPromise(
            store.read(storeId, { fromSeq: cursor + 1 }),
          )
          const currentHead = await Effect.runPromise(store.tail(storeId))
          if (backlog.length > 0 && active) {
            const data = JSON.stringify({
              batch: backlog.map(encodeLoomsEvent),
              head: currentHead,
            })
            controller.enqueue(encoder.encode(`event: batch\ndata: ${data}\n\n`))
          }
        } catch {
          // Error reading backlog
        }

        // Real-time subscription for subsequent events
        const subFiber = Effect.runFork(
          store.subscribe(storeId, { fromSeq: cursor + 1 }).pipe(
            Stream.runForEach((event) =>
              Effect.sync(() => {
                if (!active) return
                const data = JSON.stringify({
                  batch: [encodeLoomsEvent(event)],
                  head: event.seq,
                })
                controller.enqueue(encoder.encode(`event: batch\ndata: ${data}\n\n`))
              }),
            ),
          ),
        )

        cleanup = () => {
          active = false
          void Effect.runPromise(Fiber.interrupt(subFiber))
        }
      },
      cancel() {
        cleanup()
      },
    })

    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      },
    })
  }

  if (req.method === 'POST') {
    try {
      const rawBody: unknown = await req.json()
      if (!Predicate.isReadonlyObject(rawBody)) {
        return Response.json({ error: 'invalid payload' }, { status: 400 })
      }
      const rawStoreId =
        'storeId' in rawBody
          ? rawBody.storeId
          : 'actorId' in rawBody
            ? rawBody.actorId
            : undefined
      if (!Predicate.isString(rawStoreId)) {
        return Response.json({ error: 'storeId required' }, { status: 400 })
      }
      const storeId = rawStoreId

      const rawBatch = 'batch' in rawBody && Array.isArray(rawBody.batch) ? rawBody.batch : []
      if (rawBatch.length === 0) {
        const head = await Effect.runPromise(store.tail(storeId))
        return Response.json({ ok: true, head })
      }

      const firstItem = rawBatch[0]
      const expectedTail =
        Predicate.isReadonlyObject(firstItem) &&
        'parentSeqNum' in firstItem &&
        Predicate.isNumber(firstItem.parentSeqNum)
          ? firstItem.parentSeqNum
          : undefined

      const events: AppendableLoomsEvent[] = []
      for (const item of rawBatch) {
        const decoded = decodeAppendableLoomsEvent(item, storeId)
        if (decoded) {
          events.push(decoded)
        }
      }

      if (events.length === 0) {
        const head = await Effect.runPromise(store.tail(storeId))
        return Response.json({ ok: true, head })
      }

      const appendEffect = store.append(storeId, events, { expectedTail })
      const appendResult = await Effect.runPromise(
        appendEffect.pipe(
          Effect.map((res) => ({ ok: true as const, res })),
          Effect.catch((err) => Effect.succeed({ ok: false as const, err })),
        ),
      )

      if (!appendResult.ok) {
        const err = appendResult.err
        if (
          err instanceof EventStoreConflictError ||
          (Predicate.isReadonlyObject(err) && '_tag' in err && err._tag === 'EventStoreConflictError')
        ) {
          const actualTail =
            'actualTail' in err && Predicate.isNumber(err.actualTail)
              ? err.actualTail
              : await Effect.runPromise(store.tail(storeId))
          return Response.json(
            {
              error: 'ServerAheadError',
              head: actualTail,
              minimumExpectedNum: actualTail + 1,
            },
            { status: 409 },
          )
        }
        return Response.json({ error: err.message }, { status: 500 })
      }

      // Wake without blocking the LiveStore push — events stream back over SSE.
      const wakeEffect = runtime.wake(storeId).pipe(
        Effect.provideService(EventStoreTag, store),
      )
      Effect.runFork(
        options.provide(wakeEffect).pipe(
          Effect.catch(() => Effect.void),
        ),
      )

      return Response.json({ ok: true, head: appendResult.res.tail })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return Response.json({ error: message }, { status: 500 })
    }
  }

  return new Response('Method Not Allowed', { status: 405 })
}
