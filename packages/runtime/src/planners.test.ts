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
    forkedFrom: null,
    attributes: {},
    threads: {},
    waits: {},
    outstandingEffects: [],
    effectExecutions: {},
    completedEffectIds: [],
    processedIdempotencyKeys: [],
    launchedRuns: [],
    closeWaiting: false,
    childCloseSent: false,
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
          heartbeatDetails: null,
          lastError: null,
          dispatchTry: 0,
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
          heartbeatDetails: null,
          lastError: null,
          dispatchTry: 0,
        },
        future: {
          effectId: 'future',
          attempt: 1,
          status: 'cancel_requested',
          nextAttemptAt: null,
          deadlineAt: 1_200,
          lastHeartbeatAt: null,
          heartbeatDetails: null,
          lastError: null,
          dispatchTry: 0,
        },
      },
    })

    expect(
      planTerminalCancellationTransitions({ runId: state.runId, state, now: 1_000 }),
    ).toHaveLength(1)

    expect(nextRuntimeDeadline(state, 1_000)).toBe(1_200)
  })

  test('schedules a deferred effect from its at timestamp', () => {
    const state = runningState({
      outstandingEffects: [
        {
          effectId: 'effect_1',
          threadId: 'thread_1',
          causingSeq: 1,
          causingEventId: 'event_1',
          effect: { type: 'defer.tick', input: null, tag: 'tick', at: 5_000 },
        },
      ],
    })

    expect(nextRuntimeDeadline(state, 0)).toBe(5_000)

    expect(
      nextRuntimeDeadline({
        ...state,
        effectExecutions: {
          effect_1: {
            effectId: 'effect_1',
            attempt: 1,
            status: 'retry_wait',
            nextAttemptAt: 9_000,
            deadlineAt: 9_000,
            startedAt: null,
            lastHeartbeatAt: null,
            heartbeatDetails: null,
            lastError: 'failed',
            dispatchTry: 0,
          },
        },
      }),
    ).toBe(9_000)

    expect(nextRuntimeDeadline({ ...state, status: 'completed' }, 0)).toBeUndefined()
  })
})

describe('worker effect planner', () => {
  test('plans due retries with stable attempts and dispatch deadlines', () => {
    const workerEffect = defineEffect({
      type: 'worker.send',
      placement: 'worker',
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
          heartbeatDetails: null,
          lastError: 'temporary',
          dispatchTry: 0,
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
      threadId: 'thread_1',
      causingEventId: 'event_4',
      deadlines: { scheduleToStartAt: 1_500 },
    })

    expect(plan?.queuedEvent?.type).toBe('runtime.effect.queued')
    expect(plan?.scheduleToStartDeadlineAt).toBe(1_500)
  })

  test('replays the same attempt from dispatch_wait without re-queuing', () => {
    const workerEffect = defineEffect({
      type: 'worker.send',
      placement: 'worker',
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
          status: 'dispatch_wait',
          nextAttemptAt: 1_000,
          deadlineAt: 1_000,
          lastHeartbeatAt: null,
          heartbeatDetails: null,
          lastError: 'worker dispatch deferred',
          dispatchTry: 2,
        },
      },
    })

    const [plan] = planWorkerEffects({ runId: state.runId, state, registry, now: 1_000 })

    expect(plan?.attempt).toBe(1)
    expect(plan?.dispatchTry).toBe(3)
    expect(plan?.queuedEvent).toBeUndefined()
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
        local: defineEffect({ type: 'route.local', placement: 'local', execute: () => [] }),
        external: defineEffect({ type: 'route.external', placement: 'worker' }),
        pinnedLocal: defineEffect({ type: 'route.pinned', placement: 'local', execute: () => [] }),
        forcedWorker: defineEffect({ type: 'route.forced', placement: 'worker' }),
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
            heartbeatDetails: null,
            lastError: null,
            dispatchTry: 0,
          }
        : undefined,
      registry,
      worker,
    })

  const worker: EffectWorker = { dispatch: () => undefined }

  test('runs local effects locally and sends worker-placed effects to the worker', () => {
    expect(route('route.local', worker)).toBe(false)
    expect(route('route.external', worker)).toBe(true)
    expect(route('route.external')).toBe(true)
  })

  test('routes by placement on the definition', () => {
    expect(route('route.pinned', { ...worker, handles: ['route.pinned'] })).toBe(false)
    expect(route('route.forced')).toBe(true)
  })

  test('does not route local-placed effects to a worker that claims their type', () => {
    const byName = { ...worker, handles: ['route.local'] }
    const byPredicate = { ...worker, handles: (type: string) => type === 'route.local' }

    expect(route('route.local', byName)).toBe(false)
    expect(route('route.local', byPredicate)).toBe(false)

    expect(
      route('route.local', { ...worker, canDispatch: (task) => task.type === 'route.local' }),
    ).toBe(false)
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
    expect(route('route.local', claiming, 'retry_wait')).toBe(false)
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
