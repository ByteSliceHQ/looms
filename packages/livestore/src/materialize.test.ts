import { describe, expect, test } from 'bun:test'

import type { EventEnvelope } from '@looms/core'

import { materializeEvents } from './materialize'

const event = (
  partial: Partial<EventEnvelope> & Pick<EventEnvelope, 'type' | 'payload'>,
): EventEnvelope => ({
  id: partial.id ?? 'evt',
  runId: partial.runId ?? 'run_1',
  seq: partial.seq ?? 1,
  ts: partial.ts ?? 1,
  threadId: partial.threadId ?? 'thr_1',
  origin: partial.origin ?? { type: 'system' },
  type: partial.type,
  payload: partial.payload,
})

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
    expect(tables.runs.get('run_1')?.definitionName).toBe('checkout')
    expect(tables.threads.get('thr_1')?.status).toBe('completed')
    expect(tables.events_log).toHaveLength(3)
  })
})
