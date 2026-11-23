import {
  createWaitId,
  invoke,
  typeIds,
  wait,
  type JsonValue,
  type LoomsIds,
  type RuntimeEffect,
} from '@looms/core'

import { requestApprovalEffect } from './effects'
import type { ApprovalAction } from './events'

export function gate(args: {
  title: string
  description?: string
  approvalId?: string
  actions?: ApprovalAction[]
  schema?: JsonValue
  /** Absolute epoch milliseconds. Decision and timer waits race; the first wins. */
  timeoutAt?: number
  /** The id format to draw `approvalId` from. Pass `ctx.ids`. Defaults to `typeIds`. */
  ids?: LoomsIds
}): RuntimeEffect[] {
  const approvalId = args.approvalId ?? (args.ids ?? typeIds).create('wait')

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
        tag: {
          approvalId,
          raceId: approvalId,
          outcome: 'timeout',
          error: `Approval ${approvalId} timed out`,
        },
      }),
    )
  }

  return effects
}
