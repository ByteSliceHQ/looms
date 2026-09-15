import { describe, expect, test } from 'bun:test'

import { Effect, Predicate, Schema } from 'effect'

import { agent, asEffectsTool, defineAgent } from '@looms/agent'
import { approval, decision, gate } from '@looms/approval'
import {
  defineEffect,
  defineEventCatalog,
  defineModule,
  defineRuntimeModule,
  defineThread,
  EventStoreTrimmedError,
  createEvent,
  snapshotStoreOf,
  complete,
  invoke,
  InvalidEventError,
  makeMemoryEventStore,
  makeMemorySnapshotStore,
  wait,
  type EventStore,
  type JsonValue,
} from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLooms } from './looms'
import { DuplicateEffectDispatchError, MaxWakeIterationsError, type WakeScheduler } from './runtime'

describe('createLooms', () => {
  test('runs a deterministic echo agent to completion', async () => {
    const echo = defineAgent({
      name: 'echo',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: JSON.stringify(input) },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({ definitions: [echo] })
    const result = await looms.start(echo, { text: 'hi' })
    expect(result.state.status).toBe('completed')

    const root = result.state.rootThreadId
      ? result.state.threads[result.state.rootThreadId]
      : undefined

    expect(root?.status).toBe('completed')
    expect(root?.output).toEqual({ text: 'hi' })
  })

  test('withdraws sibling waits when an invoke fails', async () => {
    const boom = defineWorkflow({
      name: 'boom',
      nodes: [
        {
          id: 'charge',
          run: (ctx) =>
            ctx.effects([
              invoke('no.such.effect', {}),
              wait({ waitId: 'w_auth', on: { type: 'payments.charge.authorized' } }),
              wait({ waitId: 'w_decl', on: { type: 'payments.charge.declined' } }),
            ]),
        },
      ],
    })

    const looms = createLooms({ definitions: [boom] })
    const { runId, state } = await looms.start(boom, {})
    expect(state.status).toBe('failed')
    const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined
    expect(root?.status).toBe('failed')
    expect(Object.keys(state.waits)).toEqual([])
    const events = await looms.getEvents(runId)
    expect(events.some((event) => event.type === 'runtime.wait.registered')).toBe(false)

    expect(
      events.some(
        (event) =>
          event.type === 'runtime.effect.failed' &&
          Predicate.isObject(event.payload) &&
          Predicate.isString(event.payload.error) &&
          event.payload.error.startsWith('withdrawn:'),
      ),
    ).toBe(true)
  })

  test('applies definition defaults when spawning a child with empty input', async () => {
    const DefaultN = {
      '~standard': {
        version: 1 as const,
        vendor: 'looms-test',
        validate(value: JsonValue) {
          const obj = Predicate.isObject(value) ? value : {}
          const n = obj.n

          if (n !== undefined && !Predicate.isNumber(n)) {
            return { issues: [{ message: 'expected number' }] }
          }

          return { value: { n: Predicate.isNumber(n) ? n : 7 } }
        },
      },
    }

    const child = defineWorkflow({
      name: 'defaults',
      input: DefaultN,
      nodes: [{ id: 'out', run: (ctx) => ctx.input }],
    })

    const parent = defineWorkflow({
      name: 'spawner',
      nodes: [
        {
          id: 'spawn',
          run: (ctx) => ctx.spawn(child, {}),
        },
      ],
    })

    const looms = createLooms({ definitions: [child, parent] })
    const { runId, state } = await looms.start(parent, {})
    expect(state.status).toBe('completed')

    const childThread = Object.values(state.threads).find(
      (thread) => thread.definitionName === 'defaults',
    )

    expect(childThread?.input).toEqual({ n: 7 })
    const events = await looms.getEvents(runId)

    const started = events.find(
      (event) =>
        event.type === 'runtime.thread.started' &&
        Predicate.isObject(event.payload) &&
        event.payload.definitionName === 'defaults',
    )

    expect(started && Predicate.isObject(started.payload) ? started.payload.input : null).toEqual({
      n: 7,
    })
  })

  test('invalid spawn input fails the child and unblocks the parent', async () => {
    const RequiredN = Schema.Struct({ n: Schema.Number })

    const child = defineWorkflow({
      name: 'needs_n',
      input: RequiredN,
      nodes: [{ id: 'out', run: (ctx) => ctx.input }],
    })

    const parent = defineWorkflow({
      name: 'bad_spawner',
      nodes: [
        {
          id: 'spawn',
          run: (ctx) => ctx.spawn(child, { n: 'nope' }),
        },
      ],
    })

    const looms = createLooms({ definitions: [child, parent] })
    const { state } = await looms.start(parent, {})
    expect(state.status).toBe('failed')

    const childThread = Object.values(state.threads).find(
      (thread) => thread.definitionName === 'needs_n',
    )

    expect(childThread?.status).toBe('failed')
    expect(childThread?.error).toBeTruthy()
    const parentThread = state.rootThreadId ? state.threads[state.rootThreadId] : undefined
    expect(parentThread?.status).toBe('failed')
  })

  test('invalid thread-tool args return a tool error without spawning', async () => {
    const RequiredN = Schema.Struct({ n: Schema.Number })

    const child = defineWorkflow({
      name: 'needs_n',
      input: RequiredN,
      nodes: [{ id: 'out', run: (ctx) => ctx.input }],
    })

    const caller = defineAgent({
      name: 'caller',
      instructions: 'call',
      tools: [child],
      runTurn: ({ turn }) => {
        if (turn === 1) {
          return {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [{ id: 't1', name: 'needs_n', arguments: { n: 'nope' } }],
            },
            toolCalls: [{ id: 't1', name: 'needs_n', arguments: { n: 'nope' } }],
          }
        }

        return {
          message: { role: 'assistant', content: 'handled' },
          done: true,
          output: { ok: true },
        }
      },
    })

    const looms = createLooms({ definitions: [child, caller] })
    const { runId, state } = await looms.start(caller, 'go')
    expect(state.status).toBe('completed')

    expect(Object.values(state.threads).some((thread) => thread.definitionName === 'needs_n')).toBe(
      false,
    )

    const events = await looms.getEvents(runId)
    const toolResult = events.find((event) => event.type === 'agent.tool.result')
    expect(toolResult).toBeDefined()

    expect(
      toolResult && Predicate.isObject(toolResult.payload) ? toolResult.payload.error : null,
    ).toBeTruthy()
  })

  test('effects-tool handler failure does not park the agent', async () => {
    const failing = defineRuntimeModule({
      namespace: 'boom',
      protocolVersion: '1.0.0',
      effects: {
        explode: defineEffect({
          type: 'boom.explode',
          execute: () => Effect.fail(new Error('boom handler down')),
        }),
      },
    })

    const asker = defineAgent({
      name: 'asker',
      instructions: 'ask',
      tools: [
        asEffectsTool({
          name: 'explode',
          description: 'explode',
          effects: () => [
            invoke('boom.explode', {}),
            wait({ waitId: 'w_boom', on: { type: 'boom.done' } }),
          ],
          waitOn: { type: 'boom.done' },
        }),
      ],
      runTurn: ({ turn }) => {
        if (turn === 1) {
          return {
            message: {
              role: 'assistant',
              content: '',
              toolCalls: [{ id: 't1', name: 'explode', arguments: {} }],
            },
            toolCalls: [{ id: 't1', name: 'explode', arguments: {} }],
          }
        }

        return {
          message: { role: 'assistant', content: 'recovered' },
          done: true,
          output: { text: 'recovered' },
        }
      },
    })

    const looms = createLooms({
      definitions: [asker],
      modules: [agent(), workflow(), failing],
    })

    const { runId, state } = await looms.start(asker, 'go')
    const events = await looms.getEvents(runId)
    const types = events.map((event) => event.type)
    expect(state.status).toBe('completed')
    expect(Object.keys(state.waits)).toEqual([])
    expect(types.some((type) => type === 'runtime.wait.registered')).toBe(false)
    expect(types).toContain('agent.tool.result')
    const toolResult = events.find((event) => event.type === 'agent.tool.result')

    expect(
      toolResult &&
        Predicate.isObject(toolResult.payload) &&
        Predicate.isString(toolResult.payload.error)
        ? toolResult.payload.error
        : '',
    ).toContain('boom handler down')
  })

  test('streams text deltas in order before the assistant message', async () => {
    const llm = {
      async complete(args: { onTextDelta?: (delta: string) => void | Promise<void> }) {
        await args.onTextDelta?.('hel')
        await args.onTextDelta?.('lo')
        return {
          message: { role: 'assistant', content: 'hello' },
          done: true,
          output: { text: 'hello' },
        }
      },
    }

    const bot = defineAgent({
      name: 'streamer',
      instructions: 'stream',
    })

    const looms = createLooms({
      definitions: [bot],
      modules: [agent({ llm })],
    })

    const { runId } = await looms.start(bot, 'hi')
    const events = await looms.getEvents(runId)
    const deltas = events.filter((event) => event.type === 'agent.turn.text_delta')

    expect(
      deltas.map((event) => (Predicate.isObject(event.payload) ? event.payload.delta : '')),
    ).toEqual(['hel', 'lo'])

    const firstDelta = events.findIndex((event) => event.type === 'agent.turn.text_delta')
    const message = events.findIndex((event) => event.type === 'agent.message')
    expect(firstDelta).toBeGreaterThan(-1)
    expect(message).toBeGreaterThan(firstDelta)
    expect(deltas.every((event) => event.ephemeral === true)).toBe(true)
  })

  test('coalesces live text deltas instead of appending one token at a time', async () => {
    const tokens = Array.from({ length: 50 }, (_, i) => `t${i}`)

    const llm = {
      async complete(args: { onTextDelta?: (delta: string) => void | Promise<void> }) {
        for (const delta of tokens) {
          await args.onTextDelta?.(delta)
        }

        return {
          message: { role: 'assistant', content: tokens.join('') },
          done: true,
          output: { text: tokens.join('') },
        }
      },
    }

    const inner = await Effect.runPromise(makeMemoryEventStore)
    let appendCalls = 0

    const delayed: EventStore = {
      append: (runId, events, options) =>
        Effect.gen(function* () {
          appendCalls += 1
          yield* Effect.promise(() => new Promise((resolve) => setTimeout(resolve, 20)))
          return yield* inner.append(runId, events, options)
        }),
      read: inner.read,
      tail: inner.tail,
      subscribe: inner.subscribe,
      listRuns: inner.listRuns,
    }

    const bot = defineAgent({
      name: 'coalesced-streamer',
      instructions: 'stream',
    })

    const looms = createLooms({
      definitions: [bot],
      modules: [agent({ llm })],
      store: delayed,
    })

    const started = Date.now()
    const { runId } = await looms.start(bot, 'hi')
    const elapsed = Date.now() - started
    const events = await looms.getEvents(runId)
    const deltas = events.filter((event) => event.type === 'agent.turn.text_delta')
    const message = events.findIndex((event) => event.type === 'agent.message')
    const lastDelta = events.findLastIndex((event) => event.type === 'agent.turn.text_delta')

    expect(
      deltas.map((event) => (Predicate.isObject(event.payload) ? event.payload.delta : '')),
    ).toEqual(tokens)

    expect(lastDelta).toBeGreaterThan(-1)
    expect(message).toBeGreaterThan(lastDelta)
    expect(elapsed).toBeLessThan(50 * 20)
    expect(appendCalls).toBeLessThan(20)
  })

  test('middleware intercepts effects across modules', async () => {
    const intercepted: string[] = []

    const auditModule = defineRuntimeModule({
      namespace: 'audit',
      protocolVersion: '1.0.0',
      middleware: [
        (effect, ctx, next) => {
          intercepted.push(effect.type)
          return next(effect, ctx)
        },
      ],
    })

    const bot = defineAgent({
      name: 'echo',
      instructions: 'echo',
      runTurn: () => ({
        message: { role: 'assistant', content: 'done' },
        done: true,
      }),
    })

    const looms = createLooms({
      definitions: [bot],
      modules: [agent(), auditModule],
    })

    const { runId } = await looms.start(bot, 'test')
    expect(intercepted).toContain('agent.callLLM')
    const events = await looms.getEvents(runId)
    expect(events.some((e) => e.type === 'agent.message')).toBe(true)
  })

  test('retries transient effect failures according to retry policy', async () => {
    let attempts = 0

    const flakyEffect = defineEffect({
      type: 'test.flaky',
      retry: { maxAttempts: 3, backoffMs: 5 },
      execute: () => {
        attempts += 1

        if (attempts < 3) {
          return Effect.fail(new Error('transient network glitch'))
        }

        return Effect.succeed([{ type: 'test.flaky.succeeded', payload: { attempts } }])
      },
    })

    const testModule = defineRuntimeModule({
      namespace: 'test',
      protocolVersion: '1.0.0',
      effects: { flaky: flakyEffect },
      threads: {
        worker: defineThread({
          kind: 'worker',
          initialState: () => ({}),
          step: (state) => state,
          effects: () => [invoke('test.flaky', {}, 'flaky-call')],
        }),
      },
    })

    const workerDef = {
      kind: 'worker',
      name: 'flaky_worker',
      value: { kind: 'worker', name: 'flaky_worker' },
    }

    const looms = createLooms({
      definitions: [workerDef],
      modules: [testModule],
    })

    const { runId } = await looms.start(workerDef, {})
    expect(attempts).toBe(3)
    const events = await looms.getEvents(runId)
    expect(events.some((e) => e.type === 'test.flaky.succeeded')).toBe(true)
  })

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
      definitions: [sleeper],
      modules: [workflow()],
    })

    const { runId } = await looms.start(sleeper, {})
    const initialRun = await looms.getRun(runId)
    expect(initialRun.status).toBe('running')
    expect(wokeUp).toBe(false)

    // Wait for the automatic timer scheduler to fire wake(runId)
    await new Promise((resolve) => setTimeout(resolve, 80))

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
      definitions: [sleeper],
      modules: [workflow()],
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
      definitions: [sleeper],
      modules: [workflow()],
      store: sharedStore,
    })

    // Wait for the restored timer to wake up in the second process
    await looms2.ready()
    await new Promise((resolve) => setTimeout(resolve, 80))

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
      definitions: [workflowDef],
      modules: [workflow()],
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
      definitions: [workflowDef],
      modules: [workflow()],
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
      definitions: [gatedFlow],
      modules: [workflow(), approval()],
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
      definitions: [bot],
      modules: [agent({ llm })],
      store: truncatedStore,
    })

    const state = await looms.getRun(seeded)
    expect(state.runId).toBe(seeded)
    expect(completeCalls).toBe(0)
    await looms.stop()
  })

  test('duplicate effect dispatch guard fails wake instead of re-executing effect', async () => {
    let executeCalls = 0

    const workModule = defineRuntimeModule({
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
          shape: Schema.Struct({ count: Schema.Number }),
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

    const workerDef = {
      kind: 'worker',
      name: 'worker-bot',
    }

    const looms = createLooms({
      definitions: [workerDef],
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

    const pingPongModule = defineRuntimeModule({
      namespace: 'pingpong',
      protocolVersion: '1.0.0',
      effects: {
        'pingpong.step': defineEffect({
          type: 'pingpong.step',
          input: Schema.Struct({ count: Schema.Number }),
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
          shape: Schema.Struct({ count: Schema.Number }),
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

    const pingPongDef = {
      kind: 'pingpong',
      name: 'stepper',
    }

    const looms = createLooms({
      definitions: [pingPongDef],
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
      definitions: [bot],
      modules: [agent({ llm })],
      store: countingStore,
    })

    await looms.start(bot, 'hi')
    expect(reads).toBeLessThanOrEqual(2)
    await looms.stop()
  })

  test('createLooms defaults a snapshot store so trim recovery works without one being passed', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const echo = defineAgent({
      name: 'default-snap',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'ok' },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({
      definitions: [echo],
      modules: [agent()],
      store,
      snapshotEvery: 1,
    })

    const { runId, state } = await looms.start(echo, 'hi')
    expect(state.status).toBe('completed')
    expect(snapshotStoreOf(store)).toBeDefined()

    const latest = await Effect.runPromise(snapshotStoreOf(store)!.loadLatest(runId))
    expect(latest._tag).toBe('Some')

    if (latest._tag === 'Some') {
      await Effect.runPromise(store.trim!(runId, latest.value.cursor + 1))
    }

    const restored = await looms.getRun(runId)
    expect(restored.status).toBe('completed')
    await looms.stop()
  })

  test('trimmed store with a snapshot loads without error', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)

    const echo = defineAgent({
      name: 'snap-echo',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'ok' },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({
      definitions: [echo],
      modules: [agent()],
      store,
      snapshotStore: snapshots,
      snapshotEvery: 1,
    })

    const { runId, state } = await looms.start(echo, 'hi')
    expect(state.status).toBe('completed')
    const latest = await Effect.runPromise(snapshots.loadLatest(runId))
    expect(latest._tag).toBe('Some')

    if (latest._tag === 'Some') {
      await Effect.runPromise(store.trim!(runId, latest.value.cursor + 1))
    }

    const looms2 = createLooms({
      definitions: [echo],
      modules: [agent()],
      store,
      snapshotStore: snapshots,
    })

    const restored = await looms2.getRun(runId)
    expect(restored.status).toBe('completed')
    await looms.stop()
    await looms2.stop()
  })

  test('trimmed store without a snapshot fails with EventStoreTrimmedError', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_trimmed_no_snap'

    await Effect.runPromise(
      store.append(runId, [
        createEvent(runId, {
          type: 'runtime.run.started',
          payload: { rootThreadId: 't', kind: 'echo', definitionName: 'e', input: null },
          threadId: null,
          origin: { type: 'system' },
        }),
        createEvent(runId, {
          type: 'runtime.thread.started',
          payload: { threadId: 't', kind: 'echo', definitionName: 'e', input: null },
          threadId: 't',
          origin: { type: 'system' },
        }),
        createEvent(runId, {
          type: 'probe.event',
          payload: {},
          threadId: null,
          origin: { type: 'system' },
        }),
      ]),
    )

    await Effect.runPromise(store.trim!(runId, 3))

    const echo = defineAgent({ name: 'trim-echo', instructions: 'echo' })

    const looms = createLooms({
      definitions: [echo],
      modules: [agent()],
      store,
    })

    let caught: unknown

    try {
      await looms.getRun(runId)
    } catch (err) {
      caught = err
    }

    expect(caught).toBeInstanceOf(EventStoreTrimmedError)
    await looms.stop()
  })

  test('a leading fence does not look like a trimmed log', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_fence_head'

    const echo = defineAgent({
      name: 'fence-head',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'ok' },
        done: true,
        output: input,
      }),
    })

    await Effect.runPromise(
      store.append(
        runId,
        [
          createEvent(runId, {
            type: 'runtime.run.started',
            payload: { rootThreadId: 't', kind: 'echo', definitionName: 'e', input: null },
            threadId: null,
            origin: { type: 'system' },
          }),
        ],
        { fence: 'tok-a' },
      ),
    )

    const looms = createLooms({
      definitions: [echo],
      modules: [agent()],
      store,
    })

    const state = await looms.getRun(runId)
    expect(state.status).toBe('running')
    await looms.stop()
  })

  test('cached cursor behind a trim falls back to the snapshot path', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)
    const runId = 'run_cache_trim'

    const events = Array.from({ length: 6 }, (_, i) =>
      createEvent(runId, {
        type: i === 0 ? 'runtime.run.started' : 'probe.event',
        payload:
          i === 0 ? { rootThreadId: 't', kind: 'echo', definitionName: 'e', input: null } : { i },
        threadId: null,
        origin: { type: 'system' },
      }),
    )

    await Effect.runPromise(store.append(runId, events))
    const echo = defineAgent({ name: 'cache-trim', instructions: 'echo' })

    const looms = createLooms({
      definitions: [echo],
      modules: [agent()],
      store,
      snapshotStore: snapshots,
    })

    const before = await looms.getRun(runId)
    expect(before.status).toBe('running')

    await Effect.runPromise(
      snapshots.save({
        runId,
        cursor: 6,
        stateHash: 'h',
        takenAt: Date.now(),
        state: before,
      }),
    )

    await Effect.runPromise(
      store.append(runId, [
        createEvent(runId, {
          type: 'probe.event',
          payload: { i: 7 },
          threadId: null,
          origin: { type: 'system' },
        }),
      ]),
    )

    await Effect.runPromise(store.trim!(runId, 7))

    const after = await looms.getRun(runId)
    expect(after.status).toBe('running')
    await looms.stop()
  })

  test('trimAfterSnapshot keeps only the latest snapshot cursor in the log', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)

    const stepper = defineWorkflow({
      name: 'snap-trim',
      nodes: [
        { id: 'a', run: () => ({ n: 1 }) },
        { id: 'b', deps: ['a'], run: () => ({ n: 2 }) },
        { id: 'c', deps: ['b'], run: () => ({ n: 3 }) },
      ],
    })

    const looms = createLooms({
      definitions: [stepper],
      modules: [workflow()],
      store,
      snapshotStore: snapshots,
      snapshotEvery: 2,
      trimAfterSnapshot: { keepSnapshots: 1 },
    })

    const { runId } = await looms.start(stepper, {})
    const bounds = await Effect.runPromise(store.bounds!(runId))
    expect(bounds.head).toBeGreaterThan(1)
    const cursors = await Effect.runPromise(snapshots.listCursors!(runId))
    expect(cursors.length).toBe(1)
    await looms.stop()
  })

  test('an in-process wake mutex serializes concurrent wakes on the same run', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    let release!: () => void
    let dispatches = 0

    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })

    const slow = defineWorkflow({
      name: 'wake-mutex',
      nodes: [
        {
          id: 'block',
          run: async () => {
            dispatches += 1
            await blocked
            return { ok: true }
          },
        },
      ],
    })

    const looms = createLooms({
      definitions: [slow],
      modules: [workflow()],
      store,
    })

    const started = looms.start(slow, {})
    await new Promise((resolve) => setTimeout(resolve, 30))
    const runId = (await Effect.runPromise(store.listRuns()))[0]
    expect(runId).toBeDefined()

    const overlapping = await looms.wake(runId!)
    expect(overlapping.status).toBe('running')
    expect(dispatches).toBe(1)
    release()
    const done = await started
    expect(done.state.status).toBe('completed')
    await looms.stop()
  })

  test('a second runtime can continue a parked run from the shared store', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const waiterModule = defineRuntimeModule({
      namespace: 'actorpark',
      protocolVersion: '1.0.0',
      threads: {
        waiter: defineThread({
          kind: 'waiter',
          shape: Schema.Struct({ done: Schema.Boolean }),
          initialState: () => ({ done: false }),
          step: (state, event) => (event.type === 'go' ? { done: true } : state),
          effects: (state) =>
            state.done ? [complete({ ok: true })] : [wait({ waitId: 'w1', on: { type: 'go' } })],
        }),
      },
    })

    const waiter = { kind: 'waiter', name: 'actor-park' }

    const a = createLooms({
      definitions: [waiter],
      modules: [waiterModule],
      store,
    })

    const started = await a.start(waiter, {})
    expect(started.state.status).toBe('running')

    const b = createLooms({
      definitions: [waiter],
      modules: [waiterModule],
      store,
    })

    const after = await b.signal(started.runId, [
      {
        type: 'go',
        payload: {},
        threadId: started.threadId,
        origin: { type: 'external' },
      },
    ])

    expect(after.status).toBe('completed')
    await a.stop()
    await b.stop()
  })

  test('wake writes no lease events onto the run log', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)

    const echo = defineAgent({
      name: 'clean-log',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'ok' },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({
      definitions: [echo],
      modules: [agent()],
      store,
    })

    const { runId, state } = await looms.start(echo, 'hi')
    expect(state.status).toBe('completed')

    const events = await Effect.runPromise(store.read(runId))
    expect(events.some((event) => event.type.startsWith('runtime.lease.'))).toBe(false)
    expect(events.some((event) => event.type === 'runtime.snapshot.taken')).toBe(false)
    await looms.stop()
  })

  test('parking writes a snapshot at the log tail so the next wake starts cold and cheap', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const snapshots = await Effect.runPromise(makeMemorySnapshotStore)

    const waiterModule = defineRuntimeModule({
      namespace: 'parksnap',
      protocolVersion: '1.0.0',
      threads: {
        waiter: defineThread({
          kind: 'waiter',
          shape: Schema.Struct({ done: Schema.Boolean }),
          initialState: () => ({ done: false }),
          step: (state, event) => (event.type === 'go' ? { done: true } : state),
          effects: (state) =>
            state.done ? [complete({ ok: true })] : [wait({ waitId: 'w1', on: { type: 'go' } })],
        }),
      },
    })

    const waiter = { kind: 'waiter', name: 'park-snap' }

    const looms = createLooms({
      definitions: [waiter],
      modules: [waiterModule],
      store,
      snapshotStore: snapshots,
    })

    const started = await looms.start(waiter, {})
    expect(started.state.status).toBe('running')

    const parked = await Effect.runPromise(snapshots.loadLatest(started.runId))
    expect(parked._tag).toBe('Some')
    const tailAfterPark = await Effect.runPromise(store.tail(started.runId))

    if (parked._tag === 'Some') {
      expect(parked.value.cursor).toBe(tailAfterPark)
      expect(parked.value.state.status).toBe('running')
    }

    const readFrom: number[] = []

    const counting: EventStore = {
      ...store,
      read: (runId, options) =>
        Effect.gen(function* () {
          readFrom.push(options?.fromSeq ?? 1)
          return yield* store.read(runId, options)
        }),
    }

    const looms2 = createLooms({
      definitions: [waiter],
      modules: [waiterModule],
      store: counting,
      snapshotStore: snapshots,
    })

    const after = await looms2.signal(started.runId, [
      { type: 'go', payload: {}, threadId: started.threadId, origin: { type: 'external' } },
    ])

    expect(after.status).toBe('completed')
    // rescan + signal + wake each read once, all from just past the park snapshot.
    expect(readFrom.length).toBeLessThanOrEqual(3)
    expect(readFrom.every((fromSeq) => fromSeq === tailAfterPark + 1)).toBe(true)

    const cursors = await Effect.runPromise(snapshots.listCursors!(started.runId))
    expect(cursors.length).toBe(1)
    await looms.stop()
    await looms2.stop()
  })

  test('a cached cursor is dropped when the stream tail moves backwards', async () => {
    const first = await Effect.runPromise(makeMemoryEventStore)
    const second = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_recreated'

    const started = (rootThreadId: string) =>
      createEvent(runId, {
        type: 'runtime.run.started',
        payload: { rootThreadId, kind: 'agent', definitionName: 'e', input: null },
        threadId: null,
        origin: { type: 'system' },
      })

    const probe = () =>
      createEvent(runId, {
        type: 'probe.event',
        payload: {},
        threadId: null,
        origin: { type: 'system' },
      })

    await Effect.runPromise(first.append(runId, [started('first'), probe(), probe()]))
    await Effect.runPromise(second.append(runId, [started('second')]))

    let inner = first

    const swappable: EventStore = {
      append: (runId, events, options) => inner.append(runId, events, options),
      read: (runId, options) => inner.read(runId, options),
      tail: (runId) => inner.tail(runId),
      bounds: (runId) => inner.bounds!(runId),
      subscribe: (runId, options) => inner.subscribe(runId, options),
      listRuns: () => inner.listRuns(),
    }

    const echo = defineAgent({ name: 'recreated', instructions: 'echo' })

    const looms = createLooms({
      definitions: [echo],
      modules: [agent()],
      store: swappable,
      runCacheSize: 10,
    })

    const before = await looms.getRun(runId)
    expect(before.rootThreadId).toBe('first')

    inner = second
    const after = await looms.getRun(runId)
    expect(after.rootThreadId).toBe('second')
    await looms.stop()
  })

  test('pluggable WakeScheduler records schedule on park and cancel on completion', async () => {
    const scheduled: Array<{ runId: string; at: number }> = []
    const cancelled: string[] = []

    const fakeScheduler: WakeScheduler = {
      schedule: (runId, at) => {
        scheduled.push({ runId, at })
      },
      cancel: (runId) => {
        cancelled.push(runId)
      },
    }

    const targetTimerAt = Date.now() + 10_000

    const sleeper = defineWorkflow({
      name: 'sleeper-custom-scheduler',
      nodes: [
        {
          id: 'step1',
          run: (ctx) =>
            ctx.effects([
              wait({
                waitId: 'timer1',
                on: { timerAt: targetTimerAt },
              }),
            ]),
        },
      ],
    })

    const looms = createLooms({
      definitions: [sleeper],
      modules: [workflow()],
      scheduler: fakeScheduler,
      rescanTimers: false,
    })

    const { runId, state } = await looms.start(sleeper, {})
    expect(state.status).toBe('running')
    expect(scheduled.length).toBe(1)
    expect(scheduled[0]?.runId).toBe(runId)
    expect(scheduled[0]?.at).toBe(targetTimerAt)

    await looms.cancel(runId)
    expect(cancelled).toContain(runId)

    await looms.stop()
  })

  test('validates incoming signal events against catalog schemas and rejects invalid payloads', async () => {
    const testCatalog = defineEventCatalog('testmod', {
      ping: Schema.Struct({
        code: Schema.Number,
      }),
    })

    const testMod = defineModule({
      namespace: 'testmod',
      protocolVersion: '1.0.0',
      events: testCatalog,
    })

    const echo = defineAgent({
      name: 'echo-test',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: 'done' },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({
      definitions: [echo],
      modules: [testMod.build({})],
    })

    const { runId } = await looms.start(echo, {})

    // Valid signal should succeed
    await looms.signal(runId, [
      {
        type: 'testmod.ping',
        payload: { code: 123 },
      },
    ])

    // Invalid signal should reject with InvalidEventError
    let threw = false

    try {
      await looms.signal(runId, [
        {
          type: 'testmod.ping',
          // @ts-expect-error deliberately passing invalid payload to verify runtime schema rejection
          payload: { code: 'not-a-number' },
        },
      ])
    } catch (err) {
      threw = true
      expect(err).toBeInstanceOf(InvalidEventError)
    }

    expect(threw).toBe(true)

    await looms.stop()
  })

  test('effect handler producing invalid event output becomes runtime.effect.failed', async () => {
    const schemaCatalog = defineEventCatalog('schematest', {
      validated: Schema.Struct({
        score: Schema.Number,
      }),
    })

    const badOutputEffect = defineEffect({
      type: 'schematest.produceBad',
      execute: () => [
        {
          type: 'schematest.validated',
          // @ts-expect-error deliberately producing invalid payload to verify runtime error conversion
          payload: { score: 'not-a-number' },
        },
      ],
    })

    const mod = defineRuntimeModule({
      namespace: 'schematest',
      protocolVersion: '1.0.0',
      events: schemaCatalog,
      effects: { produceBad: badOutputEffect },
    })

    const worker = defineWorkflow({
      name: 'bad-effect-worker',
      nodes: [
        {
          id: 'step1',
          run: (ctx) => ctx.effects([invoke(badOutputEffect, {})]),
        },
      ],
    })

    const looms = createLooms({
      definitions: [worker],
      modules: [workflow(), mod],
    })

    const { runId } = await looms.start(worker, {})
    const events = await looms.getEvents(runId)
    const effectFailed = events.find((e) => e.type === 'runtime.effect.failed')
    expect(effectFailed).toBeDefined()
    expect(Predicate.isObject(effectFailed?.payload)).toBe(true)

    if (
      Predicate.isObject(effectFailed?.payload) &&
      Predicate.isString(effectFailed.payload.error)
    ) {
      expect(effectFailed.payload.error).toContain(
        'Invalid payload for event "schematest.validated"',
      )
    }

    await looms.stop()
  })
})
