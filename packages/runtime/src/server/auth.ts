import { Effect } from 'effect'

import type { RunAttributes } from '@looms/core'

/**
 * What a route can do. `public` routes (health) are never passed to `authorize`; `read` and
 * `write` cover run state, `worker` covers external worker callbacks, and `operations` covers
 * operator repair endpoints.
 */
export type RouteAccess = 'public' | 'read' | 'write' | 'worker' | 'operations'

export type AuthorizedAccess = Exclude<RouteAccess, 'public'>

export interface RouteInfo {
  readonly access: AuthorizedAccess
  /** Stable route name, such as `runs.signal` or `effects.retry`. */
  readonly name: string
  readonly runId?: string
  /** The signal a `runs.signal.named` request sends, as `namespace/name`. */
  readonly signal?: string
  /** Present when the run has labels. Safe for the authorizer to branch on. */
  readonly attributes?: RunAttributes
}

export type AuthDecision =
  | {
      readonly allowed: true
      /**
       * Who the request acts as. Events the request sends are recorded with this as their
       * `origin.actorId`, replacing anything the request claimed for itself.
       */
      readonly actorId?: string
    }
  | { readonly allowed: false; readonly status: number; readonly error: string }

export type Authorize = (request: Request, route: RouteInfo) => Effect.Effect<AuthDecision>

export const authAllowed: AuthDecision = { allowed: true }

/** Allows the request and names who it acts as; see `AuthDecision`. */
export function authAllowedAs(actorId: string): AuthDecision {
  return { allowed: true, actorId }
}

export function authDenied(status: number, error: string): AuthDecision {
  return { allowed: false, status, error }
}

export function authResponse(decision: AuthDecision): Response | null {
  return decision.allowed
    ? null
    : Response.json({ error: decision.error }, { status: decision.status })
}

const unauthorized = authDenied(401, 'Unauthorized')

function notConfigured(access: 'worker' | 'operations'): AuthDecision {
  return authDenied(
    503,
    access === 'worker'
      ? 'Worker callbacks are not configured'
      : 'Operational endpoints are not configured',
  )
}

/**
 * Used when a host supplies no `authorize`: run reads and writes stay open, while worker callbacks
 * and operational endpoints are unavailable until a host opts in.
 */
export const defaultAuthorize: Authorize = (_request, route) =>
  Effect.succeed(
    route.access === 'worker' || route.access === 'operations'
      ? notConfigured(route.access)
      : authAllowed,
  )

/**
 * The header a trusted front (such as `routeToDurableObject` with an `authorize` option) uses to
 * tell the host behind it who a request acts as.
 */
export const ACTOR_HEADER = 'x-looms-actor-id'

/**
 * For a host that only a trusted front can reach, such as a Durable Object behind a Worker that
 * routes with `routeToDurableObject`. Applies `inner`, then records the request as acting for the
 * actor the front named in `ACTOR_HEADER`.
 *
 * Do not use this on a host that clients reach directly: they could name any actor.
 */
export function forwardedActorAuth(inner: Authorize = defaultAuthorize): Authorize {
  return (request, route) =>
    inner(request, route).pipe(
      Effect.map((decision) => {
        const actorId = request.headers.get(ACTOR_HEADER)

        return decision.allowed && actorId ? { ...decision, actorId } : decision
      }),
    )
}

export interface BearerTokens {
  readonly read?: string
  readonly write?: string
  readonly worker?: string
  readonly operations?: string
}

function constantTimeEquals(actual: string, expected: string): boolean {
  const length = Math.max(actual.length, expected.length)
  let difference = actual.length ^ expected.length

  for (let index = 0; index < length; index += 1) {
    difference |= (actual.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0)
  }

  return difference === 0
}

/**
 * Requires `Authorization: Bearer <token>` for every access level that has a token. Levels without
 * a token keep the default behavior: reads and writes are open, worker and operations routes 503.
 */
export function bearerAuth(tokens: BearerTokens): Authorize {
  return (request, route) => {
    const token = tokens[route.access]

    if (token === undefined) {
      return defaultAuthorize(request, route)
    }

    const header = request.headers.get('authorization') ?? ''
    return Effect.succeed(
      constantTimeEquals(header, `Bearer ${token}`) ? authAllowed : unauthorized,
    )
  }
}
