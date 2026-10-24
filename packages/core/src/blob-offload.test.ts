import { describe, expect, test } from 'bun:test'

import { Effect, Option, Stream } from 'effect'

import { withBlobOffload } from './blob-offload'
import { BlobNotFoundError, memoryBlobStore } from './blob-store'
import { collectBlobDigests, expandBlobDigests, isBlobRef } from './blobs'
import { createEvent } from './envelope'
import { makeMemorySnapshotStore, snapshotStoreOf } from './snapshot-store'
import { emptyRunState } from './state'
import { makeMemoryEventStore } from './store'
import { isJsonObject, type JsonValue } from './types'

function started(runId: string, payload: JsonValue) {
  return createEvent(runId, {
    type: 'runtime.run.started',
    payload,
    threadId: null,
    origin: { type: 'system' },
  })
}

function firstDigest(value: JsonValue): string | undefined {
  if (isBlobRef(value)) {
    return value.sha256
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstDigest(item)

      if (found) {
        return found
      }
    }

    return undefined
  }

  if (isJsonObject(value)) {
    for (const child of Object.values(value)) {
      const found = firstDigest(child)

      if (found) {
        return found
      }
    }
  }

  return undefined
}

describe('blob offload', () => {
  test('keeps small JSON inline and resolves values over the threshold', async () => {
    const inner = await Effect.runPromise(makeMemoryEventStore)
    const blobs = memoryBlobStore()
    const store = withBlobOffload(inner, blobs, { thresholdBytes: 32 })
    const large = 'x'.repeat(80)

    await Effect.runPromise(store.append('run_small', [started('run_small', { n: 1 })]))

    await Effect.runPromise(store.append('run_large', [started('run_large', { blob: large })]))

    const small = await Effect.runPromise(inner.read('run_small'))
    expect(small[0]?.payload).toEqual({ n: 1 })
    expect(JSON.stringify(small)).not.toContain('"$looms"')

    const raw = await Effect.runPromise(inner.read('run_large'))
    expect(JSON.stringify(raw)).toContain('"$looms":"blob"')
    expect(JSON.stringify(raw)).not.toContain(large)

    const resolved = await Effect.runPromise(store.read('run_large'))
    expect(resolved[0]?.payload).toEqual({ blob: large })

    const live = await Effect.runPromise(
      store.subscribe('run_large', { fromSeq: 1 }).pipe(Stream.take(1), Stream.runCollect),
    )

    expect(live[0]?.payload).toEqual({ blob: large })
  })

  test('stores one body for the same bytes and deletes it only after every run releases it', async () => {
    const inner = await Effect.runPromise(makeMemoryEventStore)
    const blobs = memoryBlobStore()
    const store = withBlobOffload(inner, blobs, { thresholdBytes: 32 })
    const payload = { blob: 'x'.repeat(80) }

    await Effect.runPromise(store.append('run_a', [started('run_a', payload)]))
    await Effect.runPromise(store.append('run_b', [started('run_b', payload)]))

    const raw = await Effect.runPromise(inner.read('run_a'))
    const digest = firstDigest(raw[0]?.payload ?? null)

    expect(digest).toBeDefined()

    await Effect.runPromise(store.trim!('run_a', 10))

    const surviving = await Effect.runPromise(store.read('run_b'))
    expect(surviving[0]?.payload).toEqual(payload)

    await Effect.runPromise(store.trim!('run_b', 10))

    const missing = await Effect.runPromise(
      blobs.get(digest!).pipe(
        Effect.match({
          onFailure: (error) => error,
          onSuccess: () => null,
        }),
      ),
    )

    expect(missing).toBeInstanceOf(BlobNotFoundError)
  })

  test('deletes nested bodies when the parent reference is trimmed', async () => {
    const inner = await Effect.runPromise(makeMemoryEventStore)
    const blobs = memoryBlobStore()
    const store = withBlobOffload(inner, blobs, { thresholdBytes: 32, maxEventBytes: 200 })
    const text = 'y'.repeat(80)
    const payload = [text, text, text, text]

    await Effect.runPromise(store.append('run_nested', [started('run_nested', payload)]))

    const raw = await Effect.runPromise(inner.read('run_nested'))
    const seeds = new Set<string>()
    collectBlobDigests(raw[0]?.payload ?? null, seeds)

    const expanded = await Effect.runPromise(expandBlobDigests(blobs, seeds))
    expect(expanded.size).toBeGreaterThan(1)
    expect(isBlobRef(raw[0]?.payload ?? null)).toBe(true)

    const resolved = await Effect.runPromise(store.read('run_nested'))
    expect(resolved[0]?.payload).toEqual(payload)

    await Effect.runPromise(store.trim!('run_nested', 10))

    for (const digest of expanded) {
      const missing = await Effect.runPromise(
        blobs.get(digest).pipe(
          Effect.match({
            onFailure: (error) => error,
            onSuccess: () => null,
          }),
        ),
      )

      expect(missing).toBeInstanceOf(BlobNotFoundError)
    }
  })

  test('fails a read that names a missing blob and ignores a lookalike object', async () => {
    const inner = await Effect.runPromise(makeMemoryEventStore)
    const blobs = memoryBlobStore()
    const store = withBlobOffload(inner, blobs, { thresholdBytes: 32 })

    const lookalike = {
      $looms: 'blob',
      sha256: 'b'.repeat(64),
      bytes: 2,
      mediaType: 'application/json',
      extra: true,
    }

    await Effect.runPromise(
      inner.append('run_missing', [
        started('run_missing', {
          $looms: 'blob',
          sha256: 'a'.repeat(64),
          bytes: 2,
          mediaType: 'application/json',
        }),
      ]),
    )

    await Effect.runPromise(store.append('run_lookalike', [started('run_lookalike', lookalike)]))

    const missing = await Effect.runPromise(
      store.read('run_missing').pipe(
        Effect.match({
          onFailure: (error) => error,
          onSuccess: () => null,
        }),
      ),
    )

    expect(missing).toBeInstanceOf(Error)
    expect(String(missing)).toContain('was not found')

    const kept = await Effect.runPromise(store.read('run_lookalike'))
    expect(kept[0]?.payload).toEqual(lookalike)
  })

  test('offloads snapshot state and keeps those blobs when the log is trimmed', async () => {
    const inner = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)
    const blobs = memoryBlobStore()
    const store = withBlobOffload(inner, blobs, { snapshots, thresholdBytes: 32 })
    const saved = snapshotStoreOf(store)
    const large = 'z'.repeat(200)

    const state = {
      ...emptyRunState('run_snap'),
      startIdentity: {
        kind: 'workflow',
        definitionName: 'blob',
        definitionVersion: 'v1',
        input: { blob: large },
        requestedThreadId: null,
        idempotencyKey: null,
        rootThreadId: 'thr_root',
        launchedBy: null,
        correlationId: null,
      },
    }

    expect(saved).toBeDefined()

    await Effect.runPromise(
      saved!.save({
        runId: 'run_snap',
        cursor: 1,
        stateHash: 'hash',
        takenAt: 1,
        state,
      }),
    )

    const raw = await Effect.runPromise(snapshots.loadLatest('run_snap'))
    expect(Option.isSome(raw)).toBe(true)

    if (Option.isSome(raw)) {
      const encoded = JSON.stringify(raw.value.state)
      expect(encoded).toContain('"$looms":"blob"')
      expect(encoded).not.toContain(large)
    }

    const loaded = await Effect.runPromise(saved!.loadLatest('run_snap'))
    expect(Option.isSome(loaded)).toBe(true)

    if (Option.isSome(loaded)) {
      expect(loaded.value.state.startIdentity?.input).toEqual({ blob: large })
    }

    await Effect.runPromise(
      store.append('run_snap', [started('run_snap', { other: 'q'.repeat(80) })]),
    )

    await Effect.runPromise(store.trim!('run_snap', 10))

    const afterTrim = await Effect.runPromise(saved!.loadLatest('run_snap'))
    expect(Option.isSome(afterTrim)).toBe(true)

    if (Option.isSome(afterTrim)) {
      expect(afterTrim.value.state.startIdentity?.input).toEqual({ blob: large })
    }
  })
})
