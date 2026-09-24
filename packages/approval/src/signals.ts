import {
  createWaitId,
  invoke,
  isJsonString,
  wait,
  type EventInput,
  type JsonValue,
  type RuntimeEffect,
} from '@looms/core'

import { requestApprovalEffect } from './effects'
import type { ApprovalAction, ApprovalDecided } from './events'
import { approvalModule } from './scope'

export function gate(args: {
  title: string
  description?: string
  approvalId?: string
  actions?: ApprovalAction[]
  schema?: JsonValue
  /** Absolute epoch milliseconds. Decision and timer waits race; the first wins. */
  timeoutAt?: number
}): RuntimeEffect[] {
  const approvalId = args.approvalId ?? createWaitId('approval')

  const actions = args.actions ?? [
    { id: 'approve', label: 'Approve', outcome: 'approve' as const },
    { id: 'reject', label: 'Reject', outcome: 'reject' as const },
  ]

  const effects: RuntimeEffect[] = [
    invoke(
      requestApprovalEffect,
      {
        approvalId,
        title: args.title,
        description: args.description,
        actions,
        schema: args.schema,
      },
      `request_${approvalId}`,
    ),
    wait({
      waitId: createWaitId(approvalId, 'decision'),
      on: { type: 'approval.decided', match: { approvalId } },
      tag: { approvalId, raceId: approvalId },
    }),
  ]

  if (args.timeoutAt !== undefined) {
    if (!Number.isFinite(args.timeoutAt)) {
      throw new Error('Approval timeoutAt must be a finite epoch timestamp')
    }

    effects.push(
      wait({
        waitId: createWaitId(approvalId, 'timeout'),
        on: { timerAt: args.timeoutAt },
        tag: { approvalId, raceId: approvalId, outcome: 'timeout' },
      }),
    )
  }

  return effects
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

  return approvalModule.input('decided', decided)
}
