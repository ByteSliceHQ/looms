import postgres from 'postgres'

import type { ReplicaView } from '@looms/northline/http'
import { postgresReplica, type PostgresReplica, type ReplicaStatus } from '@swirls/looms/replica'

export interface ReplicaEnv {
  readonly NORTHLINE_DB?: { readonly connectionString: string }
  readonly DATABASE_URL?: string
}

let cached: { readonly key: string; readonly replica: PostgresReplica } | undefined

/**
 * The event copy, when this isolate has a database. Hyperdrive wins over a direct URL.
 * `verify` refuses to project until `looms replica migrate` has applied ./migrations.
 */
export function eventReplica(env: ReplicaEnv): PostgresReplica | undefined {
  const hyperdrive = env.NORTHLINE_DB?.connectionString

  if (hyperdrive) {
    return remember(`hd:${hyperdrive}`, () =>
      postgresReplica({
        sql: postgres(hyperdrive, { prepare: false }),
        migrate: 'verify',
      }),
    )
  }

  const url = env.DATABASE_URL

  if (!url) {
    return undefined
  }

  return remember(`url:${url}`, () => postgresReplica({ url, migrate: 'verify' }))
}

export function replicaView(env: ReplicaEnv, runId: string): Promise<ReplicaView> {
  const replica = eventReplica(env)

  if (!replica) {
    return Promise.resolve({ attached: false, copy: null })
  }

  return replica.status(runId).then(
    (status) => ({ attached: true, copy: status ? copyOf(status) : null }),
    () => ({ attached: true, copy: null }),
  )
}

function remember(key: string, create: () => PostgresReplica): PostgresReplica {
  if (cached?.key === key) {
    return cached.replica
  }

  const replica = create()
  cached = { key, replica }
  return replica
}

function copyOf(status: ReplicaStatus): ReplicaView['copy'] {
  return {
    replicatedSeq: status.replicatedSeq,
    finished: status.finished,
    complete: status.complete,
    purgedAt: status.purgedAt,
  }
}
