import { Database } from 'bun:sqlite'
import { describe, expect, test } from 'bun:test'

import { createEvent } from '@looms/core'

import { sqlite } from './sqlite'

function threadEvents(runId: string, status: 'completed' | 'cancelled') {
  return [
    createEvent(runId, {
      type: 'runtime.thread.started',
      payload: {
        threadId: 'thr_shared',
        kind: 'agent',
        definitionName: 'echo',
        input: null,
        parentThreadId: null,
      },
      threadId: 'thr_shared',
      origin: { type: 'system' },
    }),
    createEvent(runId, {
      type: `runtime.thread.${status}`,
      payload: { threadId: 'thr_shared', output: null },
      threadId: 'thr_shared',
      origin: { type: 'system' },
    }),
    createEvent(runId, {
      type: 'approval.requested',
      payload: { approvalId: 'approval_shared', title: `${runId} approval`, actions: [] },
      threadId: 'thr_shared',
      origin: { type: 'system' },
    }),
  ]
}

describe('sqlite projector', () => {
  test('indexes a started run', async () => {
    const projector = sqlite({ path: ':memory:' })
    await projector.init?.()

    await projector.project([
      createEvent('run_1', {
        type: 'runtime.run.started',
        payload: { rootThreadId: 'thr_1', kind: 'agent', definitionName: 'echo', input: null },
        threadId: null,
        origin: { type: 'system' },
      }),
    ])

    const row = await projector.getActor('run_1')
    expect(row?.definitionName).toBe('echo')
    await projector.dispose?.()
  })

  test('indexes which run launched a run and lists the runs it launched', async () => {
    const projector = sqlite({ path: ':memory:' })
    await projector.init?.()

    await projector.project([
      createEvent('nightly:fire:1', {
        type: 'runtime.run.started',
        payload: {
          rootThreadId: 'thr_1',
          kind: 'workflow',
          definitionName: 'report',
          input: null,
          launchedBy: {
            runId: 'nightly',
            threadId: 'thr_s',
            effectId: 'eff_1',
            causationId: 'evt_4',
            causationSeq: 4,
          },
        },
        threadId: null,
        correlationId: 'nightly',
        origin: { type: 'run', runId: 'nightly' },
      }),
    ])

    expect(await projector.getActor('nightly:fire:1')).toMatchObject({
      launchedByRunId: 'nightly',
      launchedByEffectId: 'eff_1',
      correlationId: 'nightly',
    })

    expect((await projector.listLaunched('nightly')).map((row) => row.runId)).toEqual([
      'nightly:fire:1',
    ])

    await projector.dispose?.()
  })

  test('adds the launch columns to a database from an earlier release', async () => {
    const db = new Database(':memory:')

    db.exec(`CREATE TABLE looms_run_actors (
      run_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      kind TEXT,
      status TEXT,
      definition_name TEXT,
      parent_actor_id TEXT,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (run_id, actor_id)
    )`)

    const projector = sqlite({ db })
    await projector.init?.()
    await projector.init?.()

    const columns = db
      .query<{ name: string }, []>('PRAGMA table_info(looms_run_actors)')
      .all()
      .map((column) => column.name)

    expect(columns).toContain('launched_by_run_id')
    expect(columns).toContain('correlation_id')
    db.close()
  })

  test('keeps a thread id shared by two runs apart', async () => {
    const projector = sqlite({ path: ':memory:' })
    await projector.init?.()
    await projector.project(threadEvents('run_source', 'cancelled'))
    await projector.project(threadEvents('run_fork', 'completed'))

    expect((await projector.getActor('run_source', 'thr_shared'))?.status).toBe('cancelled')
    expect((await projector.getActor('run_fork', 'thr_shared'))?.status).toBe('completed')

    expect((await projector.listReviews('run_source')).map((row) => row.title)).toEqual([
      'run_source approval',
    ])

    expect(await projector.listReviews()).toHaveLength(2)
    await projector.dispose?.()
  })
})
