import { describe, expect, test } from 'bun:test'

import { decision, pendingApprovals } from '@swirls/looms/approval'
import { createLoomsClient } from '@swirls/looms/client'
import {
  cloudflareQueueWorker,
  createMemoryQueue,
  createQueuePullConsumer,
  workerHandlers,
  type MemoryQueue,
} from '@swirls/looms/cloudflare/queues'
import { bearerAuth, createLooms, type Looms } from '@swirls/looms/runtime'
import { moduleConformance } from '@swirls/looms/testing'

import { admitVenue } from './admit'
import { simBroker } from './broker'
import { tradeSession } from './definitions/session'
import { SIM_LIMITS } from './limits'
import { deskLlm } from './llm'
import { execution } from './modules/execution'
import { submitOrder } from './modules/execution/effects'
import { settleOrder } from './modules/execution/fill'
import { blotter } from './modules/execution/projections'
import { ledger } from './modules/ledger'
import { book } from './modules/ledger/projections'
import { market } from './modules/market'
import { risk } from './modules/risk'
import { signals } from './modules/signals'
import { assessRisk } from './risk'
import { meridianModules } from './runtime'

const WORKER_TOKEN = 'meridian-test-worker'

interface Desk {
  readonly looms: Looms
  readonly queue: MemoryQueue
  stop(): Promise<void>
}

function openDesk(): Desk {
  const queue = createMemoryQueue()

  const looms = createLooms({
    modules: meridianModules({ llm: deskLlm }),
    worker: cloudflareQueueWorker({
      routes: [{ effects: [submitOrder], queue }],
    }),
    authorize: bearerAuth({ worker: WORKER_TOKEN }),
  })

  const callbacks = createLoomsClient({
    baseUrl: 'http://meridian.test',
    workerCallbackToken: WORKER_TOKEN,
    fetch: Object.assign(
      async (input: RequestInfo | URL, init?: RequestInit) =>
        (await looms.fetch(new Request(input, init))) ?? new Response('Not Found', { status: 404 }),
      { preconnect: fetch.preconnect },
    ),
  })

  const consumer = createQueuePullConsumer({
    source: queue,
    callbacks,
    handlers: workerHandlers([[submitOrder, (input, ctx) => settleOrder(input, ctx, simBroker())]]),
  })

  return {
    looms,
    queue,
    stop: async () => {
      await consumer.stop()
      await looms.stop()
    },
  }
}

async function waitFor(looms: Looms, runId: string, ready: () => boolean | Promise<boolean>) {
  const deadline = Date.now() + 4_000

  while (!(await ready())) {
    if (Date.now() > deadline) {
      const state = await looms.getRun(runId)
      const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined
      throw new Error(
        `timed out: run ${state.status}, root ${root?.status ?? 'none'} ${root?.error ?? ''}`,
      )
    }

    await Bun.sleep(20)
  }
}

const seeded = {
  symbol: 'NVDA',
  strategy: 'momentum' as const,
  venue: 'sim' as const,
  cycles: 1,
  intervalMs: 0,
  seedTick: 40,
  prices: [100, 110, 120],
  lot: 10,
}

describe('Meridian modules', () => {
  test('market, signals, risk, execution, and ledger conform', () => {
    expect(moduleConformance(market)).toEqual([])
    expect(moduleConformance(signals)).toEqual([])
    expect(moduleConformance(risk)).toEqual([])
    expect(moduleConformance(execution)).toEqual([])
    expect(moduleConformance(ledger)).toEqual([])
  })

  test('risk blocks a kill switch, caps a live order, and asks on a soft breach', () => {
    const bookState = { position: 0, avgCost: 0, cash: 1_000_000, realizedPnl: 0 }

    const base = {
      side: 'buy' as const,
      qty: 1,
      price: 100,
      book: bookState,
      dayNotional: 0,
      killed: false,
    }

    expect(assessRisk({ ...base, venue: 'sim', limits: SIM_LIMITS }).outcome).toBe('passed')

    expect(assessRisk({ ...base, venue: 'sim', limits: SIM_LIMITS, killed: true }).reason).toBe(
      'kill switch',
    )

    expect(assessRisk({ ...base, venue: 'robinhood', limits: SIM_LIMITS, price: 10 }).outcome).toBe(
      'soft_breach',
    )

    expect(
      assessRisk({
        ...base,
        venue: 'robinhood',
        limits: { ...SIM_LIMITS, maxOrderUsd: 10 },
        price: 100,
      }).reason,
    ).toBe('live order cap')

    expect(
      assessRisk({
        ...base,
        venue: 'robinhood',
        limits: SIM_LIMITS,
        dayNotional: 90,
        price: 20,
      }).reason,
    ).toBe('live day cap')

    expect(
      assessRisk({ ...base, venue: 'sim', limits: { ...SIM_LIMITS, maxNotional: 1 }, price: 100 })
        .outcome,
    ).toBe('soft_breach')
  })

  test('live orders are refused unless the desk is armed', () => {
    expect(
      admitVenue({
        symbol: 'BTC-USD',
        venue: 'robinhood',
        intervalMs: 5_000,
        liveEnabled: false,
        configured: true,
      }),
    ).toEqual({ ok: false, reason: 'live trading is off' })

    expect(
      admitVenue({
        symbol: 'NVDA',
        venue: 'robinhood',
        intervalMs: 5_000,
        liveEnabled: true,
        configured: true,
      }).ok,
    ).toBe(false)

    expect(
      admitVenue({
        symbol: 'BTC-USD',
        venue: 'robinhood',
        intervalMs: 5_000,
        liveEnabled: true,
        configured: false,
      }).ok,
    ).toBe(false)

    expect(
      admitVenue({
        symbol: 'NVDA',
        venue: 'sim',
        intervalMs: 0,
        liveEnabled: false,
        configured: false,
      }),
    ).toEqual({ ok: true })
  })
})

