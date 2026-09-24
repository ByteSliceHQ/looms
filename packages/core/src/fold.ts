import { Option, Predicate, Schema, Stream, type Effect } from 'effect'

import { isWithdrawnError, WaitConditionSchema, type RuntimeEffect } from './effects'
import type { EventEnvelope } from './envelope'
import { createEffectId } from './ids'
import { DEFAULT_DEFINITION_VERSION } from './module'
import type { ThreadRecord, OutstandingEffect, RunState, WaitRecord } from './state'
import { emptyRunState } from './state'
import { isTerminalStatus, type ThreadContext, type ThreadDefinition } from './thread'
import type { JsonValue } from './types'

export interface FoldRegistry {
  readonly threads: ReadonlyMap<string, ThreadDefinition>
}

const decodeWaitCondition = Schema.decodeUnknownOption(WaitConditionSchema)

function payloadObject(event: EventEnvelope): { [key: string]: JsonValue } {
  const payload = event.payload

  if (payload === null || Array.isArray(payload)) {
    return {}
  }

  if (Predicate.isReadonlyObject(payload)) {
    return payload
  }

  return {}
}

function readString(obj: { [key: string]: JsonValue }, key: string): string | undefined {
  const value = obj[key]
  return Predicate.isString(value) ? value : undefined
}

function cloneState(state: RunState): RunState {
  return {
    runId: state.runId,
    status: state.status,
    rootThreadId: state.rootThreadId,
    startIdentity: state.startIdentity,
    threads: { ...state.threads },
    waits: { ...state.waits },
    outstandingEffects: [...state.outstandingEffects],
    effectExecutions: { ...state.effectExecutions },
    completedEffectIds: state.completedEffectIds ? [...state.completedEffectIds] : [],
    processedIdempotencyKeys: state.processedIdempotencyKeys
      ? [...state.processedIdempotencyKeys]
      : [],
  }
}

function completeEffect(state: RunState, effectId: string): RunState {
  const completed = state.completedEffectIds ?? []
  const { [effectId]: _completedExecution, ...effectExecutions } = state.effectExecutions ?? {}
  return {
    ...state,
    outstandingEffects: state.outstandingEffects.filter((item) => item.effectId !== effectId),
    effectExecutions,
    completedEffectIds: completed.includes(effectId) ? completed : [...completed, effectId],
  }
}

function putThread(state: RunState, record: ThreadRecord): RunState {
  return {
    ...state,
    threads: { ...state.threads, [record.threadId]: record },
  }
}

function addWait(state: RunState, record: WaitRecord): RunState {
  return {
    ...state,
    waits: { ...state.waits, [record.waitId]: record },
  }
}

function removeWait(state: RunState, waitId: string): RunState {
  const { [waitId]: _removed, ...rest } = state.waits
  return { ...state, waits: rest }
}

function threadWaits(state: RunState, threadId: string): WaitRecord[] {
  return Object.values(state.waits).filter((record) => record.threadId === threadId)
}

function dropThreadWork(state: RunState, threadId: string): RunState {
  const waits: RunState['waits'] = {}

  for (const [waitId, record] of Object.entries(state.waits)) {
    if (record.threadId !== threadId) {
      waits[waitId] = record
    }
  }

  return {
    ...state,
    waits,
    outstandingEffects: state.outstandingEffects.filter((item) => item.threadId !== threadId),
  }
}

