import { Effect } from 'effect'

import type { DebuggerHost } from '@looms/core'

import { authResponse, type Authorize } from './auth'
import { isLoomsApiPath } from './http'

export interface DebuggerMount {
  readonly basePath: string
  readonly host: DebuggerHost
}

export function mountDebugger(host: DebuggerHost): DebuggerMount {
  const path = host.basePath

  if (!path.startsWith('/') || path.includes('//') || path.split('/').includes('..')) {
    throw new Error(`debugger basePath must be an absolute URL path: ${path}`)
  }

  const basePath = path.endsWith('/') ? path.slice(0, -1) : path

  if (basePath === '') {
    throw new Error('debugger basePath must not be /')
  }

  if (isLoomsApiPath(basePath)) {
    throw new Error(`debugger basePath overlaps the HTTP API: ${basePath}`)
  }

  return { basePath, host }
}

/** Path below the mount, or null when `pathname` is outside it. */
export function debuggerPath(mount: DebuggerMount, pathname: string): string | null {
  if (pathname === mount.basePath) {
    return ''
  }

  return pathname.startsWith(`${mount.basePath}/`) ? pathname.slice(mount.basePath.length) : null
}

export function serveDebugger(
  req: Request,
  mount: DebuggerMount,
  path: string,
  authorize: Authorize,
): Effect.Effect<Response | null> {
  return authorize(req, { access: 'read', name: 'debugger' }).pipe(
    Effect.flatMap((decision) => {
      const denied = authResponse(decision)

      return denied
        ? Effect.succeed(denied)
        : Effect.promise(() => mount.host.fetch(req, { basePath: mount.basePath, path }))
    }),
  )
}
