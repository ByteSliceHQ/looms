import {
  crossRunResponse,
  definitionsResponse,
  resolveRunTarget,
  RunTargetError,
} from '@looms/actor'
import type { AnyRuntimeModule } from '@looms/core'
import {
  ACTOR_HEADER,
  authResponse,
  describeRoute,
  type AuthDecision,
  type RouteInfo,
} from '@looms/runtime'

export interface DurableObjectStubLike {
  fetch(request: Request): Promise<Response>
}

export interface DurableObjectNamespaceLike<
  T extends DurableObjectStubLike = DurableObjectStubLike,
> {
  getByName(name: string): T
}

/**
 * Decides, in the Worker, whether a request may be forwarded to a run's Durable Object. `route` is
 * what `describeRoute` says about the request: it has no run attributes, because the Worker does
 * not read the run.
 */
export type RouteAuthorize = (
  request: Request,
  route: RouteInfo,
) => AuthDecision | Promise<AuthDecision>

/** `req` with `ACTOR_HEADER` set to `actorId`, or removed when there is none. */
function withActor(req: Request, actorId: string | undefined): Request {
  if (actorId === undefined && !req.headers.has(ACTOR_HEADER)) {
    return req
  }

  const headers = new Headers(req.headers)

  if (actorId === undefined) {
    headers.delete(ACTOR_HEADER)
  } else {
    headers.set(ACTOR_HEADER, actorId)
  }

  return new Request(req, { headers })
}

/**
 * Routes incoming HTTP requests to the appropriate Durable Object actor cell.
 * Handles `/health` locally, returns 501 for global run lists and forks, and forwards
 * all other run and event-stream requests to `namespace.getByName(runId)`.
 *
 * With `authorize`, every request for a Looms route is checked in the Worker first, and a denied
 * one never reaches a Durable Object. When the decision names an actor, the forwarded request
 * carries it in `ACTOR_HEADER`; give the Durable Object `forwardedActorAuth()` as its `authorize`
 * to record the request's events as sent by that actor. A client can never set the header itself:
 * it is removed from every request that comes through here.
 */
export function routeToDurableObject(
  namespace: DurableObjectNamespaceLike,
  req: Request,
  options?: {
    readonly modules?: readonly AnyRuntimeModule[] | (() => readonly AnyRuntimeModule[])
    readonly authorize?: RouteAuthorize
  },
): Promise<Response | null> {
  const url = new URL(req.url)

  if (url.pathname === '/health') {
    return Promise.resolve(Response.json({ ok: true }))
  }

  const route = options?.authorize ? describeRoute(req.method, url.pathname) : null

  if (options?.authorize && route) {
    return Promise.resolve(options.authorize(req, route)).then((decision) => {
      const denied = authResponse(decision)

      return (
        denied ??
        forward(namespace, withActor(req, decision.allowed ? decision.actorId : undefined), options)
      )
    })
  }

  return forward(namespace, withActor(req, undefined), options)
}

function forward(
  namespace: DurableObjectNamespaceLike,
  req: Request,
  options?: {
    readonly modules?: readonly AnyRuntimeModule[] | (() => readonly AnyRuntimeModule[])
  },
): Promise<Response | null> {
  const definitions = definitionsResponse(req, options?.modules)

  if (definitions) {
    return Promise.resolve(definitions)
  }

  const unsupported = crossRunResponse(req, 'the Durable Object backend')

  if (unsupported) {
    return Promise.resolve(unsupported)
  }

  return resolveRunTarget(req)
    .then(({ runId, request }) => namespace.getByName(runId).fetch(request))
    .catch((error: Error) => {
      if (error instanceof RunTargetError) {
        return null
      }

      return Promise.reject(error)
    })
}
