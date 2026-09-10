import { defineEventCatalog, payload, type JsonValue } from '@looms/core'

export type ApprovalAction = { id: string; label: string; outcome: 'approve' | 'reject' }

export type ApprovalRequested = {
  approvalId: string
  title: string
  description?: string
  actions: ApprovalAction[]
  schema?: JsonValue
}

export type ApprovalDecided = {
  approvalId: string
  actionId: string
  outcome: 'approve' | 'reject'
  payload?: JsonValue
}

export const approvalCatalog = defineEventCatalog('approval', {
  requested: payload<ApprovalRequested>(),
  decided: payload<ApprovalDecided>(),
  timed_out: payload<{ approvalId: string }>(),
})
