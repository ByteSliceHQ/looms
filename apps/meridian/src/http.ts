import { z } from 'zod'

import { Limits } from './limits'

export type { DailyFill } from './modules/ledger/events'

export const ReplicaCopy = z.object({
  replicatedSeq: z.number().int().nonnegative(),
  finished: z.boolean(),
  complete: z.boolean(),
  purgedAt: z.number().nullable(),
})

export const ReplicaView = z.object({
  attached: z.boolean(),
  copy: ReplicaCopy.nullable(),
})
export type ReplicaView = z.infer<typeof ReplicaView>

export const SessionStatus = z.enum(['running', 'waiting', 'completed', 'failed', 'cancelled'])
export type SessionStatus = z.infer<typeof SessionStatus>

export const SessionRecord = z.object({
  id: z.string(),
  runId: z.string(),
  symbol: z.string(),
  strategy: z.enum(['momentum', 'mean-revert']),
  venue: z.enum(['sim', 'robinhood']),
  status: SessionStatus,
  openedAt: z.number(),
  position: z.number(),
  realizedPnl: z.number(),
  parentRunId: z.string().nullable(),
})
export type SessionRecord = z.infer<typeof SessionRecord>

export const StartSessionInput = z.object({
  symbol: z.string(),
  strategy: z.enum(['momentum', 'mean-revert']),
  venue: z.enum(['sim', 'robinhood']),
  cycles: z.number().int().positive().max(40),
  intervalMs: z.number().nonnegative(),
  limits: Limits.optional(),
})
export type StartSessionInput = z.infer<typeof StartSessionInput>

export const OrderRecord = z.object({
  id: z.string(),
  runId: z.string(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.number(),
  price: z.number(),
  status: z.string(),
  slippageBps: z.number(),
  venue: z.enum(['sim', 'robinhood']),
  ts: z.number(),
})
export type OrderRecord = z.infer<typeof OrderRecord>

export const ApprovalRecord = z.object({
  approvalId: z.string(),
  runId: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
})
export type ApprovalRecord = z.infer<typeof ApprovalRecord>

export const DeskOverview = z.object({
  killed: z.boolean(),
  live: z.boolean(),
  maxOrderUsd: z.number(),
  maxDayUsd: z.number(),
  position: z.number(),
  realizedPnl: z.number(),
  openOrders: z.number(),
  lastOrder: z.string(),
  sessions: z.array(SessionRecord),
  orders: z.array(OrderRecord),
  approvals: z.array(ApprovalRecord),
  analystRunId: z.string().nullable(),
  openRunId: z.string(),
  eodRunId: z.string(),
})
export type DeskOverview = z.infer<typeof DeskOverview>

export const AnalystMessage = z.object({
  text: z.string().trim().min(1),
})

export const SessionDetail = z.object({
  session: SessionRecord,
  replica: ReplicaView,
})
export type SessionDetail = z.infer<typeof SessionDetail>

export const RunRef = z.object({
  runId: z.string(),
})

export const QuoteWire = z.object({
  symbol: z.string(),
  tick: z.number(),
  bid: z.number(),
  ask: z.number(),
  last: z.number(),
  spread: z.number(),
  venue: z.enum(['sim', 'robinhood']),
})
