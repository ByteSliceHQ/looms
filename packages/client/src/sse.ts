import { Data, Effect, Option, Predicate, Queue, Schema, Stream } from 'effect'

import { decodeLoomsEvent, type EventEnvelope } from '@looms/core'

export interface SseFrame {
  id?: string
  event?: string
  data: string
}

const decodeSseData = Schema.decodeOption(Schema.fromJsonString(Schema.Unknown))

export function parseSseFrame(raw: string): SseFrame | undefined {
  let id: string | undefined
  let event: string | undefined
  const dataLines: string[] = []

  for (const line of raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')) {
    if (line.startsWith(':')) {
      continue
    }

    if (line.startsWith('id:')) {
      id = line.slice(3).trim()
      continue
    }

    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
      continue
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }

  if (dataLines.length === 0) {
    return undefined
  }

  return { id, event, data: dataLines.join('\n') }
}

export class SseStreamError extends Data.TaggedError('SseStreamError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'SseStreamError'
  }
}

export function consumeSseStreamEffect(
  body: ReadableStream<Uint8Array>,
  onFrame: (frame: SseFrame) => void,
): Effect.Effect<void, SseStreamError> {
  const decoder = new TextDecoder()

  return Effect.acquireUseRelease(
    Effect.sync(() => body.getReader()),
    (reader) =>
      Effect.gen(function* () {
        let buffer = ''

        while (true) {
          const { done, value } = yield* Effect.tryPromise({
            try: () => reader.read(),
            catch: (cause) => new SseStreamError(cause),
          })

          if (done) {
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const chunks = buffer.split('\n\n')
          buffer = chunks.pop() ?? ''

          for (const chunk of chunks) {
            const frame = parseSseFrame(chunk)

            if (frame) {
              onFrame(frame)
            }
          }
        }
      }),
    (reader) =>
      Effect.promise(() => reader.cancel()).pipe(
        Effect.ignore,
        Effect.ensuring(Effect.sync(() => reader.releaseLock()).pipe(Effect.ignore)),
      ),
  )
}

export function sseFrames(
  body: ReadableStream<Uint8Array>,
): Stream.Stream<SseFrame, SseStreamError> {
  return Stream.callback((queue) =>
    consumeSseStreamEffect(body, (frame) => {
      Queue.offerUnsafe(queue, frame)
    }).pipe(
      Effect.tap(() =>
        Effect.sync(() => {
          Queue.endUnsafe(queue)
        }),
      ),
    ),
  )
}

export function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  onFrame: (frame: SseFrame) => void,
  signal?: AbortSignal,
): Promise<void> {
  return Effect.runPromise(consumeSseStreamEffect(body, onFrame), { signal })
}

export function eventsFromSseData(data: string, runId: string): EventEnvelope[] {
  const parsed = decodeSseData(data)

  if (Option.isNone(parsed)) {
    return []
  }

  if (!Predicate.isReadonlyObject(parsed.value)) {
    return []
  }

  const batch =
    'batch' in parsed.value && Array.isArray(parsed.value.batch) ? parsed.value.batch : []

  const events: EventEnvelope[] = []

  for (const item of batch) {
    try {
      events.push(decodeLoomsEvent(item, runId))
    } catch {
      // skip a malformed item and keep the rest of the batch
    }
  }

  return events
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.resolve()
  }

  return Effect.runPromise(Effect.sleep(ms), { signal }).catch(() => undefined)
}
