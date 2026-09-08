import { LlmTag } from '@looms/agent'
import {
  EventStoreTag,
  EventTypeSchema,
  fromWireEvent,
  InvalidInputError,
  JsonValueSchema,
  type EventStore,
  type JsonValue,
  type Message,
  type LoomsEventSignal,
} from '@looms/core'
import { Effect, Predicate, Schema } from 'effect'
import { handleLivestoreProxy } from './livestore-proxy'
import type { LoomsRuntime } from './runtime'

export interface FetchHandlerOptions {
  runtime: LoomsRuntime
  store: EventStore
  /**
   * Provide remaining Effect context (LlmTag, etc.) after EventStore is injected.
   */
  provide: <A, E>(effect: Effect.Effect<A, E, LlmTag>) => Effect.Effect<A, E>
}

export interface RunningServer {
  port: number
  stop: () => void
}

export type LoomsFetchResult = Response | null

const MessageSchema = Schema.Struct({
  role: Schema.Literals(['system', 'user', 'assistant', 'tool'] as const),
  content: Schema.String,
  toolCallId: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
})

const StartActorBodySchema = Schema.Struct({
  definitionName: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
  input: Schema.optional(JsonValueSchema),
  actorId: Schema.optional(Schema.String),
})

const SignalEventSchema = Schema.Struct({
  type: EventTypeSchema,
  payload: JsonValueSchema,
  id: Schema.optional(Schema.String),
  ts: Schema.optional(Schema.Number),
  ephemeral: Schema.optional(Schema.Boolean),
  parentActorId: Schema.optional(Schema.NullOr(Schema.String)),
})

const SignalBodySchema = Schema.Struct({
  events: Schema.optional(Schema.Array(SignalEventSchema)),
  message: Schema.optional(Schema.Union([Schema.String, MessageSchema])),
})

const ReviewDecideBodySchema = Schema.Struct({
  actionId: Schema.optional(Schema.String),
  outcome: Schema.optional(Schema.Literals(['approve', 'reject'] as const)),
  payload: Schema.optional(JsonValueSchema),
})

const SteerBodySchema = Schema.Struct({
  message: Schema.optional(Schema.Union([Schema.String, MessageSchema])),
  interrupt: Schema.optional(Schema.Boolean),
  turn: Schema.optional(Schema.Number),
})

function run<A, E>(
  effect: Effect.Effect<A, E, EventStoreTag | LlmTag>,
  store: EventStore,
  provide: FetchHandlerOptions['provide'],
): Promise<A> {
  const withStore = Effect.provideService(effect, EventStoreTag, store)
  return Effect.runPromise(provide(withStore))
}

async function readJson(req: Request): Promise<JsonValue> {
  try {
    const value: unknown = await req.json()
    return Schema.decodeUnknownSync(JsonValueSchema)(value)
  } catch {
    return {}
  }
}

function parseMessage(value: string | Message): Message {
  if (Predicate.isString(value)) {
    return { role: 'user', content: value }
  }
  return value
}

/** True for Looms HTTP routes that hosts should claim before UI fallthrough. */
export function isLoomsApiPath(path: string): boolean {
  return (
    path === '/health' ||
    path.startsWith('/api/livestore') ||
    path.startsWith('/actors/')
  )
}

/**
 * Build a Fetch handler for Looms HTTP routes.
 * Returns `null` when the path is not a Looms API route so a
 * parent server (e.g. TanStack Start, Nitro) can fall through.
 */
