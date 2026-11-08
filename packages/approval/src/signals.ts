import { isJsonString, type JsonValue } from '@looms/core'

import type { ApprovalDecided } from './events'
import { approvalModule } from './scope'

export type ApprovalChoice =
  | 'approve'
  | 'reject'
  | { actionId: string; outcome: 'approve' | 'reject'; payload?: JsonValue }

/**
 * Build the `approval.decided` event that resolves a pending gate.
 * Send it with `looms.signal(runId, [decision(approvalId, 'approve')])`.
 */
export function decision(approvalId: string, choice: ApprovalChoice) {
  const decided: ApprovalDecided = isJsonString(choice)
    ? { approvalId, actionId: choice, outcome: choice }
    : { approvalId, actionId: choice.actionId, outcome: choice.outcome, payload: choice.payload }

  return approvalModule.input('decided', decided)
}
