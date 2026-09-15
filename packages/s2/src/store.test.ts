import { describe, expect, test } from 'bun:test'

import { Effect, Stream } from 'effect'

import { createEvent } from '@looms/core'

import { findS2Binary, startS2Lite } from './lite'
import { paginateS2Stream, readAllPages, s2, type S2ReadBatchLike } from './store'

interface TestRecord {
  readonly seqNum: number
  readonly body: string
}

describe('readAllPages', () => {
  test('reads all pages until tail is reached across multiple chunks', async () => {
    const total = 2500

    const records: TestRecord[] = Array.from({ length: total }, (_, i) => ({
      seqNum: i,
      body: JSON.stringify({ index: i }),
    }))

    const fetchedCounts: number[] = []

    const fetchPage = async (
      cursor: number,
      count: number,
    ): Promise<S2ReadBatchLike<TestRecord> | null> => {
      fetchedCounts.push(count)
      const slice = records.slice(cursor, cursor + count)
      return {
        records: slice,
        tail: { seqNum: total },
      }
    }

    const result = await readAllPages(fetchPage, { maxPageSize: 1000 })
    expect(result.length).toBe(total)
    expect(result[0]?.seqNum).toBe(0)
    expect(result[result.length - 1]?.seqNum).toBe(total - 1)
    expect(fetchedCounts[0]).toBe(1000)
    expect(fetchedCounts.length).toBeGreaterThanOrEqual(3)
  })

  test('does not stop when a page is shortened due to byte size limit', async () => {
    const total = 1200

    const records: TestRecord[] = Array.from({ length: total }, (_, i) => ({
      seqNum: i,
      body: JSON.stringify({ index: i }),
    }))

    // Simulate S2 returning 250 records per call due to 1 MiB byte cap even when 1000 requested
    const fetchPage = async (
      cursor: number,
      count: number,
    ): Promise<S2ReadBatchLike<TestRecord> | null> => {
      const actualCount = Math.min(count, 250)
      const slice = records.slice(cursor, cursor + actualCount)
      return {
        records: slice,
        tail: { seqNum: total },
      }
    }

    const result = await readAllPages(fetchPage, { maxPageSize: 1000 })
    expect(result.length).toBe(total)
    expect(result[0]?.seqNum).toBe(0)
    expect(result[result.length - 1]?.seqNum).toBe(total - 1)
  })

  test('does not treat a byte-capped batch tail as the stream tail', async () => {
    const total = 40

    const records: TestRecord[] = Array.from({ length: total }, (_, i) => ({
      seqNum: i,
      body: JSON.stringify({ index: i }),
    }))

    const fetchPage = async (
      cursor: number,
      count: number,
    ): Promise<S2ReadBatchLike<TestRecord> | null> => {
      const actualCount = Math.min(count, 8)
      const slice = records.slice(cursor, cursor + actualCount)
      const last = slice[slice.length - 1]
      return {
        records: slice,
        tail: { seqNum: last ? last.seqNum + 1 : cursor },
      }
    }

    const result = await readAllPages(fetchPage, { maxPageSize: 1000 })
    expect(result.length).toBe(total)
    expect(result[result.length - 1]?.seqNum).toBe(total - 1)
  })

  test('honors limit when smaller than a single page', async () => {
    const total = 500

    const records: TestRecord[] = Array.from({ length: total }, (_, i) => ({
      seqNum: i,
      body: JSON.stringify({ index: i }),
    }))

    const fetchPage = async (
      cursor: number,
      count: number,
    ): Promise<S2ReadBatchLike<TestRecord> | null> => {
      const slice = records.slice(cursor, cursor + count)
      return {
        records: slice,
        tail: { seqNum: total },
      }
    }

    const result = await readAllPages(fetchPage, { limit: 50, maxPageSize: 1000 })
    expect(result.length).toBe(50)
    expect(result[result.length - 1]?.seqNum).toBe(49)
  })

  test('honors limit across multiple pages', async () => {
    const total = 3000

    const records: TestRecord[] = Array.from({ length: total }, (_, i) => ({
      seqNum: i,
      body: JSON.stringify({ index: i }),
    }))

    const fetchedCounts: number[] = []

    const fetchPage = async (
      cursor: number,
      count: number,
    ): Promise<S2ReadBatchLike<TestRecord> | null> => {
      fetchedCounts.push(count)
      const slice = records.slice(cursor, cursor + count)
      return {
        records: slice,
        tail: { seqNum: total },
      }
    }

    const result = await readAllPages(fetchPage, { limit: 1500, maxPageSize: 1000 })
    expect(result.length).toBe(1500)
    expect(result[result.length - 1]?.seqNum).toBe(1499)
    expect(fetchedCounts).toEqual([1000, 500])
  })

  test('returns empty array when stream is empty or returns null', async () => {
    const nullFetch = async () => null
    const emptyFetch = async () => ({ records: [], tail: { seqNum: 0 } })

    const fromNull = await readAllPages(nullFetch)
    expect(fromNull).toEqual([])

    const fromEmpty = await readAllPages(emptyFetch)
    expect(fromEmpty).toEqual([])
  })

  test('filters out records before fromSeq', async () => {
    const total = 50

    const records: TestRecord[] = Array.from({ length: total }, (_, i) => ({
      seqNum: i,
      body: JSON.stringify({ index: i }),
    }))

    // Simulate clamp starting from earlier position (index 10 instead of 20)
    const fetchPage = async (cursor: number): Promise<S2ReadBatchLike<TestRecord> | null> => {
      if (cursor > 20) {
        return { records: [], tail: { seqNum: total } }
      }

      return {
        records: records.slice(10, 50),
        tail: { seqNum: total },
      }
    }

    const result = await readAllPages(fetchPage, { fromSeq: 20, maxPageSize: 1000 })
    expect(result.length).toBe(30)
    expect(result[0]?.seqNum).toBe(20)
    expect(result[result.length - 1]?.seqNum).toBe(49)
  })

  test('paginateS2Stream yields records as an interruptible Stream', async () => {
    let pagesFetched = 0

    const stream = paginateS2Stream(
      (cursor, count) =>
        Effect.sync(() => {
          pagesFetched += 1

          const records: TestRecord[] = Array.from({ length: count }, (_, i) => ({
            seqNum: cursor + i,
            body: JSON.stringify({ index: cursor + i }),
          }))

          return { records, tail: { seqNum: 10000 } }
        }),
      { limit: 25, maxPageSize: 10 },
    )

    const collected = await Effect.runPromise(Stream.runCollect(stream))
    expect(collected.length).toBe(25)
    expect(collected[0]?.seqNum).toBe(0)
    expect(collected[24]?.seqNum).toBe(24)
    expect(pagesFetched).toBe(3)
  })
})

