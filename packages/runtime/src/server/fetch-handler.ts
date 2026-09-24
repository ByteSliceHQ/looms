import { Effect, Predicate } from 'effect'

import type { EventStore } from '@looms/core'

import type { LoomsRuntime } from '../runtime'
import { defaultAuthorize, type Authorize } from './auth'
import { acceptsEventStream, toErrorResponse, type RouteOptions } from './http'
import { matchRoute, type MatchedRoute, type Route } from './route-table'
import { effectRoutes } from './routes/effects'
import { operationRoutes } from './routes/operations'
import { runRoutes } from './routes/runs'

export interface FetchHandlerOptions {
  readonly runtime: LoomsRuntime
  readonly store: EventStore
  /**
   * Decides whether a request may use a route. Defaults to open reads and writes with worker and
   * operations routes unavailable; use `bearerAuth` or your own policy to change that.
   */
  readonly authorize?: Authorize
}

function createRoutes(options: RouteOptions): readonly Route[] {
  return [...runRoutes(options), ...effectRoutes(options), ...operationRoutes(options)]
}

function authorizeRoute(
  req: Request,
  matched: MatchedRoute,
  authorize: Authorize,
): Effect.Effect<Response | null> {
  const { access, name } = matched.route

  if (access === 'public') {
    return Effect.succeed(null)
  }

  const runId = matched.params.runId

  return authorize(
    req,
    Predicate.isString(runId) ? { access, name, runId } : { access, name },
  ).pipe(
    Effect.map((decision) =>
      decision.allowed
        ? null
        : Response.json({ error: decision.error }, { status: decision.status }),
    ),
  )
}

export function isLoomsApiPath(path: string): boolean {
  return (
    path === '/health' ||
    path === '/runs' ||
    path.startsWith('/runs/') ||
    path.startsWith('/operations/')
  )
}

export function createFetchHandler(
  options: FetchHandlerOptions,
): (req: Request) => Promise<Response | null> {
  const routes = createRoutes(options)
  const authorize = options.authorize ?? defaultAuthorize

  return (req) => {
    const url = new URL(req.url)

    if (!isLoomsApiPath(url.pathname)) {
      return Promise.resolve(null)
    }

    const accept = req.headers.get('accept') ?? ''

    if (req.method === 'GET' && accept.includes('text/html') && !acceptsEventStream(req)) {
      return Promise.resolve(null)
    }

    return Effect.runPromise(
      Effect.gen(function* () {
        const matched = matchRoute(routes, req.method, url.pathname)

        if (!matched) {
          return new Response('Not Found', { status: 404 })
        }

        const denied = yield* authorizeRoute(req, matched, authorize)

        if (denied) {
          return denied
        }

        return yield* matched.route.handle({ req, url, params: matched.params })
      }).pipe(
        Effect.catch((error) => Effect.succeed(toErrorResponse(error))),
        Effect.catchCause((cause) =>
          Effect.logError('[@looms/runtime] request failed', cause).pipe(
            Effect.as(Response.json({ error: 'Internal server error' }, { status: 500 })),
          ),
        ),
      ),
    )
  }
}
