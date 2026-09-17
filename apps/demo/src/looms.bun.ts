import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { createLocalActorHost, type LocalActorHost } from '@swirls/looms/actor'
import type { EventStore } from '@swirls/looms/core'
import { bunSqliteEventStore } from '@swirls/looms/core/bun-sqlite'
import { withProjectors } from '@swirls/looms/projectors'
import { s2Projector, startS2Lite } from '@swirls/looms/s2'

import { demoEnvFromProcess, resolveDemoLlm, resolveDemoProjectors } from './demo-config'
import { demoModules } from './runtime'

const runsDir = join(process.cwd(), '.looms', 'runs')
const env = demoEnvFromProcess()

let s2LiteEndpointPromise: Promise<string | undefined> | undefined

function getS2LiteEndpoint(): Promise<string | undefined> {
  if (!s2LiteEndpointPromise) {
    s2LiteEndpointPromise =
      env.LOOMS_S2_ENDPOINT || env.LOOMS_S2_ACCESS_TOKEN
        ? Promise.resolve(undefined)
        : startS2Lite({ env: process.env }).then((lite) => lite.endpoint)
  }

  return s2LiteEndpointPromise
}

function createRunStore(runId: string): Promise<EventStore> {
  return mkdir(runsDir, { recursive: true }).then(() => {
    const local = bunSqliteEventStore({
      path: join(runsDir, `${runId}.sqlite`),
    })

    const configured = resolveDemoProjectors(env)

    if (configured.length > 0) {
      return withProjectors(local, configured)
    }

    return getS2LiteEndpoint().then((liteEndpoint) =>
      liteEndpoint
        ? withProjectors(local, [
            s2Projector({
              basin: 'looms-demo',
              accessToken: 's2_local',
              endpoint: liteEndpoint,
            }),
          ])
        : local,
    )
  })
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
