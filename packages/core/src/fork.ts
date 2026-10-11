import { Data, Effect, Predicate } from 'effect'

import {
  isPrimitiveEffect,
  isWithdrawnError,
  type EffectDefinition,
  type RuntimeEffect,
} from './effects'
import { createEvent, type EventEnvelope } from './envelope'
import { foldEvent, foldRun, type FoldRegistry } from './fold'
import { emptyRunState, isRunTerminal, type RunState } from './state'
import { isTerminalStatus } from './thread'

export class ForkSourceError extends Data.TaggedError('ForkSourceError')<{
  readonly runId: string
  readonly message: string
}> {
  constructor(runId: string, message: string) {
    super({ runId, message })
    this.name = 'ForkSourceError'
  }
}

export interface ForkRegistry extends FoldRegistry {
  readonly effects: ReadonlyMap<string, Pick<EffectDefinition, 'deterministic'>>
}

export interface ForkPlan {
  /** The fork's history: the copied prefix, keeping source seqs, then the `runtime.run.forked` marker. */
  readonly events: readonly EventEnvelope[]
  /** Last source seq the fork copied. */
  readonly sourceSeq: number
  readonly rootThreadId: string
}

interface SourceScan {
  /** Index of the first event the fork leaves out. */
  readonly cut: number
  readonly effects: ReadonlyMap<string, RuntimeEffect>
  readonly failedAt: ReadonlyMap<string, number>
  readonly rootFailed: boolean
}

function payloadThreadId(event: EventEnvelope): string | null {
  const threadId = Predicate.isObject(event.payload) ? event.payload.threadId : undefined
  return Predicate.isString(threadId) ? threadId : event.threadId
}

function rootTerminal(state: RunState): boolean {
  const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined
  return isRunTerminal(state) || (root !== undefined && isTerminalStatus(root.status))
}

/** Where the cancellation that wrote `event` began, when it recorded that; a seq is an index + 1. */
function cancellationStart(event: EventEnvelope): number | undefined {
  const resumeSeq =
    event.type === 'runtime.thread.cancelled' && Predicate.isObject(event.payload)
      ? event.payload.resumeSeq
      : undefined

  return Predicate.isNumber(resumeSeq) ? resumeSeq : undefined
}

/**
 * Fold the source until its root thread ends. Everything from that event on is how the run
 * finished, so the fork leaves it out; a cancellation that recorded where it began is left
 * out from there.
 */
function scanSource(events: readonly EventEnvelope[], registry: FoldRegistry): SourceScan {
  const effects = new Map<string, RuntimeEffect>()
  const failedAt = new Map<string, number>()
  let state = emptyRunState(events[0]?.runId ?? '')

  for (const [index, event] of events.entries()) {
    state = foldEvent(state, event, registry)

    for (const item of state.outstandingEffects) {
      effects.set(item.effectId, item.effect)
    }

    for (const record of Object.values(state.threads)) {
      if (record.status === 'failed' && !failedAt.has(record.threadId)) {
        failedAt.set(record.threadId, index)
      }
    }

    if (rootTerminal(state)) {
      const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined
      const rootFailed = root?.status === 'failed' || state.status === 'failed'
      return { cut: cancellationStart(event) ?? index, effects, failedAt, rootFailed }
    }
  }

  return { cut: events.length, effects, failedAt, rootFailed: false }
}

/**
 * Walk back from the root's failure to the effect outcome that started it, so the fork
 * re-issues that effect instead of replaying a failure the modules already folded in.
 */
function failureOrigin(
  events: readonly EventEnvelope[],
  scan: SourceScan,
  registry: ForkRegistry,
): number {
  const indexById = new Map(events.map((event, index) => [event.id, index]))

  /** A failed thread leads back to where the fold failed it, anything else to its cause. */
  const previous = (index: number): number | undefined => {
    const event = events[index]!
    const threadId = event.type === 'runtime.thread.failed' ? payloadThreadId(event) : null
    const failedAt = threadId ? scan.failedAt.get(threadId) : undefined
    const cause = event.causationId ? indexById.get(event.causationId) : undefined
    const next = failedAt !== undefined && failedAt < index ? failedAt : cause
    return next !== undefined && next < index ? next : undefined
  }

  for (let index: number | undefined = scan.cut; index !== undefined; index = previous(index)) {
    const event = events[index]!
    const effect = event.effectId ? scan.effects.get(event.effectId) : undefined
    const error = Predicate.isObject(event.payload) ? event.payload.error : undefined
    const withdrawn = Predicate.isString(error) && isWithdrawnError(error)

    if (
      effect &&
      !isPrimitiveEffect(effect) &&
      !registry.effects.get(effect.type)?.deterministic &&
      !withdrawn
    ) {
      return index
    }
  }

  return scan.cut
}

function copyEvent(event: EventEnvelope, runId: string, reissued: ReadonlySet<string>) {
  if (event.ephemeral && event.effectId && reissued.has(event.effectId)) {
    return { ...event, runId, type: 'runtime.fork.elided', payload: { type: event.type } }
  }

  if (event.type === 'runtime.snapshot.taken' && Predicate.isObject(event.payload)) {
    const { state: _state, ...pointer } = event.payload
    return { ...event, runId, payload: pointer }
  }

  if (event.type === 'runtime.run.started') {
    return { ...event, runId, idempotencyKey: null }
  }

  return { ...event, runId }
}

/**
 * Plan a new run that continues where the source run ended. The fork copies the source's
 * history up to the point the run finished, keeping sequence numbers so effect ids still
 * line up, and its next wake re-issues whatever effects were outstanding there.
 */
export function planFork(input: {
  readonly sourceRunId: string
  readonly runId: string
  readonly events: readonly EventEnvelope[]
  readonly registry: ForkRegistry
}): Effect.Effect<ForkPlan, ForkSourceError> {
  const { sourceRunId, runId, events, registry } = input

  if (events.length === 0) {
    return Effect.fail(new ForkSourceError(sourceRunId, `Run "${sourceRunId}" has no events`))
  }

  if (events.some((event, index) => event.seq !== index + 1)) {
    return Effect.fail(
      new ForkSourceError(
        sourceRunId,
        `Run "${sourceRunId}" does not have its full history from seq 1; it cannot be forked`,
      ),
    )
  }

  const scan = scanSource(events, registry)
  const cut = scan.rootFailed ? failureOrigin(events, scan, registry) : scan.cut
  const prefix = events.slice(0, cut)
  const atCut = foldRun(prefix, registry, { runId })

  if (!atCut.rootThreadId) {
    return Effect.fail(
      new ForkSourceError(sourceRunId, `Run "${sourceRunId}" never started a root thread`),
    )
  }

  const reissued = new Set(atCut.outstandingEffects.map((item) => item.effectId))

  const marker = createEvent(
    runId,
    {
      type: 'runtime.run.forked',
      payload: { sourceRunId, sourceSeq: cut },
      threadId: null,
      origin: { type: 'system' },
    },
    { seq: cut + 1 },
  )

  return Effect.succeed({
    events: [...prefix.map((event) => copyEvent(event, runId, reissued)), marker],
    sourceSeq: cut,
    rootThreadId: atCut.rootThreadId,
  })
}
