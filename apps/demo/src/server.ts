import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { looms } from './looms.server'

interface BunServerLike {
  timeout?(req: Request, seconds: number): void
}

interface RequestWithBunRuntime extends Request {
  runtime?: {
    bun?: {
      server?: BunServerLike
    }
  }
}

function disableBunTimeout(req: Request, server: BunServerLike | undefined): void {
  try {
    // SAFETY: Bun.serve passes server as second arg; srvx attaches runtime.bun.server to Request.
    const srv = server ?? (req as RequestWithBunRuntime).runtime?.bun?.server
    if (srv) {
      srv.timeout?.(req, 0)
    }
  } catch {
    // Ignore when timeout is not supported.
  }
}

export default createServerEntry({
  fetch: async (req, opts) => {
    // SAFETY: Bun runtime attaches optional server instance to request or opts.
    disableBunTimeout(req, opts as BunServerLike | undefined)
    return (await looms.fetch(req)) ?? handler.fetch(req)
  },
})
