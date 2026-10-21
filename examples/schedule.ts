import { createLooms } from '@swirls/looms/runtime'
import { defineSchedule, once, schedule, scheduleStatus } from '@swirls/looms/schedule'
import { defineWorkflow, workflow } from '@swirls/looms/workflow'

// A schedule is a run. Each fire starts a new run of the target definition.
// cron('0 2 * * *', { tz: 'UTC' }) is the recurring form. This script uses a
// past one-shot so the fire happens during start and the process can exit.
// bun run --filter @looms/examples schedule

const report = defineWorkflow({
  name: 'report',
  nodes: [
    {
      id: 'write',
      run: (ctx) => ctx.input ?? null,
    },
  ],
})

const nightly = defineSchedule({
  name: 'nightly-report',
  target: report,
  spec: once(1),
  input: ({ at }) => ({ at }),
})

const looms = createLooms({
  modules: [workflow({ definitions: [report] }), schedule({ definitions: [nightly] })],
})

const { runId, state } = await looms.start(nightly, null, { runId: 'nightly-report' })
const status = await looms.project(runId, scheduleStatus)

console.log('schedule:', state.status, 'fires:', status.fireCount)
console.log('started run:', status.recent[0]?.runId)

await looms.stop()
