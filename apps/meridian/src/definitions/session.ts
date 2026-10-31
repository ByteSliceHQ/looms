import { z } from 'zod'

import { defineWorkflow } from '@swirls/looms/workflow'

import { OPENING_CASH } from '../accounting'
import { Limits } from '../limits'
import { SYMBOLS, isSymbol } from '../market'
import { CycleOutput, tradeCycle } from './cycle'

export const SessionInput = z.object({
  symbol: z.string(),
  strategy: z.enum(['momentum', 'mean-revert']),
  venue: z.enum(['sim', 'robinhood']),
  cycles: z.number().int().positive().max(40),
  intervalMs: z.number().nonnegative(),
  seedTick: z.number().int().nonnegative().optional(),
  prices: z.array(z.number()).optional(),
  limits: Limits,
  lot: z.number().positive(),
})
export type SessionInput = z.infer<typeof SessionInput>

export function sessionLot(symbol: string): number {
  return isSymbol(symbol) ? Math.max(1, SYMBOLS[symbol].lot / 4) : 10
}

export const tradeSession = defineWorkflow({
  name: 'trade-session',
  description: 'Run a strategy for a fixed number of cycles on one symbol',
  input: SessionInput,
  childExecution: 'thread',
  nodes: [
    {
      id: 'cycles',
      run: (ctx) => {
        const previous = CycleOutput.safeParse(ctx.iteration?.previous)
        const index = ctx.iteration?.index ?? 0

        if (index >= ctx.input.cycles) {
          return previous.success
            ? previous.data
            : {
                tick: ctx.input.seedTick ?? 0,
                prices: [],
                position: 0,
                avgCost: 0,
                cash: OPENING_CASH,
                realizedPnl: 0,
                dayNotional: 0,
                status: 'done',
              }
        }

        const carried = previous.success ? previous.data : undefined
        const tick = (ctx.input.seedTick ?? 0) + index

        return ctx.loop(
          tradeCycle,
          {
            symbol: ctx.input.symbol,
            strategy: ctx.input.strategy,
            venue: ctx.input.venue,
            tick,
            intervalMs: ctx.input.intervalMs,
            prices: carried?.prices ?? ctx.input.prices ?? [],
            position: carried?.position ?? 0,
            avgCost: carried?.avgCost ?? 0,
            cash: carried?.cash ?? OPENING_CASH,
            realizedPnl: carried?.realizedPnl ?? 0,
            dayNotional: carried?.dayNotional ?? 0,
            limits: ctx.input.limits,
            lot: ctx.input.lot,
          },
          { maxIterations: ctx.input.cycles },
        )
      },
    },
  ],
  output: ({ results }) => results.cycles ?? null,
})
