import { Data, Effect, Schema } from 'effect'

import {
  EventStoreTag,
  InvalidEventError,
  InvalidInputError,
  JsonValueSchema,
  type EventStore,
  type JsonValue,
} from '@looms/core'

import { RunOverloadedError, StartRunConflictError, type LoomsRuntime } from '../runtime'

export interface RouteOptions {
  readonly runtime: LoomsRuntime
  readonly store: EventStore
}

export class RequestBodyError extends Data.TaggedError('RequestBodyError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({ cause, message: 'Invalid JSON request body' })
    this.name = 'RequestBodyError'
  }
}

export class RequestQueryError extends Data.TaggedError('RequestQueryError')<{
  readonly message: string
}> {}

export const EventInputBodySchema = Schema.Struct({
  type: Schema.String,
  payload: JsonValueSchema,
  threadId: Schema.optional(Schema.NullOr(Schema.String)),
})

export function provideStore<A, E>(
  effect: Effect.Effect<A, E, EventStoreTag>,
  store: EventStore,
): Effect.Effect<A, E> {
  return Effect.provideService(effect, EventStoreTag, store)
}

export const readJson = (req: Request): Effect.Effect<JsonValue, RequestBodyError> =>
  Effect.tryPromise({
    try: () => req.json(),
    catch: (cause) => new RequestBodyError(cause),
  }).pipe(
    Effect.flatMap(Schema.decodeUnknownEffect(JsonValueSchema)),
    Effect.mapError((cause) =>
      cause instanceof RequestBodyError ? cause : new RequestBodyError(cause),
    ),
  )

export function extractIdempotencyKey(req: Request, bodyKey?: string): string | undefined {
  return (
    bodyKey ??
    req.headers.get('idempotency-key') ??
    req.headers.get('x-idempotency-key') ??
    undefined
  )
}

export function acceptsEventStream(req: Request): boolean {
  return (req.headers.get('accept') ?? '')
    .split(',')
    .some((value) => value.split(';', 1)[0]?.trim().toLowerCase() === 'text/event-stream')
}

export function readIntegerQuery(
  url: URL,
  name: string,
  options: { minimum: number },
): Effect.Effect<number | null, RequestQueryError> {
  const raw = url.searchParams.get(name)

  if (raw === null) {
    return Effect.succeed(null)
  }

  const value = Number(raw)

  if (!Number.isSafeInteger(value) || value < options.minimum || raw.trim() === '') {
    return Effect.fail(
      new RequestQueryError({
        message: `${name} must be an integer greater than or equal to ${options.minimum}`,
      }),
    )
  }

  return Effect.succeed(value)
}

export function toErrorResponse(err: Error): Response {
  if (err instanceof RequestBodyError || err instanceof RequestQueryError) {
    return Response.json({ error: err.message }, { status: 400 })
  }

  if (err instanceof InvalidInputError || err instanceof InvalidEventError) {
    return Response.json({ error: err.message, issues: err.issues }, { status: 400 })
  }

  if (err instanceof RunOverloadedError) {
    return Response.json({ error: err.message }, { status: 429 })
  }

  if (err instanceof StartRunConflictError) {
    return Response.json({ error: err.message, mismatches: err.mismatches }, { status: 409 })
  }

  return Response.json({ error: err.message }, { status: 500 })
}
