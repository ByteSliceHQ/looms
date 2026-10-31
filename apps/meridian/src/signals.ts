import { round } from './market'
import type { Strategy } from './market'

export interface Signal {
  readonly side: 'buy' | 'sell' | 'flat'
  readonly strength: number
  readonly momentum: number
  readonly zScore: number
  readonly imbalance: number
}

export function signalFor(
  strategy: Strategy,
  prices: readonly number[],
  bookImbalance: number,
): Signal {
  const last = prices.at(-1) ?? 0
  const window = prices.slice(0, -1)

  const mean =
    window.length === 0 ? last : window.reduce((sum, price) => sum + price, 0) / window.length

  const variance =
    window.length === 0
      ? 0
      : window.reduce((sum, price) => sum + (price - mean) ** 2, 0) / window.length

  const deviation = Math.sqrt(variance)
  const momentum = round(last - mean)
  const zScore = deviation === 0 ? 0 : round((last - mean) / deviation, 4)
  const strength = round(Math.min(1, Math.abs(zScore) / 2 + Math.abs(bookImbalance) / 2), 4)
  const directional = strategy === 'momentum' ? momentum >= 0 : momentum < 0

  if (prices.length < 2 || strength < 0.05) {
    return { side: 'flat', strength, momentum, zScore, imbalance: bookImbalance }
  }

  return {
    side: directional ? 'buy' : 'sell',
    strength,
    momentum,
    zScore,
    imbalance: bookImbalance,
  }
}

export function orderQty(strength: number, lot: number): number {
  return round(Math.max(lot / 10, strength * lot), 4)
}
