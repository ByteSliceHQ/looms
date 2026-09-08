import {
  decodeAppendableEvent,
  encodeLoomsEvent,
  EventStoreConflictError,
  EventStoreTag,
  type EventStore,
  type LiveStoreGlobalEncoded,
} from '@looms/core'
import { Effect, Fiber, Predicate, Stream } from 'effect'
import type { LoomsRuntime } from './runtime'

export { encodeLoomsEvent, type LiveStoreGlobalEncoded }

export async function handleLivestoreProxy(
  req: Request,
  runtime: LoomsRuntime,
  store: EventStore,
): Promise<Response> {
  const url = new URL(req.url)

  if (req.method === 'HEAD') {
    return new Response(null, { status: 200 })
  }

  if (req.method === 'GET') {
    const storeId = url.searchParams.get('storeId') ?? url.searchParams.get('runId')
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
      const events = await Effect.runPromise(store.read(storeId, { fromSeq: cursor + 1 }))
      const head = await Effect.runPromise(store.tail(storeId))
      return Response.json({ batch: events.map(encodeLoomsEvent), head })
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        const write = (data: { batch: ReturnType<typeof encodeLoomsEvent>[] }) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }
        const fiber = Effect.runFork(
          store.subscribe(storeId, { fromSeq: cursor + 1 }).pipe(
            Stream.tap((event) =>
              Effect.sync(() => {
                write({ batch: [encodeLoomsEvent(event)] })
              }),
            ),
            Stream.runDrain,
          ),
        )
        req.signal.addEventListener('abort', () => {
          Effect.runFork(Fiber.interrupt(fiber))
          controller.close()
        })
      },
    })
    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
      },
    })
  }

  if (req.method === 'POST') {
    const body: unknown = await req.json()
    const storeId =
      url.searchParams.get('storeId') ??
      (Predicate.isReadonlyObject(body) && Predicate.isString(body.storeId) ? body.storeId : null)
    if (!storeId) return Response.json({ error: 'storeId required' }, { status: 400 })

    const batch =
      Predicate.isReadonlyObject(body) && Array.isArray(body.batch) ? body.batch : []
    const parentSeqNum =
      Predicate.isReadonlyObject(body) && Predicate.isNumber(body.parentSeqNum) ? body.parentSeqNum : 0
    const tail = await Effect.runPromise(store.tail(storeId))
    if (parentSeqNum !== tail) {
      return Response.json(
        { _tag: 'ServerAheadError', expected: parentSeqNum, actual: tail },
        { status: 409 },
      )
    }

    const appendable = batch
      .map((item) => {
        // SAFETY: LiveStore push batch items are host-encoded envelopes.
        return decodeAppendableEvent(item as LiveStoreGlobalEncoded, storeId)
      })
      .filter((item): item is NonNullable<typeof item> => item !== undefined)

    try {
      await Effect.runPromise(store.append(storeId, appendable, { expectedTail: parentSeqNum }))
    } catch (err) {
      if (err instanceof EventStoreConflictError) {
        return Response.json(
          { _tag: 'ServerAheadError', expected: err.expectedTail, actual: err.actualTail },
          { status: 409 },
        )
      }
      throw err
    }

    await Effect.runPromise(Effect.provideService(runtime.wake(storeId), EventStoreTag, store))
    return Response.json({ ok: true })
  }

  return new Response('Method Not Allowed', { status: 405 })
}
