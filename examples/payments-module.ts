import { z } from 'zod'

import { defineModule, invoke, wait } from '@swirls/looms/core'

const Charge = z.object({
  chargeId: z.string(),
  amount: z.number(),
})

const Ledger = z.object({
  charges: z.record(
    z.string(),
    z.object({ amount: z.number(), status: z.enum(['requested', 'authorized']) }),
  ),
})

type Ledger = z.infer<typeof Ledger>

export const payments = defineModule(
  {
    namespace: 'payments',
    protocolVersion: '1.0.0',
    description: 'Card charges and the ledger folded from them.',
    // Events: facts in the run log, named in the past tense.
    events: {
      'charge.requested': Charge,
      'charge.authorized': Charge,
    },
  },
  (m) => {
    // Effect: work the host performs. It submits the charge and records that it did.
    const charge = m.effect({
      type: 'payments.charge',
      placement: 'local',
      input: Charge,
      execute: (input) => [{ type: 'payments.charge.requested', payload: input }],
    })

    return {
      effects: { charge },

      // Signals: events from outside the run. The provider's webhook confirms a charge.
      signals: {
        chargeAuthorized: m.signal({
          input: Charge,
          build: (input) => m.input('charge.authorized', input),
        }),
      },

      // Steps: effects a thread or workflow node returns. Charge, then park until confirmed.
      steps: {
        chargeAndAwait: (chargeId: string, amount: number) => [
          invoke(charge, { chargeId, amount }),
          wait({
            waitId: `charge_${chargeId}`,
            on: { type: 'payments.charge.authorized', match: { chargeId } },
          }),
        ],
      },

      // Projection: state folded from events, for UIs and queries.
      projections: {
        ledger: m.projection({
          name: 'ledger',
          shape: Ledger,
          initialState: { charges: {} },
          reduce(state, event): Ledger {
            if (
              event.type !== 'payments.charge.requested' &&
              event.type !== 'payments.charge.authorized'
            ) {
              return state
            }

            const { chargeId, amount } = event.payload
            const status = event.type === 'payments.charge.requested' ? 'requested' : 'authorized'

            return { charges: { ...state.charges, [chargeId]: { amount, status } } }
          },
        }),
      },

      // Examples: traces moduleConformance folds against the projections.
      examples: [
        {
          name: 'a webhook authorizes a requested charge',
          events: [
            m.input('charge.requested', { chargeId: 'ch_1', amount: 40 }),
            m.input('charge.authorized', { chargeId: 'ch_1', amount: 40 }),
          ],
          projections: {
            ledger: { charges: { ch_1: { amount: 40, status: 'authorized' } } },
          },
        },
      ],
    }
  },
)

export const { charge } = payments.effects
export const { chargeAuthorized } = payments.signals
export const { chargeAndAwait } = payments.steps
export const { ledger } = payments.projections
