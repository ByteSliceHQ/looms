import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { Predicate } from 'effect'

import { looms } from './looms.server'

interface BunServerLike {
  timeout?(req: Request, seconds: number): void
}

function isBunServer(value: unknown): value is BunServerLike {
  return (
    Predicate.isReadonlyObject(value) &&
    (!('timeout' in value) || Predicate.isFunction(value.timeout))
  )
}

function requestBunServer(req: Request): BunServerLike | undefined {
  if (!('runtime' in req) || !Predicate.isReadonlyObject(req.runtime)) {
    return undefined
  }

  const runtime = req.runtime

  if (!('bun' in runtime) || !Predicate.isReadonlyObject(runtime.bun)) {
    return undefined
  }

  const bun = runtime.bun
  return 'server' in bun && isBunServer(bun.server) ? bun.server : undefined
}

function disableBunTimeout(req: Request, server: BunServerLike | undefined): void {
  try {
    const srv = server ?? requestBunServer(req)

    if (srv) {
      srv.timeout?.(req, 0)
    }
  } catch {
    // Ignore when timeout is not supported.
  }
}

export default createServerEntry({
  fetch: (req, opts) => {
    disableBunTimeout(req, isBunServer(opts) ? opts : undefined)
    return looms.fetch(req).then((response) => response ?? handler.fetch(req))
  },
})
