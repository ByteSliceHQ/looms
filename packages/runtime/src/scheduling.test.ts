import { describe, expect, test } from 'bun:test'

import { Effect, Predicate, Schema } from 'effect'

import { agent, defineAgent } from '@looms/agent'
import { approval, decision, gate } from '@looms/approval'
import {
  defineEffect,
  defineRuntimeModule,
  defineThread,
  createEvent,
  invoke,
  makeMemoryEventStore,
  type EventStore,
} from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLooms } from './looms'
import { DuplicateEffectDispatchError, MaxWakeIterationsError } from './runtime'

async function waitFor(predicate: () => boolean, timeoutMs = 1_000): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (!predicate() && Date.now() < deadline) {
    await Bun.sleep(10)
  }
}

describe('createLooms runtime', () => {
  test('automatically wakes sleeping workflows when timer expires', async () => {
    let wokeUp = false

    const sleeper = defineWorkflow({
      name: 'sleeper',
      nodes: [
        {
          id: 'step1',
          run: (ctx) => ctx.sleep(20),
        },
        {
          id: 'step2',
          deps: ['step1'],
          run: () => {
            wokeUp = true
            return { done: true }
          },
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [sleeper] })],
    })

    const { runId } = await looms.start(sleeper, {})

    // Wait for the automatic timer scheduler to fire wake(runId)
    await waitFor(() => wokeUp)

    const finalRun = await looms.getRun(runId)
    expect(wokeUp).toBe(true)
    expect(finalRun.status).toBe('completed')
    await looms.stop()
  })

  test('rescans and schedules pending timers across process restart', async () => {
    let wokeUp = false

    const sleeper = defineWorkflow({
      name: 'sleeping-restart-workflow',
      nodes: [
        {
          id: 'step1',
          run: (ctx) => ctx.sleep(30),
        },
        {
          id: 'step2',
          deps: ['step1'],
          run: () => {
            wokeUp = true
            return { done: true }
          },
        },
      ],
    })

    const sharedStore = await Effect.runPromise(makeMemoryEventStore)

    // First process starts the sleeping workflow then stops (simulating shutdown)
    const looms1 = createLooms({
      modules: [workflow({ definitions: [sleeper] })],
      store: sharedStore,
    })

    const { runId } = await looms1.start(sleeper, {})
    const initialRun = await looms1.getRun(runId)
    expect(initialRun.status).toBe('running')
    expect(wokeUp).toBe(false)

    // Shut down first process (cancels all in-memory timers)
    await looms1.stop()

    // Second process boots up with the same persistent store
    const looms2 = createLooms({
      modules: [workflow({ definitions: [sleeper] })],
      store: sharedStore,
    })

    // Wait for the restored timer to wake up in the second process
    await looms2.ready()
    await waitFor(() => wokeUp)

    const finalRun = await looms2.getRun(runId)
    expect(wokeUp).toBe(true)
    expect(finalRun.status).toBe('completed')
    await looms2.stop()
  })

  test('idempotent start returns existing run without duplicate start events', async () => {
    let runCount = 0

    const workflowDef = defineWorkflow({
      name: 'idempotent-flow',
      nodes: [
        {
          id: 'step1',
          run: () => {
            runCount += 1
            return { ok: true }
          },
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [workflowDef] })],
    })

    const runId = 'run_idempotent_test_1'
    const idempotencyKey = 'req_unique_key_123'

    const res1 = await looms.start(workflowDef, {}, { runId, idempotencyKey })
    expect(res1.runId).toBe(runId)
    expect(res1.state.status).toBe('completed')
    expect(runCount).toBe(1)

    // Second start with same runId and idempotencyKey
    const res2 = await looms.start(workflowDef, {}, { runId, idempotencyKey })
    expect(res2.runId).toBe(runId)
    expect(res2.state.status).toBe('completed')
    expect(runCount).toBe(1)

    const events = await looms.getEvents(runId)
    const startEvents = events.filter((e) => e.type === 'runtime.run.started')
    expect(startEvents.length).toBe(1)
    expect(startEvents[0]?.idempotencyKey).toBe(idempotencyKey)
    await looms.stop()
  })

  test('idempotent signal ignores duplicates with identical idempotency key', async () => {
    const workflowDef = defineWorkflow({
      name: 'signal-flow',
      nodes: [
        {
          id: 'wait-node',
          run: (ctx) => ctx.wait({ type: 'test.signal' }),
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [workflowDef] })],
    })

    const { runId } = await looms.start(workflowDef, {})

    // Send signal with idempotencyKey
    const idempotencyKey = 'sig_key_456'

    await looms.signal(runId, [{ type: 'test.signal', payload: { data: 1 }, threadId: null }], {
      idempotencyKey,
    })

    const eventsAfterFirstSignal = await looms.getEvents(runId)
    const signalEvents1 = eventsAfterFirstSignal.filter((e) => e.type === 'test.signal')
    expect(signalEvents1.length).toBe(1)

    // Re-send same signal with same idempotencyKey
    await looms.signal(runId, [{ type: 'test.signal', payload: { data: 1 }, threadId: null }], {
      idempotencyKey,
    })

    const eventsAfterSecondSignal = await looms.getEvents(runId)
    const signalEvents2 = eventsAfterSecondSignal.filter((e) => e.type === 'test.signal')
    expect(signalEvents2.length).toBe(1)
    await looms.stop()
  })

  test('workflow gate with approval request emits approval.requested exactly once while waiting', async () => {
    const gatedFlow = defineWorkflow({
      name: 'gated-flow',
      nodes: [
        {
          id: 'gate-step',
          run: (ctx) => ctx.effects(gate({ title: 'Approve test run?' })),
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [gatedFlow] }), approval()],
    })

    const { runId, state } = await looms.start(gatedFlow, {})
    expect(state.status).toBe('running')
    const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined
    expect(root?.status).toBe('waiting')

    const events = await looms.getEvents(runId)
    const reqEvents = events.filter((e) => e.type === 'approval.requested')
    expect(reqEvents.length).toBe(1)
    expect(reqEvents[0]?.payload).toBeDefined()

    const firstReq = reqEvents[0]
    expect(firstReq).toBeDefined()
    const payload = firstReq && Predicate.isObject(firstReq.payload) ? firstReq.payload : {}
    const approvalId = Predicate.isString(payload.approvalId) ? payload.approvalId : ''
    expect(approvalId).not.toBe('')
    const afterDecision = await looms.signal(runId, [decision(approvalId, 'approve')])
    expect(afterDecision.status).toBe('completed')

    const eventsAfterDone = await looms.getEvents(runId)
    const finalReqs = eventsAfterDone.filter((e) => e.type === 'approval.requested')
    expect(finalReqs.length).toBe(1)
    await looms.stop()
  })

  test('approval response and timeout race produces one winning satisfaction', async () => {
    const approvalId = 'approval-race'

    const gatedFlow = defineWorkflow({
      name: 'approval-race-flow',
      nodes: [
        {
          id: 'gate',
          run: (ctx) =>
            ctx.effects(
              gate({
                approvalId,
                title: 'Race',
                timeoutAt: Date.now() + 15,
              }),
            ),
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [gatedFlow] }), approval()],
    })

    const started = await looms.start(gatedFlow, {})
    await Bun.sleep(15)

    await Promise.all([
      looms.wake(started.runId),
      looms.signal(started.runId, [decision(approvalId, 'approve')]),
    ])

    const events = await looms.getEvents(started.runId)

    const winningSatisfactions = events.filter(
      (event) =>
        event.type === 'runtime.wait.satisfied' &&
        Predicate.isObject(event.payload) &&
        Predicate.isObject(event.payload.tag) &&
        event.payload.tag.approvalId === approvalId,
    )

    expect(winningSatisfactions).toHaveLength(1)
    expect(['completed', 'failed']).toContain((await looms.getRun(started.runId)).status)
    await looms.stop()
  })

  test('pages a store that returns at most 5 events per read instead of treating it as truncation', async () => {
    let completeCalls = 0
    const tokens = Array.from({ length: 20 }, (_, i) => `token_${i}`)

    const llm = {
      async complete(args: { onTextDelta?: (delta: string) => void | Promise<void> }) {
        completeCalls += 1

        for (const delta of tokens) {
          await args.onTextDelta?.(delta)
        }

        return {
          message: { role: 'assistant', content: 'done' },
          done: true,
          output: { text: 'done' },
        }
      },
    }

    const inner = await Effect.runPromise(makeMemoryEventStore)

    // Unary reads are capped at 5 events even when more exist past the page.
    const truncatedStore: EventStore = {
      append: inner.append,
      read: (runId, options) =>
        Effect.gen(function* () {
          const events = yield* inner.read(runId, options)
          return events.slice(0, 5)
        }),
      tail: inner.tail,
      subscribe: inner.subscribe,
      listRuns: inner.listRuns,
    }

    const bot = defineAgent({
      name: 'truncation-victim',
      instructions: 'stream',
    })

    const seeded = 'run_truncated'

    await Effect.runPromise(
      inner.append(
        seeded,
        Array.from({ length: 10 }, (_, i) =>
          createEvent(seeded, {
            type: 'probe.event',
            payload: { i },
            threadId: null,
            origin: { type: 'system' },
          }),
        ),
      ),
    )

    const looms = createLooms({
      modules: [agent({ definitions: [bot], llm })],
      store: truncatedStore,
    })

    const state = await looms.getRun(seeded)
    expect(state.runId).toBe(seeded)
    expect(completeCalls).toBe(0)
    await looms.stop()
  })

  test('duplicate effect dispatch guard fails wake instead of re-executing effect', async () => {
    let executeCalls = 0

    const workerDef = {
      kind: 'worker',
      name: 'worker-bot',
    }

    const workModule = defineRuntimeModule({
      definitions: [workerDef],
      namespace: 'work',
      protocolVersion: '1.0.0',
      effects: {
        'work.do': defineEffect({
          type: 'work.do',
          execute: (_input, ctx) => {
            executeCalls += 1
            return [{ type: 'work.done', threadId: ctx.threadId, effectId: 'other' }]
          },
        }),
      },
      threads: {
        worker: defineThread({
          kind: 'worker',
          shape: Schema.Struct({ count: Schema.Finite }),
          initialState: () => ({ count: 0 }),
          step: (state, event) => {
            if (event.type === 'work.done') {
              return { count: state.count + 1 }
            }

            return state
          },
          effects: (state) => (state.count < 10 ? [invoke('work.do', {}, 'work_1')] : []),
        }),
      },
    })

    const looms = createLooms({
      modules: [workModule],
    })

    let caughtError: Error | undefined

    try {
      await looms.start(workerDef, {})
    } catch (err) {
      caughtError = err instanceof Error ? err : new Error(String(err))
    }

    expect(caughtError).toBeDefined()
    expect(caughtError).toBeInstanceOf(DuplicateEffectDispatchError)

    if (caughtError instanceof DuplicateEffectDispatchError) {
      expect(caughtError._tag).toBe('DuplicateEffectDispatchError')
    }

    expect(caughtError?.message).toContain('Duplicate effect dispatch detected')
    expect(caughtError?.message).toContain('work_1')
    expect(executeCalls).toBe(1)
    await looms.stop()
  })

  test('maxWakeIterations guard fails wake when iteration cap is hit', async () => {
    let stepCalls = 0

    const pingPongDef = {
      kind: 'pingpong',
      name: 'stepper',
    }

    const pingPongModule = defineRuntimeModule({
      definitions: [pingPongDef],
      namespace: 'pingpong',
      protocolVersion: '1.0.0',
      effects: {
        'pingpong.step': defineEffect({
          type: 'pingpong.step',
          input: Schema.Struct({ count: Schema.Finite }),
          execute: (input) => {
            stepCalls += 1
            return [
              {
                type: 'pingpong.stepped',
                payload: { count: input.count + 1 },
                threadId: null,
              },
            ]
          },
        }),
      },
      threads: {
        pingpong: defineThread({
          kind: 'pingpong',
          shape: Schema.Struct({ count: Schema.Finite }),
          initialState: () => ({ count: 0 }),
          step: (state, event) => {
            if (event.type === 'pingpong.stepped' && Predicate.isObject(event.payload)) {
              return { count: Number(event.payload.count) }
            }

            return state
          },
          effects: (state) => [
            invoke('pingpong.step', { count: state.count }, `step_${state.count}`),
          ],
        }),
      },
    })

    const looms = createLooms({
      modules: [pingPongModule],
      maxWakeIterations: 5,
    })

    let caughtError: Error | undefined

    try {
      await looms.start(pingPongDef, {})
    } catch (err) {
      caughtError = err instanceof Error ? err : new Error(String(err))
    }

    expect(caughtError).toBeDefined()
    expect(caughtError).toBeInstanceOf(MaxWakeIterationsError)

    if (caughtError instanceof MaxWakeIterationsError) {
      expect(caughtError._tag).toBe('MaxWakeIterationsError')
    }

    expect(caughtError?.message).toContain('Max wake iterations exceeded (5)')
    expect(stepCalls).toBeLessThanOrEqual(5)
    await looms.stop()
  })

  test('multi-turn streamed agent performs at most two store reads', async () => {
    let reads = 0
    const tokens = ['a', 'b', 'c', 'd', 'e']
    const inner = await Effect.runPromise(makeMemoryEventStore)

    const countingStore: EventStore = {
      append: inner.append,
      read: (runId, options) =>
        Effect.gen(function* () {
          reads += 1
          return yield* inner.read(runId, options)
        }),
      tail: inner.tail,
      bounds: inner.bounds,
      trim: inner.trim,
      subscribe: inner.subscribe,
      listRuns: inner.listRuns,
    }

    const llm = {
      async complete(args: { onTextDelta?: (delta: string) => void | Promise<void> }) {
        for (const delta of tokens) {
          await args.onTextDelta?.(delta)
        }

        return {
          message: { role: 'assistant', content: 'done' },
          done: true,
          output: { text: 'done' },
        }
      },
    }

    const bot = defineAgent({ name: 'read-count', instructions: 'stream' })

    const looms = createLooms({
      modules: [agent({ definitions: [bot], llm })],
      store: countingStore,
    })

    await looms.start(bot, 'hi')
    expect(reads).toBeLessThanOrEqual(2)
    await looms.stop()
  })
})
