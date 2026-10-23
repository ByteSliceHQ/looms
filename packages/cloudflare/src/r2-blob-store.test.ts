import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { isBlobRef, isJsonObject, offloadJson, resolveJson } from '@looms/core'

import { r2BlobStore, type R2BucketLike, type R2ListResult } from './r2-blob-store'

function fakeBucket(): R2BucketLike & { readonly keys: () => string[] } {
  const objects = new Map<string, Uint8Array>()

  return {
    keys: () => [...objects.keys()],

    put: (key, value) => {
      objects.set(key, value.slice())
      return Promise.resolve({ key })
    },

    get: (key) => {
      const body = objects.get(key)

      if (!body) {
        return Promise.resolve(null)
      }

      const copy = body.slice()

      return Promise.resolve({
        arrayBuffer: () =>
          Promise.resolve(copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength)),
      })
    },

    delete: (key) => {
      objects.delete(key)
      return Promise.resolve(undefined)
    },

    list: (options) => {
      const prefix = options?.prefix ?? ''
      const keys = [...objects.keys()].filter((key) => key.startsWith(prefix)).toSorted()
      const start = options?.cursor === undefined ? 0 : Number(options.cursor)
      const page = keys.slice(start, start + 1)
      const next = start + page.length
      const truncated = next < keys.length

      const result: R2ListResult = {
        objects: page.map((key) => ({ key })),
        truncated,
      }

      if (truncated) {
        return Promise.resolve({ ...result, cursor: String(next) })
      }

      return Promise.resolve(result)
    },
  }
}

describe('r2BlobStore', () => {
  test('pages the bucket and resolves an offloaded value', async () => {
    const bucket = fakeBucket()
    const blobs = r2BlobStore(bucket)
    const value = { text: 'q'.repeat(80) }
    const stored = await Effect.runPromise(offloadJson(value, blobs, { thresholdBytes: 16 }))
    const text = isJsonObject(stored) ? stored.text : undefined

    if (text === undefined || !isBlobRef(text)) {
      throw new Error('expected the string to be stored by hash')
    }

    await Effect.runPromise(blobs.retain('run-a', [text.sha256]))
    await Effect.runPromise(blobs.retain('run-b', [text.sha256]))
    await Effect.runPromise(blobs.replaceRefs('run-a', new Set()))

    const resolved = await Effect.runPromise(resolveJson(stored, blobs))

    expect(resolved).toEqual(value)
    expect(bucket.keys().length).toBeGreaterThan(1)
  })
})
