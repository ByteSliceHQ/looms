import { describe, expect, test } from 'bun:test'

import {
  agent,
  defineAgent,
  defineTool,
  type AgentRunContext,
  type AgentTurnResult,
  type LlmCompleteArgs,
} from '@looms/agent'
import {
  createEffectId,
  makeDefinitionStore,
  typeIds,
  type EventEnvelope,
  type RunAttributes,
} from '@looms/core'
import { createLooms } from '@looms/runtime'

import { BoardError, type BoardCaller, type MessageBoard } from './board'
import { defineSwarm } from './definitions'
import { activationRunId } from './effects'
import { ensureSwarm } from './ensure'
import { createMemoryBoard } from './memory-board'
import { swarm } from './module'
import { swarmStatus } from './projections'
import { nudge } from './signals'
import { createSwarmThread, type SwarmState } from './threads'
import { memberTools } from './tools'

const tenant: RunAttributes = { orgId: 'org_1', businessId: 'biz_1' }

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

/** One board per business. A caller reaches only the board of the business it runs for. */
function tenantBoards(callers: BoardCaller[]) {
  const boards = new Map<string, MessageBoard>()

  const open = (businessId: string): MessageBoard => {
    const board = boards.get(businessId) ?? createMemoryBoard()

    boards.set(businessId, board)

    return board
  }

  return {
    open,
    resolve: (boardId: string, caller: BoardCaller): MessageBoard => {
      callers.push(caller)

      if (boardId !== caller.attributes.businessId) {
        throw new BoardError({
          code: 'board_denied',
          message: `Board "${boardId}" belongs to another business`,
        })
      }

      return open(boardId)
    },
  }
}

describe('swarm tenancy', () => {
  test('a swarm and its members act as the tenant the swarm was started for', async () => {
    const callers: BoardCaller[] = []
    const modelRuns: AgentRunContext[] = []
    const toolRuns: AgentRunContext[] = []
    const resolvedFor: RunAttributes[] = []
    const boards = tenantBoards(callers)

    const whoami = defineTool({
      name: 'whoami',
      description: 'Report the tenant',
      handler: (_input, ctx) => {
        toolRuns.push(ctx)

        return { businessId: ctx.attributes.businessId ?? null }
      },
    })

    const helper = defineAgent({
      name: 'helper',
      instructions: 'helper',
      resolveTools: (ctx) => {
        resolvedFor.push(ctx.attributes)

        return [...memberTools(ctx), whoami]
      },
    })

    const desk = defineSwarm({
      name: 'desk',
      pollIntervalMs: null,
      members: [{ name: 'helper', agent: helper }],
    })

    const complete = (args: LlmCompleteArgs): Promise<AgentTurnResult> => {
      modelRuns.push(args.run)

      const results = args.messages.filter((message) => message.role === 'tool').length

      if (results >= 2) {
        return Promise.resolve({
          message: { role: 'assistant', content: 'done' },
          done: true,
          output: { text: 'done' },
        })
      }

      const toolCalls =
        results === 0
          ? [{ id: 'call_1', name: 'whoami', arguments: {} }]
          : [{ id: 'call_2', name: 'board_reply', arguments: { to: 'msg_1', text: 'on it' } }]

      return Promise.resolve({ message: { role: 'assistant', content: '', toolCalls }, toolCalls })
    }

    const looms = createLooms({
      maxWakeIterations: 2_000,
      modules: [
        agent({ definitions: [helper], llm: { complete } }),
        swarm({ definitions: [desk], boards: boards.resolve }),
      ],
    })

    try {
      await ensureSwarm(looms, desk, 'swarm_biz_1', { board: 'biz_1' }, { attributes: tenant })
      await boards.open('biz_1').post({ by: 'dana', channel: 'support', text: '@helper hello' })
      await looms.signal('swarm_biz_1', [nudge()])

      await until(
        () =>
          boards
            .open('biz_1')
            .messages({ thread: 'msg_1' })
            .then((thread) => thread.length === 2),
        'the helper replied',
      )

      const memberRun = activationRunId({
        swarmRunId: 'swarm_biz_1',
        member: 'helper',
        activation: 1,
      })

      expect((await looms.getRun(memberRun)).attributes).toEqual(tenant)

      // The board resolver, the tool resolver, the tool and the model adapter all see the tenant.
      expect(callers.every((caller) => caller.attributes.businessId === 'biz_1')).toBe(true)
      expect(callers.map((caller) => caller.runId)).toContain(memberRun)
      expect(resolvedFor.every((attributes) => attributes.orgId === 'org_1')).toBe(true)
      expect(toolRuns.map((run) => [run.runId, run.attributes])).toEqual([[memberRun, tenant]])
      expect(modelRuns.length).toBeGreaterThan(0)

      expect(
        modelRuns.every((run) => run.runId === memberRun && run.attributes.orgId === 'org_1'),
      ).toBe(true)

      // A swarm started for one business on another business's board halts instead of reading it.
      await ensureSwarm(looms, desk, 'swarm_stray', { board: 'biz_2' }, { attributes: tenant })

      await until(
        () => looms.project('swarm_stray', swarmStatus).then((view) => view.status === 'halted'),
        'the stray swarm halted',
      )

      expect(await boards.open('biz_2').events()).toMatchObject({ events: [] })
    } finally {
      await looms.stop()
    }
  })

  test('a swarm tries an unreachable board again, less and less often', () => {
    const desk = defineSwarm({ name: 'desk', members: [] })
    const thread = createSwarmThread(makeDefinitionStore('swarm', [desk]))
    const ctx = { runId: 'swarm_1', threadId: 'thread_1', parentThreadId: null, ids: typeIds }

    const start: SwarmState = {
      generation: 1,
      definitionName: 'desk',
      definitionVersion: desk.version,
      board: 'biz_1',
      cursor: null,
      pulls: 3,
      pullFailures: 0,
      pullNow: true,
      nextPullAt: null,
      dirty: false,
      members: {},
      paused: false,
      stopped: false,
      invalid: null,
      halted: false,
    }

    const failed = (state: SwarmState, ts: number, nonRetryable: boolean): EventEnvelope => ({
      id: `evt_${ts}`,
      runId: ctx.runId,
      seq: ts,
      ts,
      type: 'runtime.effect.failed',
      payload: {
        effectId: createEffectId(ctx.threadId, `pull:3:${state.pullFailures}:now`),
        error: 'connection refused',
        nonRetryable,
      },
      threadId: ctx.threadId,
      effectId: createEffectId(ctx.threadId, `pull:3:${state.pullFailures}:now`),
      origin: { type: 'thread', threadId: ctx.threadId },
    })

    const once = thread.step(start, failed(start, 1_000, false), ctx)

    expect(once).toMatchObject({ pullFailures: 1, pullNow: false, nextPullAt: 31_000 })
    expect(thread.effects(once, ctx)).toMatchObject([{ tag: 'pull:3:1:31000', at: 31_000 }])

    // A failure of the pull the swarm has already given up on changes nothing.
    expect(thread.step(once, failed(start, 2_000, false), ctx)).toBe(once)

    const refused = thread.step(start, failed(start, 1_000, true), ctx)

    // A refusal halts the swarm: its run stays open for a restart.
    expect(thread.effects(refused, ctx)).toMatchObject([
      { type: 'runtime.emit', event: { type: 'swarm.halted' }, tag: 'halt:1' },
    ])
  })
})
