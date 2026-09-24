import { describe, expect, test } from 'bun:test'

import {
  composeModules,
  defineEffect,
  defineRuntimeModule,
  type EffectExecutionRecord,
  type RunState,
} from '@looms/core'

import {
  nextRuntimeDeadline,
  planDeadlineTransitions,
  planTerminalCancellationTransitions,
} from './deadline-transition-planner'
import { retryBackoff } from './retry-policy'
import type { EffectWorker } from './types'
import { isWorkerEffect, planWorkerEffects } from './worker-effect-dispatch'

function runningState(overrides: Partial<RunState> = {}): RunState {
  return {
    runId: 'run_1',
    status: 'running',
    rootThreadId: null,
    startIdentity: null,
    threads: {},
    waits: {},
    outstandingEffects: [],
    effectExecutions: {},
    completedEffectIds: [],
    processedIdempotencyKeys: [],
    ...overrides,
  }
}

describe('retry policy', () => {
  test('applies defaults, exponential growth, and the maximum', () => {
    expect(retryBackoff({ maxAttempts: 4 }, 1)).toBe(100)
    expect(retryBackoff({ maxAttempts: 4, backoffMs: 20, backoffMultiplier: 3 }, 3)).toBe(180)

    expect(
      retryBackoff({ maxAttempts: 4, backoffMs: 20, backoffMultiplier: 3, maxBackoffMs: 100 }, 3),
    ).toBe(100)
  })
})

describe('deadline transition planner', () => {
  test('materializes due timers and wait satisfaction before later deadlines', () => {
    const state = runningState({
      waits: {
        wait_1: {
          waitId: 'wait_1',
          threadId: 'thread_1',
          on: { timerAt: 1_000 },
        },
      },
      effectExecutions: {
        effect_1: {
          effectId: 'effect_1',
          attempt: 1,
          status: 'dispatched',
          nextAttemptAt: null,
          deadlineAt: 1_001,
          lastHeartbeatAt: null,
          lastError: null,
        },
      },
    })

    const plan = planDeadlineTransitions({
      runId: state.runId,
      state,
      registry: composeModules([]),
      now: 1_000,
    })

    expect(plan.events.map((event) => event.type)).toEqual([
      'runtime.timer.fired',
      'runtime.wait.satisfied',
    ])

    expect(plan.timerNotices).toEqual([{ timerId: 'wait_1', latenessMs: 0 }])
    expect(plan.timeoutNotices).toEqual([])
  })

  test('plans terminal cancellation ambiguity and the next deadline', () => {
    const state = runningState({
      status: 'completed',
      effectExecutions: {
        expired: {
          effectId: 'expired',
          attempt: 2,
          status: 'cancel_requested',
          nextAttemptAt: null,
          deadlineAt: 900,
          lastHeartbeatAt: null,
          lastError: null,
        },
        future: {
          effectId: 'future',
          attempt: 1,
          status: 'cancel_requested',
          nextAttemptAt: null,
          deadlineAt: 1_200,
          lastHeartbeatAt: null,
          lastError: null,
        },
      },
    })

    expect(
      planTerminalCancellationTransitions({ runId: state.runId, state, now: 1_000 }),
    ).toHaveLength(1)

    expect(nextRuntimeDeadline(state, 1_000)).toBe(1_200)
  })
})

