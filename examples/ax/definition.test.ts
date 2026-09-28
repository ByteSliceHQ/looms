import { expect, test } from 'bun:test'

import { decision, pendingApprovals } from '@swirls/looms/approval'
import { createLooms } from '@swirls/looms/runtime'

import { modules, repository, review } from './definition'

test('the same domain workflow uses local analysis and waits for explicit approval', async () => {
  const looms = createLooms({ modules })

  try {
    const run = await looms.start(review, {
      revision: 'fixture-v1',
      delayMs: 0,
      failAttempts: 0,
      networkProbe: false,
    })

    const approvals = await looms.project(run.runId, pendingApprovals)
    const pending = approvals.items.find((item) => item.status === 'pending')
    expect(pending).toBeDefined()
    expect((await looms.project(run.runId, repository.projections.report)).analyses).toHaveLength(1)

    if (!pending) {
      throw new Error('Workflow did not park for approval')
    }

    await looms.signal(run.runId, [decision(pending.approvalId, 'approve')])
    expect((await looms.getRun(run.runId)).status).toBe('completed')
  } finally {
    await looms.stop()
  }
})
