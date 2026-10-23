import { Effect } from 'effect'

import {
  descendantThreadIds,
  isTerminalStatus,
  type EventInput,
  type RunLauncher,
  type RunState,
} from '@looms/core'

/** Tell the launching run that this child has reached a terminal status. */
export function notifyLaunchingParent(
  launcher: RunLauncher,
  runId: string,
  state: RunState,
): Effect.Effect<void, Error> {
  const launchedBy = state.startIdentity?.launchedBy
  const status = state.status

  if (!launchedBy || status === 'running') {
    return Effect.void
  }

  const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined
  const error = status === 'completed' ? null : (root?.error ?? status)

  return launcher.signal(
    launchedBy.runId,
    [
      {
        type: 'runtime.child.settled',
        payload: {
          runId,
          status,
          output: root?.output ?? null,
          error,
        },
        threadId: launchedBy.threadId,
        idempotencyKey: `child-settled:${runId}`,
        origin: { type: 'run', runId },
      },
    ],
    { idempotencyKey: `child-settled:${runId}` },
  )
}

/**
 * When a run asked to wait for child cancellation and those children are gone, cancel the
 * run's own threads. The caller appends these events from the parent wake, which must not
 * call `runtime.cancel` on itself.
 */
export function childCloseCancellations(state: RunState): EventInput[] {
  if (!state.closeWaiting || state.launchedRuns.some((run) => run.close === 'wait')) {
    return []
  }

  const rootId = state.rootThreadId

  if (!rootId) {
    return []
  }

  const root = state.threads[rootId]

  if (!root || isTerminalStatus(root.status)) {
    return []
  }

  const ids = [...descendantThreadIds(state, rootId).toReversed(), rootId]

  return ids.flatMap((threadId) => {
    const record = state.threads[threadId]

    if (!record || isTerminalStatus(record.status)) {
      return []
    }

    return [
      {
        type: 'runtime.thread.cancelled',
        payload: { threadId, reason: 'cancelled' },
        threadId,
      },
    ]
  })
}
