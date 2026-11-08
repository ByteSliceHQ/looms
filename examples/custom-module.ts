import { z } from 'zod'

import { createLooms } from '@swirls/looms/runtime'
import { defineWorkflow, workflow } from '@swirls/looms/workflow'

import { chargeAndAwait, chargeAuthorized, ledger, payments } from './payments-module'

// Domain module in a workflow: a step charges and parks, a signal confirms.
// bun run --filter @looms/examples custom-module

const checkout = defineWorkflow({
  name: 'checkout',
  input: z.object({ orderId: z.string(), amount: z.number() }),
  nodes: [
    {
      id: 'charge',
      run: (ctx) => ctx.effects(chargeAndAwait(`ch_${ctx.input.orderId}`, ctx.input.amount)),
    },
  ],
})

const looms = createLooms({
  modules: [workflow({ definitions: [checkout] }), payments],
})

const { runId, state } = await looms.start(checkout, { orderId: 'ord_1', amount: 40 })

console.log('status:', state.status)
console.log('ledger:', (await looms.project(runId, ledger)).charges)

// The provider's webhook would send this.
await looms.signal(runId, [chargeAuthorized('ch_ord_1', 40)])

console.log('status:', (await looms.getRun(runId)).status)
console.log('ledger:', (await looms.project(runId, ledger)).charges)

await looms.stop()
