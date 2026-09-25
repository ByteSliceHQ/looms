import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { debuggerUi } from '@looms/debugger/server'
import { createLooms } from '@swirls/looms'
import type { EventStore } from '@swirls/looms/core'
import { bunSqliteEventStore } from '@swirls/looms/core/bun-sqlite'
import { withProjectors } from '@swirls/looms/projectors'
import { s2Projector, startS2Lite } from '@swirls/looms/s2'

import { demoEnvFromProcess, resolveDemoLlm, resolveDemoProjectors } from './demo-config'
import { demoModules } from './runtime'

const runsDir = join(process.cwd(), '.looms')
const env = demoEnvFromProcess()
const port = Number(process.env.PORT ?? 8787)
const hostname = process.env.HOST ?? '127.0.0.1'
// The kit default sits beside the server module (`packages/debugger/src/app` from source).
const debuggerRoot = fileURLToPath(new URL('../../debugger/dist', import.meta.url))

function createStore(): Promise<EventStore> {
  return mkdir(runsDir, { recursive: true }).then(() => {
    const local = bunSqliteEventStore({ path: join(runsDir, 'demo.sqlite') })
    const configured = resolveDemoProjectors(env)

    if (configured.length > 0) {
      return withProjectors(local, configured)
    }

    if (env.LOOMS_S2_ENDPOINT || env.LOOMS_S2_ACCESS_TOKEN) {
      return local
    }

    return startS2Lite({ env: process.env }).then((lite) =>
      withProjectors(local, [
        s2Projector({
          basin: 'looms-demo',
          accessToken: 's2_local',
          endpoint: lite.endpoint,
        }),
      ]),
    )
  })
}

createLooms({
  modules: demoModules({ llm: resolveDemoLlm(env) }),
  store: createStore(),
  debugger: debuggerUi({ root: debuggerRoot }),
  serve: { port, hostname },
})
