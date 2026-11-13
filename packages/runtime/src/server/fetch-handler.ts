import { Data, Effect, Option, Predicate, Schema } from 'effect'

import { hasEntries, RunAttributesSchema, type EventStore, type RunAttributes } from '@looms/core'

import type { LoomsRuntime } from '../runtime'
import {
  authAllowed,
  authResponse,
  defaultAuthorize,
  type AuthDecision,
  type Authorize,
  type RouteInfo,
} from './auth'
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
   * operations routes unavailable; use `bearerAuth`, `grantAuth`, or your own policy to change that.
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

const START_ROUTES: ReadonlySet<string> = new Set(['runs.start', 'runs.launch'])

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

const NAMED_SIGNAL_ROUTE = 'runs.signal.named'

/** What a matched route is about, before the run's attributes are known. */
function matchedRouteInfo(matched: MatchedRoute): RouteInfo | null {
  const { access, name } = matched.route

  if (access === 'public') {
    return null
  }

  const { runId, namespace, name: signalName } = matched.params

  if (!Predicate.isString(runId)) {
    return { access, name }
  }

  // Only a run's named signal route has these two parameters.
  return name === NAMED_SIGNAL_ROUTE &&
    Predicate.isString(namespace) &&
    Predicate.isString(signalName)
    ? { access, name, runId, signal: `${namespace}/${signalName}` }
    : { access, name, runId }
}

let routeShapes: readonly Route[] | undefined

/**
 * Says which Looms route a request is for, without a runtime: the same access level, route name,
 * run id and signal that `authorize` receives, but never the run's attributes. Returns null for a
 * path Looms does not serve and for public routes.
 *
 * A front that forwards requests to a host, such as a Worker in front of Durable Objects, uses
 * this to decide what to let through.
 */
export function describeRoute(method: string, pathname: string): RouteInfo | null {
  // SAFETY: route handlers are the only code that reads the options, and they are never called
  // here; only each route's method, path, name and access are used.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  routeShapes ??= createRoutes({} as RouteOptions)

  const matched = matchRoute(routeShapes, method, pathname)

  return matched ? matchedRouteInfo(matched) : null
}

function authorizeRoute(
  req: Request,
  matched: MatchedRoute,
  authorize: Authorize,
  runtime: LoomsRuntime,
  store: EventStore,
): Effect.Effect<AuthDecision, Error> {
  const info = matchedRouteInfo(matched)

  if (!info) {
    return Effect.succeed(authAllowed)
  }

  const { name, runId } = info

  return Effect.gen(function* () {
    const stored = Predicate.isString(runId)
      ? yield* readStoredAttributes(runtime, store, runId)
      : noAttributes

    const requested = START_ROUTES.has(name) ? yield* readRequestAttributes(req) : noAttributes

    const attributes = hasEntries(stored) ? stored : requested

    return yield* authorize(req, hasEntries(attributes) ? { ...info, attributes } : info)
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

        const decision = yield* authorizeRoute(
          req,
          matched,
          authorize,
          options.runtime,
          options.store,
        )

        const denied = authResponse(decision)

        if (denied) {
          return denied
        }

        const context = { req, url, params: matched.params }

        return yield* matched.route.handle(
          decision.allowed && decision.actorId
            ? { ...context, actorId: decision.actorId }
            : context,
        )
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
