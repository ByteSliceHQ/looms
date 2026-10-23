import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { blobStoreFromBytes, sha256Hex, type BlobBytes } from './blob-store'

interface Recorded {
  readonly bytes: BlobBytes
  readonly objects: Map<string, Uint8Array>
  readonly reads: string[]
  onRemove?: (key: string) => void
}

function recordedBytes(): Recorded {
  const objects = new Map<string, Uint8Array>()
  const reads: string[] = []

  const recorded: Recorded = {
    objects,
    reads,
    bytes: {
      read: (key) =>
        Effect.sync(() => {
          reads.push(key)
          return objects.get(key) ?? null
        }),
      write: (key, body) =>
        Effect.sync(() => {
          objects.set(key, body)
        }),
      remove: (key) =>
        Effect.sync(() => {
          objects.delete(key)
          recorded.onRemove?.(key)
        }),
      exists: (key) => Effect.sync(() => objects.has(key)),
      list: (prefix) =>
        Effect.sync(() => [...objects.keys()].filter((key) => key.startsWith(prefix))),
    },
  }

  return recorded
}

const body = new TextEncoder().encode('"a large string"')
const digest = await Effect.runPromise(sha256Hex(body))
const objectKey = `objects/${digest}`

describe('blob references', () => {
  test('a shared body survives until the last run drops it', async () => {
    const recorded = recordedBytes()
    const blobs = blobStoreFromBytes(recorded.bytes)

    await Effect.runPromise(blobs.put(digest, body))
    await Effect.runPromise(blobs.retain('run-a', [digest]))
    await Effect.runPromise(blobs.retain('run-b', [digest]))
    await Effect.runPromise(blobs.replaceRefs('run-a', new Set()))

    expect(recorded.objects.has(objectKey)).toBe(true)

    await Effect.runPromise(blobs.replaceRefs('run-b', new Set()))

    expect([...recorded.objects.keys()].filter((key) => key.includes(digest))).toEqual([])
  })

  test('dropping a reference never reads another run', async () => {
    const recorded = recordedBytes()
    const blobs = blobStoreFromBytes(recorded.bytes)

    await Effect.runPromise(blobs.put(digest, body))

    for (const runId of ['run-a', 'run-b', 'run-c', 'run-d']) {
      await Effect.runPromise(blobs.retain(runId, [digest]))
    }

    recorded.reads.length = 0
    await Effect.runPromise(blobs.replaceRefs('run-a', new Set()))

    expect(recorded.reads).toEqual(['runs/run-a'])
  })

  test('a reference recorded after the body was deleted fails so the append can retry', async () => {
    const recorded = recordedBytes()
    const blobs = blobStoreFromBytes(recorded.bytes)

    await Effect.runPromise(blobs.put(digest, body))
    await Effect.runPromise(blobs.retain('run-a', [digest]))
    await Effect.runPromise(blobs.put(digest, body))
    await Effect.runPromise(blobs.replaceRefs('run-a', new Set()))

    const failed = await Effect.runPromise(Effect.flip(blobs.retain('run-b', [digest])))

    expect(failed.message).toContain('retry the append')

    await Effect.runPromise(blobs.put(digest, body))
    await Effect.runPromise(blobs.retain('run-b', [digest]))

    expect(recorded.objects.has(objectKey)).toBe(true)
  })

  test('a body deleted while another run references it is put back', async () => {
    const recorded = recordedBytes()
    const blobs = blobStoreFromBytes(recorded.bytes)

    await Effect.runPromise(blobs.put(digest, body))
    await Effect.runPromise(blobs.retain('run-a', [digest]))

    recorded.onRemove = (key) => {
      if (key === objectKey) {
        recorded.objects.set(`refs/${digest}/run-b`, new Uint8Array(0))
      }
    }

    await Effect.runPromise(blobs.replaceRefs('run-a', new Set()))

    expect(recorded.objects.get(objectKey)).toEqual(body)
  })
})
