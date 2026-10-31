import { matchOrder, quoteAt, round } from '../market'
import type { Broker, BrokerOrder, BrokerResult } from './types'

function fromMatch(order: BrokerOrder, matched: ReturnType<typeof matchOrder>): BrokerResult {
  return {
    orderId: '',
    status: matched.status === 'rejected' ? 'rejected' : matched.status,
    reason: matched.reason,
    fills: matched.fills,
    vwap: matched.vwap,
    slippageBps: matched.slippageBps,
  }
}

export function simBroker(): Broker {
  return {
    quote(symbol, tick) {
      const quote = quoteAt(symbol, tick, 'sim')

      if (!quote) {
        return Promise.reject(new Error(`No simulated book for ${symbol}`))
      }

      return Promise.resolve(quote)
    },
    submit(order, clientOrderId) {
      const matched = matchOrder(order)
      return Promise.resolve({ ...fromMatch(order, matched), orderId: clientOrderId })
    },
    status(orderId) {
      return Promise.resolve({
        orderId,
        status: 'filled',
        reason: 'filled',
        fills: [],
        vwap: 0,
        slippageBps: 0,
      })
    },
    cancel() {
      return Promise.resolve()
    },
  }
}

export function slippageBps(side: BrokerOrder['side'], arrival: number, vwap: number): number {
  if (!(arrival > 0)) {
    return 0
  }

  const slip =
    side === 'buy' ? ((vwap - arrival) / arrival) * 10_000 : ((arrival - vwap) / arrival) * 10_000

  return round(slip, 2)
}
