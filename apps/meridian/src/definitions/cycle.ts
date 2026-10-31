import { z } from 'zod'

import { gate } from '@swirls/looms/approval'
import { createWaitId, invoke, isJsonObject, wait, type JsonValue } from '@swirls/looms/core'
import { defineWorkflow } from '@swirls/looms/workflow'

import { Limits } from '../limits'
import { imbalance } from '../market'
import { submitOrder } from '../modules/execution/effects'
import { OrderClosed } from '../modules/execution/events'
import { takeSnapshot } from '../modules/market/effects'
import { SnapshotRecorded } from '../modules/market/events'
import { checkRisk } from '../modules/risk/effects'
import { RiskChecked } from '../modules/risk/events'
import { computeSignal } from '../modules/signals/effects'
import { SignalReady } from '../modules/signals/events'
import { orderQty } from '../signals'
import { gradeFill } from './grade'

export const CycleInput = z.object({
  symbol: z.string(),
  strategy: z.enum(['momentum', 'mean-revert']),
  venue: z.enum(['sim', 'robinhood']),
  tick: z.number().int(),
  intervalMs: z.number().nonnegative(),
  prices: z.array(z.number()),
  position: z.number(),
  avgCost: z.number(),
  cash: z.number(),
  realizedPnl: z.number(),
  dayNotional: z.number(),
  limits: Limits,
  lot: z.number().positive(),
})
export type CycleInput = z.infer<typeof CycleInput>

export const CycleOutput = z.object({
  tick: z.number(),
  prices: z.array(z.number()),
  position: z.number(),
  avgCost: z.number(),
  cash: z.number(),
  realizedPnl: z.number(),
  dayNotional: z.number(),
  status: z.string(),
})
export type CycleOutput = z.infer<typeof CycleOutput>

function read<T>(schema: z.ZodType<T>, value: JsonValue | null | undefined): T | undefined {
  const parsed = schema.safeParse(value)
  return parsed.success ? parsed.data : undefined
}

