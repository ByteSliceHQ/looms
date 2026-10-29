import { z } from 'zod'

import { ShipmentKind, ShipmentSchema } from './catalog'

export const CaseStatus = z.enum(['running', 'waiting', 'completed', 'failed', 'cancelled'])
export type CaseStatus = z.infer<typeof CaseStatus>

export const OpenCaseInput = z.object({
  shipmentId: z.string().min(1),
  openedBy: z.string().min(1).max(80),
})
export type OpenCaseInput = z.infer<typeof OpenCaseInput>

export const CaseRecord = z.object({
  id: z.string(),
  shipmentId: z.string(),
  pro: z.string(),
  consignee: z.string(),
  destination: z.string(),
  kind: ShipmentKind,
  openedBy: z.string(),
  runId: z.string(),
  openedAt: z.number(),
  status: CaseStatus,
})
export type CaseRecord = z.infer<typeof CaseRecord>

export const CaseList = z.object({
  cases: z.array(CaseRecord),
})
export type CaseList = z.infer<typeof CaseList>

export const ShipmentList = z.object({
  shipments: z.array(ShipmentSchema),
})
export type ShipmentList = z.infer<typeof ShipmentList>

export const DeskSession = z.object({
  runId: z.string().nullable(),
})
export type DeskSession = z.infer<typeof DeskSession>

export const DeskMessageInput = z.object({
  text: z.string().min(1).max(2_000),
})
export type DeskMessageInput = z.infer<typeof DeskMessageInput>

export const SweepInfo = z.object({
  runId: z.string(),
})
export type SweepInfo = z.infer<typeof SweepInfo>

export const ReplicaCopy = z.object({
  replicatedSeq: z.number().int().nonnegative(),
  finished: z.boolean(),
  complete: z.boolean(),
  purgedAt: z.number().nullable(),
})
export type ReplicaCopy = z.infer<typeof ReplicaCopy>

/** `attached` is false when this desk has no Postgres. `copy` is null until the run lands. */
export const ReplicaView = z.object({
  attached: z.boolean(),
  copy: ReplicaCopy.nullable(),
})
export type ReplicaView = z.infer<typeof ReplicaView>

export const CaseResponse = z.object({
  case: CaseRecord,
  replica: ReplicaView,
})
export type CaseResponse = z.infer<typeof CaseResponse>

export const DeskMessageResult = z.object({
  runId: z.string(),
})
export type DeskMessageResult = z.infer<typeof DeskMessageResult>

export const DigestRunInput = z.object({
  at: z.number().finite(),
})
export type DigestRunInput = z.infer<typeof DigestRunInput>

export const CaseStatusUpdate = z.object({
  runId: z.string().min(1),
  status: CaseStatus,
})
export type CaseStatusUpdate = z.infer<typeof CaseStatusUpdate>
