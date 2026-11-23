import { describe, expect, test } from 'bun:test'

import { Predicate, Schema } from 'effect'

import {
  complete,
  defineEffect,
  defineEventCatalog,
  defineRuntimeModule,
  defineThread,
  InvalidIdFormatError,
  invoke,
  wait,
  type EventEnvelope,
  type LoomsIds,
  type RunState,
} from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLooms } from './looms'
import { createRuntime } from './runtime'

/**
 * A format with nothing in common with the default: no `run_`, `thr_` or `evt_` prefix, and thread
 * ids that begin with `run_`, which the workflow reducer once took to mean "this child is a run".
 */
function customIds(): LoomsIds & { readonly drawn: string[] } {
  const drawn: string[] = []

  const prefix = { event: 'E', run: 'R', thread: 'run_T', wait: 'W' } as const

  return {
    drawn,
    create: (kind) => {
      const id = `${prefix[kind]}-${drawn.length + 1}`
      drawn.push(id)
      return id
    },
    derive: (kind, parts) => `${prefix[kind]}~${parts.join('.').replaceAll(':', '_')}`,
  }
}

function payloadString(event: EventEnvelope | undefined, key: string): string {
  const payload = event?.payload
  const value = Predicate.isObject(payload) ? payload[key] : undefined
  return Predicate.isString(value) ? value : ''
}

async function waitForStatus(
  looms: { getRun(runId: string): Promise<RunState> },
  runId: string,
  status: RunState['status'],
) {
  const deadline = Date.now() + 2_000
  let state = await looms.getRun(runId)

  while (state.status !== status && Date.now() < deadline) {
    await Bun.sleep(10)
    state = await looms.getRun(runId)
  }

  return state
}

const child = defineWorkflow({
  name: 'child-value',
  nodes: [{ id: 'out', run: () => 7 }],
  output: ({ results }) => results.out,
})

const failOrHang = defineWorkflow({
  name: 'fail-or-hang',
  nodes: [
    {
      id: 'out',
      run: (ctx) => {
        if (ctx.input === 'fail') {
          throw new Error('child broke')
        }

        return ctx.effects([wait({ waitId: 'never', on: { type: 'test.never' } })])
      },
    },
  ],
})

describe('the default id format', () => {
  test('names runs, threads and events with TypeIDs', async () => {
    const looms = createLooms({ modules: [workflow({ definitions: [child] })] })
    const started = await looms.start(child, {})
    const events = await looms.getEvents(started.runId)

    expect(started.runId).toMatch(/^run_[0-7][0-9a-hjkmnp-tv-z]{25}$/)
    expect(started.threadId).toMatch(/^thr_[0-7][0-9a-hjkmnp-tv-z]{25}$/)
    expect(events.length).toBeGreaterThan(0)

    for (const event of events) {
      expect(event.id).toMatch(/^evt_[0-7][0-9a-hjkmnp-tv-z]{25}$/)
    }

    await looms.stop()
  })

  test('derives child threads and child runs as TypeIDs', async () => {
    const threaded = defineWorkflow({
      name: 'threaded-parent',
      nodes: [{ id: 'spawn', run: (ctx) => ctx.spawn(child, {}) }],
    })

    const launching = defineWorkflow({
      name: 'launching-parent',
      childExecution: 'run',
      nodes: [{ id: 'spawn', run: (ctx) => ctx.spawn(child, {}) }],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [child, threaded, launching] })],
    })

    const inRun = await looms.start(threaded, {})

    const childThread = Object.values(inRun.state.threads).find(
      (thread) => thread.definitionName === 'child-value',
    )

    expect(childThread?.threadId).toMatch(/^thr_[0-7][0-9a-hjkmnp-tv-z]{25}$/)

    const ownRun = await looms.start(launching, {})
    await waitForStatus(looms, ownRun.runId, 'completed')

    const launched = (await looms.getEvents(ownRun.runId)).find(
      (event) => event.type === 'runtime.run.launched',
    )

    expect(payloadString(launched, 'runId')).toMatch(/^run_[0-7][0-9a-hjkmnp-tv-z]{25}$/)

    await looms.stop()
  })
})

