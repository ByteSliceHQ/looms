import {
  asJson,
  createWaitId,
  defineEffect,
  defineEventCatalog,
  payload,
  defineProjection,
  defineRuntimeModule,
  invoke,
  isJsonObject,
  isJsonString,
  wait,
  type EventEnvelope,
  type EventInput,
  type JsonValue,
  type RuntimeEffect,
} from '@looms/core'

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

export const requestApprovalEffect = defineEffect({
  type: 'approval.request',
  execute: (input, ctx) => {
    return [
      {
        type: 'approval.requested',
        payload: input,
        threadId: ctx.threadId,
      },
    ]
  },
})

export function gate(args: {
  title: string
  description?: string
  approvalId?: string
  actions?: ApprovalAction[]
  schema?: JsonValue
}): RuntimeEffect[] {
  const approvalId = args.approvalId ?? createWaitId()
  const actions = args.actions ?? [
    { id: 'approve', label: 'Approve', outcome: 'approve' as const },
    { id: 'reject', label: 'Reject', outcome: 'reject' as const },
  ]
  return [
    invoke(
      'approval.request',
      asJson({
        approvalId,
        title: args.title,
        description: args.description,
        actions,
        schema: args.schema,
      }),
    ),
    wait({
      waitId: createWaitId(),
      on: { type: 'approval.decided', match: { approvalId } },
      tag: { approvalId },
    }),
  ]
}

export type ApprovalChoice =
  | 'approve'
  | 'reject'
  | { actionId: string; outcome: 'approve' | 'reject'; payload?: JsonValue }

/**
 * Build the `approval.decided` event that resolves a pending gate.
 * Send it with `looms.signal(runId, [decision(approvalId, 'approve')])`.
 */
export function decision(approvalId: string, choice: ApprovalChoice): EventInput {
  const decided: ApprovalDecided = isJsonString(choice)
    ? { approvalId, actionId: choice, outcome: choice }
    : { approvalId, actionId: choice.actionId, outcome: choice.outcome, payload: choice.payload }
  return { type: 'approval.decided', payload: asJson(decided) }
}

export interface PendingApproval {
  approvalId: string
  title: string
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'timed_out'
  threadId: string | null
}

function payloadObject(event: EventEnvelope): { [key: string]: JsonValue } {
  return isJsonObject(event.payload) ? event.payload : {}
}

export const pendingApprovals = defineProjection<{ items: PendingApproval[] }>({
  name: 'pendingApprovals',
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

export function approval() {
  return defineRuntimeModule({
    namespace: 'approval',
    protocolVersion: '1.0.0',
    events: approvalCatalog,
    effects: { request: requestApprovalEffect },
    projections: { pendingApprovals },
  })
}
