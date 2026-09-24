import {
  createEvent,
  foldRun,
  isRunTerminal,
  isWaitOnTimer,
  type ComposedRegistry,
  type EventEnvelope,
  type RunState,
} from '@looms/core'

import { createEffectFailedEvent, waitSatisfiedEvents } from './helpers'
import { retryBackoff } from './retry-policy'

export interface TimerLateNotice {
  readonly timerId: string
  readonly latenessMs: number
}

export interface EffectTimeoutNotice {
  readonly effectId: string
  readonly attempt: number
  readonly timeout: 'schedule-to-start' | 'heartbeat' | 'start-to-close'
}

export interface DeadlineTransitionPlan {
  readonly events: ReadonlyArray<EventEnvelope>
  readonly timerNotices: ReadonlyArray<TimerLateNotice>
  readonly timeoutNotices: ReadonlyArray<EffectTimeoutNotice>
}

const EMPTY_PLAN: DeadlineTransitionPlan = {
  events: [],
  timerNotices: [],
  timeoutNotices: [],
}

export function planDeadlineTransitions(input: {
  readonly runId: string
  readonly state: RunState
  readonly registry: ComposedRegistry
  readonly now: number
}): DeadlineTransitionPlan {
  const timerPlan = planDueTimers(input)

  if (timerPlan.events.length > 0) {
    return timerPlan
  }

  return planExpiredExecutions(input)
}

function planDueTimers(input: {
  readonly runId: string
  readonly state: RunState
  readonly registry: ComposedRegistry
  readonly now: number
}): DeadlineTransitionPlan {
  const due = Object.values(input.state.waits).filter(
    (record) => isWaitOnTimer(record.on) && record.on.timerAt <= input.now + 5,
  )

  if (due.length === 0) {
    return EMPTY_PLAN
  }

  const fired = due.flatMap((record) =>
    isWaitOnTimer(record.on)
      ? [
          createEvent(input.runId, {
            type: 'runtime.timer.fired',
            payload: { timerId: record.waitId, waitId: record.waitId },
            threadId: record.threadId,
            origin: { type: 'system' },
          }),
        ]
      : [],
  )

  const stateAfterFired = foldRun(fired, input.registry, {
    runId: input.runId,
    initial: input.state,
  })

  const satisfied = waitSatisfiedEvents(stateAfterFired, fired).map((event) =>
    createEvent(input.runId, event),
  )

  return {
    events: [...fired, ...satisfied],
    timerNotices: due.flatMap((record) =>
      isWaitOnTimer(record.on)
        ? [{ timerId: record.waitId, latenessMs: Math.max(0, input.now - record.on.timerAt) }]
        : [],
    ),
    timeoutNotices: [],
  }
}

function planExpiredExecutions(input: {
  readonly runId: string
  readonly state: RunState
  readonly registry: ComposedRegistry
  readonly now: number
}): DeadlineTransitionPlan {
  const expired = Object.values(input.state.effectExecutions).filter(
    (execution) =>
      (execution.status === 'dispatched' ||
        execution.status === 'started' ||
        execution.status === 'heartbeat' ||
        execution.status === 'cancel_requested') &&
      execution.deadlineAt !== null &&
      execution.deadlineAt <= input.now,
  )

  if (expired.length === 0) {
    return EMPTY_PLAN
  }

  const events: EventEnvelope[] = []
  const timeoutNotices: EffectTimeoutNotice[] = []

  for (const execution of expired) {
    const item = input.state.outstandingEffects.find(
      (candidate) => candidate.effectId === execution.effectId,
    )

    if (!item) {
      if (execution.status === 'cancel_requested') {
        events.push(cancellationAmbiguous(input.runId, execution.effectId, execution.attempt))
      }

      continue
    }

    const retry = input.registry.effects.get(item.effect.type)?.retry

    const timeout =
      execution.status === 'dispatched'
        ? 'schedule-to-start'
        : execution.status === 'heartbeat'
          ? 'heartbeat'
          : 'start-to-close'

    timeoutNotices.push({
      effectId: item.effectId,
      attempt: execution.attempt,
      timeout,
    })

    events.push(
      createEvent(input.runId, {
        type: 'runtime.effect.timed_out',
        payload: { effectId: item.effectId, attempt: execution.attempt, timeout },
        threadId: item.threadId,
        causationId: item.causingEventId,
        origin: { type: 'system' },
      }),
    )

    if (retry && execution.attempt < retry.maxAttempts) {
      events.push(
        createEvent(input.runId, {
          type: 'runtime.effect.retry.scheduled',
          payload: {
            effectId: item.effectId,
            attempt: execution.attempt,
            nextAttemptAt: input.now + retryBackoff(retry, execution.attempt),
            error: `${timeout} timeout`,
          },
          threadId: item.threadId,
          causationId: item.causingEventId,
          origin: { type: 'system' },
        }),
      )
    } else {
      events.push(createEffectFailedEvent(input.runId, item, `${timeout} timeout`))
    }
  }

  return { events, timerNotices: [], timeoutNotices }
}

export function planTerminalCancellationTransitions(input: {
  readonly runId: string
  readonly state: RunState
  readonly now: number
}): ReadonlyArray<EventEnvelope> {
  if (!isRunTerminal(input.state)) {
    return []
  }

  return Object.values(input.state.effectExecutions)
    .filter(
      (execution) =>
        execution.status === 'cancel_requested' &&
        execution.deadlineAt !== null &&
        execution.deadlineAt <= input.now,
    )
    .map((execution) => cancellationAmbiguous(input.runId, execution.effectId, execution.attempt))
}

export function nextRuntimeDeadline(state: RunState, now: number): number | undefined {
  const deadlines = [
    ...Object.values(state.waits).flatMap((record) =>
      isWaitOnTimer(record.on) && record.on.timerAt > now ? [record.on.timerAt] : [],
    ),
    ...Object.values(state.effectExecutions).flatMap((execution) =>
      execution.deadlineAt !== null && execution.deadlineAt > now ? [execution.deadlineAt] : [],
    ),
  ]

  return deadlines.length > 0 ? Math.min(...deadlines) : undefined
}

function cancellationAmbiguous(runId: string, effectId: string, attempt: number): EventEnvelope {
  return createEvent(runId, {
    type: 'runtime.effect.ambiguous',
    payload: {
      effectId,
      attempt,
      error: 'worker did not acknowledge cancellation',
    },
    threadId: null,
    origin: { type: 'system' },
  })
}
