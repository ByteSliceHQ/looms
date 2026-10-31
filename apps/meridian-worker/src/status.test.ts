import { describe, expect, test } from 'bun:test'

import { applyDeskMutations, projectDesk, type DeskExec } from './status'

describe('desk projector', () => {
  test('a trade session, an approval, and a fill become desk rows', () => {
    const queries: string[] = []

    const sql: DeskExec = {
      exec(query) {
        queries.push(query)
      },
    }

    const started = projectDesk({
      runId: 'run_1',
      type: 'runtime.run.started',
      ts: 10,
      payload: {
        kind: 'workflow',
        definitionName: 'trade-session',
        definitionVersion: '1',
        input: { symbol: 'NVDA', strategy: 'momentum', venue: 'sim' },
      },
    })

    const asked = projectDesk({
      runId: 'run_1',
      type: 'approval.requested',
      ts: 11,
      payload: { approvalId: 'apr_1', title: 'Buy NVDA?', description: 'soft breach' },
    })

    const filled = projectDesk({
      runId: 'run_1',
      type: 'execution.order.closed',
      ts: 12,
      payload: {
        clientOrderId: 'ord_1',
        symbol: 'NVDA',
        side: 'buy',
        qty: 10,
        price: 140,
        status: 'filled',
        slippageBps: 1,
        venue: 'sim',
        position: 10,
        realizedPnl: 0,
      },
    })

    applyDeskMutations(sql, [...started, ...asked, ...filled])
    expect(started[0]).toMatchObject({ type: 'session', symbol: 'NVDA' })
    expect(asked.map((item) => item.type)).toEqual(['status', 'approval'])
    expect(queries.some((query) => query.includes('INSERT OR IGNORE INTO sessions'))).toBe(true)
    expect(queries.some((query) => query.includes('INSERT INTO orders'))).toBe(true)
    expect(queries.some((query) => query.includes('UPDATE sessions SET position'))).toBe(true)
  })

  test('a finished status does not come from an unrelated event', () => {
    expect(
      projectDesk({
        runId: 'run_1',
        type: 'runtime.run.completed',
        ts: 20,
        payload: { output: { status: 'flat' }, error: null },
      }),
    ).toEqual([{ type: 'status', runId: 'run_1', status: 'completed' }])
  })
})
