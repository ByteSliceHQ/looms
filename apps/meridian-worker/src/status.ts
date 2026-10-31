import { z } from 'zod'

import type { SessionStatus } from '@looms/meridian/http'
import { completedRunStatus, type JsonValue } from '@swirls/looms/core'
import type { Projector } from '@swirls/looms/projectors'

const Started = z.object({
  definitionName: z.string(),
  input: z.object({
    symbol: z.string(),
    strategy: z.enum(['momentum', 'mean-revert']),
    venue: z.enum(['sim', 'robinhood']),
  }),
})

const Closed = z.object({
  clientOrderId: z.string(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.number(),
  price: z.number(),
  status: z.string(),
  slippageBps: z.number(),
  venue: z.enum(['sim', 'robinhood']),
  position: z.number(),
  realizedPnl: z.number(),
})

const Requested = z.object({
  approvalId: z.string(),
  title: z.string(),
  description: z.string().optional(),
})

const Decided = z.object({
  approvalId: z.string(),
  outcome: z.enum(['approve', 'reject']),
})

export type DeskMutation =
  | {
      type: 'session'
      runId: string
      symbol: string
      strategy: 'momentum' | 'mean-revert'
      venue: 'sim' | 'robinhood'
      openedAt: number
    }
  | { type: 'status'; runId: string; status: SessionStatus }
  | {
      type: 'book'
      runId: string
      position: number
      realizedPnl: number
    }
  | {
      type: 'order'
      id: string
      runId: string
      symbol: string
      side: 'buy' | 'sell'
      qty: number
      price: number
      status: string
      slippageBps: number
      venue: 'sim' | 'robinhood'
      ts: number
    }
  | {
      type: 'approval'
      approvalId: string
      runId: string
      title: string
      description: string
    }
  | { type: 'decision'; approvalId: string; status: 'approved' | 'rejected' }

export interface DeskEvent {
  readonly runId: string
  readonly type: string
  readonly ts: number
  readonly payload: JsonValue
}

export function projectDesk(event: DeskEvent): DeskMutation[] {
  if (event.type === 'runtime.run.started') {
    const parsed = Started.safeParse(event.payload)

    if (!parsed.success || parsed.data.definitionName !== 'trade-session') {
      return []
    }

    return [
      {
        type: 'session',
        runId: event.runId,
        symbol: parsed.data.input.symbol,
        strategy: parsed.data.input.strategy,
        venue: parsed.data.input.venue,
        openedAt: event.ts,
      },
    ]
  }

  if (event.type === 'approval.requested') {
    const parsed = Requested.safeParse(event.payload)

    if (!parsed.success) {
      return []
    }

    return [
      { type: 'status', runId: event.runId, status: 'waiting' },
      {
        type: 'approval',
        approvalId: parsed.data.approvalId,
        runId: event.runId,
        title: parsed.data.title,
        description: parsed.data.description ?? '',
      },
    ]
  }

  if (event.type === 'approval.decided') {
    const parsed = Decided.safeParse(event.payload)

    if (!parsed.success) {
      return []
    }

    return [
      { type: 'status', runId: event.runId, status: 'running' },
      {
        type: 'decision',
        approvalId: parsed.data.approvalId,
        status: parsed.data.outcome === 'approve' ? 'approved' : 'rejected',
      },
    ]
  }

  if (event.type === 'runtime.run.cancelled') {
    return [{ type: 'status', runId: event.runId, status: 'cancelled' }]
  }

  if (event.type === 'runtime.run.completed') {
    return [{ type: 'status', runId: event.runId, status: completedRunStatus(event.payload) }]
  }

  if (event.type === 'execution.order.closed') {
    const parsed = Closed.safeParse(event.payload)

    if (!parsed.success) {
      return []
    }

    return [
      {
        type: 'order',
        id: parsed.data.clientOrderId,
        runId: event.runId,
        symbol: parsed.data.symbol,
        side: parsed.data.side,
        qty: parsed.data.qty,
        price: parsed.data.price,
        status: parsed.data.status,
        slippageBps: parsed.data.slippageBps,
        venue: parsed.data.venue,
        ts: event.ts,
      },
      {
        type: 'book',
        runId: event.runId,
        position: parsed.data.position,
        realizedPnl: parsed.data.realizedPnl,
      },
    ]
  }

  return []
}

export interface DeskExec {
  exec(sql: string, ...bindings: Array<string | number | null>): void
}

export function applyDeskMutations(sql: DeskExec, mutations: readonly DeskMutation[]): void {
  for (const mutation of mutations) {
    switch (mutation.type) {
      case 'session':
        sql.exec(
          `INSERT OR IGNORE INTO sessions (
            id, run_id, symbol, strategy, venue, status, opened_at, position, realized_pnl, parent_run_id
          ) VALUES (?, ?, ?, ?, ?, 'running', ?, 0, 0, NULL)`,
          mutation.runId,
          mutation.runId,
          mutation.symbol,
          mutation.strategy,
          mutation.venue,
          mutation.openedAt,
        )

        break
      case 'status':
        sql.exec(
          `UPDATE sessions SET status = ? WHERE run_id = ? AND status NOT IN ('completed', 'failed', 'cancelled')`,
          mutation.status,
          mutation.runId,
        )

        break
      case 'book':
        sql.exec(
          'UPDATE sessions SET position = ?, realized_pnl = ? WHERE run_id = ?',
          mutation.position,
          mutation.realizedPnl,
          mutation.runId,
        )

        break
      case 'order':
        sql.exec(
          `INSERT INTO orders (id, run_id, symbol, side, qty, price, status, slippage_bps, venue, ts)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             qty = excluded.qty,
             price = excluded.price,
             status = excluded.status,
             slippage_bps = excluded.slippage_bps,
             ts = excluded.ts`,
          mutation.id,
          mutation.runId,
          mutation.symbol,
          mutation.side,
          mutation.qty,
          mutation.price,
          mutation.status,
          mutation.slippageBps,
          mutation.venue,
          mutation.ts,
        )

        break
      case 'approval':
        sql.exec(
          `INSERT INTO approvals (approval_id, run_id, title, description, status)
           VALUES (?, ?, ?, ?, 'pending')
           ON CONFLICT(approval_id) DO NOTHING`,
          mutation.approvalId,
          mutation.runId,
          mutation.title,
          mutation.description,
        )

        break
      case 'decision':
        sql.exec(
          `UPDATE approvals SET status = ? WHERE approval_id = ? AND status = 'pending'`,
          mutation.status,
          mutation.approvalId,
        )

        break

      default: {
        const unexpected: never = mutation
        void unexpected
      }
    }
  }
}

interface DeskStub {
  fetch(request: Request): Promise<Response>
}

interface DeskNamespace {
  getByName(name: string): DeskStub
}

export function deskStatusProjector(desk: DeskNamespace): Projector {
  return {
    name: 'meridian-desk',
    version: '1',
    project(events) {
      let chain = Promise.resolve()

      for (const event of events) {
        if (projectDesk(event).length === 0) {
          continue
        }

        const update = {
          runId: event.runId,
          type: event.type,
          ts: event.ts,
          payload: event.payload,
        }

        chain = chain.then(() => postEvent(desk, update))
      }

      return chain
    },
  }
}

function postEvent(desk: DeskNamespace, update: DeskEvent): Promise<void> {
  return desk
    .getByName('board')
    .fetch(
      new Request('https://meridian.internal/internal/project', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(update),
      }),
    )
    .then((response) => {
      if (response.ok) {
        return Promise.resolve()
      }

      return response.text().then((text) => {
        throw new Error(text || `Desk update failed (${response.status})`)
      })
    })
}
