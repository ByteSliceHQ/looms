import { Effect, Schema } from 'effect'

import {
  createRunId,
  EventStoreTag,
  InvalidInputError,
  JsonValueSchema,
  type EventStore,
  type JsonValue,
} from '@looms/core'

import { handleLivestoreProxy } from './livestore-proxy'
import type { LoomsRuntime } from './runtime'
import { createEventStreamResponse } from './sse'

export interface FetchHandlerOptions {
  runtime: LoomsRuntime
  store: EventStore
}

export interface RunningServer {
  port: number
  stop: () => void
}

export type LoomsFetchResult = Response | null

const StartRunBodySchema = Schema.Struct({
  kind: Schema.optional(Schema.String),
  definitionName: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
  input: Schema.optional(JsonValueSchema),
  runId: Schema.optional(Schema.String),
  idempotencyKey: Schema.optional(Schema.String),
})

const SignalBodySchema = Schema.Struct({
  events: Schema.optional(
    Schema.Array(
      Schema.Struct({
        type: Schema.String,
        payload: JsonValueSchema,
        threadId: Schema.optional(Schema.NullOr(Schema.String)),
      }),
    ),
  ),
  type: Schema.optional(Schema.String),
  payload: Schema.optional(JsonValueSchema),
  threadId: Schema.optional(Schema.NullOr(Schema.String)),
  idempotencyKey: Schema.optional(Schema.String),
})

function extractIdempotencyKey(req: Request, bodyKey?: string): string | undefined {
  return (
    bodyKey ??
    req.headers.get('idempotency-key') ??
    req.headers.get('x-idempotency-key') ??
    undefined
  )
}

function run<A, E>(effect: Effect.Effect<A, E, EventStoreTag>, store: EventStore): Promise<A> {
  return Effect.runPromise(Effect.provideService(effect, EventStoreTag, store))
}

function wantsRunStream(req: Request, url: URL): boolean {
  const accept = req.headers.get('accept') ?? ''
  return url.searchParams.get('stream') === 'true' || accept.includes('text/event-stream')
}

function streamStartRun(
  req: Request,
  runtime: LoomsRuntime,
  store: EventStore,
  args: {
    kind: string
    definitionName: string
    input: JsonValue
    runId: string
    idempotencyKey?: string
  },
): Response {
  return createEventStreamResponse({
    signal: req.signal,
    request: req,
    store,
    runId: args.runId,
    fromSeq: 1,
    onStart: async (write, close) => {
      try {
        const result = await run(
          runtime.startRun({
            kind: args.kind,
            definitionName: args.definitionName,
            input: args.input,
            runId: args.runId,
            idempotencyKey: args.idempotencyKey,
          }),
          store,
        )
        write(`event: done\ndata: ${JSON.stringify(result)}\n\n`)
      } catch (cause: unknown) {
        const error = cause instanceof Error ? cause.message : String(cause)
        write(`event: error\ndata: ${JSON.stringify({ error })}\n\n`)
      } finally {
        close()
      }
    },
  })
}

async function readJson(req: Request): Promise<JsonValue> {
  try {
    const value: unknown = await req.json()
    return Schema.decodeUnknownSync(JsonValueSchema)(value)
  } catch {
    return {}
  }
}

export function isLoomsApiPath(path: string): boolean {
  return path === '/health' || path.startsWith('/api/livestore') || path.startsWith('/runs')
}

