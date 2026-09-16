import { z } from 'zod'

import { defineModule } from '@swirls/looms/core'

const Charge = z.object({
  chargeId: z.string(),
  amount: z.number(),
})

export const payments = defineModule(
  {
    namespace: 'payments',
    protocolVersion: '1.0.0',
    events: {
      'charge.requested': Charge,
      'charge.authorized': Charge,
    },
  },
  (m) => ({
    effects: {
      charge: m.effect({
        type: 'payments.charge',
        input: z.object({ amount: z.number() }),
        execute: (input, ctx) => [
          {
            type: 'payments.charge.requested',
            payload: { chargeId: ctx.effectId, amount: input.amount },
          },
          {
            type: 'payments.charge.authorized',
            payload: { chargeId: ctx.effectId, amount: input.amount },
          },
        ],
      }),
    },
    projections: {
      ledger: m.projection({
        name: 'ledger',
        shape: z.object({
          entries: z.array(Charge),
        }),
        initialState: { entries: [] },
        reduce(state, event) {
          if (event.type !== 'payments.charge.authorized') {
            return state
          }

          return { entries: [...state.entries, event.payload] }
        },
      }),
    },
  }),
)

export const { charge } = payments.effects
export const { ledger } = payments.projections
