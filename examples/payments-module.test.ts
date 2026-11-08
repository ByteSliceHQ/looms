import { expect, test } from 'bun:test'

import { z } from 'zod'

import { createLooms } from '@swirls/looms/runtime'
import { moduleConformance } from '@swirls/looms/testing'
import { defineWorkflow, workflow } from '@swirls/looms/workflow'

import { chargeAndAwait, chargeAuthorized, ledger, payments } from './payments-module'

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

test('the payments module passes conformance', () => {
  expect(moduleConformance(payments)).toEqual([])
})

test('a checkout parks on its charge until the provider webhook signals', async () => {
  const looms = createLooms({ modules: [workflow({ definitions: [checkout] }), payments] })

  try {
    const { runId, state } = await looms.start(checkout, { orderId: 'ord_1', amount: 40 })

    expect(state.status).toBe('running')

    expect(await looms.project(runId, ledger)).toEqual({
      charges: { ch_ord_1: { amount: 40, status: 'requested' } },
    })

    await looms.signal(runId, [chargeAuthorized('ch_ord_1', 40)])

    expect((await looms.getRun(runId)).status).toBe('completed')

    expect(await looms.project(runId, ledger)).toEqual({
      charges: { ch_ord_1: { amount: 40, status: 'authorized' } },
    })
  } finally {
    await looms.stop()
  }
})
