import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { storeOptions } from '@livestore/livestore'
import { schema } from './livestore-schema'
import { createLoomsSyncBackend } from './sync-backend'

export type ActorStoreOptionsConfig = {
  /**
   * LiveStore sync endpoint. Defaults to same-origin `/api/livestore`
   * (typical when the Looms host is proxied by the app).
   */
  endpoint?: string
}

/** Build per-actor `storeOptions` for the opinionated Looms LiveStore schema. */
export function actorStoreOptions(actorId: string, config: ActorStoreOptionsConfig = {}) {
  const endpoint = config.endpoint ?? '/api/livestore'
  return storeOptions({
    storeId: actorId,
    schema,
    adapter: makeInMemoryAdapter({
      sync: {
        backend: createLoomsSyncBackend({
          endpoint,
        }),
      },
    }),
  })
}
