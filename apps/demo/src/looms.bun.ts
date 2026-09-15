import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { createLocalActorHost, type LocalActorHost } from '@looms/actor'
import type { EventStore } from '@looms/core'
import { bunSqliteEventStore } from '@looms/core/bun-sqlite'
import { withProjectors } from '@looms/projectors'
import { s2Projector, startS2Lite } from '@looms/s2'

import { demoEnvFromProcess, resolveDemoLlm, resolveDemoProjectors } from './demo-config'
import { demoModules } from './runtime'

const runsDir = join(process.cwd(), '.looms', 'runs')
const env = demoEnvFromProcess()

let s2LiteEndpointPromise: Promise<string | undefined> | undefined

function getS2LiteEndpoint(): Promise<string | undefined> {
  if (!s2LiteEndpointPromise) {
    s2LiteEndpointPromise = (async () => {
      if (env.LOOMS_S2_ENDPOINT || env.LOOMS_S2_ACCESS_TOKEN) {
        return undefined
      }

      const lite = await startS2Lite({ env: process.env })
      return lite.endpoint
    })()
  }

  return s2LiteEndpointPromise
}

async function createRunStore(runId: string): Promise<EventStore> {
  await mkdir(runsDir, { recursive: true })

  const local = bunSqliteEventStore({
    path: join(runsDir, `${runId}.sqlite`),
  })

  const configured = resolveDemoProjectors(env)

  if (configured.length > 0) {
    return withProjectors(local, configured)
  }

  const liteEndpoint = await getS2LiteEndpoint()

  if (!liteEndpoint) {
    return local
  }

  return withProjectors(local, [
    s2Projector({
      basin: 'looms-demo',
      accessToken: 's2_local',
      endpoint: liteEndpoint,
    }),
  ])
}

let localHostPromise: Promise<LocalActorHost> | undefined

/**
 * Local Bun+SQLite actor host: one cell and one SQLite file per runId.
 * Only imported when LOOMS_BACKEND=bun so Vite SSR (Node) never evaluates `bun:sqlite`
 * in cloudflare mode.
 */
export function getLocalRuntime(): Promise<LocalActorHost> {
  if (!localHostPromise) {
    localHostPromise = Promise.resolve(
      createLocalActorHost({
        createStore: createRunStore,
        modules: demoModules({ llm: resolveDemoLlm(env) }),

      }),
    )
  }

  return localHostPromise
}
