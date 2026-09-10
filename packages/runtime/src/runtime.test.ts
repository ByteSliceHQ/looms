import { describe, expect, test } from 'bun:test'

import { Effect, Predicate, Schema } from 'effect'

import { agent, asEffectsTool, defineAgent } from '@looms/agent'
import { approval, decision, gate } from '@looms/approval'
import {
  defineEffect,
  defineRuntimeModule,
  defineThread,
  invoke,
  makeMemoryEventStore,
  wait,
  type JsonValue,
} from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLooms } from './looms'

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
          output: () => ({ effects: [invoke('test.flaky', {}, 'flaky-call')] }),
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
})
