import { Effect, Predicate } from 'effect'

import type { JsonValue, RunState } from '@looms/core'

import { RuntimeExecutionError, StartRunConflictError, type RunStartIdentity } from './errors'

function canonicalJson(value: JsonValue): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`
  }

  if (Predicate.isObject(value)) {
    const keys = Object.keys(value)

    // oxlint-disable-next-line unicorn/no-array-sort
    keys.sort()

    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key] ?? null)}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

export function assertSameDurableStart(
  runId: string,
  state: RunState,
  requested: RunStartIdentity,
): Effect.Effect<string, RuntimeExecutionError | StartRunConflictError> {
  const existing = state.startIdentity

  if (!existing) {
    return Effect.fail(
      new RuntimeExecutionError(
        `Run "${runId}" has durable state but no start identity; its legacy snapshot cannot safely validate a retry`,
      ),
    )
  }

  const mismatches: (keyof RunStartIdentity)[] = []

  if (existing.kind !== requested.kind) {
    mismatches.push('kind')
  }

  if (existing.definitionName !== requested.definitionName) {
    mismatches.push('definitionName')
  }

  if (existing.definitionVersion !== requested.definitionVersion) {
    mismatches.push('definitionVersion')
  }

  if (canonicalJson(existing.input) !== canonicalJson(requested.input)) {
    mismatches.push('input')
  }

  if (existing.requestedThreadId !== requested.requestedThreadId) {
    mismatches.push('requestedThreadId')
  }

  if (existing.idempotencyKey !== requested.idempotencyKey) {
    mismatches.push('idempotencyKey')
  }

  return mismatches.length > 0
    ? Effect.fail(new StartRunConflictError(runId, requested, existing, mismatches))
    : Effect.succeed(existing.rootThreadId)
}
