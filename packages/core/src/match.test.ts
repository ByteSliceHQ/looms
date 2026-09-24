import { describe, expect, test } from 'bun:test'

import { createEvent } from './envelope'
import { matchingWaits } from './match'

describe('matchingWaits', () => {
  test('matches a timer event only to its own wait', () => {
    const event = createEvent('run_timer_match', {
      type: 'runtime.timer.fired',
      payload: { timerId: 'later', waitId: 'later' },
      threadId: 'thread',
      origin: { type: 'system' },
    })

    const waits = [
      { waitId: 'earlier', on: { timerAt: 100 } },
      { waitId: 'later', on: { timerAt: 200 } },
    ]

    expect(matchingWaits(event, waits)).toEqual([waits[1]])
  })
})
