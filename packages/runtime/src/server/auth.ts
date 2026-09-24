import { Effect } from 'effect'

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
}

export type AuthDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly status: number; readonly error: string }

export type Authorize = (request: Request, route: RouteInfo) => Effect.Effect<AuthDecision>

export const authAllowed: AuthDecision = { allowed: true }

export function authDenied(status: number, error: string): AuthDecision {
  return { allowed: false, status, error }
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
