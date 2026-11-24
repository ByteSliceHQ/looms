import { describe, expect, test } from 'bun:test'

import { agent, defineAgent, type AgentTurnContext, type ToolCall } from '@looms/agent'
import { foldRun, stringifyJson } from '@looms/core'
import { createLooms } from '@looms/runtime'
import { moduleConformance } from '@looms/testing'

import type { MessageBoard } from './board'
import { defineSwarm, readActivation } from './definitions'
import { activationRunId } from './effects'
import { ensureSwarm } from './ensure'
import { createMemoryBoard } from './memory-board'
import { swarm } from './module'
import { swarmStatus } from './projections'
import { nudge, stop } from './signals'
import { concerns } from './threads'
import { memberTools } from './tools'

const triage = defineAgent({
  name: 'triage',
  instructions: 'triage',
  resolveTools: memberTools,
})

const fixer = defineAgent({
  name: 'fixer',
  instructions: 'fixer',
  resolveTools: memberTools,
})

const ops = defineSwarm({
  name: 'ops',
  pollIntervalMs: null,
  members: [
    { name: 'triage', agent: triage, channels: ['support/'], description: 'Sorts incoming work' },
    { name: 'fixer', agent: fixer, description: 'Fixes what triage hands over' },
  ],
})

/** Triage turns a report into a task for the fixer. The fixer claims it and completes it. */
function script(ctx: AgentTurnContext): ToolCall[] | undefined {
  const results = ctx.messages.filter((message) => message.role === 'tool')
  const prompt = ctx.messages.find((message) => message.role === 'user')?.content ?? ''

  if (ctx.instructions === 'triage') {
    return results.length > 0
      ? undefined
      : [
          {
            id: 'triage_1',
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

function hostFor(board: MessageBoard) {
  return createLooms({
    maxWakeIterations: 2_000,
    modules: [
      agent({ definitions: [triage, fixer], llmPolicy: { toolCallsFor: script } }),
      swarm({ definitions: [ops], board }),
    ],
  })
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

describe('swarm module', () => {
  test('conforms and folds its examples', () => {
    expect(moduleConformance(swarm({ definitions: [ops] }))).toEqual([])
  })

  test('rejects member names that cannot be mentioned', () => {
    expect(() =>
      defineSwarm({ name: 'bad', members: [{ name: 'Triage Bot', agent: triage }] }),
    ).toThrow('lowercase')

    expect(() =>
      defineSwarm({
        name: 'bad',
        members: [
          { name: 'triage', agent: triage },
          { name: 'triage', agent: fixer },
        ],
      }),
    ).toThrow('twice')
  })

  test('wakes members for mentions, assigned tasks, and their channels only', () => {
    const [listener, worker] = ops.members
    const base = { cursor: '1', at: 0 }

    const message = {
      id: 'msg_1',
      channel: 'support/billing',
      text: 'hello',
      by: 'dana',
      re: null,
      mentions: [],
      labels: {},
      createdAt: 0,
    }

    const task = {
      id: 'msg_2',
      channel: 'eng',
      text: 'x',
      by: 'triage',
      for: 'fixer',
      needs: [],
      state: 'ready' as const,
      holder: null,
      epoch: 0,
      leaseUntil: null,
      note: null,
      createdAt: 0,
      updatedAt: 0,
    }

    const posted = { ...base, type: 'message.posted' as const, by: 'dana', message }

    expect(concerns(listener!, posted)).toBe(true)
    expect(concerns(worker!, posted)).toBe(false)

    expect(concerns(worker!, { ...posted, message: { ...message, mentions: ['fixer'] } })).toBe(
      true,
    )

    expect(concerns(listener!, { ...posted, by: 'triage' })).toBe(false)

    const created = { ...base, type: 'task.created' as const, by: 'triage', task }

    expect(concerns(worker!, created)).toBe(true)
    expect(concerns(listener!, created)).toBe(false)
    expect(concerns(worker!, { ...created, task: { ...task, state: 'waiting' } })).toBe(false)
    expect(concerns(worker!, { ...created, type: 'task.claimed' })).toBe(false)
  })

  test('members hand work to each other through the board', async () => {
    const board = createMemoryBoard()
    const looms = hostFor(board)

    try {
      expect(await ensureSwarm(looms, ops, 'swarm_acme', { board: 'acme' })).toBe('started')
      expect(await ensureSwarm(looms, ops, 'swarm_acme', { board: 'acme' })).toBe('running')

      await board.post({ by: 'dana', channel: 'support', text: 'nobody can log in' })
      await looms.signal('swarm_acme', [nudge()])

      await until(
        () => board.tasks({ state: 'completed' }).then((tasks) => tasks.length === 1),
        'the fixer completed the task',
      )

      const [task] = await board.tasks()

      expect(task).toMatchObject({ by: 'triage', for: 'fixer', note: 'patched', holder: null })

      await until(
        () =>
          looms
            .project('swarm_acme', swarmStatus)
            .then((view) => view.members.fixer?.status === 'idle'),
        'the fixer went idle',
      )

      const view = await looms.project('swarm_acme', swarmStatus)

      expect(view.board).toBe('acme')
      expect(view.members.triage).toMatchObject({ activations: 1, lastOutcome: 'completed' })

      expect(view.members.fixer).toMatchObject({
        activations: 1,
        lastOutcome: 'completed',
        runId: activationRunId('swarm_acme', 'fixer', 1),
      })

      // The member's own run records what it did on the board.
      const fixerEvents = await looms.getEvents(activationRunId('swarm_acme', 'fixer', 1))
      const types = fixerEvents.map((event) => event.type)

      expect(types).toContain('swarm.task.claimed')
      expect(types).toContain('swarm.task.settled')

      const events = await looms.getEvents('swarm_acme')
      const { runtime } = await looms.ready()
      const first = foldRun(events, runtime.registry, { runId: 'swarm_acme' })
      const second = foldRun(events, runtime.registry, { runId: 'swarm_acme' })

      expect(stringifyJson(first)).toBe(stringifyJson(second))

      await looms.signal('swarm_acme', [stop()])

      await until(
        () => looms.getRun('swarm_acme').then((state) => state.status === 'completed'),
        'the swarm completed',
      )
    } finally {
      await looms.stop()
    }
  })

  test('members see and pass on the files attached to messages', async () => {
    const shot = { id: 'files/login', mediaType: 'image/png', name: 'login.png' }
    const seen: Array<{ role: string; files: string[] }> = []

    const viewer = defineAgent({
      name: 'viewer',
      instructions: 'viewer',
      resolveTools: memberTools,
    })

    const desk = defineSwarm({
      name: 'desk',
      pollIntervalMs: null,
      members: [{ name: 'viewer', agent: viewer }],
    })

    const board = createMemoryBoard()

    const looms = createLooms({
      maxWakeIterations: 2_000,
      modules: [
        agent({
          definitions: [viewer],
          llmPolicy: {
            toolCallsFor: (ctx) => {
              const results = ctx.messages.filter((message) => message.role === 'tool')

              seen.length = 0

              for (const message of ctx.messages) {
                if (message.attachments) {
                  seen.push({
                    role: message.role,
                    files: message.attachments.map((file) => file.id),
                  })
                }
              }

              if (results.length === 0) {
                return [{ id: 'view_1', name: 'board_view', arguments: { message: 'msg_1' } }]
              }

              return results.length === 1
                ? [
                    {
                      id: 'reply_1',
                      name: 'board_reply',
                      arguments: { to: 'msg_1', text: 'annotated', attachments: [shot] },
                    },
                  ]
                : undefined
            },
          },
        }),
        swarm({ definitions: [desk], board }),
      ],
    })

    try {
      await ensureSwarm(looms, desk, 'swarm_desk')

      await board.post({
        by: 'dana',
        channel: 'support',
        text: '@viewer what is wrong here?',
        attachments: [shot],
      })

      await looms.signal('swarm_desk', [nudge()])

      await until(
        () => board.messages({ thread: 'msg_1' }).then((thread) => thread.length === 2),
        'the viewer replied',
      )

      const [, reply] = await board.messages({ thread: 'msg_1' })

      expect(reply).toMatchObject({ by: 'viewer', text: 'annotated', attachments: [shot] })

      // The file came with the wake-up message and again with the board_view result.
      expect(seen).toEqual([
        { role: 'user', files: ['files/login'] },
        { role: 'tool', files: ['files/login'] },
      ])

      const run = await looms.getEvents(activationRunId('swarm_desk', 'viewer', 1))
      const start = readActivation(run[0]?.payload.input)

      expect(start?.attachments).toEqual([shot])
      expect(start?.prompt).toContain('login.png (image/png, id "files/login")')
    } finally {
      await looms.stop()
    }
  })

  test('polls the board when nothing nudges it', async () => {
    const board = createMemoryBoard()
    const lone = defineAgent({ name: 'poller', instructions: 'poller' })

    const polling = defineSwarm({
      name: 'polling',
      pollIntervalMs: 20,
      members: [{ name: 'poller', agent: lone }],
    })

    const looms = createLooms({
      maxWakeIterations: 2_000,
      modules: [agent({ definitions: [lone] }), swarm({ definitions: [polling], board })],
    })

    try {
      await looms.start(polling, null, { runId: 'swarm_polling' })
      await board.post({ by: 'dana', channel: 'general', text: 'not for anyone' })
      await board.post({ by: 'dana', channel: 'general', text: '@poller are you there?' })

      await until(
        () =>
          looms
            .project('swarm_polling', swarmStatus)
            .then((view) => view.members.poller?.lastOutcome === 'completed'),
        'the poll woke the member',
      )

      const run = await looms.getRun(activationRunId('swarm_polling', 'poller', 1))
      const input = readActivation(run.threads[run.rootThreadId ?? '']?.input)

      expect(input?.swarm).toMatchObject({ board: 'swarm_polling', member: 'poller' })
      expect(input?.events.map((event) => event.message?.text)).toEqual(['@poller are you there?'])
    } finally {
      await looms.stop()
    }
  })

  test('a refused board call reaches the agent as a tool error', async () => {
    const board = createMemoryBoard()
    const lone = defineAgent({ name: 'lone', instructions: 'lone', resolveTools: memberTools })

    const solo = defineSwarm({
      name: 'solo',
      pollIntervalMs: null,
      members: [{ name: 'lone', agent: lone, channels: ['inbox'] }],
    })

    const looms = createLooms({
      maxWakeIterations: 2_000,
      modules: [
        agent({
          definitions: [lone],
          llmPolicy: {
            toolCallsFor: (ctx) =>
              ctx.messages.some((message) => message.role === 'tool')
                ? undefined
                : [{ id: 'lone_1', name: 'board_reply', arguments: { to: 'msg_404', text: 'hi' } }],
          },
        }),
        swarm({ definitions: [solo], board }),
      ],
    })

    try {
      await board.post({ by: 'dana', channel: 'inbox', text: 'anyone there?' })
      await looms.start(solo, null, { runId: 'swarm_solo' })

      const memberRun = activationRunId('swarm_solo', 'lone', 1)

      await until(
        () => looms.getRun(memberRun).then((state) => state.status === 'completed'),
        'the member finished',
      )

      const events = await looms.getEvents(memberRun)
      const rejected = events.find((event) => event.type === 'swarm.call.rejected')
      const result = events.find((event) => event.type === 'agent.tool.result')

      expect(rejected?.payload).toMatchObject({ code: 'message_not_found' })
      expect(result?.payload).toMatchObject({ name: 'board_reply', error: 'No message "msg_404"' })
    } finally {
      await looms.stop()
    }
  })
})
