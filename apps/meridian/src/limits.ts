import { z } from 'zod'

export const TICK_MS = 250
export const LIVE_MIN_INTERVAL_MS = 5_000

export const Limits = z.object({
  maxPosition: z.number().positive(),
  maxNotional: z.number().positive(),
  maxDrawdown: z.number().positive(),
  maxOrderUsd: z.number().positive(),
  maxDayUsd: z.number().positive(),
})
export type Limits = z.infer<typeof Limits>

export const SIM_LIMITS: Limits = {
  maxPosition: 500,
  maxNotional: 50_000,
  maxDrawdown: 25_000,
  maxOrderUsd: 25,
  maxDayUsd: 100,
}

export function tickAt(ms: number): number {
  return Math.floor(ms / TICK_MS)
}

export function orderNotional(qty: number, price: number): number {
  return Math.abs(qty * price)
}
