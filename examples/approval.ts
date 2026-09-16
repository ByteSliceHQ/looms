import { approval, decision, gate, pendingApprovals } from '@looms/approval'
import { isJsonObject } from '@looms/core'
import { createLooms } from '@looms/runtime'
import { defineWorkflow, workflow } from '@looms/workflow'

// Human-in-the-loop: a workflow parks on gate(), then a decision resumes it.
// bun run --filter @looms/examples approval

const review = defineWorkflow({
  name: 'review',
  nodes: [
    {
      id: 'ask',
      run: (ctx) => ctx.effects(gate({ title: 'Ship this change?' })),
    },
    {
      id: 'done',
      deps: ['ask'],
      run: (ctx) => ({
        shipped: isJsonObject(ctx.results.ask) && ctx.results.ask.outcome === 'approve',
      }),
    },
  ],
  output: ({ results }) => results.done ?? null,
})

const looms = createLooms({
  modules: [workflow({ definitions: [review] }), approval()],
})

const { runId, state } = await looms.start(review, {})
console.log('after start:', state.status)

const pending = await looms.project(runId, pendingApprovals)
const approvalId = pending.items.find((item) => item.status === 'pending')?.approvalId

if (!approvalId) {
  throw new Error('expected a pending approval')
}

console.log('pending approval:', approvalId, pending.items[0]?.title)

const after = await looms.signal(runId, [decision(approvalId, 'approve')])
console.log('after decision:', after.status)
console.log('output:', after.rootThreadId ? after.threads[after.rootThreadId]?.output : null)

await looms.stop()
