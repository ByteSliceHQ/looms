export {
  createFetchHandler,
  isLoomsApiPath,
  type FetchHandlerOptions,
} from './server/fetch-handler'
export {
  authAllowed,
  authDenied,
  bearerAuth,
  defaultAuthorize,
  type AuthDecision,
  type AuthorizedAccess,
  type Authorize,
  type BearerTokens,
  type RouteAccess,
  type RouteInfo,
} from './server/auth'

export interface RunningServer {
  port: number
  stop: () => void
}

export type LoomsFetchResult = Response | null

export function serveHttp(
  fetchHandler: (req: Request) => Promise<Response | null>,
  options?: { port?: number; hostname?: string },
): RunningServer {
  const port = options?.port ?? 8787
  const hostname = options?.hostname ?? '0.0.0.0'

  const server = Bun.serve({
    port,
    hostname,
    idleTimeout: 0,
    fetch(req, srv) {
      srv.timeout(req, 0)
      return fetchHandler(req).then(
        (result) => result ?? new Response('Not Found', { status: 404 }),
      )
    },
  })

  return {
    port: server.port ?? port,
    stop: () => server.stop(true),
  }
}