export function createFetchHandler(
  options: FetchHandlerOptions,
): (req: Request) => Promise<Response | null> {
  const { runtime, store } = options

  return async (req: Request): Promise<Response | null> => {
    const url = new URL(req.url)
    const path = url.pathname
    if (!isLoomsApiPath(path)) return null
    const accept = req.headers.get('accept') ?? ''
    if (req.method === 'GET' && accept.includes('text/html') && !path.startsWith('/api/')) {
      return null
    }

    if (path === '/health') return Response.json({ ok: true })
    if (path.startsWith('/api/livestore')) {
      return handleLivestoreProxy(req, runtime, store)
    }

    try {
      if (req.method === 'GET' && path === '/runs') {
        const runIds = await run(runtime.listRuns(), store)
        return Response.json({ runIds })
      }

      if (req.method === 'POST' && path === '/runs') {
        const body = Schema.decodeUnknownSync(StartRunBodySchema)(await readJson(req))
        const definitionName = body.definitionName ?? body.name
        const kind = body.kind
        if (!definitionName || !kind) {
          return Response.json({ error: 'kind and definitionName required' }, { status: 400 })
        }
        const runId = body.runId ?? createRunId()
        const idempotencyKey = extractIdempotencyKey(req, body.idempotencyKey)
        if (wantsRunStream(req, url)) {
          return streamStartRun(req, runtime, store, {
            kind,
            definitionName,
            input: body.input ?? null,
            runId,
            idempotencyKey,
          })
        }
        try {
          const result = await run(
            runtime.startRun({
              kind,
              definitionName,
              input: body.input ?? null,
              runId,
              idempotencyKey,
            }),
            store,
          )
          return Response.json(result)
        } catch (err) {
          if (err instanceof InvalidInputError) {
            return Response.json({ error: err.message, issues: err.issues }, { status: 400 })
          }
          throw err
        }
      }

      const replayMatch = path.match(/^\/runs\/([^/]+)\/replay$/)
      if (req.method === 'GET' && replayMatch) {
        const runId = decodeURIComponent(replayMatch[1]!)
        const seq = Number(url.searchParams.get('seq') ?? '0')
        const step = await run(runtime.replayTo(runId, seq), store)
        return Response.json({ runId, step })
      }

      const projectionMatch = path.match(/^\/runs\/([^/]+)\/projections\/([^/]+)$/)
      if (req.method === 'GET' && projectionMatch) {
        const runId = decodeURIComponent(projectionMatch[1]!)
        const name = decodeURIComponent(projectionMatch[2]!)
        const definition = runtime.registry.projections.get(name)
        if (!definition)
          return Response.json({ error: `Unknown projection: ${name}` }, { status: 404 })
        const value = await run(runtime.project(runId, definition), store)
        return Response.json({ runId, name, value })
      }

      const eventsMatch = path.match(/^\/runs\/([^/]+)\/events$/)
      if (req.method === 'POST' && eventsMatch) {
        const runId = decodeURIComponent(eventsMatch[1]!)
        const body = Schema.decodeUnknownSync(SignalBodySchema)(await readJson(req))
        const events =
          body.events ??
          (body.type
            ? [
                {
                  type: body.type,
                  payload: body.payload ?? null,
                  threadId: body.threadId,
                },
              ]
            : [])
        const idempotencyKey = extractIdempotencyKey(req, body.idempotencyKey)
        const state = await run(runtime.signal(runId, events, { idempotencyKey }), store)
        return Response.json({ runId, state })
      }

      if (req.method === 'GET' && eventsMatch) {
        const runId = decodeURIComponent(eventsMatch[1]!)
        const fromSeq = url.searchParams.get('fromSeq')
          ? Number(url.searchParams.get('fromSeq'))
          : undefined
        const limit = url.searchParams.get('limit')
          ? Number(url.searchParams.get('limit'))
          : undefined
        const events = await run(runtime.getEvents(runId, { fromSeq, limit }), store)
        return Response.json({ runId, events })
      }

      const threadsMatch = path.match(/^\/runs\/([^/]+)\/(threads)$/)
      if (req.method === 'GET' && threadsMatch) {
        const runId = decodeURIComponent(threadsMatch[1]!)
        const state = await run(runtime.getRun(runId), store)
        return Response.json({ runId, threads: state.threads })
      }

      const wakeMatch = path.match(/^\/runs\/([^/]+)\/wake$/)
      if (req.method === 'POST' && wakeMatch) {
        const runId = decodeURIComponent(wakeMatch[1]!)
        const state = await run(runtime.wake(runId), store)
        return Response.json({ runId, state })
      }

      const runMatch = path.match(/^\/runs\/([^/]+)$/)
      if (req.method === 'GET' && runMatch) {
        const runId = decodeURIComponent(runMatch[1]!)
        const state = await run(runtime.getRun(runId), store)
        return Response.json({ runId, state })
      }

      return new Response('Not Found', { status: 404 })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return Response.json({ error: message }, { status: 500 })
    }
  }
}

export function serveHttp(
  fetchHandler: (req: Request) => Promise<Response | null>,
  options?: { port?: number; hostname?: string },
): RunningServer {
  const port = options?.port ?? 8787
  const hostname = options?.hostname ?? '0.0.0.0'
  const server = Bun.serve({
    port,
    hostname,
    idleTimeout: 0,
    async fetch(req, srv) {
      srv.timeout(req, 0)
      const result = await fetchHandler(req)
      if (result === null) return new Response('Not Found', { status: 404 })
      return result
    },
  })
  return {
    port: server.port ?? port,
    stop: () => server.stop(true),
  }
}
