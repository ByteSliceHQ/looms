import {
  asJson,
  createWaitId,
  invoke,
  isJsonString,
  wait,
  type EventInput,
  type JsonValue,
  type RuntimeEffect,
} from '@looms/core'

import type { ApprovalAction, ApprovalDecided } from './events'

export function gate(args: {
  title: string
  description?: string
  approvalId?: string
  actions?: ApprovalAction[]
  schema?: JsonValue
}): RuntimeEffect[] {
  const approvalId = args.approvalId ?? createWaitId('approval')

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
      `request_${approvalId}`,
    ),
    wait({
      waitId: createWaitId(approvalId, 'decision'),
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
