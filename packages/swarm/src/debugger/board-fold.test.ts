import { beforeAll, describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { foldLive } from '@looms/react'

import type { BoardEvent, BoardMessage, BoardTask } from '../board'
import { BoardPulledPayloadSchema } from '../events'
import {
  applyEvents,
  boardTaskGroups,
  boardThreads,
  emptyBoard,
  swarmBoard,
  type SwarmBoard,
} from './board-fold'
import { recordSwarmRun, type RecordedSwarmRun } from './recorded-run.fixture'

const decodePulled = Schema.decodeUnknownSync(BoardPulledPayloadSchema)

let recorded: RecordedSwarmRun
let board: SwarmBoard

beforeAll(async () => {
  recorded = await recordSwarmRun()
  board = foldLive(swarmBoard, recorded.events)
})

function pages(events: RecordedSwarmRun['events']): readonly (readonly BoardEvent[])[] {
  return events
    .filter((event) => event.type === 'swarm.board.pulled')
    .map((event) => decodePulled(event.payload).events)
}

describe('swarmBoard', () => {
  test('folds every board event the swarm read, in log order', () => {
    expect(board.board).toBe('ops')

    expect(board.events.map((event) => event.type)).toEqual([
      'message.posted',
      'message.posted',
      'task.created',
      'task.claimed',
      'task.completed',
    ])

    expect(board.events.length).toBe(recorded.status.eventsRead)
  })

  test('keeps the latest snapshot of a task that changed in a later pull', () => {
    const withTask = pages(recorded.events).filter((page) =>
      page.some((event) => event.task?.id === 'msg_3'),
    )

    expect(withTask.length).toBeGreaterThan(1)
    expect(board.taskOrder).toEqual(['msg_3'])

    expect(board.tasks.msg_3).toMatchObject({
      state: 'completed',
      by: 'triage',
      for: 'fixer',
      holder: null,
      note: 'patched',
    })
  })

  test('groups messages into threads by channel', () => {
    const [support] = boardThreads(board)

    expect(support?.channel).toBe('support')

    expect(
      support?.threads.map(({ root, replies }) => [root.text, replies.map((m) => m.text)]),
    ).toEqual([
      ['@triage nobody can log in', ['Looking into it']],
      ['fix the login page', []],
    ])

    expect(support?.threads[0]?.root).toMatchObject({
      by: 'dana',
      mentions: ['triage'],
      labels: { priority: 'high' },
    })

    expect(support?.threads[0]?.replies[0]).toMatchObject({ by: 'triage', re: 'msg_1' })
  })

  test('groups tasks by state', () => {
    expect(boardTaskGroups(board).map((group) => [group.state, group.tasks.length])).toEqual([
      ['completed', 1],
    ])
  })

  test('skips a page the swarm ignored and a page it already read', () => {
    const pulled = recorded.events.filter((event) => event.type === 'swarm.board.pulled')
    const [first] = pulled

    if (!first) {
      throw new Error('the run has no pulls')
    }

    // The same page again carries the pull number the swarm has moved past.
    const stale = foldLive(swarmBoard, [...recorded.events, { ...first, seq: 10_000 }])

    expect(stale).toEqual(board)
  })

  test('starts over when the board log was reset', () => {
    const last = recorded.events.findLast((event) => event.type === 'swarm.board.pulled')

    if (!last) {
      throw new Error('the run has no pulls')
    }

    const payload = decodePulled(last.payload)

    const reset = {
      ...last,
      seq: 10_000,
      payload: { ...payload, pull: board.pulls, reset: true, events: payload.events.slice(-1) },
    }

    const after = foldLive(swarmBoard, [...recorded.events, reset])

    expect(after.events.map((event) => event.type)).toEqual(['task.completed'])
    expect(after.messageOrder).toEqual([])
    expect(after.taskOrder).toEqual(['msg_3'])
  })
})

function message(id: number, re: number | null): BoardMessage {
  return {
    id: `msg_${id}`,
    channel: `channel-${id % 3}`,
    text: `message ${id}`,
    by: 'dana',
    re: re === null ? null : `msg_${re}`,
    mentions: [],
    labels: {},
    attachments: [],
    createdAt: id,
  }
}

function task(id: number, state: BoardTask['state'], at: number): BoardTask {
  return {
    id: `msg_${id}`,
    channel: `channel-${id % 3}`,
    text: `task ${id}`,
    by: 'dana',
    for: null,
    needs: [],
    state,
    holder: state === 'claimed' ? 'fixer' : null,
    epoch: at,
    leaseUntil: null,
    note: null,
    createdAt: id,
    updatedAt: at,
  }
}

/** A board log of `count` events: roots, replies, tasks that change state, and relabels. */
function boardLog(count: number): BoardEvent[] {
  return Array.from({ length: count }, (_, at): BoardEvent => {
    const cursor = `c${at}`

    switch (at % 5) {
      case 0: {
        return { cursor, type: 'message.posted', at, by: 'dana', message: message(at, null) }
      }

      case 1: {
        return { cursor, type: 'message.posted', at, by: 'triage', message: message(at, at - 1) }
      }

      case 2: {
        return {
          cursor,
          type: 'task.created',
          at,
          by: 'triage',
          message: message(at, null),
          task: task(at, 'ready', at),
        }
      }

      case 3: {
        return { cursor, type: 'task.claimed', at, by: 'fixer', task: task(at - 1, 'claimed', at) }
      }

      default: {
        // Relabel a message posted earlier, so its latest snapshot comes from a later page.
        const relabeled = { ...message(at - 4, null), labels: { seen: String(at) } }
        return { cursor, type: 'message.labeled', at, by: 'triage', message: relabeled }
      }
    }
  })
}

function chunks<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  )
}

describe('applyEvents', () => {
  test('folds a page the same as its events one at a time', () => {
    const log = boardLog(2_000)

    // Overlapping pages, with a cursor repeated inside a page, as a re-read after a retry.
    const reads = chunks(log, 300).map((page, index) => [
      ...(index === 0 ? [] : log.slice(index * 300 - 50, index * 300)),
      ...page,
      ...page.slice(0, 3),
    ])

    const paged = reads.reduce((state, page) => applyEvents(state, 'ops', page), emptyBoard)
    const single = log.reduce((state, event) => applyEvents(state, 'ops', [event]), emptyBoard)

    expect(paged).toEqual(single)
    expect(paged.events).toEqual(log)
    expect(paged.messageOrder.length).toBe(1_200)
    expect(paged.messages.msg_0?.labels).toEqual({ seen: '4' })
    expect(paged.tasks.msg_2?.state).toBe('claimed')
  })

  test('returns the same state for a page with nothing new', () => {
    const log = boardLog(20)
    const state = applyEvents(emptyBoard, 'ops', log)

    expect(applyEvents(state, 'ops', log)).toBe(state)
    expect(applyEvents(state, 'ops', [])).toBe(state)

    const moved = applyEvents(state, 'other', log.slice(0, 2))

    expect(moved).toEqual({ ...state, board: 'other' })
  })

  test('replays a long board in well under a second', () => {
    const log = boardLog(20_000)
    const started = performance.now()

    const state = chunks(log, 1_000).reduce(
      (folded, page) => applyEvents(folded, 'ops', page),
      emptyBoard,
    )

    const elapsed = performance.now() - started

    expect(state.events.length).toBe(20_000)
    expect(boardThreads(state).length).toBe(3)
    // Quadratic folding took about 4.7 s here; linear folding takes tens of milliseconds.
    expect(elapsed).toBeLessThan(500)
  })
})
