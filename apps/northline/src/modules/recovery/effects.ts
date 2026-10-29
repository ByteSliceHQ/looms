import { BookRecoveryInput } from './events'
import { recoveryScope } from './scope'

/**
 * Books a recovery with the linehaul partner. The handler lives in the queue consumer
 * (`book.ts`), not here, so this file can be imported by the Durable Object without the
 * partner client. Retries reuse `effectId` as the booking id.
 */
export const bookRecovery = recoveryScope.effect({
  type: 'recovery.book',
  placement: 'worker',
  input: BookRecoveryInput,
  retry: {
    maxAttempts: 3,
    backoffMs: 1_000,
    scheduleToStartTimeoutMs: 60_000,
    startToCloseTimeoutMs: 30_000,
    heartbeatTimeoutMs: 20_000,
  },
})
