import { describe, expect, test } from 'bun:test'

import type { EventEnvelope } from '@looms/core'

import { materializeEvents } from './materialize'

function event(partial: Partial<EventEnvelope> & Pick<EventEnvelope, 'type'>): EventEnvelope {
  return {
    id: partial.id ?? 'evt_1',
    runId: partial.runId ?? 'run_1',
    seq: partial.seq ?? 1,
    ts: partial.ts ?? 1,
    type: partial.type,
    payload: partial.payload ?? {},
    threadId: partial.threadId,
    origin: partial.origin ?? { type: 'system' },
  }
}

describe('materializeEvents', () => {
  test('tracks run and thread rows', () => {
    const tables = materializeEvents([
      event({
        type: 'runtime.run.started',
        payload: {
          rootThreadId: 'thr_1',
          kind: 'workflow',
          definitionName: 'checkout',
          input: null,
        },
      }),
      event({
        seq: 2,
        type: 'runtime.thread.started',
        payload: {
          threadId: 'thr_1',
          kind: 'workflow',
          definitionName: 'checkout',
          input: null,
          parentThreadId: null,
        },
      }),
      event({
        seq: 3,
        type: 'runtime.thread.completed',
        payload: { threadId: 'thr_1', output: { ok: true } },
      }),
    ])

    expect(tables.runs.get('run_1')?.status).toBe('running')
    expect(tables.runs.get('run_1')?.definitionName).toBe('checkout')
    expect(tables.threads.get('thr_1')?.status).toBe('completed')
  })

  test('appends into existing tables in O(batch) time without copying maps', () => {
    const initialTables = materializeEvents([
      event({
        type: 'runtime.run.started',
        payload: {
          rootThreadId: 'thr_1',
          kind: 'workflow',
          definitionName: 'checkout',
          input: null,
        },
      }),
    ])

    const originalRunsRef = initialTables.runs
    const originalThreadsRef = initialTables.threads

    const updatedTables = materializeEvents(
      [
        event({
          seq: 2,
          type: 'runtime.thread.started',
          payload: {
            threadId: 'thr_1',
            kind: 'workflow',
            definitionName: 'checkout',
            input: null,
            parentThreadId: null,
          },
        }),
      ],
      initialTables,
    )

    expect(updatedTables.runs).toBe(originalRunsRef)
    expect(updatedTables.threads).toBe(originalThreadsRef)
    expect(updatedTables.threads.get('thr_1')?.status).toBe('running')
  })
})
