import { LIVE_MIN_INTERVAL_MS } from './limits'
import { isLiveSymbol, isSymbol } from './market'

export function admitVenue(input: {
  readonly symbol: string
  readonly venue: 'sim' | 'robinhood'
  readonly intervalMs: number
  readonly liveEnabled: boolean
  readonly configured: boolean
}): { ok: true } | { ok: false; reason: string } {
  if (!isSymbol(input.symbol)) {
    return { ok: false, reason: 'unknown symbol' }
  }

  if (input.venue === 'sim') {
    return { ok: true }
  }

  if (!input.configured || !input.liveEnabled) {
    return { ok: false, reason: 'live trading is off' }
  }

  if (!isLiveSymbol(input.symbol)) {
    return { ok: false, reason: 'that symbol is not on the live venue' }
  }

  if (input.intervalMs < LIVE_MIN_INTERVAL_MS) {
    return { ok: false, reason: 'live orders need at least five seconds between cycles' }
  }

  return { ok: true }
}
