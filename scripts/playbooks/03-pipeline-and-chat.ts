#!/usr/bin/env bun
/**
 * Playbook 03 — Nested pipeline + interactive follow-ups
 *
 * Covers:
 *   - pipeline workflow (DAG + spawn_agent child)
 *   - send a follow-up message to an echo agent session
 *   - steer an agent mid-history
 *
 * Prereq: bun run demo
 * Run:    bun run scripts/playbooks/03-pipeline-and-chat.ts
 */

import {
  ensureHost,
  getEvents,
  log,
  requestStartResult,
  startAgent,
  startWorkflow,
  LOOMS_URL,
} from './_lib.ts'

await ensureHost()
log('host', LOOMS_URL)

{
  log('1) pipeline workflow (double → spawn echo → format)')
  const { actorId, state } = await startWorkflow('pipeline', { n: 21 })
  log('result', {
    actorId,
    status: state.status,
    output: state.output,
    children: state.children,
  })

  const { events } = await getEvents(actorId)
  log(
    'event types',
    events.map((e) => `${e.seq}:${e.type}`),
  )

  if (state.status !== 'completed') process.exitCode = 1
  const childDone = Object.values(state.children ?? {}).some((c) => c.status === 'completed')
  if (!childDone) {
    console.error('expected completed child from spawn_agent')
    process.exitCode = 1
  }
}

{
  log('2) multi-turn echo via signal')
  const started = await startAgent('echo', { text: 'first' })
  log('first turn', { actorId: started.actorId, output: started.state.output })

  // echo marks done on first turn; follow-up message starts another turn
  const followUp = await requestStartResult(
    `/actors/${encodeURIComponent(started.actorId)}/signal`,
    {
      method: 'POST',
      body: JSON.stringify({ message: 'second message' }),
    },
  )
  log('after signal', {
    status: followUp.state.status,
    messages: followUp.state.messages?.map((m) => `${m.role}:${m.content}`),
    output: followUp.state.output,
  })
}

{
  log('3) steer an agent')
  const started = await startAgent('echo', { text: 'before steer' })
  const steered = await requestStartResult(
    `/actors/${encodeURIComponent(started.actorId)}/steer`,
    {
      method: 'POST',
      body: JSON.stringify({ message: 'please pivot', interrupt: true }),
    },
  )
  log('after steer', {
    actorId: started.actorId,
    status: steered.state.status,
    hasPivot: steered.state.messages?.some((m) => m.content === 'please pivot'),
    messages: steered.state.messages?.map((m) => `${m.role}:${m.content.slice(0, 40)}`),
  })
  if (!steered.state.messages?.some((m) => m.content === 'please pivot')) {
    process.exitCode = 1
  }
}

log(process.exitCode ? 'FAILED' : 'OK — pipeline/chat playbook complete')
