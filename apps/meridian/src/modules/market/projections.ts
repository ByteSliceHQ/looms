import { z } from 'zod'

import { SnapshotRecorded } from './events'
import { marketScope } from './scope'

const LastQuote = z.object({
  quote: SnapshotRecorded.nullable(),
})

export const lastQuote = marketScope.projection({
  name: 'last-quote',
  shape: LastQuote,
  initialState: { quote: null },
  reduce(state, event) {
    if (event.type !== 'market.snapshot.recorded') {
      return state
    }

    return { quote: event.payload }
  },
})
