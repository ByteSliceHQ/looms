import { z } from 'zod'

import { SignalReady } from './events'
import { signalsScope } from './scope'

const Tape = z.object({
  latest: SignalReady.nullable(),
  count: z.number(),
})

export const signalTape = signalsScope.projection({
  name: 'signal-tape',
  shape: Tape,
  initialState: { latest: null, count: 0 },
  reduce(state, event) {
    if (event.type !== 'signals.signal.ready') {
      return state
    }

    return { latest: event.payload, count: state.count + 1 }
  },
})