describe('a custom id format', () => {
  test('names the run, its root thread and every event of a start', async () => {
    const ids = customIds()
    const looms = createLooms({ ids, modules: [workflow({ definitions: [child] })] })
    const started = await looms.start(child, {})
    const events = await looms.getEvents(started.runId)

    expect(started.runId).toMatch(/^R-\d+$/)
    expect(started.threadId).toMatch(/^run_T-\d+$/)
    expect(started.state.status).toBe('completed')
    expect(events.length).toBeGreaterThan(0)

    for (const event of events) {
      expect(event.id).toMatch(/^E-\d+$/)
      expect(ids.drawn).toContain(event.id)
    }

    await looms.stop()
  })

  test('keeps the ids a caller passes', async () => {
    const looms = createLooms({ ids: customIds(), modules: [workflow({ definitions: [child] })] })
    const started = await looms.start(child, {}, { runId: 'mine' })

    expect(started.runId).toBe('mine')

    await looms.stop()
  })

  test('derives child threads and launches child runs under derived ids', async () => {
    const threaded = defineWorkflow({
      name: 'threaded-parent',
      nodes: [{ id: 'items', run: (ctx) => ctx.fanout(child, [1]) }],
    })

    const launching = defineWorkflow({
      name: 'launching-parent',
      childExecution: 'run',
      nodes: [{ id: 'spawn', run: (ctx) => ctx.spawn(child, {}) }],
      output: ({ results }) => results.spawn,
    })

    const looms = createLooms({
      ids: customIds(),
      modules: [workflow({ definitions: [child, threaded, launching] })],
    })

    const inRun = await looms.start(threaded, {})

    const childThread = Object.values(inRun.state.threads).find(
      (thread) => thread.definitionName === 'child-value',
    )

    expect(inRun.state.status).toBe('completed')
    expect(childThread?.threadId).toBe(`run_T~${inRun.threadId}.items.map.1.0`)

    const ownRun = await looms.start(launching, {})
    const state = await waitForStatus(looms, ownRun.runId, 'completed')
    const events = await looms.getEvents(ownRun.runId)

    const childRunId = payloadString(
      events.find((event) => event.type === 'runtime.run.launched'),
      'runId',
    )

    expect(state.status).toBe('completed')
    expect(state.threads[ownRun.threadId]?.output).toBe(7)
    expect(childRunId.startsWith(`R~${ownRun.runId}.run_T-`)).toBe(true)

    const childState = await looms.getRun(childRunId)
    const childEvents = await looms.getEvents(childRunId)

    expect(childState.status).toBe('completed')
    expect(childState.rootThreadId).toMatch(/^run_T-\d+$/)
    expect(childEvents.every((event) => /^E-\d+$/.test(event.id))).toBe(true)

    await looms.stop()
  })

  test('cancels a sibling thread whose id starts with run_ as a thread', async () => {
    const mapper = defineWorkflow({
      name: 'cancelling-mapper',
      nodes: [{ id: 'items', run: (ctx) => ctx.fanout(failOrHang, ['hang', 'fail'], 2) }],
    })

    const looms = createLooms({
      ids: customIds(),
      modules: [workflow({ definitions: [failOrHang, mapper] })],
    })

    const { state, runId } = await looms.start(mapper, {})
    const events = await looms.getEvents(runId)

    const children = Object.values(state.threads).filter(
      (thread) => thread.definitionName === 'fail-or-hang',
    )

    expect(state.status).toBe('failed')
    expect(children.every((thread) => thread.threadId.startsWith('run_T~'))).toBe(true)
    expect(children.map((thread) => thread.status).toSorted()).toEqual(['cancelled', 'failed'])
    expect(events.some((event) => event.type === 'runtime.run.cancel.requested')).toBe(false)

    await looms.stop()
  })

  test('cancels a sibling run whose id does not start with run_ as a run', async () => {
    const mapper = defineWorkflow({
      name: 'cancelling-run-mapper',
      childExecution: 'run',
      nodes: [{ id: 'items', run: (ctx) => ctx.fanout(failOrHang, ['hang', 'fail'], 2) }],
    })

    const looms = createLooms({
      ids: customIds(),
      modules: [workflow({ definitions: [failOrHang, mapper] })],
    })

    const started = await looms.start(mapper, {})
    const state = await waitForStatus(looms, started.runId, 'failed')

    const childRunIds = (await looms.getEvents(started.runId))
      .filter((event) => event.type === 'runtime.run.launched')
      .map((event) => payloadString(event, 'runId'))

    expect(state.status).toBe('failed')
    expect(childRunIds).toHaveLength(2)
    expect(childRunIds.every((id) => id.startsWith('R~'))).toBe(true)

    const hanging = await waitForStatus(looms, childRunIds[0] ?? '', 'cancelled')
    const failing = await looms.getRun(childRunIds[1] ?? '')

    expect(hanging.status).toBe('cancelled')
    expect(failing.status).toBe('failed')

    await looms.stop()
  })

  test('reaches reducers and effect handlers as ctx.ids', async () => {
    const ids = customIds()
    const seenByReducer: string[] = []
    const seenByHandler: string[] = []

    const catalog = defineEventCatalog('probe', { done: Schema.Struct({}) })

    const tick = defineEffect({
      type: 'probe.tick',
      placement: 'local',
      execute: (_input, ctx) => {
        seenByHandler.push(ctx.ids.create('thread'), ctx.ids.derive('run', [ctx.runId, 'x']))
        return [{ type: 'probe.done', payload: {}, threadId: ctx.threadId }]
      },
    })

    const thread = defineThread({
      kind: 'probe',
      initialState: (ctx) => ({ child: ctx.ids.derive('thread', [ctx.threadId, 'child']) }),
      step: (state, event, ctx) =>
        event.type === 'probe.done'
          ? { ...state, done: ctx.ids.derive('thread', [ctx.threadId, 'done']) }
          : state,
      effects: (state, ctx) => {
        seenByReducer.push(ctx.ids.derive('thread', [ctx.threadId, 'effects']))
        return 'done' in state ? [complete(state)] : [invoke(tick, null, 'tick')]
      },
    })

    const probe = defineRuntimeModule({
      namespace: 'probe',
      protocolVersion: '1.0.0',
      events: catalog,
      threads: { probe: thread },
      effects: { tick },
      definitions: [{ kind: 'probe', name: 'probe', version: 'v1' }],
    })

    const looms = createLooms({ ids, modules: [probe] })
    const started = await looms.start({ kind: 'probe', name: 'probe', version: 'v1' }, null)
    const root = started.state.threads[started.threadId]

    expect(started.state.status).toBe('completed')

    expect(root?.output).toEqual({
      child: `run_T~${started.threadId}.child`,
      done: `run_T~${started.threadId}.done`,
    })

    expect(seenByReducer).toContain(`run_T~${started.threadId}.effects`)
    expect(seenByHandler[0]).toMatch(/^run_T-\d+$/)
    expect(seenByHandler[1]).toBe(`R~${started.runId}.x`)

    await looms.stop()
  })
})

