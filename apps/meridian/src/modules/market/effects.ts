import { liveQuote } from '../../broker/robinhood'
import { quoteAt } from '../../market'
import { SnapshotInput, marketEvents } from './events'
import { marketScope } from './scope'

export const takeSnapshot = marketScope.effect({
  type: 'market.snapshot',
  placement: 'local',
  input: SnapshotInput,
  execute: (input) => {
    if (input.venue === 'robinhood') {
      return liveQuote(input.symbol, input.tick).then((quote) => [
        marketEvents.input('snapshot.recorded', {
          ...quote,
          depth: quote.depth.map((level) => ({ ...level })),
        }),
      ])
    }

    const quote = quoteAt(input.symbol, input.tick, 'sim')

    if (!quote) {
      throw new Error(`No book for ${input.symbol}`)
    }

    return [
      marketEvents.input('snapshot.recorded', {
        ...quote,
        depth: quote.depth.map((level) => ({ ...level })),
      }),
    ]
  },
})
