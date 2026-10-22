import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import {
  RunLauncherTag,
  complete,
  defineEffect,
  defineEventCatalog,
  defineModule,
  defineThread,
  foldRun,
  invoke,
  stringifyJson,
} from '@looms/core'
import { createLooms } from '@looms/runtime'
import { defineWorkflow, workflow } from '@looms/workflow'

import { defineSchedule } from './definitions'
import { ensureSchedule, readSchedule } from './ensure'
import { schedule } from './module'
import { scheduleStatus } from './projections'
import { pause, resume, retire, trigger, update } from './signals'
import { cron, every, once } from './specs'

const job = defineWorkflow({
  name: 'job',
  nodes: [{ id: 'work', run: (ctx) => ctx.input ?? null }],
})

const waiting = defineWorkflow({
  name: 'waiting-job',
  nodes: [{ id: 'wait', run: (ctx) => ctx.wait({ type: 'job.done' }) }],
})

function hostFor(definitions: Parameters<typeof schedule>[0]) {
  return createLooms({
    maxWakeIterations: 2_000,
    modules: [workflow({ definitions: [job, waiting] }), schedule(definitions)],
  })
}

async function waitForRun(
  looms: ReturnType<typeof hostFor>,
  runId: string,
  status: string,
): Promise<void> {
  const deadline = Date.now() + 20_000

  while (Date.now() < deadline) {
    const state = await looms.getRun(runId)

    if (state.status === status) {
      return
    }

    await Bun.sleep(10)
  }

  throw new Error(`run ${runId} did not become ${status}`)
}

