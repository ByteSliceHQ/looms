import { Schema } from 'effect'

import {
  defineProjection,
  isJsonObject,
  isJsonString,
  type EventEnvelope,
  type JsonValue,
} from '@looms/core'

export const PendingApprovalSchema = Schema.Struct({
  approvalId: Schema.String,
  title: Schema.String,
  description: Schema.optional(Schema.String),
  status: Schema.Union([
    Schema.Literal('pending'),
    Schema.Literal('approved'),
    Schema.Literal('rejected'),
    Schema.Literal('timed_out'),
  ]),
  threadId: Schema.NullOr(Schema.String),
})
export type PendingApproval = Schema.Schema.Type<typeof PendingApprovalSchema>

export const PendingApprovalsSchema = Schema.Struct({
  items: Schema.mutable(Schema.Array(PendingApprovalSchema)),
})
export type PendingApprovalsState = Schema.Schema.Type<typeof PendingApprovalsSchema>

function payloadObject(event: EventEnvelope): { [key: string]: JsonValue } {
  return isJsonObject(event.payload) ? event.payload : {}
}

export const pendingApprovals = defineProjection({
  name: 'pendingApprovals',
  shape: PendingApprovalsSchema,
  initialState: { items: [] },
  reduce(state, event) {
    const data = payloadObject(event)
    const approvalId = isJsonString(data.approvalId) ? data.approvalId : undefined
    if (!approvalId) return state
    switch (event.type) {
      case 'approval.requested': {
        const threadId = event.threadId ?? null
        return {
          items: [
            ...state.items.filter((item) => item.approvalId !== approvalId),
            {
              approvalId,
              title: isJsonString(data.title) ? data.title : 'Approval',
              description: isJsonString(data.description) ? data.description : undefined,
              status: 'pending',
              threadId,
            },
          ],
        }
      }
      case 'approval.decided': {
        const outcome = data.outcome === 'reject' ? 'rejected' : 'approved'
        return {
          items: state.items.map((item) =>
            item.approvalId === approvalId ? { ...item, status: outcome } : item,
          ),
        }
      }
      case 'approval.timed_out':
        return {
          items: state.items.map((item) =>
            item.approvalId === approvalId ? { ...item, status: 'timed_out' } : item,
          ),
        }
      default:
        return state
    }
  },
})