describe('S2 integration with s2-lite (if binary present)', () => {
  const binary = findS2Binary({})

  test.skipIf(!binary)('reads more than 1000 events without truncation', async () => {
    const lite = await startS2Lite()

    try {
      const store = s2({
        basin: 'pagination-test',
        accessToken: 's2_local',
        endpoint: lite.endpoint,
      })

      const runId = `run_paginate_${Date.now()}`
      const totalEvents = 1050

      const events = Array.from({ length: totalEvents }, (_, i) =>
        createEvent(runId, {
          type: 'test.event',
          payload: { index: i },
        }),
      )

      // Append in batches of 500 to stay under append limits
      for (let i = 0; i < events.length; i += 500) {
        const batch = events.slice(i, i + 500)
        await Effect.runPromise(store.append(runId, batch))
      }

      const tail = await Effect.runPromise(store.tail(runId))
      expect(tail).toBe(totalEvents)

      const readBack = await Effect.runPromise(store.read(runId))
      expect(readBack.length).toBe(totalEvents)
      expect(readBack[readBack.length - 1]?.seq).toBe(totalEvents)

      // Verify readStream returns the exact same events
      const streamed = await Effect.runPromise(Stream.runCollect(store.readStream!(runId)))
      expect(streamed.length).toBe(totalEvents)
      expect(streamed[streamed.length - 1]?.seq).toBe(totalEvents)
    } finally {
      lite.stop()
    }
  })
})
