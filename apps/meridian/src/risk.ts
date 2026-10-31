import { unrealized, type Book } from './accounting'
import { orderNotional } from './limits'
import type { Limits } from './limits'
import type { Side, Venue } from './market'

export type RiskOutcome = 'passed' | 'soft_breach' | 'blocked'

export interface RiskInput {
  readonly venue: Venue
  readonly side: Side | 'flat'
  readonly qty: number
  readonly price: number
  readonly book: Book
  readonly dayNotional: number
  readonly limits: Limits
  readonly killed: boolean
}

export interface RiskDecision {
  readonly outcome: RiskOutcome
  readonly reason: string
}

export function assessRisk(input: RiskInput): RiskDecision {
  if (input.killed) {
    return { outcome: 'blocked', reason: 'kill switch' }
  }

  if (input.side === 'flat' || !(input.qty > 0)) {
    return { outcome: 'passed', reason: 'no order' }
  }

  const signed = input.side === 'buy' ? input.qty : -input.qty
  const next = input.book.position + signed
  const notional = orderNotional(input.qty, input.price)
  const drawdown = Math.max(0, -unrealized(input.book, input.price), -input.book.realizedPnl)

  if (Math.abs(next) > input.limits.maxPosition) {
    return { outcome: 'blocked', reason: 'position limit' }
  }

  if (drawdown > input.limits.maxDrawdown) {
    return { outcome: 'blocked', reason: 'drawdown' }
  }

  if (input.venue === 'robinhood' && notional > input.limits.maxOrderUsd) {
    return { outcome: 'blocked', reason: 'live order cap' }
  }

  if (input.venue === 'robinhood' && input.dayNotional + notional > input.limits.maxDayUsd) {
    return { outcome: 'blocked', reason: 'live day cap' }
  }

  if (input.venue === 'robinhood') {
    return { outcome: 'soft_breach', reason: 'live order' }
  }

  if (notional > input.limits.maxNotional) {
    return { outcome: 'soft_breach', reason: 'notional' }
  }

  return { outcome: 'passed', reason: 'within limits' }
}
