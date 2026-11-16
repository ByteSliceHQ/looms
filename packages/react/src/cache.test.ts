import { describe, expect, test } from 'bun:test'

import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'

import type { EventEnvelope } from '@looms/core'

import { indexedDbEventCache } from './cache'

// The adapter builds key ranges with the global, as a browser provides it.
globalThis.IDBKeyRange = IDBKeyRange

function event(seq: number, runId = 'run_1'): EventEnvelope {
  return {
    id: `evt_${runId}_${seq}`,
    runId,
    seq,
    ts: 1_700_000_000_000 + seq,
    type: 'test.tick',
    payload: { n: seq },
    threadId: 'thr_1',
    origin: { type: 'external', actorId: 'user_1' },
    idempotencyKey: `key_${seq}`,
  }
}

describe('indexedDbEventCache', () => {
  test('returns what was appended, in order, with the fields a store relies on', async () => {
    const cache = indexedDbEventCache({ indexedDB: new IDBFactory() })

    await cache.append('a', [event(2), event(1)])
    await cache.append('a', [event(3)])
    await cache.append('b', [event(1, 'run_2')])

    const kept = await cache.load('a')

    expect(kept.map((item) => item.seq)).toEqual([1, 2, 3])

    expect(kept[0]).toMatchObject({
      id: 'evt_run_1_1',
      runId: 'run_1',
      payload: { n: 1 },
      origin: { type: 'external', actorId: 'user_1' },
      idempotencyKey: 'key_1',
    })

    expect((await cache.load('b')).map((item) => item.runId)).toEqual(['run_2'])
    expect(await cache.load('never')).toEqual([])
  })

  test('clear forgets one key and leaves the others', async () => {
    const cache = indexedDbEventCache({ indexedDB: new IDBFactory() })

    await cache.append('a', [event(1)])
    await cache.append('b', [event(1)])
    await cache.clear('a')

    expect(await cache.load('a')).toEqual([])
    expect(await cache.load('b')).toHaveLength(1)
  })

  test('keeps only the most recently opened runs', async () => {
    const cache = indexedDbEventCache({ indexedDB: new IDBFactory(), maxRuns: 2 })

    await cache.append('a', [event(1)])
    await Bun.sleep(5)
    await cache.append('b', [event(1)])
    await Bun.sleep(5)
    await cache.append('c', [event(1)])

    // Loading evicts in the background.
    await cache.load('c')
    await Bun.sleep(30)

    expect(await cache.load('a')).toEqual([])
    expect(await cache.load('b')).toHaveLength(1)
    expect(await cache.load('c')).toHaveLength(1)
  })

  test('is an empty cache where there is no IndexedDB', async () => {
    // Bun has no `indexedDB` global, which is the host this stands for.
    expect(globalThis.indexedDB).toBeUndefined()

    const cache = indexedDbEventCache()

    await cache.append('a', [event(1)])
    expect(await cache.load('a')).toEqual([])
  })
})
