import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import {
  RunLauncherTag,
  complete,
  defineEffect,
  defineEventCatalog,
  defineRuntimeModule,
  defineThread,
  invoke,
  isJsonObject,
} from '@looms/core'

import { StartRunConflictError } from './errors'
import { createLooms } from './looms'

const catalog = defineEventCatalog('relay', {
  launched: Schema.Struct({}),
})

const RelayInput = Schema.Struct({ depth: Schema.Finite })

const launchNext = defineEffect({
  type: 'relay.launch',
  placement: 'local',
  input: RelayInput,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const launcher = yield* RunLauncherTag

      yield* launcher.launch({
        runId: `${ctx.runId}-child`,
        kind: 'relay',
        definitionName: 'relay',
        input: { depth: input.depth - 1 },
        launchedBy: {
          runId: 'forged',
          threadId: 'forged',
          effectId: 'forged',
          causationId: 'forged',
          causationSeq: 0,
        },
        correlationId: 'forged',
      })

      return [{ type: 'relay.launched', payload: {}, threadId: ctx.threadId }]
    }),
})

const relayThread = defineThread({
  kind: 'relay',
  input: RelayInput,
  initialState: (ctx) => ({ depth: ctx.input?.depth ?? 0, launched: false }),
  step: (state, event) => (event.type === 'relay.launched' ? { ...state, launched: true } : state),
  effects: (state) =>
    state.depth === 0 || state.launched
      ? [complete({ ok: true })]
      : [invoke(launchNext, { depth: state.depth }, 'launch')],
})

const relayModule = defineRuntimeModule({
  namespace: 'relay',
  protocolVersion: '1.0.0',
  events: catalog,
  threads: { relay: relayThread },
  effects: { launch: launchNext },
  definitions: [{ kind: 'relay', name: 'relay', version: 'v1', input: RelayInput }],
})

const relay = { kind: 'relay', name: 'relay', version: 'v1' }

describe('launch provenance', () => {
  test('records the launching effect, origin, and root correlation on each launched run', async () => {
    const looms = createLooms({ modules: [relayModule] })

    try {
      await looms.start(relay, { depth: 2 }, { runId: 'root' })

      const deadline = Date.now() + 5_000

      while ((await looms.getRun('root-child-child')).status !== 'completed') {
        if (Date.now() > deadline) {
          throw new Error('the grandchild run did not complete')
        }

        await Bun.sleep(5)
      }

      const rootEvents = await looms.getEvents('root')
      const childEvents = await looms.getEvents('root-child')
      const grandchildEvents = await looms.getEvents('root-child-child')
      const rootStarted = rootEvents.find((event) => event.type === 'runtime.run.started')
      const childStarted = childEvents.find((event) => event.type === 'runtime.run.started')

      const grandchildStarted = grandchildEvents.find(
        (event) => event.type === 'runtime.run.started',
      )

      expect(rootStarted?.correlationId ?? null).toBeNull()
      expect(rootStarted?.origin).toEqual({ type: 'system' })

      const child = await looms.getRun('root-child')
      const launchedBy = child.startIdentity?.launchedBy
      const cause = rootEvents.find((event) => event.id === launchedBy?.causationId)

      expect(launchedBy?.runId).toBe('root')
      expect(launchedBy?.threadId).toBe((await looms.getRun('root')).rootThreadId ?? '')
      expect(cause?.seq).toBe(launchedBy?.causationSeq ?? -1)

      expect(
        rootEvents.some(
          (event) =>
            event.type === 'runtime.effect.attempt.started' &&
            isJsonObject(event.payload) &&
            event.payload.effectId === launchedBy?.effectId,
        ),
      ).toBe(true)

      const runLaunched = rootEvents.find((event) => event.type === 'runtime.run.launched')

      expect(runLaunched?.payload).toEqual({
        runId: 'root-child',
        kind: 'relay',
        definitionName: 'relay',
        definitionVersion: 'v1',
        effectId: launchedBy?.effectId ?? '',
      })

      expect(runLaunched?.effectId).toBeUndefined()
      expect(runLaunched?.threadId).toBe(launchedBy?.threadId ?? '')
      expect(runLaunched?.causationId).toBe(launchedBy?.causationId ?? '')
      expect(runLaunched?.correlationId).toBe('root')

      expect(childStarted?.payload).toMatchObject({ launchedBy })
      expect(childStarted?.origin).toEqual({ type: 'run', runId: 'root' })
      expect(childStarted?.correlationId).toBe('root')
      expect(child.startIdentity?.correlationId).toBe('root')

      const grandchild = await looms.getRun('root-child-child')
      expect(grandchild.startIdentity?.launchedBy?.runId).toBe('root-child')
      expect(grandchildStarted?.correlationId).toBe('root')
    } finally {
      await looms.stop()
    }
  })

  test('a start without the same launcher conflicts with a launched run', async () => {
    const looms = createLooms({ modules: [relayModule] })

    try {
      await looms.start(relay, { depth: 1 }, { runId: 'parent' })

      const deadline = Date.now() + 5_000

      while ((await looms.getRun('parent-child')).status !== 'completed') {
        if (Date.now() > deadline) {
          throw new Error('the child run did not complete')
        }

        await Bun.sleep(5)
      }

      let caught

      try {
        await looms.start(relay, { depth: 0 }, { runId: 'parent-child' })
      } catch (error) {
        caught = error
      }

      expect(caught).toBeInstanceOf(StartRunConflictError)
      expect(caught).toMatchObject({ mismatches: ['launchedBy', 'correlationId'] })
    } finally {
      await looms.stop()
    }
  })
})
