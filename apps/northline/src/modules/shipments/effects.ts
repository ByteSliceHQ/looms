import { findShipment, openExceptions, type Shipment } from '../../catalog'
import { DigestInput, LookupInput, shipmentsEvents, type LaneCount } from './events'
import { shipmentsScope } from './scope'

function lanesOf(items: readonly Shipment[]): LaneCount[] {
  const counts = new Map<string, number>()

  for (const item of items) {
    counts.set(item.destination, (counts.get(item.destination) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([destination, count]) => ({ destination, count }))
    .toSorted((left, right) => left.destination.localeCompare(right.destination))
}

/** Point read in the actor. Subscribers see the result as it is appended. */
export const lookupShipment = shipmentsScope.effect({
  type: 'shipments.lookup',
  placement: 'local',
  input: LookupInput,
  execute: (input) => {
    const shipment = findShipment(input.shipmentId)

    if (!shipment) {
      return [
        shipmentsEvents.input('lookup.completed', {
          found: false,
          shipmentId: input.shipmentId,
          error: `No shipment ${input.shipmentId} on today's board`,
        }),
      ]
    }

    return [shipmentsEvents.input('lookup.completed', { found: true, ...shipment })]
  },
})

/** Fold of the board the actor already holds. The schedule passes the fire time. */
export const composeDigest = shipmentsScope.effect({
  type: 'shipments.digest',
  placement: 'local',
  input: DigestInput,
  execute: (input) => {
    const open = openExceptions()

    return [
      shipmentsEvents.input('digest.ready', {
        at: input.at,
        open: open.length,
        lanes: lanesOf(open),
      }),
    ]
  },
})
