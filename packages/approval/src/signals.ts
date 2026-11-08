import { Schema } from 'effect'

import { isJsonString, type JsonValue } from '@looms/core'

import type { ApprovalDecided } from './events'
import { approvalModule } from './scope'

export type ApprovalChoice =
  | 'approve'
  | 'reject'
  | { actionId: string; outcome: 'approve' | 'reject'; payload?: JsonValue }

const ApprovalChoiceSchema = Schema.Union([
  Schema.Literal('approve'),
  Schema.Literal('reject'),
  Schema.Struct({
    actionId: Schema.String,
    outcome: Schema.Union([Schema.Literal('approve'), Schema.Literal('reject')]),
    payload: Schema.optional(Schema.Json),
  }),
])

const DecisionInputSchema = Schema.Struct({
  approvalId: Schema.String,
  choice: ApprovalChoiceSchema,
})

function decidedFrom(approvalId: string, choice: ApprovalChoice): ApprovalDecided {
  return isJsonString(choice)
    ? { approvalId, actionId: choice, outcome: choice }
    : { approvalId, actionId: choice.actionId, outcome: choice.outcome, payload: choice.payload }
}

/**
 * Build the `approval.decided` event that resolves a pending gate.
 * Send it with `looms.signal(runId, [decision({ approvalId, choice: 'approve' })])`.
 */
export const decision = approvalModule.signal({
  description: 'Resolve a pending approval gate.',
  input: DecisionInputSchema,
  build: ({ approvalId, choice }) =>
    approvalModule.input('decided', decidedFrom(approvalId, choice)),
})
