import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import {
  makeMemoryEventStore,
  type DefinitionResolver,
  type RunSummary,
  type SnapshotStore,
} from '@looms/core'
import { createLooms } from '@looms/runtime'

import { defineSchedule } from './definitions'
import { schedule } from './module'
import { every } from './specs'

function discardingSnapshots(): SnapshotStore {
  const headers: RunSummary[] = []

  return {
    loadLatest: () => Effect.succeedNone,
    save: () => Effect.void,
    saveHeader: (header) =>
      Effect.sync(() => {
        const index = headers.findIndex((item) => item.runId === header.runId)

        if (index >= 0) {
          headers[index] = header
          return
        }

        headers.push(header)
      }),
    get listHeaders() {
      return Effect.succeed(headers)
    },
  }
}

describe('schedule definition resolver', () => {
  test('replay reads misfire from the resolved definition', async () => {
    const nightly = defineSchedule({
      name: 'nightly',
      version: 'v3',
      target: { kind: 'workflow', name: 'job', version: 'v1' },
      spec: every(1),
      misfire: 'skip',
    })

    const resolver: DefinitionResolver = {
      peek: () => undefined,
      resolve: (kind, name, version) =>
        Effect.succeed(
          kind === 'schedule' && name === 'nightly' && version === 'v3' ? nightly : undefined,
        ),
    }

    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = discardingSnapshots()

    const looms = createLooms({
      modules: [schedule({ minIntervalMs: 60_000 })],
      store,
      snapshotStore: snapshots,
      definitionResolver: resolver,
      rescanTimers: false,
    })

    try {
      const started = await looms.start(nightly, null, { runId: 'nightly' })
      const thread = Object.values(started.state.threads).find((item) => item.kind === 'schedule')
      expect(thread?.state).toMatchObject({ misfire: 'skip' })

      const reloaded = createLooms({
        modules: [schedule({ minIntervalMs: 60_000 })],
        store,
        snapshotStore: snapshots,
        definitionResolver: resolver,
        rescanTimers: false,
      })

      try {
        const state = await reloaded.getRun('nightly')
        const replayed = Object.values(state.threads).find((item) => item.kind === 'schedule')
        expect(replayed?.state).toMatchObject({ misfire: 'skip' })
      } finally {
        await reloaded.stop()
      }
    } finally {
      await looms.stop()
    }
  })
})
