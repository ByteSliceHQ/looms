import { describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Effect } from 'effect'

import { offloadJson, resolveJson } from '@looms/core'

import { filesystemBlobStore } from './filesystem-blob-store'

describe('filesystemBlobStore', () => {
  test('round-trips an offloaded value', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'looms-blobs-'))

    try {
      const blobs = filesystemBlobStore(directory)
      const value = { text: 'z'.repeat(100) }
      const stored = await Effect.runPromise(offloadJson(value, blobs, { thresholdBytes: 16 }))
      const resolved = await Effect.runPromise(resolveJson(stored, blobs))

      expect(resolved).toEqual(value)
      expect(JSON.stringify(stored)).toContain('"$looms":"blob"')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