function applyProtocol(state: RunState, event: EventEnvelope, registry: FoldRegistry): RunState {
  const payload = payloadObject(event)

  switch (event.type) {
    case 'runtime.run.started': {
      const rootThreadId = readString(payload, 'rootThreadId')
      const kind = readString(payload, 'kind')
      const definitionName = readString(payload, 'definitionName')

      const definitionVersion =
        readString(payload, 'definitionVersion') ?? DEFAULT_DEFINITION_VERSION

      const startIdentity =
        rootThreadId && kind && definitionName && definitionVersion
          ? {
              kind,
              definitionName,
              definitionVersion,
              input: payload.input ?? null,
              requestedThreadId: readString(payload, 'requestedThreadId') ?? null,
              idempotencyKey: event.idempotencyKey ?? null,
              rootThreadId,
            }
          : null

      return {
        ...state,
        runId: event.runId,
        rootThreadId: rootThreadId ?? null,
        startIdentity,
        status: 'running',
      }
    }

    case 'runtime.run.completed': {
      const error = payload.error
      const status = Predicate.isString(error) && error.length > 0 ? 'failed' : 'completed'
      return { ...state, status }
    }

    case 'runtime.run.cancelled':
      return { ...state, status: 'cancelled' }

    case 'runtime.thread.started': {
      const threadId = readString(payload, 'threadId') ?? event.threadId
      const kind = readString(payload, 'kind')
      const definitionName = readString(payload, 'definitionName')

      const definitionVersion =
        readString(payload, 'definitionVersion') ?? DEFAULT_DEFINITION_VERSION

      if (!threadId || !kind || !definitionName) {
        return state
      }

      const parent = payload.parentThreadId
      const parentThreadId = parent === null || Predicate.isString(parent) ? parent : null
      const input = payload.input ?? null
      const definition = registry.threads.get(kind)

      const record: ThreadRecord = {
        threadId,
        kind,
        definitionName,
        definitionVersion,
        parentThreadId,
        status: definition ? 'running' : 'failed',
        input,
        output: null,
        error: definition ? null : `Unsupported thread kind: ${kind}`,
        state: definition
          ? definition.initialState({
              runId: event.runId,
              threadId,
              parentThreadId,
              definitionName,
              definitionVersion,
              input,
            })
          : {},
      }

      let next = putThread(state, record)

      if (!next.rootThreadId) {
        next = { ...next, rootThreadId: threadId }
      }

      return next
    }

    case 'runtime.thread.completed': {
      const threadId = readString(payload, 'threadId') ?? event.threadId

      if (!threadId) {
        return state
      }

      const existing = state.threads[threadId]

      if (!existing) {
        return state
      }

      return putThread(state, {
        ...existing,
        status: 'completed',
        output: payload.output ?? null,
        error: null,
      })
    }

    case 'runtime.thread.failed': {
      const threadId = readString(payload, 'threadId') ?? event.threadId

      if (!threadId) {
        return state
      }

      const existing = state.threads[threadId]

      if (!existing) {
        return state
      }

      return dropThreadWork(
        putThread(state, {
          ...existing,
          status: 'failed',
          error: readString(payload, 'error') ?? 'failed',
        }),
        threadId,
      )
    }

    case 'runtime.thread.cancelled': {
      const threadId = readString(payload, 'threadId') ?? event.threadId

      if (!threadId) {
        return state
      }

      const existing = state.threads[threadId]

      if (!existing) {
        return state
      }

      return dropThreadWork(
        putThread(state, {
          ...existing,
          status: 'cancelled',
          error: readString(payload, 'reason') ?? existing.error,
        }),
        threadId,
      )
    }

    case 'runtime.effect.attempt.started': {
      const effectId = readString(payload, 'effectId')
      const attempt = payload.attempt

      if (!effectId || !Predicate.isNumber(attempt)) {
        return state
      }

      return {
        ...state,
        effectExecutions: {
          ...state.effectExecutions,
          [effectId]: {
            effectId,
            attempt,
            status: 'running',
            nextAttemptAt: null,
            deadlineAt: null,
            startedAt: event.ts,
            lastHeartbeatAt: null,
            lastError: null,
          },
        },
      }
    }

    case 'runtime.effect.queued':
    case 'runtime.effect.dispatched':
    case 'runtime.effect.worker.started':
    case 'runtime.effect.heartbeat':
    case 'runtime.effect.cancel.requested':
    case 'runtime.effect.timed_out':

    case 'runtime.effect.ambiguous': {
      const effectId = readString(payload, 'effectId')
      const attempt = payload.attempt

      if (!effectId || !Predicate.isNumber(attempt)) {
        return state
      }

      const status =
        event.type === 'runtime.effect.queued'
          ? 'queued'
          : event.type === 'runtime.effect.dispatched'
            ? 'dispatched'
            : event.type === 'runtime.effect.worker.started'
              ? 'started'
              : event.type === 'runtime.effect.heartbeat'
                ? 'heartbeat'
                : event.type === 'runtime.effect.cancel.requested'
                  ? 'cancel_requested'
                  : event.type === 'runtime.effect.timed_out'
                    ? 'timed_out'
                    : 'ambiguous'

      const deadlineAt = payload.deadlineAt
      const heartbeatAt = payload.heartbeatAt
      const previous = state.effectExecutions[effectId]
      const sameAttempt = previous?.attempt === attempt

      return {
        ...state,
        effectExecutions: {
          ...state.effectExecutions,
          [effectId]: {
            effectId,
            attempt,
            status,
            nextAttemptAt: null,
            deadlineAt: Predicate.isNumber(deadlineAt) ? deadlineAt : null,
            startedAt:
              event.type === 'runtime.effect.worker.started'
                ? event.ts
                : sameAttempt
                  ? previous.startedAt
                  : null,
            lastHeartbeatAt: Predicate.isNumber(heartbeatAt)
              ? heartbeatAt
              : sameAttempt
                ? previous.lastHeartbeatAt
                : null,
            lastError: readString(payload, 'error') ?? null,
          },
        },
      }
    }

    case 'runtime.effect.cancelled': {
      const effectId = readString(payload, 'effectId')
      return effectId ? completeEffect(state, effectId) : state
    }

    case 'runtime.effect.retry.scheduled': {
      const effectId = readString(payload, 'effectId')
      const attempt = payload.attempt
      const nextAttemptAt = payload.nextAttemptAt

      if (!effectId || !Predicate.isNumber(attempt) || !Predicate.isNumber(nextAttemptAt)) {
        return state
      }

      return {
        ...state,
        effectExecutions: {
          ...state.effectExecutions,
          [effectId]: {
            effectId,
            attempt,
            status: 'retry_wait',
            nextAttemptAt,
            deadlineAt: nextAttemptAt,
            startedAt: null,
            lastHeartbeatAt: null,
            lastError: readString(payload, 'error') ?? 'effect failed',
          },
        },
      }
    }

    case 'runtime.wait.registered': {
      const waitId = readString(payload, 'waitId')
      const threadId = readString(payload, 'threadId') ?? event.threadId
      const on = payload.on

      if (!waitId || !threadId || !on || !Predicate.isObject(on)) {
        return state
      }

      const waitCondition = decodeWaitCondition(on)

      if (Option.isNone(waitCondition)) {
        return state
      }

      const record: WaitRecord = {
        waitId,
        threadId,
        on: waitCondition.value,
      }

      if (payload.tag !== undefined) {
        record.tag = payload.tag
      }

      let next = addWait(state, record)
      const existing = next.threads[threadId]

      if (existing && !isTerminalStatus(existing.status)) {
        next = putThread(next, { ...existing, status: 'waiting' })
      }

      return next
    }

    case 'runtime.wait.satisfied': {
      const waitId = readString(payload, 'waitId')

      if (!waitId) {
        return state
      }

      const existingWait = state.waits[waitId]
      let next = removeWait(state, waitId)
      const existingTag = Predicate.isObject(existingWait?.tag) ? existingWait.tag : undefined

      const raceId =
        existingTag && Predicate.isString(existingTag.raceId) ? existingTag.raceId : undefined

      if (raceId) {
        for (const sibling of Object.values(next.waits)) {
          const siblingTag = Predicate.isObject(sibling.tag) ? sibling.tag : undefined

          if (siblingTag?.raceId === raceId) {
            next = removeWait(next, sibling.waitId)
          }
        }
      }

      const threadId = existingWait?.threadId ?? event.threadId

      if (!threadId) {
        return next
      }

      const existing = next.threads[threadId]

      if (existing && existing.status === 'waiting' && threadWaits(next, threadId).length === 0) {
        next = putThread(next, { ...existing, status: 'running' })
      }

      return next
    }

    case 'runtime.snapshot.taken':
    case 'runtime.thread.cancel.requested':
    case 'runtime.timer.set':
    case 'runtime.timer.fired':
    case 'runtime.effect.failed':
    case 'runtime.effect.completed':
    case 'runtime.signal.received':
      return state
    default:
      return state
  }
}

