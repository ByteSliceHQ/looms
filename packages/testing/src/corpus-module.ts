import { Option, Schema } from 'effect'

import {
  complete,
  defineEffect,
  defineEventCatalog,
  defineRuntimeModule,
  defineThread,
  fail,
  invoke,
  payload,
  wait,
  type EventInput,
  type JsonValue,
} from '@looms/core'

/**
 * A small production-shaped module used to record and replay the upgrade-safety corpus.
 * Keep its event and effect contracts stable; add a new type when meaning changes.
 */
export const corpusDefinition = {
  kind: 'corpus.checkout',
  name: 'checkout',
  version: 'v1',
}

export const corpusChargeV1 = 'payments.charge'
export const corpusChargeV2 = 'payments.charge@v2'

const DecisionSchema = Schema.Union([Schema.Literal('approve'), Schema.Literal('reject')])
const ApprovedPayloadSchema = Schema.Struct({ decision: DecisionSchema })
const CheckoutInputSchema = Schema.Finite
const decodeApproved = Schema.decodeUnknownOption(ApprovedPayloadSchema)
const decodeCheckoutInput = Schema.decodeUnknownOption(CheckoutInputSchema)

export function corpusModule(options?: {
  readonly charge?: (input: JsonValue) => ReadonlyArray<EventInput>
}) {
  const charge = defineEffect({
    type: corpusChargeV1,
    retry: {
      maxAttempts: 3,
      backoffMs: 1,
      scheduleToStartTimeoutMs: 60_000,
      startToCloseTimeoutMs: 60_000,
    },
    execute: options?.charge,
  })

  const chargeV2 = defineEffect({
    type: corpusChargeV2,
    retry: {
      maxAttempts: 1,
      scheduleToStartTimeoutMs: 60_000,
      startToCloseTimeoutMs: 60_000,
    },
    execute: options?.charge,
  })

  return defineRuntimeModule({
    namespace: 'corpus',
    protocolVersion: '1.0.0',
    events: defineEventCatalog('corpus', {
      charged: payload<{ amount: number; version: string }>(),
      approved: payload<{ decision: 'approve' | 'reject' }>(),
    }),
    effects: { charge, chargeV2 },
    threads: {
      'corpus.checkout': defineThread({
        kind: 'corpus.checkout',
        shape: Schema.Struct({
          amount: Schema.Finite,
          charged: Schema.Boolean,
          decision: Schema.NullOr(DecisionSchema),
        }),
        initialState: (ctx) => {
          const decision: 'approve' | 'reject' | null = null

          return {
            amount: Option.getOrElse(decodeCheckoutInput(ctx.input), () => 0),
            charged: false,
            decision,
          }
        },
        step: (state, event) => {
          if (event.type === 'corpus.approved') {
            return Option.match(decodeApproved(event.payload), {
              onNone: () => state,
              onSome: ({ decision }) => ({ ...state, decision }),
            })
          }

          if (event.type === 'corpus.charged') {
            return { ...state, charged: true }
          }

          return state
        },
        effects: (state) => {
          if (state.decision === 'reject') {
            return [fail('rejected')]
          }

          if (state.decision === null) {
            return [
              wait({
                waitId: 'approval',
                on: { type: 'corpus.approved' },
              }),
            ]
          }

          if (!state.charged) {
            return [invoke(charge, { amount: state.amount }, 'charge')]
          }

          return [complete({ amount: state.amount, ok: true })]
        },
      }),
    },
    definitions: [corpusDefinition],
  })
}
