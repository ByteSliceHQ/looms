import { z } from 'zod'

import { defineEventCatalog, defineModule, type EventOf } from '@swirls/looms/core'

const ChargeRequested = z.object({
  chargeId: z.string(),
  amount: z.number(),
  currency: z.string(),
})

const ChargeAuthorized = ChargeRequested

const ChargeDeclined = ChargeRequested.extend({
  reason: z.string(),
})

export const paymentsCatalog = defineEventCatalog('payments', {
  'charge.requested': ChargeRequested,
  'charge.authorized': ChargeAuthorized,
  'charge.declined': ChargeDeclined,
})

const ChargeInput = z.object({
  chargeId: z.string().optional(),
  amount: z.number(),
  currency: z.string().optional(),
  force: z.enum(['authorize', 'decline']).optional(),
})

type ChargeInput = z.infer<typeof ChargeInput>

const outcomes = new Map<string, 'authorized' | 'declined'>()

function decideOutcome(effectId: string, input: ChargeInput): 'authorized' | 'declined' {
  const cached = outcomes.get(effectId)

  if (cached) {
    return cached
  }

  const next = input.force === 'decline' || input.amount === 13 ? 'declined' : 'authorized'
  outcomes.set(effectId, next)
  return next
}

const LedgerEntrySchema = z.object({
  chargeId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['requested', 'authorized', 'declined']),
})

const LedgerSchema = z.object({
  entries: z.array(LedgerEntrySchema),
})

export type LedgerEntry = z.infer<typeof LedgerEntrySchema>

export const payments = defineModule(
  {
    namespace: 'payments',
    protocolVersion: '1.0.0',
    events: paymentsCatalog,
  },
  (m) => ({
    effects: {
      charge: m.effect({
        type: 'payments.charge',
        input: ChargeInput,
        execute: (input, ctx) => {
          const chargeId = input.chargeId ?? ctx.effectId
          const currency = input.currency ?? 'USD'
          const outcome = decideOutcome(ctx.effectId, input)

          return [
            {
              type: 'payments.charge.requested',
              payload: { chargeId, amount: input.amount, currency },
              threadId: ctx.threadId,
            },
            outcome === 'authorized'
              ? {
                  type: 'payments.charge.authorized',
                  payload: { chargeId, amount: input.amount, currency },
                  threadId: ctx.threadId,
                }
              : {
                  type: 'payments.charge.declined',
                  payload: { chargeId, amount: input.amount, currency, reason: 'card_declined' },
                  threadId: ctx.threadId,
                },
          ]
        },
      }),
    },
    projections: {
      ledger: m.projection({
        name: 'ledger',
        shape: LedgerSchema,
        initialState: { entries: [] },
        reduce(state, event) {
          switch (event.type) {
            case 'payments.charge.requested': {
              const { chargeId, amount, currency } = event.payload
              return {
                entries: [
                  ...state.entries.filter((entry) => entry.chargeId !== chargeId),
                  { chargeId, amount, currency, status: 'requested' },
                ],
              }
            }

            case 'payments.charge.authorized': {
              const { chargeId, amount, currency } = event.payload
              return {
                entries: [
                  ...state.entries.filter((entry) => entry.chargeId !== chargeId),
                  { chargeId, amount, currency, status: 'authorized' },
                ],
              }
            }

            case 'payments.charge.declined': {
              const { chargeId, amount, currency } = event.payload
              return {
                entries: [
                  ...state.entries.filter((entry) => entry.chargeId !== chargeId),
                  { chargeId, amount, currency, status: 'declined' },
                ],
              }
            }

            default:
              return state
          }
        },
      }),
    },
  }),
)

export const chargeEffect = payments.effects.charge
export const ledger = payments.projections.ledger
export type PaymentsEvent = EventOf<typeof payments>
