import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { Schema } from 'effect'

import {
  assertCorpusEntry,
  corpusRegistry,
  readCorpusEntry,
  type CorpusEntry,
} from './replay-corpus'

const decodeJson = Schema.decodeUnknownOption(Schema.Json)

async function loadCorpus(): Promise<ReadonlyArray<CorpusEntry>> {
  const directory = join(import.meta.dir, '..', 'corpus')
  const listing = await Array.fromAsync(new Bun.Glob('*.json').scan({ cwd: directory }))

  return Promise.all(
    listing.toSorted().map(async (name) => {
      const file = Bun.file(join(directory, name))
      const decoded = decodeJson(await file.json())

      if (decoded._tag === 'None') {
        throw new Error(`corpus fixture ${name} is not JSON`)
      }

      return readCorpusEntry(decoded.value)
    }),
  )
}

describe('upgrade-safety replay corpus', () => {
  test('every recorded log folds deterministically to its stored state hash', async () => {
    const corpus = await loadCorpus()
    const registry = corpusRegistry()

    expect(corpus.map((entry) => entry.name)).toEqual([
      'happy-path',
      'parked-for-approval',
      'rejected-approval',
    ])

    for (const entry of corpus) {
      const state = assertCorpusEntry(entry, registry)

      expect(state.runId).toBe(entry.runId)
      expect(entry.events.length).toBeGreaterThan(0)
    }
  })
})
