import { describe, expect, test } from 'bun:test'

import { Option, Schema } from 'effect'

import { defineEventCatalog } from './catalog'
import { invoke } from './effects'
import { createEvent, type EventEnvelope } from './envelope'
import { foldRun, stableEffectId } from './fold'
import { composeModules, defineRuntimeModule } from './index'
import { defineThread } from './thread'

const QueuedSchema = Schema.Struct({ name: Schema.String })
const decodeQueued = Schema.decodeUnknownOption(QueuedSchema)

const catalog = defineEventCatalog('job', { queued: QueuedSchema })

interface JobState {
  readonly queued: string | null
  readonly failures: readonly string[]
}

/** Runs one job at a time. A failed job is recorded and forgotten; the next one can still run. */
function jobThread(handlesEffectFailures: boolean) {
  return defineThread<JobState>({
    kind: 'job',
    handlesEffectFailures,
    initialState: () => ({ queued: null, failures: [] }),
    step(state, event) {
      if (event.type === 'job.queued') {
        return { ...state, queued: Option.getOrNull(decodeQueued(event.payload))?.name ?? null }
      }

      if (event.type === 'runtime.effect.failed' && state.queued !== null) {
        return { queued: null, failures: [...state.failures, state.queued] }
      }

      return state
    },
    effects(state) {
      return state.queued === null ? [] : [invoke('job.run', null, `job:${state.queued}`)]
    },
  })
}

function registryFor(handlesEffectFailures: boolean) {
  return composeModules([
    defineRuntimeModule({
      namespace: 'job',
      protocolVersion: '1.0.0',
      events: catalog,
      threads: { job: jobThread(handlesEffectFailures) },
    }),
  ])
}

const runId = 'run_1'
const threadId = 'thr_1'

function started(): EventEnvelope[] {
  return [
    createEvent(runId, {
      type: 'runtime.run.started',
      payload: { rootThreadId: threadId, kind: 'job', definitionName: 'job', input: null },
      threadId: null,
      origin: { type: 'system' },
    }),
    createEvent(runId, {
      type: 'runtime.thread.started',
      payload: {
        threadId,
        kind: 'job',
        definitionName: 'job',
        definitionVersion: 'v1',
        input: null,
        parentThreadId: null,
      },
      threadId,
      origin: { type: 'system' },
    }),
  ]
}

function queued(name: string): EventEnvelope {
  return createEvent(runId, {
    type: 'job.queued',
    payload: { name },
    threadId,
    origin: { type: 'external' },
  })
}

function failed(name: string): EventEnvelope {
  const effectId = stableEffectId(threadId, invoke('job.run', null, `job:${name}`)) ?? 'missing'

  return createEvent(runId, {
    type: 'runtime.effect.failed',
    payload: { effectId, error: `job ${name} broke` },
    threadId,
    effectId,
    origin: { type: 'system' },
  })
}

function fold(events: readonly EventEnvelope[], handlesEffectFailures: boolean) {
  return foldRun(
    events.map((event, index) => ({ ...event, seq: index + 1 })),
    registryFor(handlesEffectFailures),
    { runId },
  )
}

describe('handlesEffectFailures', () => {
  test('without it, a failure that enables no new effect fails the thread', () => {
    const state = fold([...started(), queued('a'), failed('a')], false)

    expect(state.threads[threadId]).toMatchObject({ status: 'failed', error: 'job a broke' })
  })

  test('with it, the thread keeps running as its reducer left it and can run again', () => {
    const afterFailure = fold([...started(), queued('a'), failed('a')], true)

    expect(afterFailure.threads[threadId]).toMatchObject({
      status: 'running',
      state: { queued: null, failures: ['a'] },
    })

    expect(afterFailure.outstandingEffects).toHaveLength(0)

    const next = fold([...started(), queued('a'), failed('a'), queued('b')], true)

    expect(next.threads[threadId]?.status).toBe('running')

    expect(next.outstandingEffects.map((item) => item.effectId)).toEqual([
      stableEffectId(threadId, invoke('job.run', null, 'job:b')),
    ])
  })
})
