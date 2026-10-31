import { z } from 'zod'

import { defineEventCatalog } from '@swirls/looms/core'

export const DailyFill = z.object({
  runId: z.string(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.number(),
  price: z.number(),
  ts: z.number(),
})
export type DailyFill = z.infer<typeof DailyFill>

export const DailyFillsInput = z.object({
  at: z.number(),
})

export const DailyFillsReady = z.object({
  at: z.number(),
  fills: z.array(DailyFill),
})

export const DeskReady = z.object({
  killed: z.boolean(),
  position: z.number(),
  realizedPnl: z.number(),
  openOrders: z.number(),
  lastOrder: z.string(),
})

export const SessionOpened = z.object({
  runId: z.string().nullable(),
  reason: z.string(),
})

export const SessionHalted = z.object({
  runId: z.string(),
  halted: z.boolean(),
  reason: z.string(),
})

export const SessionStartInput = z.object({
  symbol: z.string(),
  strategy: z.enum(['momentum', 'mean-revert']),
  venue: z.enum(['sim', 'robinhood']),
  cycles: z.number().int().positive(),
  intervalMs: z.number().nonnegative(),
})

export const SessionHaltInput = z.object({
  runId: z.string(),
})

export const ledgerEvents = defineEventCatalog('ledger', {
  'daily_fills.ready': DailyFillsReady,
  'desk.ready': DeskReady,
  'session.opened': SessionOpened,
  'session.halted': SessionHalted,
})
