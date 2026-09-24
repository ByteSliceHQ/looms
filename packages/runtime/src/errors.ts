import { Data } from 'effect'

import type { JsonValue, RunStartIdentity as DurableRunStartIdentity } from '@looms/core'

export interface RunStartIdentity {
  readonly kind: string
  readonly definitionName: string
  readonly definitionVersion: string
  readonly input: JsonValue
  readonly requestedThreadId: string | null
  readonly idempotencyKey: string | null
}

export class StartRunConflictError extends Data.TaggedError('StartRunConflictError')<{
  readonly runId: string
  readonly requested: RunStartIdentity
  readonly existing: DurableRunStartIdentity
  readonly mismatches: readonly (keyof RunStartIdentity)[]
  readonly message: string
}> {
  constructor(
    runId: string,
    requested: RunStartIdentity,
    existing: DurableRunStartIdentity,
    mismatches: readonly (keyof RunStartIdentity)[],
  ) {
    super({
      runId,
      requested,
      existing,
      mismatches,
      message: `Run "${runId}" already has a different durable start (${mismatches.join(', ')})`,
    })

    this.name = 'StartRunConflictError'
  }
}

export class DuplicateEffectDispatchError extends Data.TaggedError('DuplicateEffectDispatchError')<{
  readonly runId: string
  readonly effectId: string
  readonly threadId: string
  readonly message: string
}> {
  constructor(runId: string, effectId: string, threadId: string) {
    super({
      runId,
      effectId,
      threadId,
      message: `Duplicate effect dispatch detected for effectId "${effectId}" on thread "${threadId}"; refusing to re-dispatch already executed effect`,
    })

    this.name = 'DuplicateEffectDispatchError'
  }
}

export class MaxWakeIterationsError extends Data.TaggedError('MaxWakeIterationsError')<{
  readonly runId: string
  readonly maxIterations: number
  readonly message: string
}> {
  constructor(runId: string, maxIterations: number) {
    super({
      runId,
      maxIterations,
      message: `Max wake iterations exceeded (${maxIterations}) for run "${runId}"; possible infinite loop`,
    })

    this.name = 'MaxWakeIterationsError'
  }
}

export class RuntimeExecutionError extends Data.TaggedError('RuntimeExecutionError')<{
  readonly message: string
}> {
  constructor(message: string) {
    super({ message })
  }
}
