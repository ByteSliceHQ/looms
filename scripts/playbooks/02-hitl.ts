#!/usr/bin/env bun
/**
 * Playbook 02 — Human-in-the-loop
 *
 * Covers:
 *   - hitl workflow parks on review.requested
 *   - approve path → completed
 *   - reject path → failed
 *   - LiveStore pull of the event batch
 *
 * Prereq: bun run demo
 * Run:    bun run scripts/playbooks/02-hitl.ts
 */

import {
  decideReview,
  ensureHost,
  firstPendingReview,
  getEvents,
  log,
  pullLivestore,
  startWorkflow,
  LOOMS_URL,
} from './_lib.ts'

await ensureHost()
log('host', LOOMS_URL)

{
  log('1) HITL approve path')
  const started = await startWorkflow('hitl', { doc: 'release notes draft', version: 1 })
  log('parked', {
    actorId: started.actorId,
    status: started.state.status,
    reviews: started.state.reviews,
  })

  if (started.state.status !== 'waiting_review') {
    console.error('expected waiting_review')
    process.exit(1)
  }

  const reviewId = firstPendingReview(started.state)
  if (!reviewId) {
    console.error('no pending review')
    process.exit(1)
  }

  const approved = await decideReview(started.actorId, reviewId, 'approve')
  log('after approve', {
    status: approved.state.status,
    output: approved.state.output,
  })

  const { events } = await getEvents(started.actorId)
  log(
    'timeline',
    events.map((e) => `${e.seq}:${e.type}`),
  )

  const ls = await pullLivestore(started.actorId, 0)
  log('livestore pull', { cursor: ls.cursor, batchSize: ls.batch.length })

  if (approved.state.status !== 'completed') process.exitCode = 1
}

{
  log('2) HITL reject path')
  const started = await startWorkflow('hitl', { doc: 'bad draft' })
  const reviewId = firstPendingReview(started.state)
  if (!reviewId) {
    console.error('no pending review')
    process.exit(1)
  }

  const rejected = await decideReview(started.actorId, reviewId, 'reject')
  log('after reject', {
    actorId: started.actorId,
    status: rejected.state.status,
    error: rejected.state.error ?? null,
  })

  if (rejected.state.status !== 'failed') {
    console.error('expected failed after reject')
    process.exitCode = 1
  }
}

log(process.exitCode ? 'FAILED' : 'OK — HITL playbook complete')
console.log('\nTip: open the demo UI and paste an actorId from above:')
console.log('  bun run demo')
