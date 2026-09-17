import { Effect, Fiber, Schedule, Stream } from 'effect'

import { encodeLoomsEvent, stringifyJson, type EventEnvelope, type EventStore } from '@looms/core'

export interface EventStreamOptions {
  signal: AbortSignal
  store: EventStore
  runId: string
  fromSeq?: number
  heartbeatMs?: number
  onStart?: (
    write: (text: string) => void,
    close: () => void,
  ) => void | Promise<void> | Effect.Effect<void>
  request?: Request
}

interface BunServerLike {
  timeout?(req: Request, seconds: number): void
}

interface RequestWithBunRuntime extends Request {
  runtime?: {
    bun?: {
      server?: BunServerLike
    }
  }
}

function disableBunSocketTimeout(request?: Request): void {
  if (!request) {
    return
  }

  try {
    // SAFETY: Bun.serve attaches runtime.bun.server to Request in srvx and Bun handlers.
    const reqWithBun = request as RequestWithBunRuntime
    const bunServer = reqWithBun.runtime?.bun?.server

    if (bunServer) {
      bunServer.timeout?.(request, 0)
    }
  } catch {
    // Ignore environments where timeout is not supported.
  }
}

/**
 * Creates an SSE Response backed by an EventStore subscription.
 * Handles heartbeats, fiber cancellation on disconnect, event encoding, and optional lifecycle hooks.
 */
export function createEventStreamResponse(options: EventStreamOptions): Response {
  const { signal, store, runId, fromSeq = 1, heartbeatMs = 3_000, onStart, request } = options
  disableBunSocketTimeout(request)

  let closed = false
  let heartbeatFiber: Fiber.Fiber<void> | undefined
  let startFiber: Fiber.Fiber<void> | undefined
  let subscriptionFiber: Fiber.Fiber<void, unknown> | undefined
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined

  const close = () => {
    if (closed) {
      return
    }

    closed = true

    if (heartbeatFiber) {
      Effect.runFork(Fiber.interrupt(heartbeatFiber))
    }

    if (startFiber) {
      Effect.runFork(Fiber.interrupt(startFiber))
    }

    if (subscriptionFiber) {
      Effect.runFork(Fiber.interrupt(subscriptionFiber))
    }

    try {
      streamController?.close()
    } catch {
      // already closed
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller
      const encoder = new TextEncoder()

      const write = (text: string) => {
        if (closed) {
          return
        }

        try {
          controller.enqueue(encoder.encode(text))
        } catch {
          close()
        }
      }

      subscriptionFiber = Effect.runFork(
        store.subscribe(runId, { fromSeq }).pipe(
          Stream.tap((event: EventEnvelope) =>
            Effect.sync(() => {
              write(
                `id: ${event.seq}\ndata: ${stringifyJson({ batch: [encodeLoomsEvent(event)] })}\n\n`,
              )
            }),
          ),
          Stream.runDrain,
        ),
      )

      // Send an immediate keepalive so bytes and headers flush over the wire immediately,
      // preventing dev server proxies and Bun.serve from aborting quiet connections.
      write(': keepalive\n\n')

      heartbeatFiber = Effect.runFork(
        Effect.repeat(
          Effect.sleep(heartbeatMs).pipe(
            Effect.andThen(Effect.sync(() => write(': keepalive\n\n'))),
          ),
          Schedule.forever,
        ).pipe(Effect.asVoid),
      )

      const startResult = onStart?.(write, close)

      const startEffect = Effect.isEffect(startResult)
        ? startResult
        : startResult
          ? Effect.promise(() => startResult)
          : undefined

      if (startEffect) {
        startFiber = Effect.runFork(startEffect)
      }

      if (signal.aborted) {
        close()
        return
      }

      signal.addEventListener('abort', close)
    },
    cancel() {
      // When the consumer closes the stream or client disconnects, tear down resources immediately.
      close()
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      vary: 'accept',
      'x-accel-buffering': 'no',
    },
  })
}
