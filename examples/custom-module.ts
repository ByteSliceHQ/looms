import { z } from 'zod'

import { createWaitId, defineModule, invoke, wait } from '@swirls/looms/core'
import { createLooms } from '@swirls/looms/runtime'
import { defineWorkflow, workflow } from '@swirls/looms/workflow'

// Domain module: events, an effect, a projection — then a workflow that uses them.
// bun run --filter @looms/examples custom-module

const Charge = z.object({
  chargeId: z.string(),
  amount: z.number(),
})

const payments = defineModule(
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

const { charge } = payments.effects
const { ledger } = payments.projections

const checkout = defineWorkflow({
  name: 'checkout',
  input: z.object({ amount: z.number() }),
  nodes: [
    {
      id: 'charge',
      run: (ctx) =>
        ctx.effects([
          invoke(charge, { amount: ctx.input.amount }),
          wait({
            waitId: createWaitId(ctx.nodeId, 'authorized'),
            on: { type: 'payments.charge.authorized' },
          }),
        ]),
    },
  ],
})

const looms = createLooms({
  modules: [workflow({ definitions: [checkout] }), payments],
})

const { runId, state } = await looms.start(checkout, { amount: 40 })
const book = await looms.project(runId, ledger)

console.log('status:', state.status)
console.log('ledger:', book.entries)

await looms.stop()
