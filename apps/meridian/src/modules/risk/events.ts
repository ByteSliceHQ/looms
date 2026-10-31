import { z } from 'zod'

import { defineEventCatalog } from '@swirls/looms/core'

import { Limits } from '../../limits'

export const RiskInput = z.object({
  symbol: z.string(),
  venue: z.enum(['sim', 'robinhood']),
  side: z.enum(['buy', 'sell', 'flat']),
  qty: z.number(),
  price: z.number(),
  position: z.number(),
  avgCost: z.number(),
  cash: z.number(),
  realizedPnl: z.number(),
  dayNotional: z.number(),
  limits: Limits,
  tick: z.number().int(),
})
export type RiskInput = z.infer<typeof RiskInput>

export const RiskChecked = z.object({
  symbol: z.string(),
  outcome: z.enum(['passed', 'soft_breach', 'blocked']),
  reason: z.string(),
  side: z.enum(['buy', 'sell', 'flat']),
  qty: z.number(),
  price: z.number(),
  tick: z.number().int(),
})
export type RiskChecked = z.infer<typeof RiskChecked>

export const riskEvents = defineEventCatalog('risk', {
  'check.passed': RiskChecked,
  'check.soft_breach': RiskChecked,
  'check.blocked': RiskChecked,
  'check.completed': RiskChecked,
})
