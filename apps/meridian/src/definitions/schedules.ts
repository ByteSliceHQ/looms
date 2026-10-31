import { z } from 'zod'

import { createWaitId, invoke, wait } from '@swirls/looms/core'
import { cron, defineSchedule } from '@swirls/looms/schedule'
import { defineWorkflow } from '@swirls/looms/workflow'

import { SIM_LIMITS } from '../limits'
import { loadDailyFills } from '../modules/ledger/effects'
import { DailyFillsReady } from '../modules/ledger/events'
import { sessionLot, tradeSession } from './session'

export const MARKET_OPEN_RUN_ID = 'meridian-market-open'
export const END_OF_DAY_RUN_ID = 'meridian-end-of-day'

const OpenInput = z.object({ at: z.number() })

const defaultSessions = ['NVDA', 'AAPL', 'MSFT'].map((symbol) => ({
  symbol,
  strategy: symbol === 'AAPL' ? ('mean-revert' as const) : ('momentum' as const),
  venue: 'sim' as const,
  cycles: 4,
  intervalMs: 1_000,
  limits: SIM_LIMITS,
  lot: sessionLot(symbol),
}))

export const openBook = defineWorkflow({
  name: 'open-book',
  description: 'Start the default simulated sessions at the open',
  input: OpenInput,
  childExecution: 'run',
  nodes: [
    {
      id: 'open',
      run: (ctx) => ctx.fanout(tradeSession, defaultSessions, 3),
    },
  ],
  output: ({ results }) => results.open ?? null,
})

const Attribution = z.object({
  symbol: z.string(),
  realizedPnl: z.number(),
  qty: z.number(),
  fills: z.number(),
})

export const attributeSymbol = defineWorkflow({
  name: 'attribute-symbol',
  description: 'One symbol row in the end-of-day attribution',
  input: Attribution,
  nodes: [
    {
      id: 'row',
      run: (ctx) => ctx.input,
    },
  ],
  output: ({ input }) => input,
})

export const eodRecon = defineWorkflow({
  name: 'eod-recon',
  description: 'Attribute the day from the fills copied into D1',
  input: OpenInput,
  nodes: [
    {
      id: 'load',
      run: (ctx) =>
        ctx.effects([
          invoke(loadDailyFills, { at: ctx.input.at }, `fills_${ctx.nodeId}`),
          wait({
            waitId: createWaitId(ctx.nodeId, 'fills'),
            on: { type: 'ledger.daily_fills.ready' },
          }),
        ]),
    },
    {
      id: 'attribute',
      deps: ['load'],
      run: (ctx) => {
        const loaded = DailyFillsReady.safeParse(ctx.results.load ?? null)
        const fills = loaded.success ? loaded.data.fills : []
        const grouped = new Map<string, { realizedPnl: number; qty: number; fills: number }>()

        for (const fill of fills) {
          const row = grouped.get(fill.symbol) ?? { realizedPnl: 0, qty: 0, fills: 0 }
          const signed = fill.side === 'buy' ? -fill.price * fill.qty : fill.price * fill.qty

          grouped.set(fill.symbol, {
            realizedPnl: row.realizedPnl + signed,
            qty: row.qty + fill.qty,
            fills: row.fills + 1,
          })
        }

        const items = [...grouped.entries()].map(([symbol, row]) => ({ symbol, ...row }))

        if (items.length === 0) {
          return []
        }

        return ctx.fanout(attributeSymbol, items, 4)
      },
    },
  ],
  output: ({ results }) => results.attribute ?? null,
})

export const marketOpen = defineSchedule({
  name: 'market-open',
  description: 'Weekday open. Starts the default simulated sessions.',
  target: openBook,
  spec: cron('30 13 * * 1-5', { tz: 'UTC' }),
  input: ({ at }) => ({ at }),
})

export const endOfDay = defineSchedule({
  name: 'end-of-day',
  description: 'Weekday close. Attributes fills copied into D1.',
  target: eodRecon,
  spec: cron('5 20 * * 1-5', { tz: 'UTC' }),
  input: ({ at }) => ({ at }),
})
