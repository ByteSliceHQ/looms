import { ApprovalRequestedPayloadSchema } from './events'
import { approvalModule } from './scope'

export const requestApprovalEffect = approvalModule.effect({
  type: 'approval.request',
  placement: 'local',
  input: ApprovalRequestedPayloadSchema,
  execute: (input, ctx) => [
    {
      type: 'approval.requested',
      payload: input,
      threadId: ctx.threadId,
    },
  ],
})
