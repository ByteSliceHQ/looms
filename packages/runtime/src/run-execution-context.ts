import { Deferred, Effect, type Exit } from 'effect'

import type { EventStore, RunState } from '@looms/core'

import { RuntimeExecutionError } from './errors'
import type { WakeError } from './types'

export type WakeCompletion = Exit.Exit<RunState, WakeError>

export interface ActiveEffect {
  readonly controller: AbortController
  readonly threadId: string
}

export interface RunIngressState {
  readonly pending: number
  readonly tail: Promise<void>
}

export interface RunExecutionContext {
  readonly activeEffects: Map<string, ActiveEffect>
  waking: boolean
  wakeAgain: boolean
  /** Resolved when a joined wake or coalesced signal asks the owner to replan mid-flight. */
  wakeSignal: Deferred.Deferred<void> | null
  wakeCompletion: Promise<WakeCompletion> | null
  resolveWakeCompletion: ((completion: WakeCompletion) => void) | null
  ingress: RunIngressState | null
  liveStore: EventStore | undefined
  liveCount: number
}

function createRunExecutionContext(): RunExecutionContext {
  return {
    activeEffects: new Map(),
    waking: false,
    wakeAgain: false,
    wakeSignal: null,
    wakeCompletion: null,
    resolveWakeCompletion: null,
    ingress: null,
    liveStore: undefined,
    liveCount: 0,
  }
}

/** Mark the run for another wake pass and unblock any mid-flight wait on `wakeSignal`. */
export function requestWakeAgain(context: RunExecutionContext): void {
  context.wakeAgain = true
  const signal = context.wakeSignal

  if (!signal) {
    return
  }

  context.wakeSignal = null
  Deferred.doneUnsafe(signal, Effect.void)
}

function isIdle(context: RunExecutionContext): boolean {
  return (
    !context.waking &&
    !context.wakeAgain &&
    context.wakeSignal === null &&
    context.wakeCompletion === null &&
    context.resolveWakeCompletion === null &&
    context.ingress === null &&
    context.liveStore === undefined &&
    context.liveCount === 0 &&
    context.activeEffects.size === 0
  )
}

export class RunExecutionContexts {
  private readonly runs = new Map<string, RunExecutionContext>()

  get(runId: string): RunExecutionContext {
    const current = this.runs.get(runId)

    if (current) {
      return current
    }

    const created = createRunExecutionContext()
    this.runs.set(runId, created)
    return created
  }

  peek(runId: string): RunExecutionContext | undefined {
    return this.runs.get(runId)
  }

  /** Abort in-process effects owned by the given threads. */
  abort(runId: string, threadIds: ReadonlySet<string>, message: string): void {
    const activeEffects = this.runs.get(runId)?.activeEffects

    if (!activeEffects || threadIds.size === 0) {
      return
    }

    for (const active of activeEffects.values()) {
      if (threadIds.has(active.threadId)) {
        active.controller.abort(new RuntimeExecutionError(message))
      }
    }
  }

  releaseIfIdle(runId: string): void {
    const context = this.runs.get(runId)

    if (context && isIdle(context)) {
      this.runs.delete(runId)
    }
  }
}
