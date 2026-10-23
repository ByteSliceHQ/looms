import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import {
  makeMemoryEventStore,
  type DefinitionResolver,
  type RunSummary,
  type SnapshotStore,
} from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { UnknownDefinitionError } from './helpers'
import { createLooms } from './looms'

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

describe('definition resolver', () => {
  test('runs a workflow supplied by the host and resolves it again on replay', async () => {
    const dynamic = defineWorkflow({
      name: 'dynamic',
      version: 'v2',
      nodes: [{ id: 'n', run: () => 'ok' }],
    })

    let calls = 0

    const resolver: DefinitionResolver = {
      peek: () => undefined,
      resolve: (kind, name, version) =>
        Effect.sync(() => {
          calls += 1

          if (kind === 'workflow' && name === 'dynamic' && version === 'v2') {
            return dynamic
          }

          return undefined
        }),
    }

    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = discardingSnapshots()

    const looms = createLooms({
      modules: [workflow()],
      store,
      snapshotStore: snapshots,
      definitionResolver: resolver,
      rescanTimers: false,
    })

    try {
      const started = await looms.start(dynamic, null, { runId: 'dyn' })
      expect(started.state.status).toBe('completed')
      expect(started.state.startIdentity?.definitionVersion).toBe('v2')
      const afterStart = calls

      const reloaded = createLooms({
        modules: [workflow()],
        store,
        snapshotStore: snapshots,
        definitionResolver: resolver,
        rescanTimers: false,
      })

      try {
        const state = await reloaded.getRun('dyn')
        expect(state.status).toBe('completed')
        expect(state.startIdentity?.definitionVersion).toBe('v2')
        expect(calls).toBeGreaterThan(afterStart)
      } finally {
        await reloaded.stop()
      }
    } finally {
      await looms.stop()
    }
  })

  test('rejects an unknown definition before writing events', async () => {
    const missing = defineWorkflow({
      name: 'missing',
      nodes: [{ id: 'n', run: () => null }],
    })

    const store = await Effect.runPromise(makeMemoryEventStore)

    const looms = createLooms({
      modules: [workflow()],
      store,
      rescanTimers: false,
    })

    try {
      const outcome = await looms.start(missing, null, { runId: 'missing' }).then(
        () => undefined,
        (cause: unknown) => cause,
      )

      expect(outcome).toBeInstanceOf(UnknownDefinitionError)

      const events = await Effect.runPromise(store.read('missing'))
      expect(events).toHaveLength(0)
    } finally {
      await looms.stop()
    }
  })
})
