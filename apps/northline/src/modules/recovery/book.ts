import type { EventInput, WorkerEffectContext } from '@swirls/looms/core'

import type { BookRecoveryInput } from './events'
import { recoveryEvents } from './events'

/** Same window on every retry. The partner key is the effect id. */
function dockWindow(destination: string): string {
  return `${destination} dock, next morning receiving`
}

export function confirmBooking(
  input: BookRecoveryInput,
  ctx: WorkerEffectContext,
): Promise<ReadonlyArray<EventInput>> {
  return ctx.heartbeat({ stage: 'partner' }).then(() => [
    recoveryEvents.input('booking.confirmed', {
      bookingId: ctx.effectId,
      shipmentId: input.shipmentId,
      pro: input.pro,
      partner: 'Red Cedar Linehaul',
      window: dockWindow(input.destination),
      valueUsd: input.valueUsd,
    }),
  ])
}
