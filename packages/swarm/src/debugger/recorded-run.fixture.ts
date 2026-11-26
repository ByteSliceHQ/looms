import { agent, defineAgent, type AgentTurnContext, type ToolCall } from '@looms/agent'
import type { EventEnvelope } from '@looms/core'
import { createLooms } from '@looms/runtime'

import { defineSwarm } from '../definitions'
import { ensureSwarm } from '../ensure'
import { createMemoryBoard } from '../memory-board'
import { swarm } from '../module'
import { swarmStatus, type SwarmStatus } from '../projections'
import { nudge } from '../signals'
import { memberTools } from '../tools'

const triage = defineAgent({ name: 'triage', instructions: 'triage', resolveTools: memberTools })
const fixer = defineAgent({ name: 'fixer', instructions: 'fixer', resolveTools: memberTools })

export const recordedSwarm = defineSwarm({
  name: 'ops',
  pollIntervalMs: null,
  members: [
    { name: 'triage', agent: triage, channels: ['support/'] },
    { name: 'fixer', agent: fixer },
  ],
})

/** Triage replies to the report and files a task for the fixer, who claims and completes it. */
function script(ctx: AgentTurnContext): ToolCall[] | undefined {
  const results = ctx.messages.filter((message) => message.role === 'tool')
  const prompt = ctx.messages.find((message) => message.role === 'user')?.content ?? ''

  if (ctx.instructions === 'triage') {
    return results.length > 0
      ? undefined
      : [
          {
            id: 'triage_1',
            name: 'board_reply',
            arguments: { to: 'msg_1', text: 'Looking into it' },
          },
          {
            id: 'triage_2',
            name: 'board_create_task',
            arguments: { channel: 'support', text: 'fix the login page', for: 'fixer' },
          },
        ]
  }

  const task = /task \[(msg_\d+)\]/.exec(prompt)?.[1] ?? ''

  if (results.length === 0) {
    return [{ id: 'fixer_1', name: 'board_claim_task', arguments: { task } }]
  }

  if (results.length === 1) {
    const token = /"token":"([^"]+)"/.exec(results[0]?.content ?? '')?.[1] ?? ''

    return [
      {
        id: 'fixer_2',
        name: 'board_settle_task',
        arguments: { task, token, outcome: 'completed', note: 'patched' },
      },
    ]
  }

  return undefined
}

async function until(check: () => Promise<boolean>, what: string): Promise<void> {
  const deadline = Date.now() + 20_000

  while (Date.now() < deadline) {
    if (await check()) {
      return
    }

    await Bun.sleep(10)
  }

  throw new Error(`timed out waiting until ${what}`)
}

export interface RecordedSwarmRun {
  readonly runId: string
  readonly events: readonly EventEnvelope[]
  readonly status: SwarmStatus
}

/**
 * Records a swarm run on the memory board: a person posts, triage replies and creates a task, the
 * fixer claims and completes it. The task reaches the swarm in one pull and changes in a later one.
 */
export async function recordSwarmRun(): Promise<RecordedSwarmRun> {
  const runId = 'swarm_ops'
  const board = createMemoryBoard()

  const looms = createLooms({
    maxWakeIterations: 2_000,
    modules: [
      agent({ definitions: [triage, fixer], llmPolicy: { toolCallsFor: script } }),
      swarm({ definitions: [recordedSwarm], board }),
    ],
  })

  try {
    await ensureSwarm(looms, recordedSwarm, runId, { board: 'ops' })

    await board.post({
      by: 'dana',
      channel: 'support',
      text: '@triage nobody can log in',
      labels: { priority: 'high' },
    })

    await looms.signal(runId, [nudge()])

    await until(
      () =>
        looms
          .project(runId, swarmStatus)
          .then(
            (view) =>
              view.eventsRead >= 5 &&
              Object.values(view.members).every((member) => member.status === 'idle'),
          ),
      'the swarm read the completed task and its members went idle',
    )

    return {
      runId,
      events: await looms.getEvents(runId),
      status: await looms.project(runId, swarmStatus),
    }
  } finally {
    await looms.stop()
  }
}
