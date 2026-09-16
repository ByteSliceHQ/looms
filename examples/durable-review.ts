import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

import { decision, pendingApprovals } from '@swirls/looms/approval'
import { bunSqliteEventStore } from '@swirls/looms/core/bun-sqlite'
import { createLooms } from '@swirls/looms/runtime'

import { modules, release } from './review-definition'

const path = process.env.LOOMS_DB ?? './.looms/review.sqlite'
await mkdir(dirname(path), { recursive: true })

const looms = createLooms({ modules, store: bunSqliteEventStore({ path }) })
const [command = 'start', runId] = Bun.argv.slice(2)

try {
  if (command === 'start') {
    const result = await looms.start(release, { topic: 'Looms launch' })
    console.log(JSON.stringify({ runId: result.runId, status: result.state.status }))
    console.log('The process now exits. Run inspect, approve, or reject with this runId.')
  } else {
    if (!runId) {
      throw new Error('Usage: bun durable-review.ts <inspect|approve|reject> <runId>')
    }

    if (command === 'approve' || command === 'reject') {
      const reviews = await looms.project(runId, pendingApprovals)
      const pending = reviews.items.find((item) => item.status === 'pending')

      if (!pending) {
        throw new Error('No pending review. Inspect the run before sending another decision.')
      }

      await looms.signal(runId, [decision(pending.approvalId, command)])
    } else if (command !== 'inspect') {
      throw new Error(`Unknown command: ${command}`)
    }

    const state = await looms.getRun(runId)
    const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined
    console.log(JSON.stringify({ runId, status: state.status, output: root?.output }, null, 2))
    console.log(JSON.stringify(await looms.project(runId, pendingApprovals), null, 2))
    console.log('Events:', (await looms.getEvents(runId)).map((event) => event.type).join(' → '))
  }
} finally {
  await looms.stop()
}
