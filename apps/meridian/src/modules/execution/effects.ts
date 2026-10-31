import { SubmitInput } from './events'
import { executionScope } from './scope'

/**
 * Sends an order to the broker. The handler lives in `fill.ts`, which only the
 * queue consumer imports, so a retry keeps the client order id derived from `effectId`.
 */
export const submitOrder = executionScope.effect({
  type: 'execution.submit',
  placement: 'worker',
  input: SubmitInput,
  retry: {
    maxAttempts: 3,
    backoffMs: 1_000,
    scheduleToStartTimeoutMs: 60_000,
    startToCloseTimeoutMs: 45_000,
    heartbeatTimeoutMs: 20_000,
  },
})