describe('schedule module', () => {
  test('fires a past once immediately and replays deterministically', async () => {
    const nightly = defineSchedule({
      name: 'nightly',
      target: job,
      spec: once(1),
      input: ({ at }) => ({ at }),
    })

    const looms = hostFor({ definitions: [nightly], minIntervalMs: 1 })

    try {
      const started = await looms.start(nightly, null, { runId: 'nightly' })
      expect(started.state.status).toBe('completed')

      const view = await looms.project('nightly', scheduleStatus)
      expect(view.fireCount).toBe(1)
      expect(view.status).toBe('completed')
      expect(view.recent[0]?.runId).toBe('nightly:fire:1')

      await waitForRun(looms, 'nightly:fire:1', 'completed')

      await looms.wake('nightly')
      const again = await looms.project('nightly', scheduleStatus)
      expect(again.fireCount).toBe(1)

      const events = await looms.getEvents('nightly')
      const { runtime } = await looms.ready()
      const first = foldRun(events, runtime.registry, { runId: 'nightly' })
      const second = foldRun(events, runtime.registry, { runId: 'nightly' })
      expect(stringifyJson(first)).toBe(stringifyJson(second))
    } finally {
      await looms.stop()
    }
  })

  test('updates, pauses, resumes, retires, and triggers', async () => {
    const later = Date.now() + 120_000

    const nightly = defineSchedule({
      name: 'nightly',
      target: job,
      spec: once(later),
    })

    const looms = hostFor({ definitions: [nightly], minIntervalMs: 1 })

    try {
      await looms.start(nightly, null, { runId: 'nightly' })
      await looms.signal('nightly', [update({ spec: once(later) })])
      const unchanged = readSchedule(await looms.getRun('nightly'))
      expect(unchanged?.generation).toBe(0)

      await looms.signal('nightly', [update({ spec: cron('0 8 * * 1-5', { tz: 'UTC' }) })])
      const updated = readSchedule(await looms.getRun('nightly'))
      expect(updated?.spec).toEqual(cron('0 8 * * 1-5', { tz: 'UTC' }))
      expect(updated?.generation).toBe(1)

      await looms.signal('nightly', [pause()])
      expect(readSchedule(await looms.getRun('nightly'))?.paused).toBe(true)
      expect((await looms.project('nightly', scheduleStatus)).status).toBe('paused')

      await looms.signal('nightly', [resume()])
      const resumed = readSchedule(await looms.getRun('nightly'))
      expect(resumed?.paused).toBe(false)
      expect(resumed?.generation).toBe(2)

      await looms.signal('nightly', [trigger()])
      const triggered = await looms.project('nightly', scheduleStatus)
      expect(triggered.fireCount).toBe(1)
      expect(triggered.recent[0]?.runId).toContain(':manual:')

      await looms.signal('nightly', [retire()])
      expect(readSchedule(await looms.getRun('nightly'))?.retired).toBe(true)
      expect((await looms.project('nightly', scheduleStatus)).status).toBe('retired')
    } finally {
      await looms.stop()
    }
  })

  test('skips an overlapping trigger and records a beforeFire hold', async () => {
    const held = defineSchedule({
      name: 'held',
      target: waiting,
      spec: every(60_000),
      overlap: 'skip',
    })

    const looms = hostFor({ definitions: [held], minIntervalMs: 1 })

    try {
      await looms.start(held, null, { runId: 'held' })
      await looms.signal('held', [trigger()])
      await looms.signal('held', [trigger()])
      const view = await looms.project('held', scheduleStatus)
      expect(view.fireCount).toBe(1)
      expect(view.recent.at(-1)).toMatchObject({ outcome: 'skipped', reason: 'overlap' })
      expect((await looms.getRun('held')).status).toBe('running')
    } finally {
      await looms.stop()
    }
  })

  test('records a beforeFire hold as a skip', async () => {
    const held = defineSchedule({
      name: 'held',
      target: job,
      spec: every(60_000),
      beforeFire: () => ({ skip: 'billing_hold' }),
    })

    const looms = hostFor({ definitions: [held], minIntervalMs: 1 })

    try {
      await looms.start(held, null, { runId: 'held' })
      await looms.signal('held', [trigger()])
      const view = await looms.project('held', scheduleStatus)
      expect(view.fireCount).toBe(0)
      expect(view.recent.at(-1)).toMatchObject({ outcome: 'skipped', reason: 'billing_hold' })
    } finally {
      await looms.stop()
    }
  })

  test('reconciles a deploy without a second fire', async () => {
    const binding = defineSchedule({
      name: 'binding',
      target: job,
      spec: cron('0 2 * * *', { tz: 'UTC' }),
      beforeFire: () => ({ skip: 'project_inactive' }),
    })

    const looms = hostFor({ definitions: [binding], minIntervalMs: 1 })

    try {
      expect(await ensureSchedule(looms, binding, 'swirls:acme:nightly:job')).toBe('started')
      expect(await ensureSchedule(looms, binding, 'swirls:acme:nightly:job')).toBe('unchanged')

      expect(
        await ensureSchedule(looms, binding, 'swirls:acme:nightly:job', {
          spec: cron('0 8 * * 1-5', { tz: 'UTC' }),
        }),
      ).toBe('updated')

      const weekday = cron('0 8 * * 1-5', { tz: 'UTC' })

      await looms.signal('swirls:acme:nightly:job', [pause()])

      expect(
        await ensureSchedule(looms, binding, 'swirls:acme:nightly:job', { spec: weekday }),
      ).toBe('resumed')

      await looms.signal('swirls:acme:nightly:job', [retire()])

      const friday = cron('0 9 * * 5', { tz: 'UTC' })

      expect(
        await ensureSchedule(looms, binding, 'swirls:acme:nightly:job', { spec: friday }),
      ).toBe('updated')

      const resumed = readSchedule(await looms.getRun('swirls:acme:nightly:job'))
      expect(resumed?.retired).toBe(false)
      expect(resumed?.paused).toBe(false)
      expect(resumed?.spec).toEqual(friday)

      await looms.signal('swirls:acme:nightly:job', [trigger()])
      const view = await looms.project('swirls:acme:nightly:job', scheduleStatus)
      expect(view.recent.at(-1)).toMatchObject({ outcome: 'skipped', reason: 'project_inactive' })
      expect(view.recent.at(-1)?.at).toBeGreaterThan(0)
      expect(view.fireCount).toBe(0)
    } finally {
      await looms.stop()
    }
  })

  test('keeps completed effect ids bounded across 1000 fires', async () => {
    const pulse = defineSchedule({
      name: 'pulse',
      target: job,
      spec: every(1),
    })

    const looms = hostFor({ definitions: [pulse], minIntervalMs: 1 })

    try {
      await looms.start(pulse, { maxFires: 1_000 }, { runId: 'pulse' })
      await waitForRun(looms, 'pulse', 'completed')
      const finished = await looms.getRun('pulse')
      expect(finished.completedEffectIds.length).toBeLessThan(8)
      expect((await looms.project('pulse', scheduleStatus)).fireCount).toBe(1_000)
    } finally {
      await looms.stop()
    }
  }, 30_000)

  test('a conflicting relaunch does not fail the caller', async () => {
    const probeCatalog = defineEventCatalog('probe', {
      done: Schema.Struct({ ok: Schema.Boolean }),
    })

    const launchTwice = defineEffect({
      type: 'probe.launch',
      execute: (_input, ctx) =>
        Effect.gen(function* () {
          const launcher = yield* RunLauncherTag

          yield* launcher.launch({
            runId: 'target',
            kind: 'workflow',
            definitionName: 'job',
            input: { n: 1 },
          })

          yield* launcher.launch({
            runId: 'target',
            kind: 'workflow',
            definitionName: 'job',
            input: { n: 2 },
          })

          return [{ type: 'probe.done', payload: { ok: true }, threadId: ctx.threadId }]
        }),
    })

    const probeThread = defineThread({
      kind: 'probe',
      initialState: () => ({ done: false }),
      step: (state, event) => (event.type === 'probe.done' ? { done: true } : state),
      effects: (state) =>
        state.done ? [complete({ ok: true })] : [invoke(launchTwice, null, 'launch')],
    })

    const probe = defineModule(
      {
        namespace: 'probe',
        protocolVersion: '1.0.0',
        events: probeCatalog,
      },
      () => ({
        threads: { probe: probeThread },
        effects: { launch: launchTwice },
        definitions: [{ kind: 'probe', name: 'probe', version: 'v1' }],
      }),
    )

    const looms = createLooms({
      modules: [workflow({ definitions: [job] }), probe],
    })

    try {
      const started = await looms.start({ kind: 'probe', name: 'probe', version: 'v1' }, null, {
        runId: 'probe',
      })

      expect(started.state.status).not.toBe('failed')
      const target = await looms.getRun('target')
      expect(target.rootThreadId).not.toBeNull()
    } finally {
      await looms.stop()
    }
  })
})
