import { z } from 'zod'

import { gate } from '@swirls/looms/approval'
import {
  createWaitId,
  invoke,
  isJsonObject,
  isJsonString,
  wait,
  type JsonValue,
} from '@swirls/looms/core'
import { defineWorkflow } from '@swirls/looms/workflow'

import { ShipmentSchema } from '../catalog'
import { sendNotice } from '../modules/notices'
import { bookRecovery } from '../modules/recovery'
import { lookupShipment } from '../modules/shipments'
import { classifyException } from './classify'

export const RecoverInput = z.object({
  shipmentId: z.string(),
  openedBy: z.string(),
})
export type RecoverInput = z.infer<typeof RecoverInput>

const Scored = z.object({
  route: z.string(),
  reason: z.enum(['model', 'uncertain', 'skipped', 'unavailable']),
})

function readShipment(result: JsonValue | null) {
  const parsed = ShipmentSchema.safeParse(result)
  return parsed.success ? parsed.data : undefined
}

function scored(result: JsonValue | null) {
  const parsed = Scored.safeParse(result)
  return parsed.success ? parsed.data : { route: 'review', reason: 'unavailable' as const }
}

function isRejected(result: JsonValue | null): boolean {
  return isJsonObject(result) && result.outcome === 'reject'
}

function textField(result: JsonValue | null, key: string): string | undefined {
  if (!isJsonObject(result)) {
    return undefined
  }

  const value = result[key]
  return isJsonString(value) ? value : undefined
}

function noticeFor(shipment: z.infer<typeof ShipmentSchema>, booking: JsonValue | null) {
  if (isRejected(booking) || (isJsonObject(booking) && booking.booked === false)) {
    return {
      subject: `PRO ${shipment.pro} held`,
      body: `We held the recovery for PRO ${shipment.pro}. A service lead will follow up with ${shipment.consignee}.`,
    }
  }

  const partner = textField(booking, 'partner') ?? 'the linehaul partner'
  const window = textField(booking, 'window') ?? 'the next dock window'

  return {
    subject: `PRO ${shipment.pro} recovery`,
    body: `We booked a recovery for PRO ${shipment.pro} with ${partner}. Window: ${window}.`,
  }
}

export const recoverShipment = defineWorkflow({
  name: 'recover-shipment',
  description:
    'Look up a shipment, classify the exception, ask a service lead when the evaluator says so, book the linehaul recovery, and email the consignee.',
  input: RecoverInput,
  nodes: [
    {
      id: 'load',
      run: (ctx) =>
        ctx.effects([
          invoke(lookupShipment, { shipmentId: ctx.input.shipmentId }, `lookup_${ctx.nodeId}`),
          wait({
            waitId: createWaitId(ctx.nodeId, 'lookup'),
            on: {
              type: 'shipments.lookup.completed',
              match: { shipmentId: ctx.input.shipmentId },
            },
          }),
        ]),
    },
    {
      id: 'classify',
      deps: ['load'],
      run: (ctx) => {
        const shipment = readShipment(ctx.results.load ?? null)

        if (!shipment) {
          throw new Error('lookup returned an unreadable shipment')
        }

        return ctx.spawn(classifyException, {
          shipmentId: shipment.shipmentId,
          kind: shipment.kind,
          hoursLate: shipment.hoursLate,
          valueUsd: shipment.valueUsd,
          note: shipment.note,
        })
      },
    },
    {
      id: 'review',
      deps: ['classify'],
      run: (ctx) => {
        const shipment = readShipment(ctx.results.load ?? null)
        const decision = scored(ctx.results.classify ?? null)

        if (decision.route === 'auto' && decision.reason !== 'unavailable') {
          return { skipped: true, reason: 'auto' }
        }

        const pro = shipment?.pro ?? ctx.input.shipmentId
        const who = shipment?.consignee ?? 'the consignee'

        return ctx.effects(
          gate({
            title: `Book a recovery for PRO ${pro}?`,
            description: `${who}. ${shipment?.note ?? 'The shipment record was incomplete.'}`,
          }),
        )
      },
    },
    {
      id: 'book',
      deps: ['review'],
      run: (ctx) => {
        if (isRejected(ctx.results.review ?? null)) {
          return { booked: false, reason: 'rejected' }
        }

        const shipment = readShipment(ctx.results.load ?? null)

        if (!shipment) {
          throw new Error('lookup returned an unreadable shipment')
        }

        return ctx.effects([
          invoke(
            bookRecovery,
            {
              shipmentId: shipment.shipmentId,
              pro: shipment.pro,
              destination: shipment.destination,
              status: shipment.status,
              valueUsd: shipment.valueUsd,
            },
            `book_${ctx.nodeId}`,
          ),
          wait({
            waitId: createWaitId(ctx.nodeId, 'booked'),
            on: {
              type: 'recovery.booking.confirmed',
              match: { shipmentId: shipment.shipmentId },
            },
          }),
        ])
      },
    },
    {
      id: 'notify',
      deps: ['book'],
      run: (ctx) => {
        const shipment = readShipment(ctx.results.load ?? null)

        if (!shipment) {
          throw new Error('lookup returned an unreadable shipment')
        }

        const copy = noticeFor(shipment, ctx.results.book ?? null)

        return ctx.effects([
          invoke(
            sendNotice,
            {
              shipmentId: shipment.shipmentId,
              pro: shipment.pro,
              to: shipment.email,
              subject: copy.subject,
              body: copy.body,
            },
            `notice_${ctx.nodeId}`,
          ),
          wait({
            waitId: createWaitId(ctx.nodeId, 'notice'),
            on: {
              type: 'notices.notice.delivered',
              match: { shipmentId: shipment.shipmentId },
            },
          }),
        ])
      },
    },
  ],
  output: ({ input, results }) => {
    const shipment = readShipment(results.load ?? null)
    const decision = scored(results.classify ?? null)
    const partner = textField(results.book ?? null, 'partner') ?? null
    const window = textField(results.book ?? null, 'window') ?? null

    return {
      shipmentId: input.shipmentId,
      pro: shipment?.pro ?? null,
      consignee: shipment?.consignee ?? null,
      route: decision.route,
      reason: decision.reason,
      held: isRejected(results.review ?? null),
      partner,
      window,
    }
  },
})
