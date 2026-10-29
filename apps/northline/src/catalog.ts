import { z } from 'zod'

export const ShipmentKind = z.enum(['late', 'damage', 'shortage'])
export type ShipmentKind = z.infer<typeof ShipmentKind>

export const ShipmentStatus = z.enum(['exception', 'delivered'])
export type ShipmentStatus = z.infer<typeof ShipmentStatus>

export const ShipmentSchema = z.object({
  shipmentId: z.string(),
  pro: z.string(),
  consignee: z.string(),
  email: z.string(),
  origin: z.string(),
  destination: z.string(),
  kind: ShipmentKind,
  hoursLate: z.number(),
  valueUsd: z.number(),
  pieces: z.number(),
  status: ShipmentStatus,
  note: z.string(),
})
export type Shipment = z.infer<typeof ShipmentSchema>

/**
 * Today's board, held with the actor. A production lookup would read the tenant cache
 * colocated with the Durable Object. It would not cross a queue for a point read.
 */
export const board: readonly Shipment[] = [
  {
    shipmentId: 'nl_1841',
    pro: '1841933',
    consignee: 'Hart & Birch Grocers',
    email: 'receiving@hartbirch.example',
    origin: 'Omaha',
    destination: 'Des Moines',
    kind: 'late',
    hoursLate: 6,
    valueUsd: 840,
    pieces: 14,
    status: 'exception',
    note: 'routine delay, the consignee already resolved the dock time',
  },
  {
    shipmentId: 'nl_2208',
    pro: '2208144',
    consignee: 'Mesa Clay Co',
    email: 'dock@mesaclay.example',
    origin: 'Denver',
    destination: 'Albuquerque',
    kind: 'damage',
    hoursLate: 0,
    valueUsd: 1160,
    pieces: 8,
    status: 'exception',
    note: 'crushed corner on a crate, customer dispute',
  },
  {
    shipmentId: 'nl_3902',
    pro: '3902551',
    consignee: 'Keel Instrument',
    email: 'inbound@keelinstrument.example',
    origin: 'Chicago',
    destination: 'Kansas City',
    kind: 'late',
    hoursLate: 30,
    valueUsd: 4800,
    pieces: 2,
    status: 'exception',
    note: 'high-value machine tool, appointment missed',
  },
  {
    shipmentId: 'nl_0774',
    pro: '0774310',
    consignee: 'Linden Paper',
    email: 'warehouse@lindenpaper.example',
    origin: 'St Louis',
    destination: 'Columbia',
    kind: 'shortage',
    hoursLate: 2,
    valueUsd: 210,
    pieces: 22,
    status: 'exception',
    note: 'duplicate scan, shortage already resolved',
  },
  {
    shipmentId: 'nl_5510',
    pro: '5510662',
    consignee: 'Red Hen Produce',
    email: 'coolers@redhen.example',
    origin: 'Lincoln',
    destination: 'Topeka',
    kind: 'late',
    hoursLate: 14,
    valueUsd: 640,
    pieces: 40,
    status: 'exception',
    note: 'urgent perishable load sitting on the dock',
  },
  {
    shipmentId: 'nl_9001',
    pro: '9001888',
    consignee: 'Plover Books',
    email: 'shop@ploverbooks.example',
    origin: 'Iowa City',
    destination: 'Quad Cities',
    kind: 'late',
    hoursLate: 4,
    valueUsd: 300,
    pieces: 6,
    status: 'delivered',
    note: 'routine, delivered after the window',
  },
]

export function findShipment(idOrPro: string): Shipment | undefined {
  return board.find((item) => item.shipmentId === idOrPro || item.pro === idOrPro)
}

export function openExceptions(): readonly Shipment[] {
  return board.filter((item) => item.status === 'exception')
}
