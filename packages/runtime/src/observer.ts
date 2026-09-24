export type RuntimeObservation =
  | { readonly type: 'run.start'; readonly runId: string; readonly at: number }
  | { readonly type: 'run.wake'; readonly runId: string; readonly at: number }
  | {
      readonly type: 'run.park' | 'run.terminal'
      readonly runId: string
      readonly at: number
      readonly status: string
    }
  | {
      readonly type: 'event.append'
      readonly runId: string
      readonly at: number
      readonly eventCount: number
      readonly latencyMs: number
      readonly outcome: 'ok' | 'conflict' | 'error'
    }
  | {
      readonly type: 'snapshot.load' | 'snapshot.save' | 'snapshot.trim'
      readonly runId: string
      readonly at: number
      readonly latencyMs: number
      readonly outcome: 'ok' | 'miss' | 'error'
      readonly cursor?: number
    }
  | {
      readonly type: 'timer.late'
      readonly runId: string
      readonly at: number
      readonly timerId: string
      readonly latenessMs: number
    }
  | {
      readonly type:
        | 'effect.attempt'
        | 'effect.retry'
        | 'effect.timeout'
        | 'effect.heartbeat'
        | 'effect.cancellation'
      readonly runId: string
      readonly at: number
      readonly effectId: string
      readonly attempt: number
      readonly detail?: string
    }

export interface RuntimeObserver {
  observe(event: RuntimeObservation): void | Promise<void>
}

export function notifyObserver(
  observer: RuntimeObserver | undefined,
  event: RuntimeObservation,
): void {
  if (!observer) {
    return
  }

  try {
    Promise.resolve(observer.observe(event)).catch(() => undefined)
  } catch {
    // Observability must never change runtime behavior.
  }
}
