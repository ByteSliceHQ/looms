import { Effect } from 'effect'

import type { EventEnvelope } from '@looms/core'
import type { Projector } from '@looms/projectors'

import { S2ConfigSchema, s2ConfigFromEnv, streamNameForRun, type S2Config } from './config'
import { s2 } from './store'

export { S2ConfigSchema, s2ConfigFromEnv, streamNameForRun, type S2Config }

/**
 * Asynchronous S2 projector. The actor's local EventStore stays authoritative;
 * this fans committed events out to `runs/{runId}` for the global stream lake.
 */
export function s2Projector(config: S2Config): Projector {
  const store = s2(config)

  return {
    name: 's2',
    version: '1',
    project: (events) => {
      if (events.length === 0) {
        return Promise.resolve()
      }

      const byRun = new Map<string, EventEnvelope[]>()

      for (const event of events) {
        const batch = byRun.get(event.runId) ?? []
        batch.push(event)
        byRun.set(event.runId, batch)
      }

      return Effect.runPromise(
        Effect.forEach(byRun, ([runId, batch]) => store.append(runId, batch), {
          discard: true,
        }),
      )
    },
  }
}
