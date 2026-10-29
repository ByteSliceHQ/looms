import { z } from 'zod'

import { ShipmentSchema } from '../../catalog'
import { LaneCount } from './events'
import { shipmentsScope } from './scope'

const DossierState = z.object({
  shipment: ShipmentSchema.nullable(),
  error: z.string().nullable(),
})

const DigestState = z.object({
  at: z.number().nullable(),
  open: z.number(),
  lanes: z.array(LaneCount),
})

export const dossier = shipmentsScope.projection({
  name: 'dossier',
  shape: DossierState,
  initialState: { shipment: null, error: null },
  reduce(state, event) {
    if (event.type !== 'shipments.lookup.completed') {
      return state
    }

    if (!event.payload.found) {
      return { shipment: null, error: event.payload.error }
    }

    const parsed = ShipmentSchema.safeParse(event.payload)

    if (!parsed.success) {
      return state
    }

    return { shipment: parsed.data, error: null }
  },
})

export const digest = shipmentsScope.projection({
  name: 'digest',
  shape: DigestState,
  initialState: { at: null, open: 0, lanes: [] },
  reduce(state, event) {
    if (event.type !== 'shipments.digest.ready') {
      return state
    }

    return {
      at: event.payload.at,
      open: event.payload.open,
      lanes: [...event.payload.lanes],
    }
  },
})
