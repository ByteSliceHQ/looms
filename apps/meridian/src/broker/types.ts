import type { Quote, Side } from '../market'

export interface BrokerOrder {
  readonly symbol: string
  readonly side: Side
  readonly qty: number
  readonly tick: number
  readonly arrivalPrice: number
}

export interface BrokerFill {
  readonly price: number
  readonly qty: number
}

export type BrokerStatus = 'filled' | 'partial' | 'rejected' | 'working'

export interface BrokerResult {
  readonly orderId: string
  readonly status: BrokerStatus
  readonly reason: string
  readonly fills: readonly BrokerFill[]
  readonly vwap: number
  readonly slippageBps: number
}

export interface Broker {
  quote(symbol: string, tick: number): Promise<Quote>
  submit(order: BrokerOrder, clientOrderId: string): Promise<BrokerResult>
  status(orderId: string): Promise<BrokerResult>
  cancel(orderId: string): Promise<void>
}
