import { describe, expect, test } from 'bun:test'

import { agent, defineAgent } from '@looms/agent'
import { foldRun, stringifyJson } from '@looms/core'
import { createLooms } from '@looms/runtime'

import { BoardError, type MessageBoard } from './board'
import { defineSwarm, readActivation } from './definitions'
import { activationRunId } from './effects'
import { ensureSwarm } from './ensure'
import { createMemoryBoard } from './memory-board'
import { swarm } from './module'
import { swarmStatus, type SwarmStatus } from './projections'
import { nudge, pause, restart, resume, stop } from './signals'

const helper = defineAgent({ name: 'helper', instructions: 'helper' })

const desk = defineSwarm({
  name: 'desk',
  pollIntervalMs: null,
  members: [{ name: 'helper', agent: helper, channels: ['inbox'] }],
})

const RUN = 'swarm_desk'

interface SwappableBoard {
  current: MessageBoard
  refuse: boolean
}

/** A host whose board can be swapped or made to refuse, as a host's database might. */
function setup() {
  const boards: SwappableBoard = {
    current: createMemoryBoard(),
    refuse: false,
  }

  const looms = createLooms({
    maxWakeIterations: 2_000,
    modules: [
      agent({ definitions: [helper] }),
      swarm({
        definitions: [desk],
        boards: () => {
          if (boards.refuse) {
            throw new BoardError({ code: 'board_denied', message: 'not your board' })
          }

          return boards.current
        },
      }),
    ],
  })

  const status = () => looms.project(RUN, swarmStatus)

  const post = async (text: string) => {
    await boards.current.post({ by: 'dana', channel: 'inbox', text })
    await looms.signal(RUN, [nudge()])
  }

  const until = async (check: (view: SwarmStatus) => boolean, what: string) => {
    const deadline = Date.now() + 20_000

    while (Date.now() < deadline) {
      if (check(await status())) {
        return
      }

      await Bun.sleep(10)
    }

    throw new Error(`timed out waiting until ${what}`)
  }

  return { looms, boards, status, post, until }
}

async function textsOf(
  looms: ReturnType<typeof createLooms>,
  runId: string,
): Promise<Array<string | undefined>> {
  const run = await looms.getRun(runId)
  const input = readActivation(run.threads[run.rootThreadId ?? '']?.input)

  return input?.events.map((event) => event.message?.text) ?? []
}