export function createFetchHandler(
  options: FetchHandlerOptions,
): (req: Request) => Promise<Response | null> {
  const { runtime, store, provide } = options

  return async (req: Request): Promise<Response | null> => {
    const url = new URL(req.url)
    const path = url.pathname

    if (!isLoomsApiPath(path)) {
      return null
    }

    if (path === '/health') {
      return Response.json({ ok: true })
    }

    if (path.startsWith('/api/livestore')) {
      return handleLivestoreProxy(req, runtime, store, { provide })
    }

    try {
      if (req.method === 'POST' && path === '/actors/agent') {
        const body = Schema.decodeUnknownSync(StartActorBodySchema)(await readJson(req))
        const definitionName = body.definitionName ?? body.name
        if (!definitionName) {
          return Response.json({ error: 'definitionName required' }, { status: 400 })
        }
        if (!runtime.registry.agents.has(definitionName)) {
          return Response.json({ error: `Unknown agent: ${definitionName}` }, { status: 404 })
        }
        try {
          const result = await run(
            runtime.startAgent(definitionName, body.input ?? null, { actorId: body.actorId }),
            store,
            provide,
          )
          return Response.json(result)
        } catch (err) {
          if (err instanceof InvalidInputError) {
            return Response.json({ error: err.message, issues: err.issues }, { status: 400 })
          }
          throw err
        }
      }

      if (req.method === 'POST' && path === '/actors/workflow') {
        const body = Schema.decodeUnknownSync(StartActorBodySchema)(await readJson(req))
        const definitionName = body.definitionName ?? body.name
        if (!definitionName) {
          return Response.json({ error: 'definitionName required' }, { status: 400 })
        }
        if (!runtime.registry.workflows.has(definitionName)) {
          return Response.json({ error: `Unknown workflow: ${definitionName}` }, { status: 404 })
        }
        try {
          const result = await run(
            runtime.startWorkflow(definitionName, body.input ?? null, {
              actorId: body.actorId,
            }),
            store,
            provide,
          )
          return Response.json(result)
        } catch (err) {
          if (err instanceof InvalidInputError) {
            return Response.json({ error: err.message, issues: err.issues }, { status: 400 })
          }
          throw err
        }
      }

      const signalMatch = path.match(/^\/actors\/([^/]+)\/signal$/)
      if (req.method === 'POST' && signalMatch) {
        const actorId = decodeURIComponent(signalMatch[1]!)
        const body = Schema.decodeUnknownSync(SignalBodySchema)(await readJson(req))
        if (body.message !== undefined) {
          const message = parseMessage(body.message)
          const state = await run(
            runtime.signal(actorId, [
              {
                type: 'agent.message.received',
                payload: { message },
              },
            ]),
            store,
            provide,
          )
          return Response.json({ actorId, state })
        }
        const events = body.events ?? []
        const signals: LoomsEventSignal[] = events.map((e) => {
          const typed = fromWireEvent({
            id: e.id ?? `sig_${Date.now().toString(36)}`,
            actorId,
            type: e.type,
            seq: 0,
            ts: e.ts ?? Date.now(),
            payload: e.payload,
            ephemeral: e.ephemeral,
            parentActorId: e.parentActorId,
          })
          // SAFETY: fromWireEvent restores type↔payload; reconstructing the signal keeps that correlation.
          return {
            type: typed.type,
            payload: typed.payload,
            id: typed.id,
            ts: typed.ts,
            ephemeral: typed.ephemeral,
            parentActorId: typed.parentActorId,
          } as LoomsEventSignal
        })
        const state = await run(runtime.signal(actorId, signals), store, provide)
        return Response.json({ actorId, state })
      }

      const reviewMatch = path.match(/^\/actors\/([^/]+)\/reviews\/([^/]+)\/decide$/)
      if (req.method === 'POST' && reviewMatch) {
        const actorId = decodeURIComponent(reviewMatch[1]!)
        const reviewId = decodeURIComponent(reviewMatch[2]!)
        const body = Schema.decodeUnknownSync(ReviewDecideBodySchema)(await readJson(req))
        if (!body.actionId || !body.outcome) {
          return Response.json({ error: 'actionId and outcome required' }, { status: 400 })
        }
        const state = await run(
          runtime.decideReview(actorId, reviewId, {
            actionId: body.actionId,
            outcome: body.outcome,
            payload: body.payload,
          }),
          store,
          provide,
        )
        return Response.json({ actorId, state })
      }

      const eventsMatch = path.match(/^\/actors\/([^/]+)\/events$/)
      if (req.method === 'GET' && eventsMatch) {
        const actorId = decodeURIComponent(eventsMatch[1]!)
        const fromSeq = url.searchParams.get('fromSeq')
          ? Number(url.searchParams.get('fromSeq'))
          : undefined
        const limit = url.searchParams.get('limit')
          ? Number(url.searchParams.get('limit'))
          : undefined
        const events = await run(runtime.getEvents(actorId, { fromSeq, limit }), store, provide)
        return Response.json({ actorId, events })
      }

      const stateMatch = path.match(/^\/actors\/([^/]+)\/state$/)
      if (req.method === 'GET' && stateMatch) {
        const actorId = decodeURIComponent(stateMatch[1]!)
        const state = await run(runtime.getState(actorId), store, provide)
        return Response.json({ actorId, state })
      }

      const wakeMatch = path.match(/^\/actors\/([^/]+)\/wake$/)
      if (req.method === 'POST' && wakeMatch) {
        const actorId = decodeURIComponent(wakeMatch[1]!)
        const state = await run(runtime.wake(actorId), store, provide)
        return Response.json({ actorId, state })
      }

      const steerMatch = path.match(/^\/actors\/([^/]+)\/steer$/)
      if (req.method === 'POST' && steerMatch) {
        const actorId = decodeURIComponent(steerMatch[1]!)
        const body = Schema.decodeUnknownSync(SteerBodySchema)(await readJson(req))
        if (body.message === undefined) {
          return Response.json({ error: 'message required' }, { status: 400 })
        }
        const state = await run(
          runtime.steer(actorId, body.message, {
            interrupt: body.interrupt,
            turn: body.turn,
          }),
          store,
          provide,
        )
        return Response.json({ actorId, state })
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
    async fetch(req) {
      const result = await fetchHandler(req)
      if (result === null) {
        return new Response('Not Found', { status: 404 })
      }
      return result
    },
  })

  return {
    port: server.port ?? port,
    stop: () => server.stop(true),
  }
}
