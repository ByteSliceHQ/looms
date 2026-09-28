import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

import { Effect } from 'effect'

import { createAxWorker } from '@swirls/looms/ax'
import { bunSqliteEventStore } from '@swirls/looms/core/bun-sqlite'
import { bearerAuth, createLooms } from '@swirls/looms/runtime'

import { modules } from './definition'

function required(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

const path = process.env.LOOMS_DB ?? './.looms/ax.sqlite'
await mkdir(dirname(path), { recursive: true })

const authorize = bearerAuth({
  read: required('LOOMS_READ_TOKEN'),
  write: required('LOOMS_WRITE_TOKEN'),
  worker: required('LOOMS_WORKER_TOKEN'),
  operations: required('LOOMS_WRITE_TOKEN'),
})

const looms = createLooms({
  modules,
  store: bunSqliteEventStore({ path }),
  worker:
    process.env.AX_EXECUTOR === 'local'
      ? undefined
      : createAxWorker({
          endpoint: required('AX_BRIDGE_URL'),
          token: required('AX_HOST_TOKEN'),
          scope: 'ax-example',
          callbackTarget: 'ax-example',
          routes: { 'repository.analyze.v1': { profile: 'repository-analyzer-v1' } },
          allowInsecureHttp: process.env.AX_ALLOW_INSECURE === 'true',
        }),
  authorize,
})

await looms.ready()
await looms.recoverDeadlines()

const server = Bun.serve({
  port: Number(process.env.PORT ?? 8790),
  hostname: '0.0.0.0',
  fetch(request) {
    const runId = /^\/demo\/runs\/([^/]+)\/cancel$/.exec(new URL(request.url).pathname)?.[1]

    if (request.method === 'POST' && runId) {
      return Effect.runPromise(
        authorize(request, { access: 'operations', name: 'demo.cancel', runId }),
      ).then((auth) =>
        auth.allowed
          ? looms.cancel(runId).then((state) => Response.json({ runId, state }))
          : Response.json({ error: auth.error }, { status: auth.status }),
      )
    }

    return looms
      .fetch(request)
      .then((response) => response ?? new Response('Not Found', { status: 404 }))
  },
})

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    void server.stop(true)
    void looms.stop().then(() => process.exit(0))
  })
}