describe('swarm lifecycle', () => {
  test('a paused swarm wakes nobody and resumes from where it was', async () => {
    const { looms, status, post, until } = setup()

    try {
      await ensureSwarm(looms, desk, RUN)
      await post('first')
      await until((view) => view.members.helper?.lastOutcome === 'completed', 'the first wake')

      await looms.signal(RUN, [pause()])
      await post('while paused')
      await Bun.sleep(100)

      expect(await status()).toMatchObject({ status: 'paused', generation: 1 })
      expect((await status()).members.helper?.activations).toBe(1)
      expect(await ensureSwarm(looms, desk, RUN)).toBe('paused')

      await looms.signal(RUN, [resume()])
      await until((view) => view.members.helper?.activations === 2, 'the resumed wake')

      expect((await status()).status).toBe('running')

      expect(
        await textsOf(looms, activationRunId({ swarmRunId: RUN, member: 'helper', activation: 2 })),
      ).toEqual(['while paused'])
    } finally {
      await looms.stop()
    }
  })

  test('ensureSwarm restarts a stopped swarm as a new generation under the same run id', async () => {
    const { looms, status, post, until } = setup()

    try {
      await ensureSwarm(looms, desk, RUN)
      await post('first')
      await until((view) => view.members.helper?.lastOutcome === 'completed', 'the first wake')

      await looms.signal(RUN, [stop()])
      await until((view) => view.status === 'stopped', 'the swarm stopped')
      await post('while stopped')

      expect(await ensureSwarm(looms, desk, RUN, {}, { restart: false })).toBe('stopped')
      expect(await ensureSwarm(looms, desk, RUN)).toBe('restarted')

      await until(
        (view) => view.generation === 2 && view.members.helper?.lastOutcome === 'completed',
        'the second generation woke the member',
      )

      expect(await ensureSwarm(looms, desk, RUN)).toBe('running')

      // The new generation carried on from the cursor, and its run cannot collide with the
      // first generation's activation 1.
      const second = activationRunId({
        swarmRunId: RUN,
        member: 'helper',
        activation: 1,
        generation: 2,
      })

      expect(second).not.toBe(activationRunId({ swarmRunId: RUN, member: 'helper', activation: 1 }))
      expect((await status()).members.helper).toMatchObject({ activations: 1, runId: second })
      expect(await textsOf(looms, second)).toEqual(['while stopped'])

      const events = await looms.getEvents(RUN)
      const { runtime } = await looms.ready()

      expect(stringifyJson(foldRun(events, runtime.registry, { runId: RUN }))).toBe(
        stringifyJson(foldRun(events, runtime.registry, { runId: RUN })),
      )
    } finally {
      await looms.stop()
    }
  })

  test('a restart can read the board again from the start', async () => {
    const { looms, post, until } = setup()

    try {
      await ensureSwarm(looms, desk, RUN)
      await post('first')
      await until((view) => view.members.helper?.lastOutcome === 'completed', 'the first wake')

      await looms.signal(RUN, [restart({ after: null })])

      await until(
        (view) => view.generation === 2 && view.members.helper?.lastOutcome === 'completed',
        'the second generation woke the member',
      )

      const second = activationRunId({
        swarmRunId: RUN,
        member: 'helper',
        activation: 1,
        generation: 2,
      })

      expect(await textsOf(looms, second)).toEqual(['first'])
    } finally {
      await looms.stop()
    }
  })

  test('a board whose log restarted is read again from its start', async () => {
    const { looms, boards, status, post, until } = setup()

    try {
      await ensureSwarm(looms, desk, RUN)
      await post('one')
      await post('two')
      await until((view) => view.eventsRead === 2, 'the swarm read the old log')
      await until((view) => view.members.helper?.lastOutcome === 'completed', 'the old wake')

      // The board's storage was wiped: its log starts again, and the old cursor means nothing.
      boards.current = createMemoryBoard()
      await post('after the reset')

      await until((view) => view.resets === 1, 'the swarm noticed the reset')
      await until((view) => view.eventsRead === 3, 'the swarm read the new log')

      expect((await status()).status).toBe('running')
    } finally {
      await looms.stop()
    }
  })

  test('a board that refuses the swarm halts it until it is restarted', async () => {
    const { looms, boards, status, post, until } = setup()

    try {
      boards.refuse = true
      await ensureSwarm(looms, desk, RUN)
      await until((view) => view.status === 'halted', 'the swarm halted')

      expect((await status()).error).toContain('board_denied')
      expect((await looms.getRun(RUN)).status).toBe('running')

      boards.refuse = false
      await boards.current.post({ by: 'dana', channel: 'inbox', text: 'hello' })

      expect(await ensureSwarm(looms, desk, RUN)).toBe('restarted')
      await until((view) => view.members.helper?.lastOutcome === 'completed', 'the member woke')
      await post('again')
      await until((view) => view.members.helper?.activations === 2, 'the member woke again')

      expect(await status()).toMatchObject({ status: 'running', generation: 2, error: null })
    } finally {
      await looms.stop()
    }
  })

  test('a cancelled swarm cannot be ensured again', async () => {
    const { looms } = setup()

    try {
      await ensureSwarm(looms, desk, RUN)
      await looms.cancel(RUN)

      expect(ensureSwarm(looms, desk, RUN)).rejects.toThrow('new run id')
    } finally {
      await looms.stop()
    }
  })
})
