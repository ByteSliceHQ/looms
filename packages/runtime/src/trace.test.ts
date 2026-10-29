import { describe, expect, test } from 'bun:test'

import { Effect, Predicate, Schema } from 'effect'

import {
  RunLauncherTag,
  complete,
  defineEffect,
  defineEventCatalog,
  defineRuntimeModule,
  defineThread,
  invoke,
  type TraceContext,
} from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLooms } from './looms'
import type { EffectWorkerTask } from './types'

const CALLER: TraceContext = {
  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
  tracestate: 'congo=t61rcWkgMzE',
}

const OVERRIDE: TraceContext = {
  traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
}

const TracedInput = Schema.Struct({ launch: Schema.Boolean, override: Schema.Boolean })

const catalog = defineEventCatalog('traced', {
  observed: Schema.Struct({}),
  launched: Schema.Struct({}),
})

const seen = new Map<string, TraceContext | null>()

const observe = defineEffect({
  type: 'traced.observe',
  execute: (_input, ctx) => {
    seen.set(ctx.runId, ctx.trace)
    return [{ type: 'traced.observed', payload: {}, threadId: ctx.threadId }]
  },
})

const remote = defineEffect({ type: 'traced.remote', execution: 'worker', execute: () => [] })

const launch = defineEffect({
  type: 'traced.launch',
  input: TracedInput,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const launcher = yield* RunLauncherTag

      yield* launcher.launch({
        runId: `${ctx.runId}-child`,
        kind: 'traced',
        definitionName: 'traced',
        input: { launch: false, override: false },
        trace: input.override ? OVERRIDE : undefined,
      })

      return [{ type: 'traced.launched', payload: {}, threadId: ctx.threadId }]
    }),
})

const tracedThread = defineThread({
  kind: 'traced',
  input: TracedInput,
  initialState: (ctx) => ({
    launch: ctx.input?.launch ?? false,
    override: ctx.input?.override ?? false,
    observed: false,
    launched: false,
  }),
  step: (state, event) => {
    switch (event.type) {
      case 'traced.observed':
        return { ...state, observed: true }
      case 'traced.launched':
        return { ...state, launched: true }
      default:
        return state
    }
  },
  effects: (state) => {
    if (!state.observed) {
      return [invoke(observe, {}, 'observe'), invoke(remote, {}, 'remote')]
    }

    if (state.launch && !state.launched) {
      return [invoke(launch, { launch: false, override: state.override }, 'launch')]
    }

    return [complete({ ok: true })]
  },
})

const tracedModule = defineRuntimeModule({
  namespace: 'traced',
  protocolVersion: '1.0.0',
  events: catalog,
  threads: { traced: tracedThread },
  effects: { observe, remote, launch },
  definitions: [{ kind: 'traced', name: 'traced', version: 'v1', input: TracedInput }],
})

const traced = { kind: 'traced', name: 'traced', version: 'v1' }

function tracedLooms(dispatched: EffectWorkerTask[] = []) {
  return createLooms({
    modules: [tracedModule],
    worker: { handles: ['traced.remote'], dispatch: (task) => void dispatched.push(task) },
  })
}

describe('trace propagation', () => {
  test('carries the caller trace from the start request to effects, workers, and launched runs', async () => {
    const dispatched: EffectWorkerTask[] = []
    const looms = tracedLooms(dispatched)

    const response = await looms.fetch(
      new Request('http://looms.test/runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...CALLER },
        body: JSON.stringify({
          kind: 'traced',
          definitionName: 'traced',
          runId: 'run_trace',
          input: { launch: true, override: false },
        }),
      }),
    )

    expect(response?.status).toBe(200)

    const started = (await looms.getEvents('run_trace')).find(
      (event) => event.type === 'runtime.run.started',
    )

    expect(started?.payload).toMatchObject({ trace: CALLER })
    expect(seen.get('run_trace')).toEqual(CALLER)
    expect(dispatched.find((task) => task.runId === 'run_trace')?.trace).toEqual(CALLER)
    expect((await looms.getRun('run_trace-child')).startIdentity?.trace).toEqual(CALLER)

    const deadline = Date.now() + 2_000

    while (!seen.has('run_trace-child') && Date.now() < deadline) {
      await Bun.sleep(5)
    }

    expect(seen.get('run_trace-child')).toEqual(CALLER)

    await looms.stop()
  })

  test('a launch can name its own trace context', async () => {
    const looms = tracedLooms()

    await looms.start(
      traced,
      { launch: true, override: true },
      {
        runId: 'run_override',
        trace: CALLER,
      },
    )

    expect((await looms.getRun('run_override-child')).startIdentity?.trace).toEqual(OVERRIDE)
    await looms.stop()
  })

  test('drops an invalid traceparent instead of storing it', async () => {
    const looms = tracedLooms()

    await looms.start(
      traced,
      { launch: false, override: false },
      {
        runId: 'run_invalid',
        trace: { traceparent: 'not-a-trace' },
      },
    )

    const started = (await looms.getEvents('run_invalid')).find(
      (event) => event.type === 'runtime.run.started',
    )

    expect(Predicate.isObject(started?.payload) && 'trace' in started.payload).toBe(false)
    expect(seen.get('run_invalid')).toBeNull()
    await looms.stop()
  })

  test('a retried start from another trace is the same run', async () => {
    const looms = tracedLooms()
    const input = { launch: false, override: false }

    await looms.start(traced, input, { runId: 'run_retry', idempotencyKey: 'k', trace: CALLER })

    const retried = await looms.start(traced, input, {
      runId: 'run_retry',
      idempotencyKey: 'k',
      trace: OVERRIDE,
    })

    expect(retried.runId).toBe('run_retry')
    expect((await looms.getRun('run_retry')).startIdentity?.trace).toEqual(CALLER)
    await looms.stop()
  })

  test('a workflow child run inherits the parent trace', async () => {
    const child = defineWorkflow({ name: 'trace-child', nodes: [{ id: 'out', run: () => 1 }] })

    const parent = defineWorkflow({
      name: 'trace-parent',
      childExecution: 'run',
      nodes: [{ id: 'spawn', run: (ctx) => ctx.spawn(child, {}) }],
    })

    const looms = createLooms({ modules: [workflow({ definitions: [child, parent] })] })
    const started = await looms.start(parent, {}, { trace: CALLER })
    const deadline = Date.now() + 2_000
    let state = await looms.getRun(started.runId)

    while (state.status !== 'completed' && Date.now() < deadline) {
      await Bun.sleep(5)
      state = await looms.getRun(started.runId)
    }

    const launched = (await looms.getEvents(started.runId)).find(
      (event) => event.type === 'runtime.run.launched',
    )

    const childRunId =
      launched && Predicate.isObject(launched.payload) && Predicate.isString(launched.payload.runId)
        ? launched.payload.runId
        : ''

    expect(state.status).toBe('completed')
    expect((await looms.getRun(childRunId)).startIdentity?.trace).toEqual(CALLER)
    await looms.stop()
  })
})
