import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import {
  complete,
  defineEffect,
  defineEventCatalog,
  defineRuntimeModule,
  defineThread,
  invoke,
} from '@looms/core'

import { createLooms } from './looms'
import type { WakeScheduler } from './wake-scheduler'

async function waitFor(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (!predicate() && Date.now() < deadline) {
    await Bun.sleep(5)
  }

  if (!predicate()) {
    throw new Error('timed out waiting for condition')
  }
}

function slowModule(gate: Promise<void>, onStart: () => void) {
  const catalog = defineEventCatalog('live', { done: Schema.Struct({}) })

  const work = defineEffect({
    type: 'live.work',
    placement: 'local',
    execute: (_input, ctx) =>
      Effect.promise(() => {
        onStart()
        return gate.then(() => [{ type: 'live.done', payload: {}, threadId: ctx.threadId }])
      }),
  })

  return defineRuntimeModule({
    namespace: 'live',
    protocolVersion: '1.0.0',
    events: catalog,
    effects: { work },
    threads: {
      'live-job': defineThread<{ done: boolean }>({
        kind: 'live-job',
        initialState: () => ({ done: false }),
        step: (state, event) => (event.type === 'live.done' ? { done: true } : state),
        effects: (state) => (state.done ? [complete({ ok: true })] : [invoke(work, null, 'work')]),
      }),
    },
    definitions: [{ kind: 'live-job', name: 'live-job', version: 'v1', input: Schema.Null }],
  })
}

describe('in-process effect liveness', () => {
  test('keeps a wake pending while an in-process effect runs and clears it on park', async () => {
    const calls: Array<{ kind: 'keepAlive' | 'schedule' | 'cancel'; at: number | null }> = []

    const scheduler: WakeScheduler = {
      schedule: (_runId, at) => Effect.sync(() => void calls.push({ kind: 'schedule', at })),
      cancel: () => Effect.sync(() => void calls.push({ kind: 'cancel', at: null })),
      keepAlive: (_runId, until) =>
        Effect.sync(() => void calls.push({ kind: 'keepAlive', at: until })),
    }

    const gate = Promise.withResolvers<void>()
    let started = 0

    const looms = createLooms({
      modules: [slowModule(gate.promise, () => (started += 1))],
      scheduler,
      livenessLeaseMs: 60,
    })

    const before = Date.now()
    const starting = looms.start({ kind: 'live-job', name: 'live-job', version: 'v1' }, null)

    await waitFor(() => started === 1)
    const held = () => calls.filter((call) => call.kind === 'keepAlive' && call.at !== null)

    // Taken as soon as the wake waits on the effect, then renewed for as long as it runs.
    expect(held().length).toBeGreaterThanOrEqual(1)
    expect(held()[0]?.at).toBeGreaterThanOrEqual(before + 60)
    await waitFor(() => held().length >= 3)

    const deadlines = held().map((call) => call.at ?? 0)
    expect(deadlines).toEqual([...deadlines].toSorted((a, b) => a - b))
    expect(calls.some((call) => call.kind === 'keepAlive' && call.at === null)).toBe(false)

    gate.resolve()
    const { state } = await starting
    expect(state.status).toBe('completed')
    expect(started).toBe(1)

    // Released after the park decided the real deadline, so the two cannot be confused.
    expect(calls.at(-1)).toEqual({ kind: 'keepAlive', at: null })
    expect(calls.at(-2)).toEqual({ kind: 'cancel', at: null })

    await looms.stop()
  })

  test('a scheduler without keepAlive is only asked for runtime deadlines', async () => {
    const calls: string[] = []

    const scheduler: WakeScheduler = {
      schedule: () => Effect.sync(() => void calls.push('schedule')),
      cancel: () => Effect.sync(() => void calls.push('cancel')),
    }

    const looms = createLooms({
      modules: [slowModule(Promise.resolve(), () => {})],
      scheduler,
      livenessLeaseMs: 20,
    })

    const { state } = await looms.start({ kind: 'live-job', name: 'live-job', version: 'v1' }, null)
    expect(state.status).toBe('completed')
    expect(calls).toEqual(['cancel'])

    await looms.stop()
  })
})
