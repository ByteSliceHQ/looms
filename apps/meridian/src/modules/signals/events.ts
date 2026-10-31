import { z } from 'zod'

import { defineEventCatalog } from '@swirls/looms/core'

export const SignalInput = z.object({
  symbol: z.string(),
  strategy: z.enum(['momentum', 'mean-revert']),
  prices: z.array(z.number()),
  imbalance: z.number(),
  tick: z.number().int(),
})
export type SignalInput = z.infer<typeof SignalInput>

export const SignalReady = z.object({
  symbol: z.string(),
  strategy: z.enum(['momentum', 'mean-revert']),
  side: z.enum(['buy', 'sell', 'flat']),
  strength: z.number(),
  momentum: z.number(),
  zScore: z.number(),
  imbalance: z.number(),
  tick: z.number().int(),
})
export type SignalReady = z.infer<typeof SignalReady>

export const signalsEvents = defineEventCatalog('signals', {
  'signal.ready': SignalReady,
})
