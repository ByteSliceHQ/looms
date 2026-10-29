import { Effect } from 'effect'

import { defineModule, failEffect, onAdmit } from '@swirls/looms/core'

import { bookRecovery } from './effects'
import { booking } from './projections'
import { recoveryScope } from './scope'

export const recovery = defineModule(recoveryScope, () => ({
  effects: { book: bookRecovery },
  projections: { booking },
  admission: [
    onAdmit(bookRecovery, (input) => {
      if (input.status === 'delivered') {
        return failEffect({
          error: 'shipment is already delivered',
          nonRetryable: true,
        })
      }

      return Effect.void
    }),
  ],
}))