/** The id an effect keeps across folds when it names itself by tag, wait id, or child thread. */
export function stableEffectId(threadId: string, effect: RuntimeEffect): string | undefined {
  if ('tag' in effect && Predicate.isString(effect.tag)) {
    return createEffectId(threadId, effect.tag)
  }

  if ('waitId' in effect && Predicate.isString(effect.waitId)) {
    return createEffectId(threadId, effect.waitId)
  }

  if ('childThreadId' in effect && Predicate.isString(effect.childThreadId)) {
    return createEffectId(threadId, `spawn_${effect.childThreadId}`)
  }

  return undefined
}

function mapEffects(
  threadId: string,
  event: EventEnvelope,
  effects: RuntimeEffect[],
  completed: readonly string[],
  existingForThread: readonly OutstandingEffect[],
): OutstandingEffect[] {
  const remainingExisting = [...existingForThread]
  return effects
    .map((effect, index) => {
      const stableId = stableEffectId(threadId, effect)

      const matchIndex = remainingExisting.findIndex((item) =>
        stableId === undefined ? item.effect.type === effect.type : item.effectId === stableId,
      )

      const existing = matchIndex >= 0 ? remainingExisting.splice(matchIndex, 1)[0] : undefined
      const effectId = stableId ?? existing?.effectId ?? createEffectId(threadId, event.seq, index)
      return (
        existing ?? {
          effectId,
          threadId,
          causingSeq: event.seq,
          causingEventId: event.id,
          effect,
        }
      )
    })
    .filter((item) => !completed.includes(item.effectId))
}

