import { beforeAll, describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { foldLive } from '@looms/react'

import type { BoardEvent } from '../board'
import { BoardPulledPayloadSchema } from '../events'
import { boardTaskGroups, boardThreads, swarmBoard, type SwarmBoard } from './board-fold'
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
