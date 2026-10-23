import { Data, Effect, Option, Predicate, Schema } from 'effect'

import { hasEntries, RunAttributesSchema, type EventStore, type RunAttributes } from '@looms/core'

import type { LoomsRuntime } from '../runtime'
import { authResponse, defaultAuthorize, type Authorize } from './auth'
import { debuggerPath, serveDebugger, type DebuggerMount } from './debugger-host'
import { acceptsEventStream, isLoomsApiPath, toErrorResponse, type RouteOptions } from './http'
import { matchRoute, type MatchedRoute, type Route } from './route-table'
import { definitionRoutes } from './routes/definitions'
import { effectRoutes } from './routes/effects'
import { operationRoutes } from './routes/operations'
import { runRoutes } from './routes/runs'
import { readStoredAttributes } from './run-route'

export interface FetchHandlerOptions {
  readonly runtime: LoomsRuntime
  readonly store: EventStore
  /**
   * Decides whether a request may use a route. Defaults to open reads and writes with worker and
   * operations routes unavailable; use `bearerAuth` or your own policy to change that.
   */
  readonly authorize?: Authorize
  /** Debugger UI served beside the API and authorized as `{ access: 'read', name: 'debugger' }`. */
  readonly debugger?: DebuggerMount
}

function createRoutes(options: RouteOptions): readonly Route[] {
  return [
    ...definitionRoutes(options),
    ...runRoutes(options),
    ...effectRoutes(options),
    ...operationRoutes(options),
  ]
}

const StartAttributesSchema = Schema.Struct({
  attributes: Schema.optional(RunAttributesSchema),
})

class UnreadableStartBody extends Data.TaggedError('UnreadableStartBody')<{
  readonly cause: unknown
}> {}

const noAttributes: RunAttributes = {}

function readRequestAttributes(req: Request): Effect.Effect<RunAttributes> {
  return Effect.tryPromise({
    try: () => req.clone().json(),
    catch: (cause) => new UnreadableStartBody({ cause }),
  }).pipe(
    Effect.map((body) =>
      Option.match(Schema.decodeUnknownOption(StartAttributesSchema)(body), {
        onNone: () => noAttributes,
        onSome: (decoded) => decoded.attributes ?? noAttributes,
      }),
    ),
    Effect.catchTag('UnreadableStartBody', () => Effect.succeed(noAttributes)),
  )
}

function authorizeRoute(
  req: Request,
  matched: MatchedRoute,
  authorize: Authorize,
  runtime: LoomsRuntime,
  store: EventStore,
): Effect.Effect<Response | null, Error> {
  const { access, name } = matched.route

  if (access === 'public') {
    return Effect.succeed(null)
  }

  const runId = matched.params.runId

  return Effect.gen(function* () {
    const stored = Predicate.isString(runId)
      ? yield* readStoredAttributes(runtime, store, runId)
      : noAttributes

    const requested =
      matched.route.name === 'runs.start' ? yield* readRequestAttributes(req) : noAttributes

    const attributes = hasEntries(stored) ? stored : requested

    const route = Predicate.isString(runId)
      ? hasEntries(attributes)
        ? { access, name, runId, attributes }
        : { access, name, runId }
      : hasEntries(attributes)
        ? { access, name, attributes }
        : { access, name }

    return yield* authorize(req, route).pipe(Effect.map(authResponse))
  })
}

/** Whether the fetch handler answers `pathname`: the HTTP API or the debugger mount. */
export function handlesPath(pathname: string, mount: DebuggerMount | undefined): boolean {
  return isLoomsApiPath(pathname) || (mount !== undefined && debuggerPath(mount, pathname) !== null)
}

export function createFetchHandler(
  options: FetchHandlerOptions,
): (req: Request) => Promise<Response | null> {
  const routes = createRoutes(options)
  const authorize = options.authorize ?? defaultAuthorize
  const mount = options.debugger

  return (req) => {
    const url = new URL(req.url)
    const mountedPath = mount ? debuggerPath(mount, url.pathname) : null

    if (mount && mountedPath !== null) {
      return respond(serveDebugger(req, mount, mountedPath, authorize))
    }

    if (!isLoomsApiPath(url.pathname)) {
      return Promise.resolve(null)
    }

    const accept = req.headers.get('accept') ?? ''

    if (req.method === 'GET' && accept.includes('text/html') && !acceptsEventStream(req)) {
      return Promise.resolve(null)
    }

    return respond(
      Effect.gen(function* () {
        const matched = matchRoute(routes, req.method, url.pathname)

        if (!matched) {
          return new Response('Not Found', { status: 404 })
        }

        const denied = yield* authorizeRoute(
          req,
          matched,
          authorize,
          options.runtime,
          options.store,
        )

        if (denied) {
          return denied
        }

        return yield* matched.route.handle({ req, url, params: matched.params })
      }),
    )
  }
}

function respond(effect: Effect.Effect<Response | null, Error>): Promise<Response | null> {
  return Effect.runPromise(
    effect.pipe(
      Effect.catch((error) => Effect.succeed(toErrorResponse(error))),
      Effect.catchCause((cause) =>
        Effect.logError('[@looms/runtime] request failed', cause).pipe(
          Effect.as(Response.json({ error: 'Internal server error' }, { status: 500 })),
        ),
      ),
    ),
  )
}
