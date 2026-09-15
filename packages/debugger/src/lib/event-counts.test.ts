import { describe, expect, test } from 'bun:test'

import { createEvent, type JsonValue } from '@looms/core'

import { countEventsByThread, runStatusFromEvents, startedAtFromEvents } from './event-counts'

const runId = 'run_counts'

function event(seq: number, type: string, threadId: string | null, payload: JsonValue = {}) {
  return createEvent(
    runId,
    {
      type,
      payload,
      threadId,
      ts: 1_000 + seq,
      id: `evt_${seq}`,
    },
    { seq },
  )
}

describe('countEventsByThread', () => {
  test('counts run-level and thread events', () => {
    const counts = countEventsByThread([
      event(1, 'runtime.run.started', null),
      event(2, 'runtime.thread.started', 'thr_a'),
      event(3, 'agent.message', 'thr_a'),
      event(4, 'runtime.thread.started', 'thr_b'),
    ])

    expect(counts.get('run')).toBe(1)
    expect(counts.get('thr_a')).toBe(2)
    expect(counts.get('thr_b')).toBe(1)
  })
})

describe('runStatusFromEvents', () => {
  test('is running until a completed event arrives', () => {
    expect(runStatusFromEvents([])).toBe('running')
    expect(runStatusFromEvents([event(1, 'runtime.run.started', null)])).toBe('running')

    expect(
      runStatusFromEvents([
        event(1, 'runtime.run.started', null),
        event(2, 'runtime.run.completed', null, { output: { ok: true }, error: null }),
      ]),
    ).toBe('completed')

    expect(
      runStatusFromEvents([
        event(1, 'runtime.run.started', null),
        event(2, 'runtime.run.completed', null, { output: null, error: 'boom' }),
      ]),
    ).toBe('failed')
  })
})

describe('startedAtFromEvents', () => {
  test('reads the first run.started timestamp', () => {
    const events = [
      event(1, 'runtime.run.started', null),
      event(2, 'runtime.thread.started', 'thr_a'),
    ]

    expect(startedAtFromEvents(events)).toBe(1_001)
  })
})