export const tradeCycle = defineWorkflow({
  name: 'trade-cycle',
  description:
    'Observe the book, signal, check risk, ask when required, execute, and grade the fill',
  input: CycleInput,
  nodes: [
    {
      id: 'observe',
      run: (ctx) =>
        ctx.effects([
          invoke(
            takeSnapshot,
            { symbol: ctx.input.symbol, tick: ctx.input.tick, venue: ctx.input.venue },
            `snap_${ctx.nodeId}_${ctx.input.tick}`,
          ),
          wait({
            waitId: createWaitId(ctx.nodeId, 'snap'),
            on: {
              type: 'market.snapshot.recorded',
              match: { symbol: ctx.input.symbol, tick: ctx.input.tick },
            },
          }),
        ]),
    },
    {
      id: 'signal',
      deps: ['observe'],
      run: (ctx) => {
        const quote = read(SnapshotRecorded, ctx.results.observe ?? null)
        const last = quote?.last ?? 0
        const prices = [...ctx.input.prices, last]

        return ctx.effects([
          invoke(
            computeSignal,
            {
              symbol: ctx.input.symbol,
              strategy: ctx.input.strategy,
              prices,
              imbalance: quote ? imbalance(quote) : 0,
              tick: ctx.input.tick,
            },
            `sig_${ctx.nodeId}_${ctx.input.tick}`,
          ),
          wait({
            waitId: createWaitId(ctx.nodeId, 'sig'),
            on: {
              type: 'signals.signal.ready',
              match: { symbol: ctx.input.symbol, tick: ctx.input.tick },
            },
          }),
        ])
      },
    },
    {
      id: 'risk',
      deps: ['signal'],
      run: (ctx) => {
        const quote = read(SnapshotRecorded, ctx.results.observe ?? null)
        const signal = read(SignalReady, ctx.results.signal ?? null)
        const price = quote?.last ?? 0
        const qty = signal ? orderQty(signal.strength, ctx.input.lot) : 0

        return ctx.effects([
          invoke(
            checkRisk,
            {
              symbol: ctx.input.symbol,
              venue: ctx.input.venue,
              side: signal?.side ?? 'flat',
              qty,
              price,
              position: ctx.input.position,
              avgCost: ctx.input.avgCost,
              cash: ctx.input.cash,
              realizedPnl: ctx.input.realizedPnl,
              dayNotional: ctx.input.dayNotional,
              limits: ctx.input.limits,
              tick: ctx.input.tick,
            },
            `risk_${ctx.nodeId}_${ctx.input.tick}`,
          ),
          wait({
            waitId: createWaitId(ctx.nodeId, 'risk'),
            on: {
              type: 'risk.check.completed',
              match: { symbol: ctx.input.symbol, tick: ctx.input.tick },
            },
          }),
        ])
      },
    },
    {
      id: 'review',
      deps: ['risk'],
      run: (ctx) => {
        const decision = read(RiskChecked, ctx.results.risk ?? null)

        if (!decision || decision.outcome === 'blocked' || decision.side === 'flat') {
          return { skipped: true, reason: decision?.outcome === 'blocked' ? 'blocked' : 'auto' }
        }

        if (decision.outcome === 'passed' && ctx.input.venue !== 'robinhood') {
          return { skipped: true, reason: 'auto' }
        }

        return ctx.effects(
          gate({
            title: `${decision.side} ${decision.qty} ${ctx.input.symbol}?`,
            description: `${decision.reason}. Mark ${decision.price}. Venue ${ctx.input.venue}.`,
          }),
        )
      },
    },
    {
      id: 'execute',
      deps: ['review'],
      run: (ctx) => {
        const review = ctx.results.review ?? null
        const rejected = isRejected(review)
        const decision = read(RiskChecked, ctx.results.risk ?? null)
        const quote = read(SnapshotRecorded, ctx.results.observe ?? null)

        if (rejected || !decision || decision.side === 'flat' || decision.outcome === 'blocked') {
          return { skipped: true, status: rejected ? 'rejected' : (decision?.outcome ?? 'skipped') }
        }

        if (!quote) {
          throw new Error('the cycle has no quote')
        }

        return ctx.effects([
          invoke(
            submitOrder,
            {
              symbol: ctx.input.symbol,
              side: decision.side,
              qty: decision.qty,
              tick: ctx.input.tick,
              arrivalPrice: decision.side === 'buy' ? quote.ask : quote.bid,
              venue: ctx.input.venue,
              position: ctx.input.position,
              avgCost: ctx.input.avgCost,
              cash: ctx.input.cash,
              realizedPnl: ctx.input.realizedPnl,
              dayNotional: ctx.input.dayNotional,
              limits: ctx.input.limits,
            },
            `ord_${ctx.nodeId}_${ctx.input.tick}`,
          ),
          wait({
            waitId: createWaitId(ctx.nodeId, 'ord'),
            on: {
              type: 'execution.order.closed',
              match: { symbol: ctx.input.symbol, tick: ctx.input.tick },
            },
          }),
        ])
      },
    },
    {
      id: 'grade',
      deps: ['execute'],
      run: (ctx) => {
        const closed = read(OrderClosed, ctx.results.execute ?? null)

        if (
          !closed ||
          closed.status === 'rejected' ||
          closed.status === 'working' ||
          !(closed.vwap > 0)
        ) {
          return { skipped: true, grade: 'ungraded' }
        }

        return ctx.spawn(gradeFill, {
          symbol: closed.symbol,
          side: closed.side,
          qty: closed.qty,
          arrivalPrice: closed.price,
          fillPrice: closed.vwap,
          slippageBps: closed.slippageBps,
        })
      },
    },
    {
      id: 'pace',
      deps: ['grade'],
      run: (ctx) => (ctx.input.intervalMs > 0 ? ctx.sleep(ctx.input.intervalMs) : { paced: true }),
    },
  ],
  output: ({ input, results }) => {
    const quote = read(SnapshotRecorded, results.observe ?? null)
    const closed = read(OrderClosed, results.execute ?? null)
    const last = quote?.last
    const prices = last === undefined ? input.prices : [...input.prices, last].slice(-32)

    return {
      tick: input.tick,
      prices,
      position: closed?.position ?? input.position,
      avgCost: closed?.avgCost ?? input.avgCost,
      cash: closed?.cash ?? input.cash,
      realizedPnl: closed?.realizedPnl ?? input.realizedPnl,
      dayNotional: closed?.dayNotional ?? input.dayNotional,
      status: closed?.status ?? 'flat',
    }
  },
})

function isRejected(value: JsonValue | null): boolean {
  return isJsonObject(value) && value.outcome === 'reject'
}
