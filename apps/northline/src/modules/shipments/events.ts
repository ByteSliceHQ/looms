import { z } from 'zod'

import { defineEventCatalog } from '@swirls/looms/core'

import { ShipmentSchema } from '../../catalog'

export const LookupInput = z.object({
  shipmentId: z.string(),
})
export type LookupInput = z.infer<typeof LookupInput>

export const LookupCompleted = z.discriminatedUnion('found', [
  ShipmentSchema.extend({ found: z.literal(true) }),
  z.object({
    found: z.literal(false),
    shipmentId: z.string(),
    error: z.string(),
  }),
])
export type LookupCompleted = z.infer<typeof LookupCompleted>

export const LaneCount = z.object({
  destination: z.string(),
  count: z.number(),
})
export type LaneCount = z.infer<typeof LaneCount>

export const DigestInput = z.object({
  at: z.number(),
})
export type DigestInput = z.infer<typeof DigestInput>

export const DigestReady = z.object({
  at: z.number(),
  open: z.number(),
  lanes: z.array(LaneCount),
})
export type DigestReady = z.infer<typeof DigestReady>

export const shipmentsEvents = defineEventCatalog('shipments', {
  'lookup.completed': LookupCompleted,
  'digest.ready': DigestReady,
})
