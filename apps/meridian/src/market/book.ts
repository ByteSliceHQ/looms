import type { Level, Quote, Side, Venue } from './types'

export interface SymbolSpec {
  readonly anchor: number
  readonly spread: number
  readonly phase: number
  /** Size posted at the touch, before the ladder thins out. */
  readonly lot: number
}

export const SYMBOLS = {
  NVDA: { anchor: 140, spread: 0.04, phase: 0.4, lot: 80 },
  AAPL: { anchor: 230, spread: 0.02, phase: 1.1, lot: 120 },
  MSFT: { anchor: 430, spread: 0.05, phase: 2.2, lot: 60 },
  AMZN: { anchor: 190, spread: 0.03, phase: 0.8, lot: 90 },
  META: { anchor: 580, spread: 0.08, phase: 1.7, lot: 40 },
  AMD: { anchor: 160, spread: 0.03, phase: 2.8, lot: 100 },
  'BTC-USD': { anchor: 67_000, spread: 8, phase: 0.2, lot: 2 },
  'ETH-USD': { anchor: 2_600, spread: 0.4, phase: 1.4, lot: 12 },
  'SOL-USD': { anchor: 170, spread: 0.06, phase: 2.5, lot: 40 },
} as const satisfies Record<string, SymbolSpec>

export const SIM_SYMBOLS = ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'META', 'AMD'] as const
export const LIVE_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD'] as const

export type SimSymbol = (typeof SIM_SYMBOLS)[number]
export type LiveSymbol = (typeof LIVE_SYMBOLS)[number]

export function isSymbol(symbol: string): symbol is keyof typeof SYMBOLS {
  return Object.hasOwn(SYMBOLS, symbol)
}

export function isLiveSymbol(symbol: string): symbol is LiveSymbol {
  switch (symbol) {
    case 'BTC-USD':
    case 'ETH-USD':
    case 'SOL-USD':
      return true
    default:
      return false
  }
}

export function round(value: number, digits = 4): number {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

function hash(text: string): number {
  let value = 2_166_136_261

  for (let index = 0; index < text.length; index += 1) {
    value = Math.imul(value ^ text.charCodeAt(index), 16_777_619)
  }

  return value >>> 0
}

/** One uniform draw in [0, 1) from a seed. Same seed, same draw. */
function unit(seed: number): number {
  let value = seed | 0
  value = (value + 0x6d2b79f5) | 0
  let mixed = Math.imul(value ^ (value >>> 15), 1 | value)
  mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
  return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296
}

export function quoteAt(symbol: string, tick: number, venue: Venue = 'sim'): Quote | undefined {
  if (!isSymbol(symbol) || !Number.isInteger(tick)) {
    return undefined
  }

  const spec = SYMBOLS[symbol]
  const wave = Math.sin(tick / 48 + spec.phase)
  const noise = unit(hash(symbol) ^ (tick >>> 0)) - 0.5
  const jumpRoll = unit(hash(`${symbol}:jump`) ^ (tick >>> 0))

  const jump =
    jumpRoll < 0.03 ? (unit(hash(`${symbol}:size`) ^ (tick >>> 0)) - 0.5) * spec.anchor * 0.008 : 0

  const last = round(spec.anchor * (1 + 0.004 * wave) + noise * spec.spread * 2 + jump)
  const bid = round(last - spec.spread / 2)
  const ask = round(last + spec.spread / 2)
  const depth: Level[] = []

  for (let level = 0; level < 5; level += 1) {
    const size = Math.max(1, Math.round(spec.lot * (1 - level * 0.15) * 100) / 100)
    depth.push({ price: round(bid - level * spec.spread), size, side: 'buy' })
    depth.push({ price: round(ask + level * spec.spread), size, side: 'sell' })
  }

  return { symbol, tick, bid, ask, last, spread: round(ask - bid), depth, venue }
}

export function imbalance(quote: Quote): number {
  let bid = 0
  let ask = 0

  for (const level of quote.depth) {
    if (level.side === 'buy') {
      bid += level.size
    } else {
      ask += level.size
    }
  }

  const total = bid + ask
  return total === 0 ? 0 : round((bid - ask) / total, 4)
}

export interface MatchFill {
  readonly price: number
  readonly qty: number
}

export interface Match {
  readonly status: 'filled' | 'partial' | 'rejected'
  readonly reason: string
  readonly fills: readonly MatchFill[]
  readonly vwap: number
  readonly slippageBps: number
  readonly leaves: number
}

export function matchOrder(order: {
  readonly symbol: string
  readonly side: Side
  readonly qty: number
  readonly tick: number
  readonly arrivalPrice: number
}): Match {
  const quote = quoteAt(order.symbol, order.tick)

  const empty = {
    status: 'rejected' as const,
    fills: [],
    vwap: 0,
    slippageBps: 0,
    leaves: order.qty,
  }

  if (!quote || !(order.qty > 0) || !(order.arrivalPrice > 0)) {
    return { ...empty, reason: 'no book' }
  }

  const resting = order.side === 'buy' ? 'sell' : 'buy'

  const levels = quote.depth
    .filter((level) => level.side === resting)
    .toSorted((left, right) =>
      order.side === 'buy' ? left.price - right.price : right.price - left.price,
    )

  const fills: MatchFill[] = []
  let left = order.qty

  for (const level of levels) {
    if (left <= 0) {
      break
    }

    const take = round(Math.min(left, level.size), 8)
    fills.push({ price: level.price, qty: take })
    left = round(left - take, 8)
  }

  if (fills.length === 0) {
    return { ...empty, reason: 'empty book' }
  }

  const filled = round(order.qty - left, 8)
  const notional = fills.reduce((sum, fill) => sum + fill.price * fill.qty, 0)
  const vwap = notional / filled

  const slip =
    order.side === 'buy'
      ? ((vwap - order.arrivalPrice) / order.arrivalPrice) * 10_000
      : ((order.arrivalPrice - vwap) / order.arrivalPrice) * 10_000

  return {
    status: left > 0 ? 'partial' : 'filled',
    reason: left > 0 ? 'book exhausted' : 'filled',
    fills,
    vwap: round(vwap),
    slippageBps: round(slip, 2),
    leaves: left,
  }
}
