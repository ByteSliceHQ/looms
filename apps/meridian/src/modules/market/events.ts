import { z } from 'zod'

import { defineEventCatalog } from '@swirls/looms/core'

const Level = z.object({
  price: z.number(),
  size: z.number(),
  side: z.enum(['buy', 'sell']),
})

export const SnapshotInput = z.object({
  symbol: z.string(),
  tick: z.number().int(),
  venue: z.enum(['sim', 'robinhood']),
})
export type SnapshotInput = z.infer<typeof SnapshotInput>

export const SnapshotRecorded = z.object({
  symbol: z.string(),
  tick: z.number().int(),
  bid: z.number(),
  ask: z.number(),
  last: z.number(),
  spread: z.number(),
  depth: z.array(Level),
  venue: z.enum(['sim', 'robinhood']),
})
export type SnapshotRecorded = z.infer<typeof SnapshotRecorded>

export const marketEvents = defineEventCatalog('market', {
  'snapshot.recorded': SnapshotRecorded,
})
