import { describe, expect, test } from 'bun:test'

import { Cause, Effect, Exit, Fiber } from 'effect'

import { EventStoreTag, makeMemoryEventStore, wait } from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLooms } from './looms'
import type { WakeScheduler } from './wake-scheduler'

describe('wake coordination', () => {
  test('settles an interrupted owner and its joiner with the same cause', async () => {
    const scheduleEntered = Promise.withResolvers<void>()
    let schedules = 0

    const scheduler: WakeScheduler = {
      schedule: () => {
        schedules += 1

        if (schedules === 1) {
          return Effect.void
        }

        return Effect.sync(() => scheduleEntered.resolve()).pipe(Effect.andThen(Effect.never))
      },
      cancel: () => Effect.void,
    }

    const sleeper = defineWorkflow({
      name: 'interruptible-wake-owner',
      nodes: [
        {
          id: 'sleep',
          run: (ctx) =>
            ctx.effects([wait({ waitId: 'later', on: { timerAt: Date.now() + 60_000 } })]),
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [sleeper] })],
      scheduler,
      rescanTimers: false,
    })

    const started = await looms.start(sleeper, {})
    const { runtime, store } = await looms.ready()
    const wake = runtime.wake(started.runId).pipe(Effect.provideService(EventStoreTag, store))
    const ownerFiber = Effect.runFork(wake)

    await scheduleEntered.promise

    const joinerFiber = Effect.runFork(wake)
    await Bun.sleep(10)

    const ownerAwait = Effect.runPromise(Fiber.await(ownerFiber))

    await Effect.runPromise(Fiber.interrupt(ownerFiber))

    const ownerExit = await ownerAwait

    const joinerExit = await Promise.race([
      Effect.runPromise(Fiber.await(joinerFiber)),
      Bun.sleep(500).then(() => {
        throw new Error('joining wake hung after owner interruption')
      }),
    ])

    expect(Exit.isFailure(ownerExit)).toBe(true)
    expect(Exit.isFailure(joinerExit)).toBe(true)

    if (Exit.isFailure(ownerExit) && Exit.isFailure(joinerExit)) {
      expect(Cause.pretty(joinerExit.cause)).toBe(Cause.pretty(ownerExit.cause))
    }

    await looms.stop()
  })

  test('signal joins an active wake and returns post-execution state', async () => {
    const inner = await Effect.runPromise(makeMemoryEventStore)
    const readEntered = Promise.withResolvers<void>()
    const readReleased = Promise.withResolvers<void>()
    const signalAppended = Promise.withResolvers<void>()
    let blockNextRead = false

    const store = {
      ...inner,
      read: (runId, options) => {
        if (blockNextRead) {
          blockNextRead = false

          return Effect.gen(function* () {
            readEntered.resolve()
            yield* Effect.promise(() => readReleased.promise)
            return yield* inner.read(runId, options)
          })
        }

        return inner.read(runId, options)
      },
      append: (runId, events, options) =>
        inner.append(runId, events, options).pipe(
          Effect.tap(() =>
            Effect.sync(() => {
              if (events.some((event) => event.type === 'go')) {
                signalAppended.resolve()
              }
            }),
          ),
        ),
    } satisfies typeof inner

    const gated = defineWorkflow({
      name: 'joined-signal-result',
      nodes: [
        {
          id: 'gate',
          run: (ctx) => ctx.effects([wait({ waitId: 'go', on: { type: 'go' } })]),
        },
        { id: 'done', deps: ['gate'], run: () => 'done' },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [gated] })],
      store,
    })

    const started = await looms.start(gated, {})
    blockNextRead = true

    const owner = looms.wake(started.runId)
    await readEntered.promise

    let signalSettled = false

    const signalled = looms
      .signal(started.runId, [{ type: 'go', payload: {}, threadId: started.threadId }])
      .then((state) => {
        signalSettled = true
        return state
      })

    await signalAppended.promise
    expect(signalSettled).toBe(false)

    readReleased.resolve()

    const [ownerState, signalState] = await Promise.all([owner, signalled])
    expect(ownerState.status).toBe('completed')
    expect(signalState.status).toBe('completed')
    await looms.stop()
  })
})
