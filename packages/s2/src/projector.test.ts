import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { createEvent } from '@looms/core'
import { bunSqliteEventStore } from '@looms/core/bun-sqlite'
import { withProjectors } from '@looms/projectors'

import { findS2Binary, startS2Lite } from './lite'
import { s2Projector } from './projector'
import { s2 } from './store'

const binary = findS2Binary({})

describe('s2Projector', () => {
  test.skipIf(!binary)('fans local appends out to an S2 stream', async () => {
    const lite = await startS2Lite()

    try {
      const config = {
        basin: 'projector-test',
        accessToken: 's2_local',
        endpoint: lite.endpoint,
      }

      const local = bunSqliteEventStore()
      const store = withProjectors(local, [s2Projector(config)])
      const runId = `run_proj_${Date.now()}`

      await Effect.runPromise(
        store.append(runId, [
          createEvent(runId, {
            type: 'runtime.run.started',
            payload: { rootThreadId: 't', kind: 'agent', definitionName: 'echo', input: 'hi' },
            threadId: null,
            origin: { type: 'system' },
          }),
          createEvent(runId, {
            type: 'runtime.thread.started',
            payload: { threadId: 't', kind: 'agent', definitionName: 'echo', input: 'hi' },
            threadId: 't',
            origin: { type: 'system' },
          }),
        ]),
      )

      const lake = s2(config)
      const projected = await Effect.runPromise(lake.read(runId))
      expect(projected).toHaveLength(2)
      expect(projected[0]?.type).toBe('runtime.run.started')
      expect(projected[1]?.type).toBe('runtime.thread.started')
    } finally {
      lite.stop()
    }
  })
})
