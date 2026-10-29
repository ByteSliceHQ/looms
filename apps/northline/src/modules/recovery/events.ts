import { z } from 'zod'

import { defineEventCatalog } from '@swirls/looms/core'

import { ShipmentStatus } from '../../catalog'

export const BookRecoveryInput = z.object({
  shipmentId: z.string(),
  pro: z.string(),
  destination: z.string(),
  status: ShipmentStatus,
  valueUsd: z.number(),
})
export type BookRecoveryInput = z.infer<typeof BookRecoveryInput>

export const BookingConfirmed = z.object({
  bookingId: z.string(),
  shipmentId: z.string(),
  pro: z.string(),
  partner: z.string(),
  window: z.string(),
  valueUsd: z.number(),
})
export type BookingConfirmed = z.infer<typeof BookingConfirmed>

export const recoveryEvents = defineEventCatalog('recovery', {
  'booking.confirmed': BookingConfirmed,
})