describe('worker effect planner', () => {
  test('plans due retries with stable attempts and dispatch deadlines', () => {
    const workerEffect = defineEffect({
      type: 'worker.send',
      retry: { maxAttempts: 3, scheduleToStartTimeoutMs: 500 },
    })

    const registry = composeModules([
      defineRuntimeModule({
        namespace: 'worker',
        protocolVersion: '1.0.0',
        effects: { send: workerEffect },
      }),
    ])

    const state = runningState({
      outstandingEffects: [
        {
          effectId: 'effect_1',
          threadId: 'thread_1',
          causingSeq: 4,
          causingEventId: 'event_4',
          effect: { type: 'worker.send', input: { message: 'hello' } },
        },
      ],
      effectExecutions: {
        effect_1: {
          effectId: 'effect_1',
          attempt: 1,
          status: 'retry_wait',
          nextAttemptAt: 1_000,
          deadlineAt: null,
          lastHeartbeatAt: null,
          lastError: 'temporary',
        },
      },
    })

    const [plan] = planWorkerEffects({ runId: state.runId, state, registry, now: 1_000 })

    expect(plan?.attempt).toBe(2)

    expect(plan?.task).toEqual({
      runId: 'run_1',
      effectId: 'effect_1',
      attempt: 2,
      type: 'worker.send',
      input: { message: 'hello' },
    })

    expect(plan?.queuedEvent?.type).toBe('runtime.effect.queued')
    expect(plan?.scheduleToStartDeadlineAt).toBe(1_500)
  })
})

function outstandingItem(type: string) {
  return {
    effectId: `effect_${type}`,
    threadId: 'thread_1',
    causingSeq: 1,
    causingEventId: 'event_1',
    effect: { type, input: null },
  }
}

describe('worker effect routing', () => {
  const registry = composeModules([
    defineRuntimeModule({
      namespace: 'route',
      protocolVersion: '1.0.0',
      effects: {
        local: defineEffect({ type: 'route.local', execute: () => [] }),
        external: defineEffect({ type: 'route.external' }),
        pinnedLocal: defineEffect({ type: 'route.pinned', execution: 'local', execute: () => [] }),
        forcedWorker: defineEffect({
          type: 'route.forced',
          execution: 'worker',
          execute: () => [],
        }),
      },
    }),
  ])

  const route = (type: string, worker?: EffectWorker, status?: EffectExecutionRecord['status']) =>
    isWorkerEffect({
      runId: 'run_1',
      item: outstandingItem(type),
      execution: status
        ? {
            effectId: 'effect_1',
            attempt: 1,
            status,
            nextAttemptAt: null,
            deadlineAt: null,
            startedAt: null,
            lastHeartbeatAt: null,
            lastError: null,
          }
        : undefined,
      registry,
      worker,
    })

  const worker: EffectWorker = { dispatch: () => undefined }

  test('runs handlers locally and sends handler-less effects to the worker', () => {
    expect(route('route.local', worker)).toBe(false)
    expect(route('route.external', worker)).toBe(true)
    expect(route('route.external')).toBe(true)
  })

  test('honors an explicit execution override over worker claims', () => {
    expect(route('route.pinned', { ...worker, handles: ['route.pinned'] })).toBe(false)
    expect(route('route.forced')).toBe(true)
  })

  test('lets a worker claim effects that have a local handler', () => {
    const byName = { ...worker, handles: ['route.local'] }
    const byPredicate = { ...worker, handles: (type: string) => type === 'route.local' }

    expect(route('route.local', byName)).toBe(true)
    expect(route('route.local', byPredicate)).toBe(true)

    expect(
      route('route.local', { ...worker, canDispatch: (task) => task.type === 'route.local' }),
    ).toBe(true)
  })

  test('routes unregistered effects only to a worker that does not decline them', () => {
    expect(route('route.unknown')).toBe(false)
    expect(route('route.unknown', worker)).toBe(true)
    expect(route('route.unknown', { ...worker, handles: ['route.other'] })).toBe(false)
  })

  test('keeps an in-flight attempt where it was placed', () => {
    const claiming = { ...worker, handles: ['route.local'] }

    expect(route('route.local', claiming, 'running')).toBe(false)
    expect(route('route.local', worker, 'dispatched')).toBe(true)
    expect(route('route.local', undefined, 'ambiguous')).toBe(true)
    expect(route('route.local', claiming, 'retry_wait')).toBe(true)
    expect(route('route.local', worker, 'retry_wait')).toBe(false)
  })

  test('never routes primitive effects to a worker', () => {
    expect(
      isWorkerEffect({
        runId: 'run_1',
        item: { ...outstandingItem('x'), effect: { type: 'runtime.complete', output: null } },
        execution: undefined,
        registry,
        worker,
      }),
    ).toBe(false)
  })
})
