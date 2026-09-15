import { resolveRunTarget } from '@looms/actor'

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
 * Handles `/health` locally, returns 501 for global `GET /runs`, and forwards
 * all other run and event-stream requests to `namespace.getByName(runId)`.
 */
export async function routeToDurableObject(
  namespace: DurableObjectNamespaceLike,
  req: Request,
): Promise<Response | null> {
  const url = new URL(req.url)

  if (url.pathname === '/health') {
    return Response.json({ ok: true })
  }

  if (req.method === 'GET' && url.pathname === '/runs') {
    return Response.json(
      {
        error:
          'Global run listing is not supported in the Durable Object backend without a global index',
      },
      { status: 501 },
    )
  }

  try {
    const { runId, request } = await resolveRunTarget(req)
    const stub = namespace.getByName(runId)
    return stub.fetch(request)
  } catch {
    // Paths without a resolvable runId (e.g. GET /) are not handled by this router.
    return null
  }
}
