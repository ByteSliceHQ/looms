import { z } from 'zod'

import { defineEventCatalog } from '@swirls/looms/core'

import { Limits } from '../../limits'

export const SubmitInput = z.object({
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.number().positive(),
  tick: z.number().int(),
  arrivalPrice: z.number().positive(),
  venue: z.enum(['sim', 'robinhood']),
  position: z.number(),
  avgCost: z.number(),
  cash: z.number(),
  realizedPnl: z.number(),
  dayNotional: z.number(),
  limits: Limits,
})
export type SubmitInput = z.infer<typeof SubmitInput>

export const OrderStatus = z.enum(['filled', 'partial', 'rejected', 'working'])

export const OrderClosed = z.object({
  clientOrderId: z.string(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.number(),
  requestedQty: z.number(),
  price: z.number(),
  vwap: z.number(),
  slippageBps: z.number(),
  venue: z.enum(['sim', 'robinhood']),
  tick: z.number(),
  status: OrderStatus,
  reason: z.string(),
  position: z.number(),
  avgCost: z.number(),
  cash: z.number(),
  realizedPnl: z.number(),
  dayNotional: z.number(),
})
export type OrderClosed = z.infer<typeof OrderClosed>

export const OrderAccepted = z.object({
  clientOrderId: z.string(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.number(),
  venue: z.enum(['sim', 'robinhood']),
})

export const OrderFill = z.object({
  clientOrderId: z.string(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.number(),
  price: z.number(),
  venue: z.enum(['sim', 'robinhood']),
})

export const executionEvents = defineEventCatalog('execution', {
  'order.accepted': OrderAccepted,
  'order.partially_filled': OrderFill,
  'order.filled': OrderFill,
  'order.rejected': OrderClosed,
  'order.working': OrderClosed,
  'order.closed': OrderClosed,
})
