import { describe, expect, test } from 'bun:test'

import { Effect, Exit } from 'effect'

import { assertSnapshotByteLimit, utf8JsonBytes } from './limits'
import { buildSnapshotMarker } from './snapshots'
import { emptyRunState } from './state'
import { makeMemoryEventStore, trimEventStoreSafely } from './store'

describe('storage byte and compaction safety', () => {
  test('rejects an oversized UTF-8 event before append', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const exit = await Effect.runPromise(
      Effect.exit(
        store.append('run_limit', [
          {
            type: 'test.large',
            payload: { text: '🧵'.repeat(300_000) },
            threadId: null,
            eventId: 'evt_limit',
            timestamp: 1,
            origin: { type: 'system' },
          },
        ]),
      ),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    expect(await Effect.runPromise(store.tail('run_limit'))).toBe(0)
  })

  test('snapshot size uses UTF-8 bytes and a stable named error', () => {
    const snapshot = {
      runId: 'run_snapshot_limit',
      cursor: 1,
      stateHash: 'hash',
      takenAt: 1,
      state: emptyRunState('🧵'.repeat(10)),
    }

    expect(() => assertSnapshotByteLimit(snapshot, 20)).toThrow('SnapshotPayloadTooLarge')
  })

  test('inline snapshot state is limited by UTF-8 bytes, not string length', () => {
    const state = emptyRunState('🧵'.repeat(100))
    const characters = JSON.stringify(state).length

    expect(utf8JsonBytes(state)).toBeGreaterThan(characters)

    const marker = buildSnapshotMarker('run_inline', 1, 'hash', {
      state,
      maxInlineBytes: characters,
    })

    expect(marker.payload).toEqual({ seq: 1, stateHash: 'hash' })
  })

  test('rejects projector coverage missing a required identity', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const result = await Effect.runPromise(
      Effect.exit(
        trimEventStoreSafely(store, 'run_trim', 2, {
          requiredProjectors: ['search', 'audit'],
          projectorCursors: { search: 1 },
        }),
      ),
    )

    expect(Exit.isFailure(result)).toBe(true)
  })

  test('rejects lagging required projector coverage', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const result = await Effect.runPromise(
      Effect.exit(
        trimEventStoreSafely(store, 'run_trim', 3, {
          requiredProjectors: ['search', 'audit'],
          projectorCursors: { search: 2, audit: 1 },
        }),
      ),
    )

    expect(Exit.isFailure(result)).toBe(true)
  })

  test('accepts complete required projector coverage', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    await Effect.runPromise(
      trimEventStoreSafely(store, 'run_trim', 3, {
        requiredProjectors: ['search', 'audit'],
        projectorCursors: { search: 2, audit: 4 },
      }),
    )
  })

  test('rejects an empty required projector set', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const result = await Effect.runPromise(
      Effect.exit(
        trimEventStoreSafely(store, 'run_trim', 2, {
          requiredProjectors: [],
          projectorCursors: {},
        }),
      ),
    )

    expect(Exit.isFailure(result)).toBe(true)
  })

  test('accepts archive coverage through the trim point', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    await Effect.runPromise(trimEventStoreSafely(store, 'run_trim', 2, { archiveCursor: 1 }))
  })
})
