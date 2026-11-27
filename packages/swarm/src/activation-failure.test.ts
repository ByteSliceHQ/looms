import { describe, expect, test } from 'bun:test'

import { agent, defineAgent } from '@looms/agent'
import {
  createEvent,
  defineRuntimeModule,
  failEffect,
  makeDefinitionStore,
  onEffect,
  typeIds,
  type ThreadContext,
} from '@looms/core'
import { createLooms } from '@looms/runtime'

import { defineSwarm } from './definitions'
import { activateEffect } from './effects'
import { ensureSwarm } from './ensure'
import { createMemoryBoard } from './memory-board'
import { swarm } from './module'
import { swarmStatus, type SwarmStatus } from './projections'
import { nudge } from './signals'
import { createSwarmThread, type SwarmState } from './threads'

const helper = defineAgent({ name: 'helper', instructions: 'helper' })
/** Named by a member, but registered with no module: launching it always fails. */
const ghost = defineAgent({ name: 'ghost', instructions: 'ghost' })

const desk = defineSwarm({
  name: 'desk',
  pollIntervalMs: null,
  members: [
    { name: 'helper', agent: helper, channels: ['inbox'] },
    { name: 'ghost', agent: ghost, channels: ['inbox'] },
  ],
})

const RUN = 'swarm_desk'

/** Fails the next activation of each member named in `faults`, as a launcher outage would. */
function launchFaults(faults: Set<string>) {
  return defineRuntimeModule({
    namespace: 'faults',
    protocolVersion: '1.0.0',
    middleware: [
      onEffect(activateEffect, (input, _ctx, next) =>
        faults.delete(input.member)
          ? failEffect({ error: 'launcher unavailable', nonRetryable: true })
          : next(),
      ),
    ],
  })
}

function setup(faults: Set<string> = new Set()) {
  const board = createMemoryBoard()

  const looms = createLooms({
    maxWakeIterations: 2_000,
    modules: [
      agent({ definitions: [helper] }),
      swarm({ definitions: [desk], board }),
      launchFaults(faults),
    ],
  })

  const status = () => looms.project(RUN, swarmStatus)

  const post = async (text: string) => {
    await board.post({ by: 'dana', channel: 'inbox', text })
    await looms.signal(RUN, [nudge()])
  }

  const until = async (check: (view: SwarmStatus) => boolean, what: string) => {
    const deadline = Date.now() + 30_000

    while (Date.now() < deadline) {
      if (check(await status())) {
        return
      }

      await Bun.sleep(10)
    }

    throw new Error(`timed out waiting until ${what}: ${JSON.stringify(await status())}`)
  }

  return { looms, status, post, until }
}

describe('a member activation that cannot start', () => {
  // The unregistered agent fails every attempt, so the activation fails once its retries are
  // spent, about 15 seconds in.
  test('is recorded on the member and the swarm keeps running', async () => {
    const faults = new Set<string>()
    const { looms, status, post, until } = setup(faults)

    try {
      await ensureSwarm(looms, desk, RUN)
      await post('first')

      await until((view) => view.members.ghost?.status === 'failed', 'the ghost failed')
      await until((view) => view.members.helper?.lastOutcome === 'completed', 'the helper ran')

      expect((await status()).members.ghost).toMatchObject({
        status: 'failed',
        activations: 1,
        runId: null,
        lastError: expect.stringContaining('Unknown definition'),
      })

      expect((await status()).status).toBe('running')
      expect((await looms.getRun(RUN)).status).toBe('running')
      expect(await ensureSwarm(looms, desk, RUN)).toBe('running')

      // The swarm still answers nudges: the helper is woken again, and the ghost is tried again.
      // Its second activation fails at once rather than after another round of retries.
      faults.add('ghost')
      await post('second')

      await until(
        (view) =>
          view.members.helper?.activations === 2 &&
          view.members.helper.lastOutcome === 'completed' &&
          view.members.ghost?.activations === 2,
        'both members were woken again',
      )

      expect((await status()).members.ghost).toMatchObject({
        status: 'failed',
        lastError: 'launcher unavailable',
      })

      expect((await looms.getRun(RUN)).status).toBe('running')
    } finally {
      await looms.stop()
    }
  }, 40_000)

  test('does not stop the member starting its next activation', async () => {
    const { looms, status, post, until } = setup(new Set(['helper']))

    try {
      await ensureSwarm(looms, desk, RUN)
      await post('first')

      await until((view) => view.members.helper?.status === 'failed', 'the helper failed')

      expect((await status()).members.helper?.lastError).toBe('launcher unavailable')

      await post('second')

      await until(
        (view) => view.members.helper?.lastOutcome === 'completed',
        'the helper ran its next activation',
      )

      expect((await status()).members.helper).toMatchObject({
        status: 'idle',
        activations: 2,
        lastError: null,
      })
    } finally {
      await looms.stop()
    }
  })
})

const polling = defineSwarm({
  name: 'polling',
  pollIntervalMs: 1_000,
  members: [{ name: 'helper', agent: helper, channels: ['inbox'] }],
})

const pollingThread = createSwarmThread(makeDefinitionStore('swarm', [polling]))

const ctx: ThreadContext = {
  runId: 'run_1',
  threadId: 'thr_1',
  parentThreadId: null,
  ids: typeIds,
}

function nudged(ts: number) {
  return createEvent('run_1', { type: 'swarm.nudged', payload: {}, threadId: 'thr_1', ts })
}

function pulled(pull: number, ts: number) {
  return createEvent('run_1', {
    type: 'swarm.board.pulled',
    payload: {
      board: 'run_1',
      pull,
      cursor: null,
      events: [],
      more: false,
      nextPullAt: ts + 1_000,
    },
    threadId: 'thr_1',
    ts,
  })
}

/** The swarm after its first pull, waiting for the poll due at 1000. */
function polled(): SwarmState {
  const initial = pollingThread.initialState({
    ...ctx,
    definitionName: polling.name,
    definitionVersion: polling.version,
    input: {},
  })

  return pollingThread.step(initial, pulled(0, 0), ctx)
}

describe('a pull requested while a scheduled pull may be reading the board', () => {
  test('reads the board again once that pull lands', () => {
    // The poll due at 1000 may have read the board before this nudge's write.
    const nudge1 = pollingThread.step(polled(), nudged(1_500), ctx)
    const landed = pollingThread.step(nudge1, pulled(1, 1_600), ctx)

    expect(landed.pullNow).toBe(true)
  })

  test('reads it only once when the scheduled pull has not started', () => {
    const early = pollingThread.step(polled(), nudged(500), ctx)
    const landed = pollingThread.step(early, pulled(1, 600), ctx)

    expect(early.pullNow).toBe(true)
    expect(landed.pullNow).toBe(false)
  })
})
