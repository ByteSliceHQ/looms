import { describe, expect, test } from 'bun:test'

import type { EventQuery, MessageBoard } from '../board'
import { createMemoryBoard } from '../memory-board'
import { followBoard, type BoardReader, type LiveBoard } from './board-reader'

const visible = () => Promise.resolve()

interface Recording {
  readonly reader: BoardReader
  readonly queries: EventQuery[]
}

/** A reader over `board` that records every query it answers. */
function recording(board: () => MessageBoard): Recording {
  const queries: EventQuery[] = []

  return {
    queries,
    reader: {
      events(query = {}) {
        queries.push(query)
        return board().events(query)
      },
    },
  }
}

async function until(check: () => boolean, what: string): Promise<void> {
  const deadline = Date.now() + 5_000

  while (Date.now() < deadline) {
    if (check()) {
      return
    }

    await Bun.sleep(5)
  }

  throw new Error(`timed out waiting until ${what}`)
}

function follow(reader: BoardReader, pollMs: number, pageSize?: number) {
  const controller = new AbortController()
  const seen: LiveBoard[] = []

  const done = followBoard(reader, 'ops', {
    pollMs,
    signal: controller.signal,
    whenVisible: visible,
    onChange: (live) => seen.push(live),
    pageSize,
  })

  return {
    seen,
    latest: () => seen.at(-1),
    stop: async () => {
      controller.abort()
      await done
    },
  }
}

describe('followBoard', () => {
  test('reads every page while more, from the start', async () => {
    const board = createMemoryBoard()

    for (const text of ['one', 'two', 'three', 'four', 'five']) {
      await board.post({ by: 'ada', channel: 'ops', text })
    }

    const { reader, queries } = recording(() => board)
    const live = follow(reader, 60_000, 2)

    await until(() => live.latest()?.board.events.length === 5, 'all five events were read')
    await live.stop()

    expect(queries[0]).toEqual({ limit: 2 })

    expect(queries.slice(0, 3).map((query) => query.after === undefined)).toEqual([
      true,
      false,
      false,
    ])

    expect(live.latest()?.board.board).toBe('ops')
    expect(live.latest()?.error).toBeNull()

    expect(
      live.latest()?.board.messageOrder.map((id) => live.latest()?.board.messages[id]?.text),
    ).toEqual(['one', 'two', 'three', 'four', 'five'])
  })

  test('polls after an empty page and picks up new events', async () => {
    const board = createMemoryBoard()
    await board.post({ by: 'ada', channel: 'ops', text: 'first' })

    const { reader, queries } = recording(() => board)
    const live = follow(reader, 10)

    await until(() => live.latest()?.board.events.length === 1, 'the first post was read')
    await until(() => queries.length >= 2, 'the board was polled again')

    const task = await board.createTask({ by: 'ada', channel: 'ops', text: 'later' })
    await board.claim({ by: 'fixer', task: task.id })

    await until(() => live.latest()?.board.events.length === 3, 'the later events were read')
    await live.stop()

    const latest = live.latest()?.board

    expect(latest?.taskOrder).toEqual([task.id])
    expect(latest?.tasks[task.id]?.state).toBe('claimed')
    expect(new Set(latest?.events.map((event) => event.cursor)).size).toBe(3)
  })

  test('starts over from the beginning when the cursor is unknown', async () => {
    const before = createMemoryBoard()
    await before.post({ by: 'ada', channel: 'ops', text: 'old' })
    await before.post({ by: 'ada', channel: 'ops', text: 'older' })

    let current = before
    const { reader, queries } = recording(() => current)
    const live = follow(reader, 10)

    await until(() => live.latest()?.board.events.length === 2, 'the old log was read')

    // The board was made again: its log does not know the cursor the reader holds.
    const again = createMemoryBoard()
    await again.post({ by: 'ada', channel: 'ops', text: 'fresh' })
    current = again

    await until(
      () => live.latest()?.board.events.length === 1 && queries.length > 2,
      'the new log was read from the start',
    )

    await live.stop()

    const latest = live.latest()?.board

    expect(latest?.messageOrder.map((id) => latest.messages[id]?.text)).toEqual(['fresh'])

    expect(live.seen.some((seen) => seen.board.events.length === 0 && seen.error === null)).toBe(
      true,
    )

    expect(live.seen.every((seen) => seen.error === null)).toBe(true)
  })

  test('reports any other failure and keeps the board it had', async () => {
    const board = createMemoryBoard()
    await board.post({ by: 'ada', channel: 'ops', text: 'kept' })

    let failing = false

    const reader: BoardReader = {
      events(query) {
        return failing ? Promise.reject(new Error('board offline')) : board.events(query)
      },
    }

    const live = follow(reader, 5)

    await until(() => live.latest()?.board.events.length === 1, 'the post was read')
    failing = true
    await until(() => live.latest()?.error === 'board offline', 'the failure was reported')

    expect(live.latest()?.board.events.length).toBe(1)

    failing = false
    await until(() => live.latest()?.error === null, 'the board recovered')
    await live.stop()
  })

  test('stops reading once aborted', async () => {
    const board = createMemoryBoard()
    const { reader, queries } = recording(() => board)
    const live = follow(reader, 5)

    await until(() => queries.length >= 2, 'the board was polled')
    await live.stop()

    const reads = queries.length
    const changes = live.seen.length

    await board.post({ by: 'ada', channel: 'ops', text: 'after unmount' })
    await Bun.sleep(40)

    expect(queries.length).toBe(reads)
    expect(live.seen.length).toBe(changes)
  })
})