describe('the rules for a custom id format', () => {
  const valid: LoomsIds = {
    create: (kind) => `${kind}-1`,
    derive: (kind, parts) => `${kind}-${parts.join('.')}`,
  }

  test('an id must be a non-empty string', () => {
    const empty: LoomsIds = { ...valid, create: () => '' }

    expect(() => createLooms({ ids: empty })).toThrow(InvalidIdFormatError)
    expect(() => createLooms({ ids: empty })).toThrow(/must return a non-empty string/)
    expect(() => createRuntime({ modules: [], ids: empty })).toThrow(/non-empty string/)
  })

  test('an id must not contain a colon', () => {
    const colon: LoomsIds = { ...valid, derive: (kind, parts) => `${kind}:${parts.join(':')}` }

    expect(() => createLooms({ ids: colon })).toThrow(InvalidIdFormatError)
    expect(() => createLooms({ ids: colon })).toThrow(/must not contain ":"/)
    expect(() => createRuntime({ modules: [], ids: colon })).toThrow(/effect ids are/)
  })

  test('an id that breaks a rule later fails where it is drawn', async () => {
    let calls = 0

    const late: LoomsIds = {
      ...valid,
      create: (kind) => (kind === 'run' && ++calls > 1 ? 'a:b' : `${kind}-${Math.random()}`),
    }

    const looms = createLooms({ ids: late, modules: [workflow({ definitions: [child] })] })

    expect(() => looms.start(child, {})).toThrow(/contains ":"/)

    await looms.stop()
  })
})
