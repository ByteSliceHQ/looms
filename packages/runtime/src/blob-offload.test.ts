import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import {
  EventPayloadTooLargeError,
  makeMemoryEventStore,
  makeMemorySnapshotStore,
  memoryBlobStore,
} from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLooms } from './looms'

const echo = defineWorkflow({
  name: 'blob-echo',
  nodes: [{ id: 'done', run: () => null }],
})

describe('createLooms blob offload', () => {
  test('rejects an event over 1 MiB when no blob store is configured', async () => {
    const looms = createLooms({ modules: [workflow({ definitions: [echo] })] })
    const input = { blob: 'x'.repeat(1_500_000) }

    const error = await looms.start(echo, input, { runId: 'too-big' }).then(
      () => null,
      (cause) => cause,
    )

    expect(error).toBeInstanceOf(EventPayloadTooLargeError)
    await looms.stop()
  })

  test('runs a payload over the event limit and reloads it from the offloaded snapshot', async () => {
    const inner = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)
    const blobs = memoryBlobStore()
    const large = 'x'.repeat(1_500_000)
    const input = { blob: large }

    const looms = createLooms({
      modules: [workflow({ definitions: [echo] })],
      store: inner,
      snapshotStore: snapshots,
      blobStore: blobs,
    })

    try {
      const started = await looms.start(echo, input, { runId: 'big' })
      expect(started.state.status).toBe('completed')
      expect(started.state.startIdentity?.input).toEqual(input)

      const rawEvents = JSON.stringify(await Effect.runPromise(inner.read('big')))
      expect(rawEvents).toContain('"$looms":"blob"')
      expect(rawEvents).not.toContain(large)

      const rawSnapshot = await Effect.runPromise(snapshots.loadLatest('big'))
      expect(JSON.stringify(rawSnapshot)).toContain('"$looms":"blob"')
      expect(JSON.stringify(rawSnapshot)).not.toContain(large)

      const events = await looms.getEvents('big')
      expect(JSON.stringify(events)).toContain(large)
    } finally {
      await looms.stop()
    }

    const reloaded = createLooms({
      modules: [workflow({ definitions: [echo] })],
      store: inner,
      snapshotStore: snapshots,
      blobStore: blobs,
      rescanTimers: false,
    })

    try {
      const state = await reloaded.getRun('big')
      expect(state.startIdentity?.input).toEqual(input)
    } finally {
      await reloaded.stop()
    }
  })
})
