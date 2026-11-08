import { defineModule } from '@looms/core'

import { requestApprovalEffect } from './effects'
import { pendingApprovals } from './projections'
import { approvalModule } from './scope'
import { decision, gate } from './signals'

export function approval() {
  return defineModule(approvalModule, () => ({
    effects: { request: requestApprovalEffect },
    projections: { pendingApprovals },
    signals: { decision },
    steps: { gate },
    examples: [
      {
        name: 'a decision resolves the pending approval',
        events: [
          approvalModule.input(
            'requested',
            {
              approvalId: 'apr_1',
              title: 'Charge $40',
              description: 'Card charge',
              actions: [{ id: 'approve', label: 'Approve', outcome: 'approve' }],
            },
            { threadId: 'thread_1' },
          ),
          decision('apr_1', 'approve'),
        ],
        projections: {
          pendingApprovals: {
            items: [
              {
                approvalId: 'apr_1',
                title: 'Charge $40',
                description: 'Card charge',
                status: 'approved',
                threadId: 'thread_1',
              },
            ],
          },
        },
      },
      {
        name: 'a request without a description stays pending',
        events: [
          approvalModule.input(
            'requested',
            {
              approvalId: 'apr_2',
              title: 'Refund',
              actions: [{ id: 'approve', label: 'Approve', outcome: 'approve' }],
            },
            { threadId: 'thread_2' },
          ),
        ],
        projections: {
          pendingApprovals: {
            items: [
              {
                approvalId: 'apr_2',
                title: 'Refund',
                status: 'pending',
                threadId: 'thread_2',
              },
            ],
          },
        },
      },
    ],
  }))
}
