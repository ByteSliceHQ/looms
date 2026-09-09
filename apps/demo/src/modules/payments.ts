import {
  asJson,
  defineEffect,
  defineEventCatalog,
  defineProjection,
  defineRuntimeModule,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  type EventEnvelope,
  type JsonValue,
} from '@looms/core'
import { z } from 'zod'

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
  if (cached) return cached
  const next = input.force === 'decline' || input.amount === 13 ? 'declined' : 'authorized'
  outcomes.set(effectId, next)
  return next
}

export const chargeEffect = defineEffect({
  type: 'payments.charge',
  input: ChargeInput,
  execute: (input, ctx) => {
    const chargeId = input.chargeId ?? ctx.effectId
    const currency = input.currency ?? 'USD'
    const outcome = decideOutcome(ctx.effectId, input)
    
    return [
      {
        type: 'payments.charge.requested',
        payload: asJson({ chargeId, amount: input.amount, currency }),
        threadId: ctx.threadId
      },
      outcome === 'authorized'
        ? {
            type: 'payments.charge.authorized',
            payload: asJson({ chargeId, amount: input.amount, currency }),
            threadId: ctx.threadId,
          }
        : {
            type: 'payments.charge.declined',
            payload: asJson({ chargeId, amount: input.amount, currency, reason: 'card_declined' }),
            threadId: ctx.threadId,
          },
    ]
  },
})

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

function payloadObject(event: EventEnvelope): { [key: string]: JsonValue } {
  return isJsonObject(event.payload) ? event.payload : {}
}

export const ledger = defineProjection({
  name: 'ledger',
  shape: LedgerSchema,
  initialState: { entries: [] },
  reduce(state, event) {
    const payload = payloadObject(event)
    const chargeId = isJsonString(payload.chargeId) ? payload.chargeId : undefined
    if (!chargeId) return state
    const amount = isJsonNumber(payload.amount) ? payload.amount : 0
    const currency = isJsonString(payload.currency) ? payload.currency : 'USD'
    const upsert = (status: LedgerEntry['status']) => ({
      entries: [
        ...state.entries.filter((entry) => entry.chargeId !== chargeId),
        { chargeId, amount, currency, status },
      ],
    })
    switch (event.type) {
      case 'payments.charge.requested':
        return upsert('requested')
      case 'payments.charge.authorized':
        return upsert('authorized')
      case 'payments.charge.declined':
        return upsert('declined')
      default:
        return state
    }
  },
})

export function payments() {
  return defineRuntimeModule({
    namespace: 'payments',
    protocolVersion: '1.0.0',
    events: paymentsCatalog,
    effects: { charge: chargeEffect },
    projections: { ledger },
  })
}
