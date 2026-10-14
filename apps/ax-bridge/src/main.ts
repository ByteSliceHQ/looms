import { Config, Effect, Schema } from 'effect'

import { createAxControl } from './ax-client'
import { createBridge } from './bridge'
import { ProfileSchema } from './model'
import { postgresJobStore } from './store'

function required(name: string): string {
  return Effect.runSync(Config.string(name))
}

const store = await postgresJobStore(required('DATABASE_URL'))

const ax = createAxControl({
  endpoint: required('AX_ENDPOINT'),
  atespace: required('AX_ATESPACE'),
  workerEndpoint: required('AX_WORKER_ENDPOINT'),
  substrateEndpoint: required('SUBSTRATE_ENDPOINT'),
  substrateAuthority: 'api.ate-system.svc',
  substrateCaFile: required('SUBSTRATE_CA_FILE'),
  substrateTokenFile: required('SUBSTRATE_TOKEN_FILE'),
  allowInsecureAx: Effect.runSync(
    Config.boolean('AX_ALLOW_INSECURE').pipe(Config.withDefault(false)),
  ),
  axCaFile: Effect.runSync(Config.string('AX_CA_FILE').pipe(Config.withDefault(''))) || undefined,
})

const bridge = createBridge(
  {
    scope: required('AX_SCOPE'),
    hostToken: required('AX_HOST_TOKEN'),
    capabilitySecret: required('AX_CAPABILITY_SECRET'),
    profiles: Schema.decodeSync(Schema.fromJsonString(Schema.Array(ProfileSchema)))(
      required('AX_PROFILES'),
    ),
    target: {
      id: required('LOOMS_CALLBACK_TARGET'),
      endpoint: required('LOOMS_URL'),
      readToken: required('LOOMS_READ_TOKEN'),
      workerToken: required('LOOMS_WORKER_TOKEN'),
    },
  },
  store,
  ax,
)

const abort = new AbortController()

const server = Bun.serve({
  port: Effect.runSync(Config.number('PORT').pipe(Config.withDefault(8789))),
  hostname: '0.0.0.0',
  maxRequestBodySize: 262_144,
  fetch: bridge.fetch,
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    void server.stop(true)
    abort.abort()
  })
}

try {
  await Effect.runPromise(
    Effect.forever(bridge.reconcile.pipe(Effect.andThen(Effect.sleep(1_000)))),
    { signal: abort.signal },
  )
} finally {
  ax.close()
  await store.close()
}
