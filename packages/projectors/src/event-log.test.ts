import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { createEvent, makeMemoryEventStore, type EventEnvelope, type EventInput } from '@looms/core'

import { memoryEventLog, POSTGRES_EVENT_LOG_SCHEMA_SQL } from './event-log'

function event(input: EventInput, seq: number): EventEnvelope {
  return { ...createEvent('run_1', input), seq }
}

const started = event(
  {
    type: 'runtime.run.started',
    payload: {
      rootThreadId: 'thr_1',
      kind: 'workflow',
      definitionName: 'checkout',
      definitionVersion: 'v1',
      input: null,
      attributes: { tenant: 'acme', project: 'billing', org: 'hq' },
      launchedBy: {
        runId: 'run_parent',
        threadId: 'thr_parent',
        effectId: 'eff_1',
        causationId: 'evt_cause',
        causationSeq: 4,
      },
    },
    correlationId: 'run_root',
    threadId: null,
    origin: { type: 'system' },
  },
  1,
)

describe('event log', () => {
  test('keeps non-ephemeral envelopes and the run index', async () => {
    const log = memoryEventLog()

    await log.project([
      started,
      event(
        {
          type: 'runtime.run.completed',
          payload: { output: { ok: true }, error: null },
          threadId: null,
          origin: { type: 'system' },
        },
        2,
      ),
    ])

    expect(log.events('run_1').map((entry) => entry.seq)).toEqual([1, 2])

    expect(log.run('run_1')).toMatchObject({
      status: 'completed',
      kind: 'workflow',
      definitionName: 'checkout',
      definitionVersion: 'v1',
      rootThreadId: 'thr_1',
      parentRunId: 'run_parent',
      launchedByEffectId: 'eff_1',
      correlationId: 'run_root',
      tenant: 'acme',
      project: 'billing',
      org: 'hq',
      attributes: { tenant: 'acme', project: 'billing', org: 'hq' },
    })
  })

  test('skips ephemeral events and does not regress a finished run when start is replayed', async () => {
    const log = memoryEventLog()

    const delta = event(
      {
        type: 'agent.turn.text_delta',
        payload: { text: 'hi' },
        threadId: 'thr_1',
        origin: { type: 'system' },
        ephemeral: true,
      },
      2,
    )

    const failed = event(
      {
        type: 'runtime.run.completed',
        payload: { output: null, error: 'nope' },
        threadId: null,
        origin: { type: 'system' },
      },
      3,
    )

    await log.project([started, delta, failed])
    await log.project([started, delta, failed])

    expect(log.events('run_1').map((entry) => entry.type)).toEqual([
      'runtime.run.started',
      'runtime.run.completed',
    ])

    expect(log.run('run_1')?.status).toBe('failed')
    expect(log.run('run_1')?.tenant).toBe('acme')
  })

  test('rebuilds the sink from the source log', async () => {
    const source = await Effect.runPromise(makeMemoryEventStore)

    await Effect.runPromise(
      source.append('run_1', [
        {
          type: 'runtime.run.started',
          payload: {
            kind: 'workflow',
            definitionName: 'checkout',
            input: null,
          },
          threadId: null,
          origin: { type: 'system' },
        },
        {
          type: 'runtime.run.cancelled',
          payload: { reason: 'stop' },
          threadId: null,
          origin: { type: 'system' },
        },
      ]),
    )

    const log = memoryEventLog()
    const written = await log.rebuild(source)

    expect(written).toBe(2)
    expect(log.run('run_1')?.status).toBe('cancelled')

    const again = await log.rebuild(source)
    expect(again).toBe(2)
    expect(log.events('run_1')).toHaveLength(2)
  })

  test('the postgres schema keys events by run and seq and indexes tenant columns', () => {
    expect(POSTGRES_EVENT_LOG_SCHEMA_SQL).toContain('PRIMARY KEY (run_id, seq)')
    expect(POSTGRES_EVENT_LOG_SCHEMA_SQL).toContain('looms_run_index_tenant')
    expect(POSTGRES_EVENT_LOG_SCHEMA_SQL).toContain('looms_run_index_project')
    expect(POSTGRES_EVENT_LOG_SCHEMA_SQL).toContain('looms_run_index_org')
  })
})
