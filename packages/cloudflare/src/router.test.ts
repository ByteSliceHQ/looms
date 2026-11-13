import { describe, expect, test } from 'bun:test'

import {
  ACTOR_HEADER,
  authAllowed,
  authAllowedAs,
  authDenied,
  type RouteInfo,
} from '@looms/runtime'

import { routeToDurableObject } from './router'

/** A namespace that records what reached which Durable Object. */
function recordingNamespace() {
  const reached: { runId: string; actor: string | null; path: string }[] = []

  return {
    reached,
    namespace: {
      getByName: (runId: string) => ({
        fetch: async (request: Request) => {
          reached.push({
            runId,
            actor: request.headers.get(ACTOR_HEADER),
            path: new URL(request.url).pathname,
          })

          return Response.json({ ok: true })
        },
      }),
    },
  }
}

function post(path: string, headers: Record<string, string> = {}): Request {
  return new Request(`http://looms.test${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ input: {} }),
  })
}

describe('routeToDurableObject authorize', () => {
  test('a denied request never reaches a Durable Object', async () => {
    const { namespace, reached } = recordingNamespace()
    const seen: RouteInfo[] = []

    const response = await routeToDurableObject(namespace, post('/runs/run_1/signals/notes/add'), {
      authorize: (_request, route) => {
        seen.push(route)
        return authDenied(403, 'Forbidden')
      },
    })

    expect(response?.status).toBe(403)
    expect(await response?.json()).toEqual({ error: 'Forbidden' })
    expect(reached).toEqual([])

    expect(seen).toEqual([
      { access: 'write', name: 'runs.signal.named', runId: 'run_1', signal: 'notes/add' },
    ])
  })

  test('an allowed request is forwarded with the actor the Worker named', async () => {
    const { namespace, reached } = recordingNamespace()

    const response = await routeToDurableObject(namespace, post('/runs/run_1/signals/notes/add'), {
      authorize: async () => authAllowedAs('user_1'),
    })

    expect(response?.status).toBe(200)

    expect(reached).toEqual([
      { runId: 'run_1', actor: 'user_1', path: '/runs/run_1/signals/notes/add' },
    ])
  })

  test('a client cannot name its own actor', async () => {
    const { namespace, reached } = recordingNamespace()
    const forged = { [ACTOR_HEADER]: 'someone_else' }

    // The Worker allows the request without naming anyone.
    await routeToDurableObject(namespace, post('/runs/run_1/signals/notes/add', forged), {
      authorize: () => authAllowed,
    })

    // The Worker names someone else.
    await routeToDurableObject(namespace, post('/runs/run_2/signals/notes/add', forged), {
      authorize: () => authAllowedAs('user_1'),
    })

    // No authorize at all.
    await routeToDurableObject(namespace, post('/runs/run_3/signals/notes/add', forged))

    expect(reached.map(({ runId, actor }) => ({ runId, actor }))).toEqual([
      { runId: 'run_1', actor: null },
      { runId: 'run_2', actor: 'user_1' },
      { runId: 'run_3', actor: null },
    ])
  })

  test('authorize is asked about reads too, and not about health', async () => {
    const { namespace } = recordingNamespace()
    const seen: string[] = []

    const authorize = (_request: Request, route: RouteInfo) => {
      seen.push(route.name)
      return authAllowed
    }

    await routeToDurableObject(namespace, new Request('http://looms.test/runs/run_1/events'), {
      authorize,
    })

    const health = await routeToDurableObject(namespace, new Request('http://looms.test/health'), {
      authorize,
    })

    expect(health?.status).toBe(200)
    expect(seen).toEqual(['runs.events'])
  })
})