/** Reconcile a thread's outstanding effects with enabled work from `effects()`. */
function reconcileEffects(
  state: RunState,
  threadId: string,
  event: EventEnvelope,
  effects: RuntimeEffect[],
): RunState {
  const record = state.threads[threadId]

  if (record && isTerminalStatus(record.status)) {
    return {
      ...state,
      outstandingEffects: state.outstandingEffects.filter((item) => item.threadId !== threadId),
    }
  }

  const completed = state.completedEffectIds ?? []
  const existingForThread = state.outstandingEffects.filter((item) => item.threadId === threadId)
  const mapped = mapEffects(threadId, event, effects, completed, existingForThread)
  const otherThreadEffects = state.outstandingEffects.filter((item) => item.threadId !== threadId)

  return {
    ...state,
    outstandingEffects: [...otherThreadEffects, ...mapped],
  }
}

function deliver(state: RunState, event: EventEnvelope, registry: FoldRegistry): RunState {
  const threadId = event.threadId

  if (!threadId) {
    return state
  }

  const record = state.threads[threadId]

  if (!record) {
    return state
  }

  if (isTerminalStatus(record.status)) {
    return state
  }

  const definition = registry.threads.get(record.kind)

  if (!definition) {
    return state
  }

  const ctx: ThreadContext = {
    runId: state.runId,
    threadId,
    parentThreadId: record.parentThreadId,
  }

  const nextState = definition.step(record.state, event, ctx)
  const enabled = definition.effects(nextState, ctx)

  let next = putThread(state, { ...record, state: nextState })
  next = reconcileEffects(next, threadId, event, enabled)
  return next
}

function failUnhandledEffect(
  state: RunState,
  event: EventEnvelope,
  effectIdsBeforeDeliver: ReadonlySet<string>,
): RunState {
  if (event.type !== 'runtime.effect.failed') {
    return state
  }

  const payload = payloadObject(event)
  const error = readString(payload, 'error') ?? 'effect failed'

  if (isWithdrawnError(error)) {
    return state
  }

  const handled = state.outstandingEffects.some(
    (item) => !effectIdsBeforeDeliver.has(item.effectId),
  )

  if (handled) {
    return state
  }

  const threadId = event.threadId

  if (!threadId) {
    return state
  }

  const existing = state.threads[threadId]

  if (!existing || isTerminalStatus(existing.status)) {
    return state
  }

  return dropThreadWork(
    putThread(state, {
      ...existing,
      status: 'failed',
      error,
    }),
    threadId,
  )
}

export function foldEvent(state: RunState, event: EventEnvelope, registry: FoldRegistry): RunState {
  if (event.ephemeral) {
    return state
  }

  let next = cloneState(state)

  if (event.runId && next.runId !== event.runId) {
    next = { ...next, runId: event.runId }
  }

  if (event.effectId) {
    next = completeEffect(next, event.effectId)
  }

  if (event.idempotencyKey) {
    const keys = next.processedIdempotencyKeys ?? []

    if (!keys.includes(event.idempotencyKey)) {
      next = { ...next, processedIdempotencyKeys: [...keys, event.idempotencyKey] }
    }
  }

  next = applyProtocol(next, event, registry)
  const effectIdsBeforeDeliver = new Set(next.outstandingEffects.map((item) => item.effectId))
  next = deliver(next, event, registry)
  return failUnhandledEffect(next, event, effectIdsBeforeDeliver)
}

export function foldRun(
  events: readonly EventEnvelope[],
  registry: FoldRegistry,
  options?: { runId?: string; initial?: RunState },
): RunState {
  const base = options?.initial ? cloneState(options.initial) : emptyRunState(options?.runId ?? '')
  return events.reduce((acc, event) => foldEvent(acc, event, registry), base)
}

/**
 * Folds an Effect Stream of events into RunState without buffering all events into memory.
 */
export function foldStream<E = never, R = never>(
  stream: Stream.Stream<EventEnvelope, E, R>,
  registry: FoldRegistry,
  options?: { runId?: string; initial?: RunState },
): Effect.Effect<RunState, E, R> {
  const getBase = () =>
    options?.initial ? cloneState(options.initial) : emptyRunState(options?.runId ?? '')

  return Stream.runFold(stream, getBase, (acc, event) => foldEvent(acc, event, registry))
}
