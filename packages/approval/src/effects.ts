import { defineEffect } from '@looms/core'

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
