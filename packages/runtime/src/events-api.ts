import { Effect, Predicate } from 'effect'

import {
  decodeAppendableEvent,
  encodeLoomsEvent,
  EventStoreConflictError,
  EventStoreTag,
  type EncodedLoomsEvent,
  type EventStore,
} from '@looms/core'

import type { LoomsRuntime } from './runtime'
import { createEventStreamResponse } from './sse'

export { encodeLoomsEvent, type EncodedLoomsEvent }

function readCursor(req: Request, url: URL): number {
  const lastEventId = req.headers.get('last-event-id')

  const raw =
    lastEventId !== null && lastEventId !== ''
      ? lastEventId
      : (url.searchParams.get('cursor') ?? '0')

  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function readRunId(url: URL): string | null {
  return url.searchParams.get('runId')
}

export async function handleEventsApi(
  req: Request,
  runtime: LoomsRuntime,
  store: EventStore,
): Promise<Response> {
  const url = new URL(req.url)

  if (req.method === 'HEAD') {
    return new Response(null, { status: 200 })
  }

  if (req.method === 'GET') {
    const runId = readRunId(url)

    if (!runId) {
      return Response.json({ error: 'runId required' }, { status: 400 })
    }

    const cursor = readCursor(req, url)
    const acceptHeader = req.headers.get('accept') ?? ''

    const isLive =
      url.searchParams.get('live') === 'true' ||
      url.searchParams.get('live') === '1' ||
      acceptHeader.includes('text/event-stream')

    if (!isLive) {
      const events = await Effect.runPromise(store.read(runId, { fromSeq: cursor + 1 }))

      const bounds = store.bounds
        ? await Effect.runPromise(store.bounds(runId))
        : { head: events[0]?.seq ?? 1, tail: await Effect.runPromise(store.tail(runId)) }

      return Response.json({
        batch: events.map(encodeLoomsEvent),
        head: bounds.head,
        tail: bounds.tail,
      })
    }

    return createEventStreamResponse({
      signal: req.signal,
      request: req,
      store,
      runId,
      fromSeq: cursor + 1,
    })
  }

  if (req.method === 'POST') {
    const body: unknown = await req.json()

    const runId =
      readRunId(url) ??
      (Predicate.isReadonlyObject(body) && Predicate.isString(body.runId) ? body.runId : null)

    if (!runId) {
      return Response.json({ error: 'runId required' }, { status: 400 })
    }

    const batch = Predicate.isReadonlyObject(body) && Array.isArray(body.batch) ? body.batch : []

    const expectedTail =
      Predicate.isReadonlyObject(body) && Predicate.isNumber(body.expectedTail)
        ? body.expectedTail
        : 0

    const tail = await Effect.runPromise(store.tail(runId))

    if (expectedTail !== tail) {
      return Response.json(
        { _tag: 'ServerAheadError', expected: expectedTail, actual: tail },
        { status: 409 },
      )
    }

    const appendable = batch
      .map((item) => {
        // SAFETY: push batch items are host-encoded envelopes.
        return decodeAppendableEvent(item as EncodedLoomsEvent, runId)
      })
      .filter((item): item is NonNullable<typeof item> => item !== undefined)

    try {
      await Effect.runPromise(store.append(runId, appendable, { expectedTail }))
    } catch (err) {
      if (err instanceof EventStoreConflictError) {
        return Response.json(
          { _tag: 'ServerAheadError', expected: err.expectedTail, actual: err.actualTail },
          { status: 409 },
        )
      }

      throw err
    }

    await Effect.runPromise(Effect.provideService(runtime.wake(runId), EventStoreTag, store))
    return Response.json({ ok: true })
  }

  return new Response('Method Not Allowed', { status: 405 })
}
