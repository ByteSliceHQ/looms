import { crossRunResponse, resolveRunTarget, RunTargetError } from '@looms/actor'

export interface DurableObjectStubLike {
  fetch(request: Request): Promise<Response>
}

export interface DurableObjectNamespaceLike<
  T extends DurableObjectStubLike = DurableObjectStubLike,
> {
  getByName(name: string): T
}

/**
 * Routes incoming HTTP requests to the appropriate Durable Object actor cell.
 * Handles `/health` locally, returns 501 for global run lists and forks, and forwards
 * all other run and event-stream requests to `namespace.getByName(runId)`.
 */
export function routeToDurableObject(
  namespace: DurableObjectNamespaceLike,
  req: Request,
): Promise<Response | null> {
  if (new URL(req.url).pathname === '/health') {
    return Promise.resolve(Response.json({ ok: true }))
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