describe('trade session', () => {
  test('a simulated cycle fills on the worker queue', async () => {
    const desk = openDesk()

    try {
      const started = await desk.looms.start(tradeSession, { ...seeded, limits: SIM_LIMITS })

      await waitFor(
        desk.looms,
        started.runId,
        async () => (await desk.looms.getRun(started.runId)).status === 'completed',
      )

      const filled = await desk.looms.project(started.runId, blotter)
      const position = await desk.looms.project(started.runId, book)
      expect(filled.fills).toBeGreaterThan(0)
      expect(filled.lastStatus).toBe('filled')
      expect(position.position).not.toBe(0)
    } finally {
      await desk.stop()
    }
  })

  test('a soft breach waits for approval and a rejection skips the order', async () => {
    const desk = openDesk()

    try {
      const started = await desk.looms.start(tradeSession, {
        ...seeded,
        limits: { ...SIM_LIMITS, maxNotional: 1 },
      })

      await waitFor(desk.looms, started.runId, async () => {
        const pending = await desk.looms.project(started.runId, pendingApprovals)
        return pending.items.some((item) => item.status === 'pending')
      })

      const pending = await desk.looms.project(started.runId, pendingApprovals)
      const approval = pending.items.find((item) => item.status === 'pending')
      expect(approval).toBeDefined()
      await desk.looms.signal(started.runId, [decision(approval?.approvalId ?? '', 'reject')])

      await waitFor(
        desk.looms,
        started.runId,
        async () => (await desk.looms.getRun(started.runId)).status === 'completed',
      )

      expect(await desk.looms.project(started.runId, blotter)).toEqual({
        lastStatus: null,
        fills: 0,
      })
    } finally {
      await desk.stop()
    }
  })

  test('halt cancels the session and fork continues it', async () => {
    const desk = openDesk()

    try {
      const started = await desk.looms.start(tradeSession, {
        ...seeded,
        limits: { ...SIM_LIMITS, maxNotional: 1 },
      })

      await waitFor(desk.looms, started.runId, async () => {
        const pending = await desk.looms.project(started.runId, pendingApprovals)
        return pending.items.some((item) => item.status === 'pending')
      })

      const pending = await desk.looms.project(started.runId, pendingApprovals)
      const approval = pending.items.find((item) => item.status === 'pending')
      await desk.looms.cancel(started.runId)

      await waitFor(
        desk.looms,
        started.runId,
        async () => (await desk.looms.getRun(started.runId)).status === 'cancelled',
      )

      const forked = await desk.looms.fork(started.runId)
      expect(forked.runId).not.toBe(started.runId)
      expect(forked.state.forkedFrom?.runId).toBe(started.runId)

      await waitFor(desk.looms, forked.runId, async () => {
        const next = await desk.looms.project(forked.runId, pendingApprovals)
        return next.items.some((item) => item.status === 'pending')
      })

      const resumed = await desk.looms.project(forked.runId, pendingApprovals)
      const gate = resumed.items.find((item) => item.status === 'pending') ?? approval
      await desk.looms.signal(forked.runId, [decision(gate?.approvalId ?? '', 'approve')])

      await waitFor(
        desk.looms,
        forked.runId,
        async () => (await desk.looms.getRun(forked.runId)).status === 'completed',
      )

      const filled = await desk.looms.project(forked.runId, blotter)
      expect(filled.fills).toBeGreaterThan(0)
    } finally {
      await desk.stop()
    }
  })
})
