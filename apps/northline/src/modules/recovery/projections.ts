import { z } from 'zod'

import { BookingConfirmed } from './events'
import { recoveryScope } from './scope'

const BookingState = z.object({
  booking: BookingConfirmed.nullable(),
})

export const booking = recoveryScope.projection({
  name: 'booking',
  shape: BookingState,
  initialState: { booking: null },
  reduce(state, event) {
    if (event.type !== 'recovery.booking.confirmed') {
      return state
    }

    return { booking: event.payload }
  },
})
