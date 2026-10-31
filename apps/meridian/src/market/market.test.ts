import { describe, expect, test } from 'bun:test'

import { imbalance, matchOrder, quoteAt } from './book'

describe('simulated book', () => {
  test('the same tick is the same book', () => {
    expect(quoteAt('NVDA', 1_000)).toEqual(quoteAt('NVDA', 1_000))
    expect(quoteAt('NVDA', 1_000)).not.toEqual(quoteAt('NVDA', 1_001))
  })

  test('a small order fills at the touch and a large order walks the book', () => {
    const touch = quoteAt('NVDA', 40)
    expect(touch).toBeDefined()

    const small = matchOrder({
      symbol: 'NVDA',
      side: 'buy',
      qty: 10,
      tick: 40,
      arrivalPrice: touch?.ask ?? 1,
    })

    const large = matchOrder({
      symbol: 'NVDA',
      side: 'buy',
      qty: 10_000,
      tick: 40,
      arrivalPrice: touch?.ask ?? 1,
    })

    expect(small).toEqual(
      matchOrder({
        symbol: 'NVDA',
        side: 'buy',
        qty: 10,
        tick: 40,
        arrivalPrice: touch?.ask ?? 1,
      }),
    )

    expect(small.status).toBe('filled')
    expect(small.fills).toHaveLength(1)
    expect(small.fills[0]?.price).toBe(touch?.ask)
    expect(large.status).toBe('partial')
    expect(large.fills.length).toBeGreaterThan(1)
    expect(large.vwap).toBeGreaterThan(small.vwap)
  })

  test('depth imbalance is between -1 and 1', () => {
    const quote = quoteAt('AAPL', 12)
    expect(quote).toBeDefined()

    if (quote) {
      const value = imbalance(quote)
      expect(value).toBeGreaterThanOrEqual(-1)
      expect(value).toBeLessThanOrEqual(1)
    }
  })
})
