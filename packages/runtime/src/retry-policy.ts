import type { RetryPolicy } from '@looms/core'

export function retryBackoff(retry: RetryPolicy, attempt: number): number {
  const base = Math.max(1, retry.backoffMs ?? 100)
  const multiplier = Math.max(1, retry.backoffMultiplier ?? 2)

  return Math.min(
    base * multiplier ** Math.max(0, attempt - 1),
    retry.maxBackoffMs ?? Number.MAX_SAFE_INTEGER,
  )
}
