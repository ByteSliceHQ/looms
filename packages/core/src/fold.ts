import { Predicate } from 'effect'
import { createEffectId } from './ids'
import type { EventEnvelope } from './envelope'
import type { ThreadDefinition, ReduceContext } from './thread'
import { isTerminalStatus } from './thread'
import { isWithdrawnError, type RuntimeEffect } from './effects'
import type { ThreadRecord, OutstandingEffect, RunState, WaitRecord } from './state'
import { emptyRunState } from './state'
import type { JsonValue } from './types'

export interface FoldRegistry {
  readonly threads: ReadonlyMap<string, ThreadDefinition>
}

function payloadObject(event: EventEnvelope): { [key: string]: JsonValue } {
  const payload = event.payload
  if (payload === null || Array.isArray(payload)) return {}
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
    threads: { ...state.threads },
    waits: { ...state.waits },
    outstandingEffects: [...state.outstandingEffects],
  }
}

function completeEffect(state: RunState, effectId: string): RunState {
  return {
    ...state,
    outstandingEffects: state.outstandingEffects.filter((item) => item.effectId !== effectId),
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
    if (record.threadId !== threadId) waits[waitId] = record
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
      const rootThreadId = readString(payload, 'rootThreadId') ?? null
      return { ...state, runId: event.runId, rootThreadId, status: 'running' }
    }
    case 'runtime.run.completed': {
      const error = payload.error
      const status = Predicate.isString(error) && error.length > 0 ? 'failed' : 'completed'
      return { ...state, status }
    }
    case 'runtime.thread.started': {
      const threadId = readString(payload, 'threadId') ?? event.threadId
      const kind = readString(payload, 'kind')
      const definitionName = readString(payload, 'definitionName')
      if (!threadId || !kind || !definitionName) return state
      const parent = payload.parentThreadId
      const parentThreadId = parent === null || Predicate.isString(parent) ? parent : null
      const input = payload.input ?? null
      const definition = registry.threads.get(kind)
      const initial = definition
        ? definition.initialState({
            runId: event.runId,
            threadId,
            parentThreadId,
            definitionName,
            input,
          })
        : {}
      const record: ThreadRecord = {
        threadId,
        kind,
        definitionName,
        parentThreadId,
        status: 'running',
        input,
        output: null,
        error: null,
        state: initial,
      }
      let next = putThread(state, record)
      if (!next.rootThreadId) {
        next = { ...next, rootThreadId: threadId }
      }
      return next
    }
    case 'runtime.thread.completed': {
      const threadId = readString(payload, 'threadId') ?? event.threadId
      if (!threadId) return state
      const existing = state.threads[threadId]
      if (!existing) return state
      return putThread(state, {
        ...existing,
        status: 'completed',
        output: payload.output ?? null,
        error: null,
      })
    }
    case 'runtime.thread.failed': {
      const threadId = readString(payload, 'threadId') ?? event.threadId
      if (!threadId) return state
      const existing = state.threads[threadId]
      if (!existing) return state
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
      if (!threadId) return state
      const existing = state.threads[threadId]
      if (!existing) return state
      return dropThreadWork(
        putThread(state, {
          ...existing,
          status: 'cancelled',
          error: readString(payload, 'reason') ?? existing.error,
        }),
        threadId,
      )
    }
    case 'runtime.wait.registered': {
      const waitId = readString(payload, 'waitId')
      const threadId = readString(payload, 'threadId') ?? event.threadId
      const on = payload.on
      if (!waitId || !threadId || !on || !Predicate.isObject(on)) {
        return state
      }
      // SAFETY: wait.registered payload.on is a WaitCondition written by the runtime.
      const record: WaitRecord = {
        waitId,
        threadId,
        on: on as WaitRecord['on'],
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
      if (!waitId) return state
      const existingWait = state.waits[waitId]
      let next = removeWait(state, waitId)
      const threadId = existingWait?.threadId ?? event.threadId
      if (!threadId) return next
      const existing = next.threads[threadId]
      if (existing && existing.status === 'waiting' && threadWaits(next, threadId).length === 0) {
        next = putThread(next, { ...existing, status: 'running' })
      }
      return next
    }
    case 'runtime.snapshot.taken':
    case 'runtime.timer.set':
    case 'runtime.timer.fired':
    case 'runtime.effect.failed':
    case 'runtime.signal.received':
      return state
    default:
      return state
  }
}

function appendEffects(
  state: RunState,
  threadId: string,
  event: EventEnvelope,
  effects: RuntimeEffect[],
): RunState {
  if (effects.length === 0) return state
  const added: OutstandingEffect[] = effects.map((effect, index) => ({
    effectId: createEffectId(threadId, event.seq, index),
    threadId,
    causingSeq: event.seq,
    causingEventId: event.id,
    effect,
  }))
  return {
    ...state,
    outstandingEffects: [...state.outstandingEffects, ...added],
  }
}

function deliver(state: RunState, event: EventEnvelope, registry: FoldRegistry): RunState {
  const threadId = event.threadId
  if (!threadId) return state
  const record = state.threads[threadId]
  if (!record) return state
  const definition = registry.threads.get(record.kind)
  if (!definition) return state
  const ctx: ReduceContext = {
    runId: state.runId,
    threadId,
    parentThreadId: record.parentThreadId,
  }
  const result = definition.reduce(record.state, event, ctx)
  const next = putThread(state, { ...record, state: result.state })
  return appendEffects(next, threadId, event, result.effects ?? [])
}

function failUnhandledEffect(state: RunState, event: EventEnvelope, effectsBeforeDeliver: number): RunState {
  if (event.type !== 'runtime.effect.failed') return state
  const payload = payloadObject(event)
  const error = readString(payload, 'error') ?? 'effect failed'
  if (isWithdrawnError(error)) return state
  if (state.outstandingEffects.length > effectsBeforeDeliver) return state
  const threadId = event.threadId
  if (!threadId) return state
  const existing = state.threads[threadId]
  if (!existing || isTerminalStatus(existing.status)) return state
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
  if (event.ephemeral) return state
  let next = cloneState(state)
  if (event.runId && next.runId !== event.runId) {
    next = { ...next, runId: event.runId }
  }
  if (event.effectId) {
    next = completeEffect(next, event.effectId)
  }
  next = applyProtocol(next, event, registry)
  const effectsBeforeDeliver = next.outstandingEffects.length
  next = deliver(next, event, registry)
  return failUnhandledEffect(next, event, effectsBeforeDeliver)
}

export function foldRun(
  events: readonly EventEnvelope[],
  registry: FoldRegistry,
  options?: { runId?: string; initial?: RunState },
): RunState {
  const base = options?.initial ? cloneState(options.initial) : emptyRunState(options?.runId ?? '')
  return events.reduce((acc, event) => foldEvent(acc, event, registry), base)
}
