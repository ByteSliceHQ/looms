export type Side = 'buy' | 'sell'
export type Venue = 'sim' | 'robinhood'
export type Strategy = 'momentum' | 'mean-revert'

export interface Level {
  readonly price: number
  readonly size: number
  readonly side: Side
}

export interface Quote {
  readonly symbol: string
  readonly tick: number
  readonly bid: number
  readonly ask: number
  readonly last: number
  readonly spread: number
  readonly depth: readonly Level[]
  readonly venue: Venue
}
