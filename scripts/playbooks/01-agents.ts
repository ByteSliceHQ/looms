#!/usr/bin/env bun
/**
 * Playbook 01 — Agents
 *
 * Covers:
 *   - echo (deterministic reply)
 *   - greeter (function tool)
 *   - orchestrator → specialist (subagent / agent-tool)
 *
 * Prereq: bun run demo
 * Run:    bun run scripts/playbooks/01-agents.ts
 */

import {
  ensureHost,
  getEvents,
  log,
  startAgent,
  LOOMS_URL,
} from './_lib.ts'

await ensureHost()
log('host', LOOMS_URL)

{
  log('1) echo agent')
  const { actorId, state } = await startAgent('echo', { text: 'hello from playbook' })
  log('actorId', actorId)
  log('status / output', { status: state.status, output: state.output })
  if (state.status !== 'completed') process.exitCode = 1
}

{
  log('2) greeter agent (tool call)')
  const { actorId, state } = await startAgent('greeter', { name: 'Dylan' })
  log('actorId', actorId)
  log('status / output', { status: state.status, output: state.output })
  log('assistant messages', state.messages?.filter((m) => m.role === 'assistant' || m.role === 'tool'))
  if (state.status !== 'completed') process.exitCode = 1
}

{
  log('3) orchestrator → specialist subagent')
  const { actorId, state } = await startAgent('orchestrator', { task: 'summarize looms demo' })
  log('actorId', actorId)
  log('status / output', { status: state.status, output: state.output })
  log('children', state.children)
  const { events } = await getEvents(actorId)
  log(
    'event types',
    events.map((e) => `${e.seq}:${e.type}`),
  )
  if (state.status !== 'completed') process.exitCode = 1
  if (!Object.values(state.children ?? {}).some((c) => c.status === 'completed')) {
    console.error('expected a completed child actor')
    process.exitCode = 1
  }
}

log(process.exitCode ? 'FAILED' : 'OK — agents playbook complete')
