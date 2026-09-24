import type { Exit } from 'effect'

import type { EventStore, RunState } from '@looms/core'

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
    wakeCompletion: null,
    resolveWakeCompletion: null,
    ingress: null,
    liveStore: undefined,
    liveCount: 0,
  }
}

function isIdle(context: RunExecutionContext): boolean {
  return (
    !context.waking &&
    !context.wakeAgain &&
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

  releaseIfIdle(runId: string): void {
    const context = this.runs.get(runId)

    if (context && isIdle(context)) {
      this.runs.delete(runId)
    }
  }
}
