import { Schema } from 'effect'

import { approvalModule } from './scope'

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

export const pendingApprovals = approvalModule.projection({
  name: 'pendingApprovals',
  shape: PendingApprovalsSchema,
  initialState: { items: [] },
  reduce(state, event) {
    switch (event.type) {
      case 'approval.requested': {
        const { approvalId, title, description } = event.payload
        const threadId = event.threadId ?? null
        return {
          items: [
            ...state.items.filter((item) => item.approvalId !== approvalId),
            {
              approvalId,
              title: title || 'Approval',
              description: description || undefined,
              status: 'pending',
              threadId,
            },
          ],
        }
      }

      case 'approval.decided': {
        const { approvalId, outcome } = event.payload
        const status = outcome === 'reject' ? 'rejected' : 'approved'
        return {
          items: state.items.map((item) =>
            item.approvalId === approvalId ? { ...item, status } : item,
          ),
        }
      }

      case 'approval.timed_out': {
        const { approvalId } = event.payload
        return {
          items: state.items.map((item) =>
            item.approvalId === approvalId ? { ...item, status: 'timed_out' } : item,
          ),
        }
      }

      default:
        return state
    }
  },
})
